# Kurio — Marketplace de NFTs

Marketplace de NFTs em React e TypeScript, com backend 100% simulado por MSW (REST e Socket.IO).

- **Aplicação publicada:** https://nft-marketplace-ashen-zeta.vercel.app
- **Repositório:** <URL do repositório>
- **Arquitetura e decisões:** [ARCHITECTURE.md](./ARCHITECTURE.md) e [docs/decisions.md](./docs/decisions.md)
- **Contratos REST:** [docs/contracts.md](./docs/contracts.md)

## Stack

React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO (cliente), Tailwind CSS, shadcn/ui (Base UI), MSW, Playwright e Lighthouse. Complementares: Zod (contratos), big.js (valores em ETH), react-hook-form.

## Requisitos

- Node.js <versão usada, ex.: 22.x> (confira com `node -v`)
- npm

## Como rodar (a partir de um checkout limpo)

```bash
git clone <URL do repositório>
cd nft-marketplace
npm ci
npm run dev
```

Abra http://localhost:5173. Os mocks sobem junto com o app: não há backend para configurar.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Verificação de tipos e build de produção (com mocks, para a demonstração) |
| `npm run preview` | Serve o build de produção |
| `npm run typecheck` | Verificação de tipos (app, mocks e testes) |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Testes Playwright funcionais (desktop e mobile, Chromium), sem os de regressão visual |
| `npm run test:visual` | Regressão visual (`@visual`); baselines só do Windows, pula em outros SOs |
| `npm run test:e2e:report` | Abre o relatório HTML da última execução |
| `npm run lighthouse` | Auditoria Lighthouse (build, 3 medições por página e perfil, gera `lighthouse/SUMMARY.md`) |

Na primeira execução dos testes, instale o Chromium do Playwright: `npx playwright install chromium`.

## Variáveis de ambiente

Já vêm no `.env` versionado (não há segredos):

| Variável | Valor | Para que serve |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa o MSW (REST e Socket.IO). Ligado também no build de demonstração. |
| `VITE_SOCKET_URL` | `wss://realtime.nft-marketplace.mock` | Endereço do Socket.IO. O domínio é fictício: o MSW intercepta a conexão. |

## Credenciais fictícias

| Usuário | E-mail | Senha | Observação |
| --- | --- | --- | --- |
| Ana Ribeiro | `ana@kurio.dev` | `kurio1234` | Tem carteira principal cadastrada |
| Bruno Costa | `bruno@kurio.dev` | `kurio5678` | Sem carteira (exercita o checkout sem carteira) |

Cupons: `KURIO10` (10% de desconto) e `EXPIRADO20` (expirado). Qualquer outro código é inválido.

## Dados simulados, persistência e reset

O "banco" do mock vive em memória e é persistido no `localStorage` do navegador (chave `kurio-mock-db`), o que mantém carrinho, favoritos, perfil, carteiras e pedidos após refresh.

Para voltar ao estado inicial (dados e cenário padrão), no console do navegador:

```js
await fetch('/api/__mock/reset', { method: 'POST' })
```

Depois recarregue a página. Apagar a chave `kurio-mock-db` no DevTools (Application → Local Storage) tem o mesmo efeito para os dados.

## Cenários de rede e falha

O cenário ativo fica salvo no navegador. Para escolher:

- pela URL: acrescente `?scenario=<nome>` a qualquer página (ex.: `/?scenario=slow`);
- ou pelo console: `await fetch('/api/__mock/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '<nome>' }) })`.

| Cenário | Efeito |
| --- | --- |
| `default` | Latência baixa e estável (120 ms) |
| `slow` | 2,5 s em toda requisição (skeletons) |
| `flaky` | Latência variável em sequência fixa: respostas chegam fora de ordem |
| `offline` | Toda requisição falha na rede |
| `server-error` | 503 em todas as consultas (GET) |
| `mutation-error` | 503 em toda escrita, exceto login (rollback dos favoritos) |
| `empty` | Catálogo vazio |
| `order-timeout` | O pedido é criado, mas a resposta demora mais que o timeout do app |
| `payment-rejected` | O pagamento é recusado |
| `wallet-rejected` | A conexão da carteira é recusada |

