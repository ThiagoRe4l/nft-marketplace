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
- Bundle inicial: ver a seção Lighthouse (o JS do app e do backend simulado limita o Performance no mobile).
- Domingo: após a rodada final dos testes, copiar playwright-report/ para docs/e2e-report/ (relatório HTML é entregável).

## Integração
- Axios com interceptor de identidade (Bearer ou X-Cart-Id) e de 401; o cliente só avisa, a camada de sessão decide (sem dependência circular com router/Query).
- Respostas validadas com os schemas Zod do contrato (função request).
- Erros normalizados em AppError, incluindo NETWORK_ERROR e TIMEOUT, que não têm resposta HTTP.
- Sessão como query (staleTime infinito). Login, cadastro, logout e 401 limpam o cache inteiro (queryClient.clear): nenhum dado privado atravessa a troca de usuário. Chaves de dados privados também levam o userId.
- Merge do carrinho de visitante no login; o id só é descartado se o merge der certo.
- Rotas privadas usam `beforeLoad: requireAuth` em cada rota (ensureQueryData da sessão), e não um layout `_auth`: um `_auth.tsx` sem filhas conflita com "/" no gerador de rotas (comentário em src/features/auth/require-auth.ts). Sem sessão, redireciona para /?auth=login&redirect=<página>. O redirect só aceita caminhos internos (evita open redirect).
- Expiração durante a navegação leva a /?auth=login&redirect=<página>&reason=expired (diálogo de login sobre a Início, com o aviso de sessão expirada). /login e /cadastro só redirecionam para esse formato.
- Tipo de retorno do queryFn da sessão declarado explicitamente (Promise<Session | null>): a inferência se perdia ao passar pela função genérica request e pelo try/catch.

## Interface
- Header mantido no mobile (o frame não tem): é onde ficam o login, o menu e a busca.
- Barra inferior do mobile reta (o Figma tem um recorte curvo) e hero mobile com uma imagem (o Figma sobrepõe duas). Desvios visuais por tempo.
- Filtros na URL no formato padrão do TanStack Router (JSON): as aspas mantêm os valores ETH como texto.
- Busca pelo header ou pelo campo mobile inicia uma pesquisa nova (descarta os outros filtros).
- O detalhe do NFT abre com a edição mais barata disponível selecionada (`defaultEdition`, em src/features/nft/purchase.ts; se todas estiverem esgotadas, a mais barata de todas). É a mesma regra do preço do card, então o valor que o usuário viu na lista é o que aparece ao abrir o detalhe. O Figma mostra o Emerald Ape com a edição 1/50 a 1.19 ETH, mas nas fixtures 1.19 é a edição mais barata e a 1/50 custa 1.79; seguimos a regra em vez de ajustar a fixture.
- Conteúdo editorial (Diário, banners) é estático; "Ler mais", newsletter e itens fora do escopo mostram "Disponível em breve nesta demonstração".

## Favoritos
- Atualização otimista com rollback: onMutate cancela buscas em andamento, guarda o estado e aplica a mudança; onError devolve o estado guardado e avisa; onSettled revalida com o servidor.
- Cache guarda só os ids (o coração funciona igual no card e no detalhe); chave com o userId.
- Visitante que tenta favoritar abre o diálogo de login e volta para a mesma página.
- Cenário mutation-error (503 em toda escrita, exceto auth) para exercitar o rollback.

## Conta
- Mutations de perfil e avatar atualizam o cache do perfil e o da sessão: o nome e o avatar no Header mudam na hora.
- Avatar enviado como multipart (FormData).
- Salvar uma carteira invalida a lista de carteiras (cadastro e edição pelo mesmo PUT por slot).

