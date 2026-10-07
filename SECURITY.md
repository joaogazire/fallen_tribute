# Segurança

O site é **100% estático**: sem backend, banco de dados, login, cookies, formulários ou upload.
Itens que dependem dessas peças não se aplicam. Abaixo, o que foi feito em cada ponto.

| # | Ponto | Status |
|---|-------|--------|
| 1 | Esconder API keys | Feito. Nenhuma chave no front-end. O gerador lê `YT_API_KEY` do ambiente e nunca a imprime. |
| 2 | Limpar secrets do git | Verificado. O histórico só tinha o placeholder `SUA_CHAVE_API_AQUI`. `.gitignore` bloqueia `.env*`, `*.pem`, `*.key`, e o CI falha se um padrão de chave aparecer. |
| 3 | Chave pública de DB | N/A (sem banco). |
| 4 | RLS | N/A (sem banco). |
| 5 | Criptografia de dados | N/A (sem dados de usuário). Em trânsito: HTTPS (ponto 19). |
| 6 | Auth server-side | N/A (sem autenticação). |
| 7 | Restringir acessos | Feito. Sem dados privados. `frame-ancestors 'none'`, `.gitignore` e sem source maps. |
| 8 | Mass assignment | N/A (sem escrita). Equivalente: `videos.json` só aceita `{id, title}`; campos extras são descartados. |
| 9 | Proteger cookies | N/A (sem cookies). O player usa `youtube-nocookie.com`. |
| 10 | Hash de senhas | N/A (sem senhas). |
| 11 | Rate limit | Não implementável em site estático. Configurar na hospedagem/CDN (ex.: Cloudflare). O site não chama API própria; o "Próximo" é local. |
| 12 | Bot protection | Idem: Cloudflare Bot Fight Mode / Turnstile na borda. Não há formulário a proteger. |
| 13 | Queries parametrizadas | N/A (sem SQL). A busca na API do YouTube usa `encodeURIComponent`. |
| 14 | Validação de inputs | Feito. ID do vídeo validado por regex (`^[A-Za-z0-9_-]{11}$`), título aparado e limitado a 200 caracteres, no gerador e no navegador. |
| 15 | Vazamento de conteúdo | Feito. Títulos entram via `textContent` (sem `innerHTML`); sem `eval`; CSP restritiva; sem segredos no repo. |
| 16 | Restringir uploads | N/A (sem upload). `form-action 'none'`. |
| 17 | Trim de respostas de API | Feito. Do retorno do YouTube só `id` e `title` são salvos. |
| 18 | Security headers | Feito. CSP via `<meta>` e, em `_headers`: HSTS, CSP com `frame-ancestors`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP. |
| 19 | Forçar HTTPS | Parcial. `upgrade-insecure-requests` e HSTS (em `_headers`). O redirecionamento HTTP→HTTPS depende da hospedagem (GitHub Pages: marcar "Enforce HTTPS"). |
| 20 | Scan de dependências | Feito. Workflow `security.yml` e Dependabot. Produção: 0 vulnerabilidades (nenhuma dependência de runtime). |

## Risco aceito

`npm audit` aponta 7 vulnerabilidades (5 high) em `braces`/`postcss-selector-parser`, dependências
**só de build** do Tailwind 3 (ReDoS ao processar padrões de glob). Não vão para o site e não há
versão corrigida de `braces`. Sair disso exige migrar para o Tailwind 4. O CI audita só produção.

## Hospedagem

`_headers` funciona em Netlify e Cloudflare Pages. O GitHub Pages ignora o arquivo, e lá valem só
a CSP do `<meta>` e o "Enforce HTTPS".
