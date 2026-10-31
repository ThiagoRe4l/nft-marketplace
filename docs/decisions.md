# Decisões

## Setup
- TypeScript fixado em ~6.0: o template do Vite veio com TS 7, mas o typescript-eslint só suporta até 6.0.x.
- MSW fixado em 2.x: o @mswjs/socket.io-binding 0.2.0 exige msw ^2, e o MSW 3 mudou a API de WebSocket.
- shadcn/ui com Base UI (preset Nova).
- baseUrl + ignoreDeprecations no tsconfig raiz: o CLI do shadcn não resolve o alias @/ só com paths no TS 6.
- routeTree.gen.ts commitado: o build roda tsc antes do vite, e um checkout limpo quebraria sem ele.
- .env commitado: só contém configuração não sensível; garante que checkout limpo e deploy rodem com mocks.
- mockServiceWorker.js versionado em public/: o deploy precisa servir o worker; sem ele, o rewrite SPA devolve HTML e o MSW falha.
- Login com credenciais erradas devolve mensagem genérica (não revela se o e-mail existe).
- Cadastro calcula o hash antes de checar duplicidade, para checagem e gravação acontecerem sem await no meio.
- Usuário público gerado com User.parse: o Zod descarta passwordHash e passwordSalt.
- Idempotência: chave guardada por usuário (userId:key) com o hash do corpo. Mesma chave e mesmo corpo devolvem o mesmo pedido no estado atual (200); corpo diferente devolve 409. Checagem e gravação da chave acontecem no mesmo write, sem await, o que cobre envios simultâneos.
- Cotação vale 10 min e uma por usuário. O pedido compara a cotação com os valores recalculados; qualquer diferença (preço, estoque, cupom, quantidade) devolve QUOTE_STALE e exige nova confirmação.
- Estoque reservado na criação do pedido e devolvido se o pagamento for recusado.
- Pagamento decidido 3 s após a criação; a decisão é retomada ao iniciar o mock e ao consultar o pedido, então sobrevive a refresh.
- Pedido de outro usuário responde 404, não 403, para não revelar que existe.
- Recibo é cópia das linhas da cotação; txHash determinístico derivado do id do pedido; link do explorer é simulado.
- Slider de preço usa os limites reais do catálogo (priceRange da API, sobre o preço do card), e não os valores fixos do Figma (0,02 – 12,30).
- Cenários de rede num handler único em primeiro lugar (http.all('/api/*')), que aplica latência ou falha e deixa a requisição seguir. Seleção por ?scenario= na URL ou POST /api/__mock/scenario; persistido em localStorage; o reset volta ao padrão.
- Determinismo: latência variável segue uma sequência fixa (reinicia ao trocar de cenário); nada de Math.random.
- Cenário padrão com 120 ms de latência (é o usado no Lighthouse).
- order-timeout atrasa só a resposta da criação (15 s, acima do timeout do Axios); o reenvio com a mesma chave responde rápido e recupera o pedido.
- Endpoints /api/__mock/* nunca sofrem falhas de cenário.
- MSW avisa no console sobre chamadas a /api sem handler; o resto (assets, Vite) passa sem aviso.
- Catálogo: estado na URL (validateSearch com .catch por campo: valor inválido é ignorado). Campos opcionais sem padrão; a API aplica os padrões e a URL fica limpa.
- Mudar filtro volta para a página 1.
- Fora de ordem: uma chave de cache por combinação de parâmetros + AbortSignal do Query repassado ao Axios (requisição obsoleta é cancelada).
- keepPreviousData no catálogo: a lista anterior fica visível (esmaecida) enquanto a nova carrega.
- Loader faz prefetch sem bloquear a navegação, para o skeleton aparecer.
- Retry: queries não repetem 4xx e tentam até 2 vezes em rede/5xx; mutations nunca repetem sozinhas.
- Axios serializa arrays como parâmetros repetidos (?category=a&category=b).
- Preço do card = edição mais barata entre as disponíveis (esgotadas só contam se todas estiverem). É também a edição que o botão de carrinho do card adiciona, e a base do filtro de preço e da ordenação.


## Tempo real
- Socket mockado via ws.link com URL explícita (VITE_SOCKET_URL + /*); o socket.io-client usa transports: ['websocket'], pois o MSW intercepta WebSocket e não long-polling.
- Socket com uma conexão por sessão, fora dos componentes; componentes só assinam eventos. Evita conexões duplicadas (StrictMode) e facilita limpar tudo no logout.
- Heartbeat no mock: o @mswjs/socket.io-binding não envia o ping do Engine.IO; sem ele o cliente derrubava a conexão a cada ~30 s. O mock envia o pacote "2" a cada 10 s (limitação do binding, documentada).

## Contratos
- Schemas Zod como fonte única; tipos derivados com z.infer. Mock valida entradas e cliente valida respostas com os mesmos schemas.
- Preço e estoque ficam na edição (1/1, 1/N, aberta); o NFT tem um version único que sobe a cada mudança.
- Carrinho sempre no mock: visitante identificado por cartId salvo no localStorage (header X-Cart-Id); no login, POST /cart/merge junta os itens.
- Carrinho traz o resumo de valores calculado pelo mock; a cotação congela os valores para o checkout.
- Sessão por token Bearer salvo no localStorage, enviado pelo interceptor do Axios.
- Pedido recebe só quoteId + walletId: o pagamento usa as carteiras cadastradas, e o formulário vem preenchido com perfil e carteira.
- Carteiras por slot fixo (primary/secondary), como no Figma.

## Pendências
- maxPerOrder das fixtures (5 para edições acima de 1/10) não permite reproduzir o carrinho do Figma (quantidades 2, 6 e 9). Avaliar subir para 10 antes de gerar as baselines de regressão visual.
- Imagens dos NFTs estão em PNG 2x; converter para AVIF/WebP com dimensões fixas na fase do Lighthouse.
- No Figma, o detalhe do Emerald Ape mostra a edição 1/50 selecionada com 1.19 ETH; nas fixtures, 1.19 é a edição mais barata e a 1/50 custa 1.79. Decidir na tela de detalhe: selecionar por padrão a edição mais barata, ou ajustar a fixture.
- Bundle principal com 649 kB (208 kB gzip): investigar na fase do Lighthouse (o que entra no chunk inicial; mocks e zod são candidatos a separar).

## Integração
- Axios com interceptor de identidade (Bearer ou X-Cart-Id) e de 401; o cliente só avisa, a camada de sessão decide (sem dependência circular com router/Query).
- Respostas validadas com os schemas Zod do contrato (função request).
- Erros normalizados em AppError, incluindo NETWORK_ERROR e TIMEOUT, que não têm resposta HTTP.
- Sessão como query (staleTime infinito). Login, cadastro, logout e 401 limpam o cache inteiro (queryClient.clear): nenhum dado privado atravessa a troca de usuário. Chaves de dados privados também levam o userId.
- Merge do carrinho de visitante no login; o id só é descartado se o merge der certo.
- Rotas privadas sob o layout _auth (beforeLoad + ensureQueryData); redirect só aceita caminhos internos (evita open redirect).
- Expiração durante a navegação leva a /login?redirect=<página>&reason=expired.
- Tipo de retorno do queryFn da sessão declarado explicitamente (Promise<Session | null>): a inferência se perdia ao passar pela função genérica request e pelo try/catch.

## Interface
- Header mantido no mobile (o frame não tem): é onde ficam o login, o menu e a busca.
- Barra inferior do mobile reta (o Figma tem um recorte curvo) e hero mobile com uma imagem (o Figma sobrepõe duas). Desvios visuais por tempo.
- Filtros na URL no formato padrão do TanStack Router (JSON): as aspas mantêm os valores ETH como texto.
- Busca pelo header ou pelo campo mobile inicia uma pesquisa nova (descarta os outros filtros).
- Conteúdo editorial (Diário, banners) é estático; "Ler mais", newsletter e itens fora do escopo mostram "Disponível em breve nesta demonstração".

## Favoritos
- Atualização otimista com rollback: onMutate cancela buscas em andamento, guarda o estado e aplica a mudança; onError devolve o estado guardado e avisa; onSettled revalida com o servidor.
- Cache guarda só os ids (o coração funciona igual no card e no detalhe); chave com o userId.
- Visitante que tenta favoritar abre o diálogo de login e volta para a mesma página.
- Cenário mutation-error (503 em toda escrita, exceto auth) para exercitar o rollback.