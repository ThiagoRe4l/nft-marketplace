# Lighthouse: medianas de 3 medições por página e perfil

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | mobile | 77 | 99 | 100 | 100 | 3961 ms | 0.014 | 354 ms |
| /nft/emerald-ape-042 | mobile | 74 | 100 | 100 | 100 | 4134 ms | 0.000 | 365 ms |
| / | desktop | 95 | 99 | 100 | 100 | 1409 ms | 0.010 | 1 ms |
| /nft/emerald-ape-042 | desktop | 95 | 100 | 100 | 100 | 1414 ms | 0.000 | 0 ms |

- Lighthouse 12.6.1
- Navegador: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36
- Build de produção (vite build + vite preview), mocks ativos no cenário padrão
- Relatórios HTML e JSON de cada medição em lighthouse/mobile e lighthouse/desktop
