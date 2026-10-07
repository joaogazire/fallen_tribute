# FalleN Tribute

Site estático com contagem regressiva e highlights do FalleN.

## Desenvolvimento

```bash
npm install
npm run build:css      # gera styles.css (commitado, o site é servido como estático)
npm run serve          # http://localhost:8080 (precisa de servidor por causa dos módulos ES e do videos.json)
```

## Atualizar a lista de vídeos

A lista fica em `videos.json` e vem da busca do YouTube (vários canais). Para regenerá-la (a chave nunca vai para o navegador):

```bash
YT_API_KEY=sua_chave npm run generate:videos
```

Sem argumentos, usa consultas padrão ("fallen highlight cs", "fallen ace cs2", ...). Para personalizar:

```bash
YT_API_KEY=sua_chave npm run generate:videos -- "fallen awp" "fallen clutch" --max-seconds=90 --max-videos=60
```

Opções: `--channel=UC...` (limita a um canal), `--max-seconds`, `--max-videos`, `--pages` (cada página custa 100 de cota) e `--require=texto` (o título precisa conter o texto; `--require=` desliga o filtro). Só entram vídeos que podem ser incorporados.
