# NFT Marketplace (Kurio) — teste técnico frontend

App React + TS com backend 100% simulado por MSW. Enunciado completo e decisões: docs/decisions.md, docs/contracts.md.

## Comandos
- npm run dev | build | preview | typecheck | lint | test:e2e
- Sempre rode `npm run typecheck` e `npm run lint` ao terminar uma tarefa.

## Versões fixadas (não atualizar)
- TypeScript ~6.0 (typescript-eslint não suporta 7)
- MSW 2.x (@mswjs/socket.io-binding exige msw ^2)

## Estrutura
- src/contracts/: schemas Zod, fonte única dos tipos (z.infer). Não duplique tipos.
- src/mocks/: o "backend". db/ (store em memória + localStorage), handlers/ (um arquivo por recurso), realtime/ (Socket.IO via ws.link), lib/ (http, pricing, password).
- src/routes/: TanStack Router file-based. src/routeTree.gen.ts é gerado: não edite.
- src/components/ui/: shadcn/ui com **Base UI** (usa a prop `render`, não `asChild`).
- e2e/: testes Playwright.

## Regras do mock
- Alterações no banco só via db.write(fn); leitura via db.read().
- Dentro de um db.write, nada de await entre checar e gravar (concorrência).
- Erros via apiError(code, message, fieldErrors?); corpo validado com parseBody(request, Schema); sessão com requireSession/optionalSession.
- Toda mudança em NFT ou pedido publica o evento (realtime/events.ts).
- Respostas públicas passam pelo schema do contrato (ex.: User.parse) para remover campos internos.

## Regras do app
- Dados do servidor só no TanStack Query; chamadas REST só via Axios (src/shared/api/client.ts).
- Estado de busca/filtros/paginação na URL (validateSearch do Router).
- Componentes, hooks e o cliente Axios NUNCA contêm respostas fictícias ou eventos simulados: isso só existe em src/mocks/.
- Valores em ETH são strings decimais; cálculos com big.js, nunca Number.
- Textos da interface em português.

## Como trabalhar
- Não adicione dependências sem perguntar.
- Não altere arquivos fora do escopo pedido. Em mudanças grandes, mostre o plano antes.
- Arquivos do núcleo escritos à mão (não reescrever sem pedir): src/mocks/db/*, src/mocks/lib/http.ts, src/mocks/handlers/{auth,cart,checkout}.ts, src/mocks/realtime/*.