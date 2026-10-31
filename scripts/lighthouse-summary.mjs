import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const PROFILES = ['mobile', 'desktop']
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

const rows = []
let sample

for (const profile of PROFILES) {
  const dir = path.join('lighthouse', profile)
  const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'))

  // agrupa as 3 medições de cada página
  const byPage = manifest.reduce((groups, run) => {
    const page = new URL(run.url).pathname
    ;(groups[page] ??= []).push(run)
    return groups
  }, {})

  for (const [page, runs] of Object.entries(byPage)) {
    const reports = runs.map((run) => JSON.parse(readFileSync(path.resolve(run.jsonPath), 'utf8')))
    sample ??= reports[0]
    const category = (key) => Math.round(median(runs.map((run) => run.summary[key])) * 100)
    const metric = (id) => median(reports.map((report) => report.audits[id].numericValue))

    rows.push(
      `| ${page} | ${profile} | ${category('performance')} | ${category('accessibility')} | ` +
        `${category('best-practices')} | ${category('seo')} | ` +
        `${Math.round(metric('largest-contentful-paint'))} ms | ` +
        `${metric('cumulative-layout-shift').toFixed(3)} | ` +
        `${Math.round(metric('total-blocking-time'))} ms |`,
    )
  }
}

const markdown = `# Lighthouse: medianas de 3 medições por página e perfil

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}

- Lighthouse ${sample.lighthouseVersion}
- Navegador: ${sample.environment.hostUserAgent}
- Build de produção (vite build + vite preview), mocks ativos no cenário padrão
- Relatórios HTML e JSON de cada medição em lighthouse/mobile e lighthouse/desktop
`

writeFileSync(path.join('lighthouse', 'SUMMARY.md'), markdown)
console.log(markdown)