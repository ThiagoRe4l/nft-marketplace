# Lighthouse: medianas de 3 medições por página e perfil

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | mobile | 73 | 99 | 100 | 83 | 3994 ms | 0.037 | 426 ms |
| /nft/emerald-ape-042 | mobile | 84 | 100 | 100 | 83 | 3798 ms | 0.000 | 151 ms |
| / | desktop | 95 | 99 | 100 | 83 | 1336 ms | 0.031 | 3 ms |
| /nft/emerald-ape-042 | desktop | 90 | 100 | 100 | 83 | 1245 ms | 0.151 | 0 ms |

- Lighthouse 12.6.1
- Navegador: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36
- Build de produção (vite build + vite preview), mocks ativos no cenário padrão
- Relatórios HTML e JSON de cada medição em lighthouse/mobile e lighthouse/desktop