## Checkout
- Formulário (react-hook-form + Zod) com os campos e a regra de endereço por rede do UpsertWalletInput (safeExtend), mais carteira escolhida e observação. Pré-preenchido com o perfil e a carteira principal; o rascunho fica em sessionStorage por usuário e vale mais que o pré-preenchimento (sobrevive a refresh e ao login depois de sessão expirada; é apagado ao criar o pedido).
- Mapeamento dos campos do Figma: "Nome de usuário" = profileName, "Nome do perfil" = nickname, "ENS ou carteira secundária" = secondaryAddress.
- Só rede e observação vão no pedido (com quoteId e walletId). Os demais campos são validados e guardados no rascunho, mas não editam a carteira: não há chamada de edição no checkout.
- A carteira que paga é a escolhida num grupo de opções (radio) com as carteiras cadastradas ("Principal — MetaMask"); escolher uma preenche o formulário com os dados dela e desconecta a anterior. Sem carteira (ex.: Bruno): mensagem com link para /carteiras e "Revisar pedido" desabilitado.
- Cotação desatualizada = a API devolveu QUOTE_STALE OU o carrinho foi relido depois da cotação e já não bate com ela (itens, quantidades, preços unitários, cupom e total). Só o dataUpdatedAt gerava aviso falso a cada refetch sem mudança (foco da janela, reconciliação do socket).
- Cotação expirada (10 min) não tem timer no cliente: a API responde QUOTE_STALE e o fluxo é o mesmo.
- Retomada: tentativa guardada sem orderId reenvia o body com a mesma chave de idempotência, uma única vez ao montar. Com QUOTE_STALE a tentativa é descartada (o servidor não criou pedido) e o fluxo volta ao normal.
- Recibo usa só o snapshot do pedido (linhas, carteira, valores); o link do Etherscan é simulado e abre em nova aba com rel="noopener noreferrer".
- Desvio do Figma (mobile): o frame mobile só tem escolha de carteira, total e Confirmar; o app empilha as mesmas seções do desktop (formulário, itens, carteira, Confirmar).
- Desvio do Figma (recibo): vira a página /pedidos/$id em vez de modal; o "X" leva ao início; a ilustração "THANK YOU" é um ícone do lucide por falta de asset.

## Telas de conta (/perfil e /carteiras)
- Layout com menu lateral (lg+); abaixo disso vira lista horizontal rolável. Dados do perfil e Carteiras são Links com aria-current; Sair usa useLogout; os demais itens chamam comingSoon(). "Meu perfil" do Header e o botão Perfil do menu mobile levam a /perfil.
- Cada parte salva separadamente (dados, avatar, senha, cada carteira), com toast. Avatar: validação de tipo e 2 MB no cliente, e erro da API (422) também aparece sob o avatar.
- O ".eth" do Figma é um adorno fixo (o ensName é guardado sem sufixo), como no checkout.
- Carteira sem cadastro mostra estado vazio + "Adicionar"; com cadastro, o formulário preenchido já está visível e o botão some. "Igual à carteira principal" é derivado: marcado enquanto os campos coincidem com a principal; marcar copia, desmarcar volta ao salvo.
- Foco no primeiro campo com erro (aria-invalid) após validação ou erro da API, via efeito depois do commit (useFocusFirstError).
- FormField (rótulo visível + erro ligado por aria-describedby) vive em src/components/form e é usado pelo checkout e pela conta.

