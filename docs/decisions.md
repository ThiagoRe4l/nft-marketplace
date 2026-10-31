# Decisões

## Setup
- TypeScript fixado em ~6.0: o template do Vite veio com TS 7, mas o typescript-eslint só suporta até 6.0.x.
- MSW fixado em 2.x: o @mswjs/socket.io-binding 0.2.0 exige msw ^2, e o MSW 3 mudou a API de WebSocket.
- shadcn/ui com Base UI (preset Nova).
- baseUrl + ignoreDeprecations no tsconfig raiz: o CLI do shadcn não resolve o alias @/ só com paths no TS 6.
- routeTree.gen.ts commitado: o build roda tsc antes do vite, e um checkout limpo quebraria sem ele.
- .env commitado: só contém configuração não sensível; garante que checkout limpo e deploy rodem com mocks.
- mockServiceWorker.js versionado em public/: o deploy precisa servir o worker; sem ele, o rewrite SPA devolve HTML e o MSW falha.

## Tempo real
- Socket mockado via ws.link com URL explícita (VITE_SOCKET_URL + /*); o socket.io-client usa transports: ['websocket'], pois o MSW intercepta WebSocket e não long-polling.
- Socket com uma conexão por sessão, fora dos componentes; componentes só assinam eventos. Evita conexões duplicadas (StrictMode) e facilita limpar tudo no logout.