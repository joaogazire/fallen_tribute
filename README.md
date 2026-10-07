# FalleN Tribute

Site estático com contagem regressiva e highlights do FalleN.

## Desenvolvimento

```bash
npm install
npm run build:css      # gera styles.css (commitado, o site é servido como estático)
npm run serve          # http://localhost:8080 (precisa de servidor por causa dos módulos ES e do videos.json)
```

## Atualizar a lista de vídeos

A lista fica em `videos.json`. Para regenerá-la pela API do YouTube (a chave nunca vai para o navegador):

```bash
YT_API_KEY=sua_chave npm run generate:videos -- [canalId] ["consulta"]
```