Os cenários são determinísticos (sem `Math.random`) e podem ser trocados a qualquer momento. O reset volta ao `default`.

## Como reproduzir os fluxos de falha

Use `ana@kurio.dev` / `kurio1234`. Os endpoints de controle (`/api/__mock/*`) devem ser chamados a partir do console da própria página, porque o MSW só intercepta requisições feitas por ela.

**Busca fora de ordem:** `/?scenario=flaky`, troque de filtro rapidamente. A tela sempre termina com o resultado do último filtro (requisições obsoletas são canceladas).

**Skeletons e nova tentativa:** `/?scenario=slow` mostra os skeletons. Com `server-error`, o catálogo mostra o erro; volte ao `default` e clique em "Tentar novamente".

**Sessão expirada durante a navegação ou o checkout:**

```js
await fetch('/api/__mock/session/expire', { method: 'POST' })
```

Na próxima ação, o diálogo de login abre com o aviso de sessão expirada e, após entrar, o usuário volta para a página onde estava (no checkout, o formulário é restaurado).

**Preço ou disponibilidade mudando com o NFT no carrinho (tempo real):** com o Emerald Ape #042 no carrinho, altere a edição "de fora":

```js
await fetch('/api/__mock/nfts/emerald-ape-042/editions/emerald-ape-042-aberta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ price: '0.90' }), // ou { available: 1 }
})
```

A interface avisa a alteração, o resumo é atualizado e o checkout exige nova cotação antes de confirmar.

**Eventos duplicados e antigos:**

```js
// duplicata (mesmo eventId): ignorada
await fetch('/api/__mock/realtime/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ which: 'last' }) })
// evento antigo (versão anterior, eventId novo): ignorado, o estado não regride
await fetch('/api/__mock/realtime/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ which: 'previous' }) })
```

**Queda de conexão em tempo real:**

```js
await fetch('/api/__mock/realtime/disconnect', { method: 'POST' })
```

O cliente reconecta sozinho e reconcilia catálogo, carrinho e pedidos com a API REST.

**Timeout após criar o pedido (idempotência):** `/checkout?scenario=order-timeout`, confirme a compra. Após o timeout, o app reenvia com a mesma `Idempotency-Key` e chega ao recibo do mesmo pedido (sem compra duplicada).

**Pagamento recusado e carteira recusada:** `?scenario=payment-rejected` ou `?scenario=wallet-rejected` no checkout. Os itens continuam no carrinho.

**Pedido pendente com refresh:** confirme uma compra e recarregue a página do pedido enquanto ele estiver pendente: o estado é recuperado sem criar outra compra.

## Testes

```bash
npm run test:e2e        # funcionais (portáteis: Windows, Mac, Linux, CI)
npm run test:visual     # regressão visual (@visual), só no Windows
npm run test:e2e:report
```

As baselines de `e2e/visual.spec.ts-snapshots/` têm sufixo `-win32`: o render de fontes muda entre sistemas e elas quebrariam em Mac/Linux/CI. Por isso esses testes têm a tag `@visual`, ficam fora de `test:e2e` e se pulam sozinhos quando `process.platform !== 'win32'`. Para gerar baselines do seu SO: `npm run test:visual -- --update-snapshots` (remova o `test.skip` de plataforma).

Cada teste roda num contexto de navegador novo, então o banco do mock começa sempre no estado inicial. Os fluxos rodam em Chromium nos viewports desktop (1440×900) e mobile (390×844). Relatório da execução final: [docs/e2e-report](./docs/e2e-report).

## Lighthouse

```bash
npm run lighthouse
```

Configuração versionada em `lighthouserc.mobile.json` e `lighthouserc.desktop.json`. Resultados (medianas, LCP, CLS, TBT, versões e ambiente) em [lighthouse/SUMMARY.md](./lighthouse/SUMMARY.md); relatórios HTML e JSON de cada medição em `lighthouse/mobile` e `lighthouse/desktop`.
