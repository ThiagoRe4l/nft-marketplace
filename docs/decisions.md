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

## Tempo real
- Socket mockado via ws.link com URL explícita (VITE_SOCKET_URL + /*); o socket.io-client usa transports: ['websocket'], pois o MSW intercepta WebSocket e não long-polling.
- Socket com uma conexão por sessão, fora dos componentes; componentes só assinam eventos. Evita conexões duplicadas (StrictMode) e facilita limpar tudo no logout.

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