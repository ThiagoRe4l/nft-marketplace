# Arquitetura — Kurio (marketplace de NFTs)

App React + TypeScript com backend 100% simulado por MSW (REST e Socket.IO) rodando dentro do navegador. Este documento explica como as partes se encaixam e **por que** cada decisão foi tomada. O registro cronológico das decisões está em [docs/decisions.md](./docs/decisions.md); a tabela de endpoints, em [docs/contracts.md](./docs/contracts.md); como rodar e reproduzir cenários, no [README](./README.md).

## Sumário

1. [Visão geral e camadas](#1-visão-geral-e-camadas)
2. [Contratos REST e eventos Socket.IO](#2-contratos-rest-e-eventos-socketio)
3. [Política de sessão](#3-política-de-sessão)
4. [Estado do carrinho](#4-estado-do-carrinho)
5. [Cache, retries e sincronização](#5-cache-retries-e-sincronização)
6. [Reconciliação entre REST e Socket.IO](#6-reconciliação-entre-rest-e-socketio)
7. [Checkout e idempotência](#7-checkout-e-idempotência)
8. [Mocks](#8-mocks)
9. [Testes e Lighthouse](#9-testes-e-lighthouse)
10. [UX, limitações conhecidas e desvios do Figma](#10-decisões-de-ux-limitações-conhecidas-e-desvios-do-figma)

---

## 1. Visão geral e camadas

```
            ┌────────────────────────── navegador ──────────────────────────┐
            │                                                               │
 routes/ ──▶ features/<domínio> ──▶ shared/api (Axios + Zod) ──▶ /api/*     │
 (URL,      (queries, mutations,    (identidade, 401,              │        │
  guards)    componentes)            validação, AppError)          ▼        │
            │       ▲                                      ┌── MSW (worker) ┐│
            │       │ setQueryData / invalidate            │ handlers/      ││
            │  RealtimeBridge ◀── socket.io-client ◀───────│ realtime/      ││
            │                                              │ db/ (memória + ││
            │         contracts/ (schemas Zod) ◀───────────│  localStorage) ││
            │       usado pelos dois lados                 └────────────────┘│
            └───────────────────────────────────────────────────────────────┘
```

Regra central: **o app não sabe que o backend é falso**. Componentes, hooks e o cliente Axios nunca contêm respostas fictícias nem eventos simulados; isso só existe em `src/mocks/`. Trocar o MSW por uma API real exigiria mudar o transporte, não as features. (A mesma regra explica por que a medição do Lighthouse fica limitada no mobile; ver seção 9.)

| Camada | Pasta | Responsabilidade |
| --- | --- | --- |
| **Contratos** | `src/contracts/` | Schemas Zod, fonte única dos tipos (`z.infer`). O mock valida as **entradas** com eles e o cliente valida as **respostas** com os mesmos schemas, então os dois lados não podem divergir em silêncio. Nada de tipos duplicados. |
| **Mocks** | `src/mocks/` | O "backend": `db/` (store em memória persistido no `localStorage`, seed), `handlers/` (um arquivo por recurso), `realtime/` (hub e eventos do Socket.IO), `lib/` (erros HTTP, preço, senha), `scenarios.ts` (rede e falhas), `fixtures/`. Só é carregado quando `VITE_ENABLE_MOCKS=true`. |
| **Cliente de API** | `src/shared/api/` | `client.ts` (Axios + `request(schema, config)`, que valida a resposta), `storage.ts` (token e id do carrinho de visitante), `errors.ts` (`toAppError`). Não depende do router nem do Query (ver seção 3). |
| **Features** | `src/features/<domínio>/` | Por domínio (`auth`, `catalog`, `nft`, `cart`, `favorites`, `checkout`, `orders`, `account`, `realtime`): hooks de dados (`queries.ts`, `mutations.ts`) e `components/`. É aqui que mora o TanStack Query: dados do servidor **só** no cache dele. |
| **Rotas** | `src/routes/` | TanStack Router file-based. Cada rota declara `validateSearch` (estado na URL), loader (prefetch) e `beforeLoad: requireAuth` quando é privada. `routeTree.gen.ts` é gerado e commitado (o `build` roda `tsc` antes do Vite). `/login` e `/cadastro` só redirecionam para `/?auth=…`. |
| **Componentes** | `src/components/` | `ui/` (shadcn com **Base UI**, usa a prop `render`, não `asChild`), `layout/` (Header, Footer, MobileNav, busca), `nft/` (card, carrossel, `NftImage`), `form/` (`FormField`: rótulo visível + erro ligado por `aria-describedby`). Não conhecem a API. |

Inicialização (`src/main.tsx`): sobe os mocks (`db.init()`, `resumePendingOrders()`, cenário da URL, `worker.start()`) e **só depois** importa `app.tsx`. O motivo é o `socket.io-client`, que guarda o construtor de `WebSocket` ao ser carregado; ele precisa receber a versão já substituída pelo MSW.

Outras escolhas de base (decisions.md, "Setup"): TypeScript fixado em ~6.0 e MSW em 2.x (compatibilidade com `typescript-eslint` e `@mswjs/socket.io-binding`); `.env` e `public/mockServiceWorker.js` versionados para que um checkout limpo e o deploy rodem com mocks; `vercel.json` com rewrite SPA (sem o worker em `public/`, o rewrite devolveria HTML no lugar do script).

---

## 2. Contratos REST e eventos Socket.IO

**REST.** Todos os endpoints, corpos e respostas estão em [docs/contracts.md](./docs/contracts.md) (sessão, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras); os schemas, em `src/contracts/{auth,nft,cart,quote,order,profile,wallet,common}.ts`. Convenções:

- **ETH é string decimal** (`EthAmount`, até 18 casas), nunca `number`; cálculos com `big.js`.
- **Erros** seguem `ApiError { code, message, fieldErrors? }`. O mapa código → status fica em `src/mocks/lib/http.ts`: `VALIDATION_ERROR` 422, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT`/`OUT_OF_STOCK`/`QUOTE_STALE`/`IDEMPOTENCY_CONFLICT` 409, `COUPON_INVALID`/`COUPON_EXPIRED`/`WALLET_REJECTED` 422, `TRANSIENT` 503. No cliente, `toAppError` acrescenta `NETWORK_ERROR`, `TIMEOUT` e `UNKNOWN` (sem resposta HTTP, `status: 0`).
- **Preço e estoque ficam na edição** (1/1, 1/N, aberta); o NFT tem um `version` único que sobe a cada mudança. É esse número que o evento em tempo real traz e que o cliente compara.
- **Listagem** (`GET /nfts`): `NftListParams` → `NftListResponse` com itens, `total`, facetas e `priceRange` (limites reais do catálogo). Arrays vão como parâmetros repetidos (`?category=a&category=b`).
- **Pedido** recebe só `quoteId`, `walletId`, `network` e `note`; a `Idempotency-Key` vai no header, não no corpo.

**Socket.IO** (`src/contracts/events.ts`). Conexão `websocket` em `VITE_SOCKET_URL`, com o token (se houver) na query do handshake. Dois eventos, ambos com o mesmo envelope:

| Campo | Para que serve |
| --- | --- |
| `eventId` | deduplicação de entregas repetidas |
| `type`, `resource { type, id }` | roteamento |
| `version` | descartar evento mais antigo que o estado já conhecido |
| `occurredAt`, `payload` | dados |

- `nft.updated` — payload: por edição, `id`, `price`, `compareAtPrice`, `available`. Enviado a **todas** as conexões (catálogo é público).
- `order.updated` — payload: `status` (`pending`/`confirmed`/`rejected`), `txHash`, `rejectionReason`. Enviado **só ao dono** do pedido.

Os eventos são publicados pelo mock em `src/mocks/realtime/events.ts` sempre que um NFT ou pedido muda (reserva ou devolução de estoque, decisão do pagamento, endpoint de controle).

---

## 3. Política de sessão

- **Token.** Bearer opaco gerado no login/cadastro (`crypto.randomUUID()`), válido por **2 h** no mock (`SESSION_TTL_MS`), guardado em `localStorage` (`kurio-token`). O interceptor do Axios o envia em toda requisição.
- **Sessão como query.** `sessionQuery` (`['session']`, `staleTime: Infinity`) é a fonte de "quem sou eu". Sem token devolve `null` sem chamar a API; com token chama `GET /auth/session`. Só muda por login, logout ou 401, por isso nunca é considerada velha.
- **Refresh com token vencido.** Se `/auth/session` responder 401, o token é apagado e o usuário vira visitante, sem alarme (não houve ação interrompida).
- **Guard.** Rotas privadas (`/checkout`, `/pedidos/$id`, `/perfil`, `/carteiras`) usam `beforeLoad: requireAuth`, que faz `ensureQueryData(sessionQuery)`. Sem sessão, redireciona para `/?auth=login&redirect=<página>`. Cada rota chama `requireAuth` diretamente; um layout `_auth` sem filhas conflitaria com `/` no gerador de rotas (comentário em `require-auth.ts`).
- **Login e cadastro são um diálogo** controlado por `?auth=login|signup` (schema no `__root.tsx`), em qualquer página. `redirect` só é aceito se for caminho interno (`safeRedirect`: começa com `/` e não com `//`), o que evita open redirect. Depois de entrar, o usuário volta à página de origem.
- **401 no meio da navegação.** O interceptor de resposta só **avisa** (`setUnauthorizedHandler`); quem decide é `app.tsx`: `endSession(queryClient)` e navegação para `/?auth=login&redirect=<página atual>&reason=expired`, com o aviso "Sua sessão expirou". O cliente não importa router nem Query (evita dependência circular). O 401 só conta como expiração se havia token e a rota não é de auth (`/auth/login`, `/signup`, `/session`, `/logout`), onde 401 é resposta esperada. Não há timer no cliente: a expiração é detectada pelo próprio 401. O mock devolve 401 também a quem manda um token inválido (`optionalSession`), em vez de tratá-lo como visitante, para o app perceber a queda.
- **Troca de usuário.** Login, cadastro, logout e 401 chamam `queryClient.clear()`: nenhum dado privado atravessa a troca de identidade. Além disso, as chaves de dados privados levam o `userId` (`['favorites', userId]`, `['profile', userId]`, `['wallets', userId]`, `['cart', userId|'guest']`), e a tentativa de compra e o rascunho do checkout são guardados por usuário.
- **Socket.** `RealtimeBridge` depende de `userId`: ao mudar a identidade, o efeito fecha o socket (remove listeners e `disconnect`) e abre outro com o token novo (ou sem token). O servidor mock só entrega `order.updated` à conexão cujo `userId` é o dono.
- **Logout.** A chamada de rede é tolerante a falha: se cair, a sessão local termina do mesmo jeito (`onSettled`). Depois navega para `/`.
- **Rascunho do checkout** (`sessionStorage`, por usuário) sobrevive ao ciclo "sessão expirou → login → volta"; é por isso que o 401 não perde o que o usuário digitou.

---

## 4. Estado do carrinho

O carrinho **sempre vive no mock**; o cliente não mantém cópia local.

- **Visitante.** O primeiro `GET /cart` sem token cria um carrinho no mock; o cliente guarda o `cart.id` em `localStorage` (`kurio-cart-id`, só quando não há token) e o interceptor o manda como `X-Cart-Id`. Com token, o header de identidade é o Bearer.
- **Merge no login.** `startSession` grava o token e chama `POST /cart/merge { guestCartId }`. O mock soma as quantidades respeitando o limite da edição (`min(maxPerOrder, estoque)`), preserva o cupom do usuário (ou herda o do visitante) e apaga o carrinho de visitante. O `cartId` local só é esquecido **se o merge der certo**; se falhar, fica guardado e o merge é tentado no próximo login. Merge repetido é inofensivo (se o carrinho de visitante já não existe, devolve o do usuário).
- **Resumo calculado pelo mock.** `Cart.summary` (subtotal, desconto, taxa de rede, total) vem do servidor (`src/mocks/lib/pricing.ts`, com `big.js`; desconto arredondado para baixo em 6 casas). O cliente só exibe, então preço e cupom têm uma única regra, e uma mudança de preço em tempo real é refletida relendo o carrinho.
- **Chave de cache com dono.** `['cart', userId | 'guest']`. A query só habilita depois de a sessão ser conhecida (`enabled: !session.isPending`), para não buscar o carrinho do dono errado.
- **Fila de mutations.** Todas as mutations do carrinho (adicionar, alterar quantidade, remover, cupom) compartilham `scope: { id: 'cart' }`, que o TanStack Query executa em série. A resposta de um clique antigo nunca sobrescreve a de um mais novo. Cada resposta já é o carrinho atualizado e vai direto para o cache (`setQueryData`); em erro (ex.: estoque mudou), invalida e busca o estado real.
- **Concorrência no servidor.** Cada handler faz leitura e gravação dentro de um único `db.write` sem `await` no meio (seção 8).
- **Preço do card.** O botão de carrinho do card adiciona a edição mais barata disponível (`editionId` do `NftSummary`), a mesma que define o preço exibido, o filtro e a ordenação.
- **Após a compra.** Quando o pedido é confirmado, o mock remove do carrinho só os itens e quantidades comprados (e zera o cupom se esvaziou); o cliente é avisado por `order.updated` e relê o carrinho.

---

## 5. Cache, retries e sincronização

Configuração global em `src/app.tsx`: `staleTime` de 15 s; `retry` de queries = **nenhuma tentativa em 4xx** (não melhora tentando de novo) e até **2 tentativas** em rede/5xx; **mutations nunca repetem sozinhas** (`retry: false`), porque repetir às cegas uma escrita é como se cria pedido duplicado. A proteção contra duplicidade é a idempotência (seção 7), não a sorte. O router usa `defaultPreload: 'intent'` e `defaultPreloadStaleTime: 0`.

**Chaves.**

| Dado | Chave |
| --- | --- |
| Sessão | `['session']` (`staleTime: Infinity`) |
| NFTs | `['nfts', 'list', params]`, `['nfts','featured']`, `['nfts','detail',id]` |
| Carrinho | `['cart', userId \| 'guest']` |
| Favoritos | `['favorites', userId]` (só os ids) |
| Perfil / carteiras | `['profile', userId]`, `['wallets', userId]` |
| Pedido | `['orders', id]` |

Hierárquicas de propósito: invalidar `['nfts']` atinge listas, destaques e detalhes de uma vez; o predicado `queryKey[1] !== 'detail'` poupa os detalhes quando só as listas precisam reler.

**Catálogo (busca fora de ordem).** Filtros, ordenação e página vivem na URL (`validateSearch` em `catalog/search.ts`, com `.catch` por campo: valor inválido é ignorado em vez de quebrar a página; campos opcionais sem padrão, a API aplica os padrões e a URL fica limpa). Há uma chave de cache por combinação de parâmetros e o `AbortSignal` do Query é repassado ao Axios, então a requisição obsoleta é **cancelada**; juntos garantem que a tela termine com o resultado do último filtro (cenário `flaky`). Mudar filtro volta à página 1. `placeholderData: keepPreviousData` mantém a lista anterior (esmaecida, `isPlaceholderData`) enquanto a nova carrega. O loader da Início faz `prefetchQuery` sem bloquear a navegação, para o skeleton aparecer em vez de a navegação travar. Os filtros usam o formato JSON padrão do Router: as aspas mantêm os valores ETH como texto.

**Favoritos (atualização otimista com rollback).** Mutations de favorito entram numa fila (`scope: 'favorites'`) e seguem três passos: `onMutate` cancela buscas em andamento (uma busca atrasada não pode desfazer a mudança), guarda o estado anterior e aplica a mudança; `onError` restaura exatamente o estado guardado e mostra um toast; `onSettled` revalida com o servidor. O cache guarda só os ids, então o coração é o mesmo no card e no detalhe. `PUT`/`DELETE` são idempotentes no mock. Visitante que clica abre o diálogo de login e volta à mesma página. O cenário `mutation-error` (503 em toda escrita, exceto auth) exercita o rollback.

**Conta.** As mutations de perfil e avatar (multipart) atualizam o cache do perfil **e** o da sessão, então nome e avatar do Header mudam na hora. Salvar uma carteira invalida a lista (cadastro e edição usam o mesmo `PUT /wallets/:slot`).

**Pedido.** `refetchInterval` de 5 s enquanto o pedido está `pending`: o socket é o caminho principal, a consulta periódica cobre o socket fora do ar.

**Cancelamento.** As queries de dados (catálogo, detalhe, carrinho, favoritos, perfil, carteiras, pedido) repassam o `signal` ao Axios; a query de sessão não. Mutations não são canceláveis.

---

## 6. Reconciliação entre REST e Socket.IO

A API REST é a fonte da verdade; o socket é um atalho de latência. O `RealtimeBridge` (`src/features/realtime/realtime-bridge.tsx`) é um componente sem UI montado no layout raiz: **uma conexão por sessão, fora dos componentes**, que apenas liga eventos ao cache. Isso evita conexões duplicadas (StrictMode monta duas vezes) e permite limpar tudo no logout.

**Dedupe e ordem.** `accept(eventId, chave, version, versãoEmCache)` só deixa passar evento inédito e mais novo que o estado conhecido:

1. `eventId` já visto → duplicata, ignorada (conjunto limitado a 500 ids, descartando os mais antigos);
2. `version <= max(última versão aplicada, versão no cache)` → evento antigo/atrasado, ignorado, então **o estado nunca regride**;
3. caso contrário aplica e registra a versão.

**Aplicação.**
- `nft.updated`: aplica preço e estoque de cada edição direto em `['nfts','detail',id]` e invalida listas e destaques (o preço do card é regra do servidor: edição mais barata disponível). Se o NFT está no carrinho, invalida o carrinho (o servidor recalcula o resumo) e avisa por toast **somente** se mudou preço ou o estoque ficou abaixo da quantidade; a reserva de estoque da própria compra não gera aviso.
- `order.updated`: mostra o novo estado na hora (`setQueryData`) e, se deixou de ser `pending`, invalida o pedido para trazer o recibo completo (`confirmedAt`, `explorerUrl`); se `confirmed`, invalida também o carrinho.
- Payloads que não passam no schema do contrato são descartados (`safeParse`).

**Reconexão.** Eventos emitidos durante a queda se perdem. No evento `reconnect` do `socket.io-client`, o bridge invalida NFTs, carrinho e pedidos e o REST volta a mandar.

**Isolamento por usuário.** (a) o mock só emite `order.updated` para conexões do dono; (b) o handshake leva o token e o `userId` do servidor é fixado na conexão (token ausente, desconhecido ou vencido = visitante); (c) o efeito do bridge depende de `userId` e fecha o socket antes de abrir outro; (d) `queryClient.clear()` na troca de identidade. O estado de dedupe (`seen`, `versions`) nasce e morre com o efeito, então não vaza entre usuários.

**Testes manuais** (README): `/api/__mock/realtime/replay` (`last` = mesma `eventId`, `previous` = versão anterior com `eventId` novo) e `/api/__mock/realtime/disconnect`.

---

## 7. Checkout e idempotência

Fluxo: **carrinho → cotação → confirmar → pedido pendente → recibo**.

1. **Cotação** (`POST /quote`). O mock valida estoque e cupom e **congela** linhas e valores. Vale **10 min**, uma por usuário (uma nova invalida a anterior) e é consumida por um único pedido. Cotação expirada não tem timer no cliente: a API responde `QUOTE_STALE` e o fluxo é o mesmo.
2. **Cotação desatualizada** (cliente). Considera-se desatualizada se a API devolveu `QUOTE_STALE` **ou** se o carrinho foi relido depois da cotação e já não bate com ela (itens, quantidades, preços unitários, cupom e total; `cartMatchesQuote`). Usar só o `dataUpdatedAt` gerava aviso falso a cada refetch sem mudança (foco da janela, reconciliação do socket). Com cotação velha o botão "Confirmar" fica bloqueado até "Atualizar cotação".
3. **Pedido** (`POST /orders`, header `Idempotency-Key`). O mock recalcula a cotação a partir do estado atual e compara por "impressão digital" (linhas, cupom, subtotal, desconto, taxa, total); qualquer diferença (preço, estoque, cupom, quantidade) devolve `QUOTE_STALE`. O pedido guarda **cópia** das linhas (o recibo não muda se o catálogo mudar), reserva o estoque na criação e o devolve se o pagamento for recusado.
4. **Pagamento** decidido 3 s depois (`settleAt`). A decisão é retomada ao iniciar o mock (`resumePendingOrders`) e ao consultar/criar pedidos (`settleAndPublish`), então sobrevive a refresh. O `txHash` é determinístico (derivado do id) e o link do explorer é simulado, aberto com `rel="noopener noreferrer"`.
5. **Pedido de outro usuário** responde 404, não 403, para não revelar que existe.

**Idempotência no servidor.** A chave é guardada como `userId:key` junto com o JSON do corpo. Mesma chave + mesmo corpo → o **mesmo pedido** no estado atual (200); mesma chave + corpo diferente → `IDEMPOTENCY_CONFLICT` (409). Checagem e gravação da chave acontecem no mesmo `db.write`, sem `await`, o que cobre envios simultâneos.

**Tentativa guardada (cliente).** `attemptFor` persiste em `localStorage` (`kurio-checkout-attempt:<userId>`) `{ key, body, orderId }` **antes** de enviar. Mesmo corpo = mesma tentativa (reaproveita a chave); corpo novo (outra cotação, outra carteira) = chave nova. Cliques repetidos entram na mesma fila (`scope: 'checkout'`) e caem na mesma tentativa. Quando a resposta chega, o `orderId` é gravado; com `orderId` já gravado, a mutation só **busca** o pedido, nunca cria outro. A tentativa termina quando a página do pedido vê um estado terminal (`finishAttempt`).

**Timeout.** O Axios corta em 10 s. Em `TIMEOUT` ou `NETWORK_ERROR` o pedido pode ter nascido sem a resposta chegar, então `usePlaceOrder` reenvia **uma vez com a mesma chave** e o mock devolve o pedido existente. O cenário `order-timeout` reproduz isso: a criação responde após 15 s (acima do timeout), o reenvio responde rápido. Outros erros não são reenviados.

**Retomada.** Ao montar `/checkout`, uma tentativa guardada **sem** `orderId` (refresh no meio do envio) reenvia o mesmo corpo com a mesma chave, uma única vez, e leva ao pedido. Se a API responder `QUOTE_STALE`, o servidor não criou pedido: a tentativa é descartada e o fluxo volta ao normal. Se a tentativa **tem** `orderId`, a página mostra "Você tem um pedido em andamento" com link.

**Compra que termina com o componente desmontado.** Ao confirmar, o carrinho esvazia em tempo real e a página troca o fluxo, desmontando o formulário. Por isso a página observa a mutation pela chave (`PLACE_ORDER_KEY`, `useIsMutating`/`useMutationState`) e navega de lá; nunca mostra "carrinho vazio" no meio do caminho.

**Pedido pendente.** `/pedidos/$id` mostra "Aguardando confirmação da rede…" e atualiza por `order.updated` ou pelo polling de 5 s; `confirmed` vira recibo, `rejected` mostra o motivo e os itens continuam no carrinho. Refresh com pedido pendente recupera o estado sem criar outra compra.

**Formulário.** react-hook-form + Zod, reaproveitando a regra de endereço por rede do `UpsertWalletInput` (`safeExtend`). Vem preenchido com perfil e carteira principal; o rascunho fica em `sessionStorage` por usuário e vale mais que o pré-preenchimento (apagado ao criar o pedido). Só rede e observação vão no pedido; os demais campos são validados e guardados no rascunho, mas **não editam a carteira** (não há chamada de edição no checkout). A carteira que paga é escolhida entre as cadastradas; sem carteira, mensagem com link para `/carteiras` e "Revisar pedido" desabilitado.

---

## 8. Mocks

**Banco.** `src/mocks/db/store.ts`. Estado em memória (`DbState`: usuários, sessões, NFTs, favoritos, carrinhos, cotações, pedidos, chaves de idempotência, carteiras, cupons), carregado do `localStorage` (`kurio-mock-db`) em `db.init()`, com `schemaVersion` (se não bater ou o JSON estiver corrompido, volta ao seed). **Leitura só via `db.read()`; escrita só via `db.write(fn)`**, que aplica a alteração e persiste sempre; nenhum handler consegue esquecer de salvar. Dentro de um `db.write` **não há `await`** entre checar e gravar: o JavaScript é single-thread, então sem await a operação é atômica e duas requisições simultâneas não passam juntas pela mesma checagem (cadastro com o mesmo e-mail, mesma chave de idempotência). Por isso o hash de senha é calculado **antes** do write e, quando preciso, o estado é conferido de novo dentro dele (troca de senha). Se o `localStorage` estiver indisponível, o mock segue só em memória.

**Convenções dos handlers.** Erros via `apiError(code, message, fieldErrors?)`; corpo validado com `parseBody(request, Schema)` (422 com erros por campo); sessão com `requireSession`/`optionalSession`; respostas públicas passam pelo schema (`User.parse` descarta `passwordHash`/`passwordSalt`). Login com credenciais erradas dá mensagem genérica (não revela se o e-mail existe). Entradas ficam em `handlers/` (um arquivo por recurso); os de auth, cart, checkout, `db/`, `lib/http.ts` e `realtime/` são o núcleo escrito à mão.

**Persistência e reset.** Dados e cenário sobrevivem a refresh. `POST /api/__mock/reset` volta o banco ao seed (via `structuredClone`, nunca das fixtures já mutadas) e o cenário ao `default`.

**Endpoints de controle** (`/api/__mock/*`, nunca sofrem falhas de cenário, nunca usados pelo app): `reset`; `GET|POST scenario`; `POST nfts/:nftId/editions/:editionId` (altera preço/estoque, sobe a `version` e emite `nft.updated`); `POST realtime/replay`; `POST realtime/disconnect`; `POST session/expire`. Como o MSW roda no navegador, só intercepta requisições **da própria página**: devem ser chamados do console ou de `page.evaluate`.

**Cenários** (`src/mocks/scenarios.ts`): `default`, `slow`, `flaky`, `offline`, `server-error`, `mutation-error`, `empty`, `order-timeout`, `payment-rejected`, `wallet-rejected` (efeitos no README). Escolha por `?scenario=` na URL (lido no `main.tsx`) ou `POST /api/__mock/scenario`, persistido em `localStorage`. Um único handler `http.all('/api/*')` vem **primeiro**, aplica latência/falha e, se não responder, deixa a requisição seguir para o handler do recurso. Determinismo: a latência do `flaky` segue uma sequência fixa (1800, 200, 900, 400 ms) reiniciada ao trocar de cenário; não existe `Math.random`. O padrão tem 120 ms de latência (é o usado no Lighthouse). Cenários de domínio (`payment-rejected`, `wallet-rejected`, `order-timeout`) são lidos pelos handlers de checkout e carteiras.

**Socket.IO simulado.** `ws.link(VITE_SOCKET_URL + '/*')` com `@mswjs/socket.io-binding`. O hub (`realtime/hub.ts`) guarda as conexões; só recebem eventos as que já entraram no namespace (pacote `40`). O `emit` aceita um `userId` para entrega privada.

**Limitações do transporte** (todas deliberadas e documentadas):
- **Só WebSocket.** O MSW intercepta WebSocket, não long-polling; o cliente usa `transports: ['websocket']`.
- **Heartbeat implementado no mock.** O binding não envia o ping do Engine.IO; sem ele o cliente derrubava a conexão a cada ~30 s. O mock envia o pacote `"2"` a cada 10 s.
- **O app é importado depois de `worker.start()`**, pelo motivo da seção 1.
- Os cenários de rede valem para o REST; a conexão WebSocket não é afetada por `offline`/`slow`.
- O banco e o hub vivem na memória de **cada aba** (persistidos no `localStorage`, mas só relidos ao iniciar): abas abertas ao mesmo tempo não se sincronizam.
- O MSW avisa no console sobre chamadas a `/api` sem handler; assets e Vite passam em silêncio.

---

## 9. Testes e Lighthouse

**Estratégia (Playwright, `e2e/`).** Testes de ponta a ponta contra o **build de produção** servido pelo `vite preview` (porta 4174; o build já embute os mocks), em Chromium nos projetos **desktop** (1440×900) e **mobile** (390×844, touch). `reducedMotion: 'reduce'` desliga o carrossel automático e as animações. Trace e screenshot só em falha; `retries: 2` e 1 worker em CI.

**Isolamento.** O "backend" é o MSW dentro da página e o banco vive no `localStorage`; cada teste roda num contexto de navegador novo, então **começa sempre no seed**, sem precisar de `reset`. Chamadas ao mock usam `page.evaluate(fetch(...))` (o `page.request` falaria com o servidor de preview, que não tem API). `e2e/fixtures.ts` oferece `gotoApp` (espera o app e o service worker), `loginAs` (login via fetch + token + reload) e `mock` (controles: reset, cenário, `patchEdition`, replay, desconexão, expirar sessões).

**O que cobrem hoje** (35 testes por projeto):
- `smoke.spec.ts`: Início com 9 cards e carrinho no Header, login da Ana, cenário `server-error` (retries e estado de erro com "Tentar novamente").
- `checkout.spec.ts`: compra até o recibo com formulário preenchido; "Enviando…" e botão desabilitado; `order-timeout` (duas chamadas com a **mesma** `Idempotency-Key`, chegada ao recibo, sem "carrinho vazio"); pagamento recusado; carteira recusada; validação; cotação desatualizada por mudança de preço em tempo real (e ausência de falso aviso em refetch sem mudança); troca de carteira; sessão expirada no checkout com formulário restaurado; rascunho após refresh; carrinho vazio; retomada (tentativa sem pedido, com `QUOTE_STALE`, com pedido); Bruno sem carteira; pedido inexistente; rota privada sem sessão.
- `account.spec.ts`: rota privada e menu, logout, edição de perfil, validação com foco no primeiro erro, conflito de e-mail, avatar (envio, remoção, tipo e tamanho inválidos), senha, carteiras (principal/secundária, cópia da principal, endereço por rede, Bruno cadastra e consegue revisar).

**O que ainda não está coberto por teste automatizado** (só reprodutível manualmente, README): busca fora de ordem (`flaky`), rollback dos favoritos (`mutation-error`), merge do carrinho, estado na URL do catálogo, dedupe/versão/reconexão do socket (`replay`, `disconnect`). `toHaveScreenshot` está configurado, mas ainda não há testes de regressão visual. O relatório HTML final ainda deve ser copiado para `docs/e2e-report/` (pendência do decisions.md).

### Lighthouse

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. `npm run lighthouse` mede o build de produção com mocks ativos, **3 execuções por página e perfil** (Início e detalhe do NFT; mobile e desktop) e grava as medianas em `lighthouse/SUMMARY.md`. A variação entre execuções chega a ±5 pontos de Performance; diferenças menores que isso não são sinal.

| Página | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | mobile | 77 | 99 | 100 | 100 | 3961 ms | 0,014 | 354 ms |
| /nft/emerald-ape-042 | mobile | 74 | 100 | 100 | 100 | 4134 ms | 0,000 | 365 ms |
| / | desktop | 95 | 99 | 100 | 100 | 1409 ms | 0,010 | 1 ms |
| /nft/emerald-ape-042 | desktop | 95 | 100 | 100 | 100 | 1414 ms | 0,000 | 0 ms |

Linha de base (primeira rodada): mobile 73 e 84; desktop 95 e 90; SEO 83 em todos. O que mudou: `lang="pt-BR"`, título, meta description e `robots.txt`; imagens AVIF/WebP em 200/400/500 px com `<picture>`/`srcset` (`NftImage`; um PNG de ~420 KB passa a ~10–16 KB); primeira fileira da grade com `eager`; skeleton do detalhe reservando altura (CLS do rodapé); preload da fonte Roboto Mono; validação das fixtures com Zod só em desenvolvimento (tira o parse do caminho crítico).

**Por que o mobile (74–77) fica abaixo de 90.** O app é só cliente e o backend é simulado no navegador. Antes do primeiro render, o perfil mobile (CPU 4× mais lenta, 1,6 Mbps) baixa e executa ~460 KB gzip de JS (app, Zod e o chunk dos mocks), sobe o service worker do MSW e só então chama a API. Depois da otimização das imagens, o LCP da Início mobile passou a ser o **texto do hero**, não mais uma imagem: o limite é o tempo até o primeiro render (~4 s), não o conteúdo. Tirar o MSW ou o chunk dos mocks do caminho inicial quebraria a entrega, e a regra do enunciado proíbe simplificar só para a auditoria. Foram testados e **revertidos** por piorar ou não medir diferença: importar o app em paralelo ao `worker.start()` (LCP ~5 s contra ~4 s), `Promise.all` nos imports dos mocks, `modulepreload` dos chunks de inicialização (FCP 2,4 s → 4,6 s) e prefetch no loader da Início e do detalhe. O caminho que sobra é medir de novo com um backend real, onde o chunk dos mocks não existe. Desktop, Accessibility, Best Practices e SEO cumprem as metas.

---

## 10. Decisões de UX, limitações conhecidas e desvios do Figma

**Decisões de UX.**
- Login e cadastro são um **diálogo sobre a página atual** (`?auth=`), não uma tela: o usuário não perde o contexto e volta ao ponto de origem.
- Estados de carregamento, vazio e erro nas telas de dado principais (skeletons, "Tentar novamente"); aviso de sessão expirada no diálogo.
- Acessibilidade: link "Pular para o conteúdo", foco no primeiro campo com erro após validação ou erro da API (`useFocusFirstError`, via efeito depois do commit), rótulo visível e erro ligado por `aria-describedby` (`FormField`), regiões `role="status"`/`role="alert"`, `prefers-reduced-motion` respeitado.
- Busca pelo header ou pelo campo mobile inicia uma pesquisa **nova** (descarta os outros filtros).
- Slider de preço usa os limites reais do catálogo (`priceRange` da API, sobre o preço do card), não os valores fixos do Figma.
- Detalhe do NFT abre com a edição mais barata disponível selecionada (`defaultEdition`).
- Conta: cada parte salva separadamente (dados, avatar, senha, cada carteira) com toast; avatar valida tipo e 2 MB no cliente e mostra o erro 422 da API sob o campo. "Igual à carteira principal" é derivado (marcado enquanto os campos coincidem).
- Conteúdo editorial (Diário, banners) é estático; "Ler mais", newsletter e itens fora do escopo mostram "Disponível em breve nesta demonstração" (`comingSoon()`), para nada parecer funcionar sem funcionar.
- Carteiras por slot fixo (`primary`/`secondary`), como no Figma; o ".eth" é um adorno fixo (o `ensName` é guardado sem sufixo).

**Limitações conhecidas.**
- Backend simulado: segurança é fictícia (token opaco, hash de senha no navegador), sem sincronização entre abas (seção 8) e sem transporte além de WebSocket.
- Cobertura e2e parcial (seção 9) e sem regressão visual.
- Performance mobile abaixo da meta, com causa e justificativa na seção 9.
- Pendências registradas no decisions.md: `maxPerOrder` das fixtures (2 até 1/10 e 5 acima) não reproduz as quantidades 2, 6 e 9 do carrinho do Figma (avaliar subir para 10 antes das baselines visuais); relatório HTML do Playwright em `docs/e2e-report/`.
- Os campos do checkout além de rede e observação não editam a carteira (decisão consciente, seção 7).

**Desvios do Figma** (conforme o decisions.md hoje):
- Header mantido no mobile (o frame não tem): é onde ficam login, menu e busca.
- Barra inferior do mobile reta (o Figma tem um recorte curvo) e hero mobile com uma imagem (o Figma sobrepõe duas), por tempo.
- Checkout mobile: o frame só tem escolha de carteira, total e Confirmar; o app empilha as mesmas seções do desktop (formulário, itens, carteira, Confirmar).
- Recibo: vira a página `/pedidos/$id` em vez de modal; o "X" leva ao início; a ilustração "THANK YOU" é um ícone do lucide por falta de asset.
- Slider de preço com os limites reais do catálogo, em vez de 0,02 – 12,30.

<!-- atualizar após os ajustes visuais -->