## Fidelidade visual ao Figma (desktop)
Medidas, tipografia e cores vêm de docs/figma/css; o mobile não foi alterado (as regras novas usam md:/lg:). Desvios e escolhas:
- Cor de destaque do texto (`text-highlight`, #E89B55 do "Text/Accent") separada do `--primary` (#D28A4C: fundos e traços).
- `--container-page` passou de 75rem para 78rem: com o gutter de 24px de cada lado o conteúdo fica com os 1200px do Figma (antes ficava com 1152px). Valores como a grade de 842px e a coluna de 595px dependem disso.
- Linha do header só na Início, Perfil e Carteiras (e no /login e /cadastro, que são a Início); detalhe, carrinho, pagamento e pedido usam o header sem a linha (`hasHeaderDivider` em nav.ts). A linha de 0,3px do Figma vira 1px com o token `--border` (≈ a cor que o Figma renderiza). No mobile o header continua com a linha de sempre.
- Header logado: o menu do usuário é mais largo que o botão "Entrar" (100px), então a nav desloca alguns pixels em relação ao Figma, que só mostra o estado deslogado.
- Hero: o título quebra em outro ponto que o do Figma (o texto do Figma é em inglês e tem outro comprimento). Os pontos ficam no fim da coluna de texto, mas o ponto do slide atual tem opacidade total e os outros 40% (no Figma os três são iguais), para o estado continuar visível.
- Filtros: botões com `aria-pressed` (seleção múltipla mantida). Pelo CSS do Figma só a contagem de Coleções é negrito; a de Rede é regular.
- Detalhe, galeria: uma miniatura por edição, todas com a imagem do NFT; a imagem central é sempre a primeira de `images` (as demais não aparecem mais no detalhe). Estado de edição e quantidade vive em `useEditionSelection` (galeria, preço, seletor e botões compartilham).
- Detalhe, avaliações: no desktop só as estrelas e a contagem aparecem (o número da nota fica para leitores de tela). As estrelas continuam do lucide (não há SVG exportado).
- Detalhe, quantidade: o texto de limite só aparece com o botão + desabilitado e fica posicionado sem deslocar o layout. Os botões do Figma (33×49,5 no detalhe, 20×30 no carrinho) são exportados com altura esticada; viraram círculos de 33px e 20px.
- Detalhe, aba de detalhes: ordem Rede, Contrato, Direitos autorais como no Figma, mas com o conteúdo certo em cada rótulo. **Desvio:** no Figma os textos de Contrato e Direitos autorais estão trocados (Contrato mostra o royalty e Direitos autorais mostra o endereço). O texto de Rede é o dado real da NFT, não o parágrafo do Figma.
- Carrosséis ("Mais desta coleção", "Colecionadores também viram"): pontos no lugar das setas; cada ponto é um botão ("Ir para a página N de M"). Uma página é uma largura visível da lista; com uma página só, os pontos não aparecem (o Figma mostra 3 pontos com 10 itens).
- Carrinho: a edição sai da linha e fica no nome acessível do link ("Emerald Ape #042 (edição ABERTA)"). Ícone de lixeira, busca, e-mail, menu, setas de select e estrelas seguem do lucide: não há SVG exportado deles.
- Ícones do Figma (src/components/icons, `currentColor`, `aria-hidden`): carrinho, logout/entrar, usuário, coração, "shopping" (card), localização, atividade, download, alerta, e as marcas Facebook, Instagram, Twitter e LinkedIn. O coração ganhou a prop `filled` (única edição à mão) para o estado de favorito. O YouTube não foi exportado e continua com o traço próprio. A barra inferior do mobile continua com lucide.
- Pagamento: o rótulo "Endereço da carteira" já era visível acima do campo; a carteira secundária fica sem rótulo visível (como no Figma, só o placeholder) mas com rótulo só para leitores de tela. O asterisco segue na cor primária (o Figma usa um coral, #F0805F, que não existe nos tokens).
- Pagamento: sem o texto de estimativa abaixo do total (fica só "Taxa estimada" na taxa). "Valores confirmados pela cotação." continua depois da revisão. A coluna do pedido passou a 405px com 32px de espaço.
- Pagamento, cupom: "Tem um código promocional? Aplique aqui" abre o mesmo `CouponForm` do carrinho. Como o formulário fica dentro do `<form>` do pagamento, o `CouponForm` deixou de ser um `<form>` (form dentro de form é inválido): é um grupo com Aplicar (botão) e Enter tratado à mão, sem enviar o pagamento. Aplicar ou remover cupom muda o carrinho e a cotação desatualizada já era tratada.
- Recibo: sem "Continuar explorando" (o X leva ao catálogo); o aviso de transação simulada virou uma linha discreta e aparece sempre, não só com o link do explorador.
- Correção de bug visual: `<picture>` com `display: contents` deixava os `<source>` como itens vazios de flex, e o `gap` empurrava as imagens (carrinho e pedido ficavam com 24 a 32px de vazio à esquerda). `picture > source { display: none }` em index.css.
- Fora do escopo e não alterado: breadcrumb, cards dos carrosséis (219px no Figma, 230px aqui), rodapé (colunas mais estreitas, então alguns títulos quebram) e as telas de login, cadastro e pedido.
- Regressão visual (e2e/visual.spec.ts): Início, Detalhe (emerald-ape-042), Carrinho (3 itens fixos) e Pagamento, em desktop e mobile, com `maxDiffPixelRatio` de 1% (playwright.config.ts). As baselines têm o sufixo `-win32`: em outro sistema operacional é preciso gerá-las (`npx playwright test visual --update-snapshots=all`). Com o padrão `--update-snapshots` só as imagens que passam do limite são reescritas.

## Lighthouse
Metas: Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 90. Medição: `npm run lighthouse` (build de produção, mocks ativos, 3 execuções por página e perfil, mediana em lighthouse/SUMMARY.md). A variação entre execuções chega a ±5 pontos de Performance; diferenças menores que isso não são sinal.

### Diagnóstico (primeira rodada)
- SEO 83: faltavam a meta description e um robots.txt válido (sem o arquivo, o preview devolvia o index.html). O <html> estava com lang="en".
- LCP: 52% a 72% do tempo era atraso de carregamento (a imagem só entra no DOM depois de HTML, JS do mock, service worker, API e render). O peso da imagem pesava pouco. Na Início mobile o LCP era um card com loading="lazy": o hero tem 136 px no mobile e o card, 162 px, então o card vence.
- Imagens: cinco PNG de ~420 a 447 KB (2 MB); economia estimada de 1,97 MiB com formatos modernos.
- CLS: no detalhe desktop, 0,149 de 0,151 vinha do rodapé empurrado quando o conteúdo (abas, mais da coleção) substituía o skeleton, bem mais baixo. Na Início, o resto vinha da troca da fonte.
- JS: 45 KiB sem uso, todos no chunk do backend simulado (fixtures e cenários), que é a entrega. Auth e react-hook-form sob demanda foram descartados: ganho desprezível.

### O que mudou
- SEO: lang="pt-BR", título e meta description, public/robots.txt.
- Imagens: scripts/optimize-images.mjs (sharp, `npm run images`) gera AVIF e WebP em 200, 400 e 500 px, versionados em public/assets/nfts. Os PNG ficam como fallback. As fontes têm ~500 px, então não há 800 px (seria ampliar). O componente NftImage (<picture>, srcset, sizes, width e height) é usado em card, hero, destaque, galeria, carrinho, pedido, recibo, banners e diário. Um PNG de 420 KB passa a ~10 a 16 KB.
- LCP: os quatro primeiros cards da grade carregam eager (primeira fileira). O hero e a imagem do detalhe já tinham eager/fetchpriority.
- CLS: o skeleton do detalhe reserva uma tela de altura (min-h-dvh), então o rodapé não se move. Preload da fonte Roboto Mono (plugin em vite.config.ts, o nome tem hash).
- TBT: as fixtures (nfts e cupons) só validam com o schema em desenvolvimento (import.meta.env.DEV); em produção o parse saía do caminho crítico.
- Header: o badge do carrinho some quando cartCount é 0.

### Testado e descartado
- Importar o app em paralelo com o worker.start() (socket.io-client dinâmico dentro do RealtimeBridge): a Início mobile piorou (LCP ~5 s contra ~4 s). Revertido, inclusive o import dinâmico.
- Promise.all dos imports dos mocks: sem diferença medível. Revertido.
- modulepreload dos chunks de inicialização: FCP de 2,4 s para 4,6 s (36 chunks disputam a banda com os críticos). Revertido.
- Prefetch no loader da Início (destaques) e do detalhe: sem efeito medível (as chamadas já saem em paralelo). Revertido.

### Resultado (medianas)
| Página | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | mobile | 77 | 99 | 100 | 100 | 3961 ms | 0,014 | 354 ms |
| /nft/emerald-ape-042 | mobile | 74 | 100 | 100 | 100 | 4134 ms | 0,000 | 365 ms |
| / | desktop | 95 | 99 | 100 | 100 | 1409 ms | 0,010 | 1 ms |
| /nft/emerald-ape-042 | desktop | 95 | 100 | 100 | 100 | 1414 ms | 0,000 | 0 ms |

Linha de base: mobile 73 e 84; desktop 95 e 90 (Performance), SEO 83 em todos.

### Meta que continua abaixo: Performance no mobile (74 a 77)
Causa: o app é só cliente e o backend é simulado no navegador. Antes do primeiro render o mobile (CPU 4x mais lenta, 1,6 Mbps) baixa e executa ~460 KB gzip de JS (app, zod e o chunk dos mocks), sobe o service worker do MSW e só então chama a API. Depois da otimização das imagens o LCP da Início mobile virou o texto do hero, não mais uma imagem: o limite é o tempo até o primeiro render (~4 s), não o conteúdo. Tirar o MSW ou o chunk dos mocks do caminho inicial quebraria a entrega, e a regra do enunciado proíbe simplificar só para a auditoria. O caminho que sobra é medir de novo com o backend real, onde o chunk dos mocks não existe.
