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

Opções: `--channel=UC...` (limita a um canal), `--max-seconds`, `--max-videos`, `--pages` (cada página custa 100 de cota) e `--require=texto` (o título precisa conter o texto; `--require=` desliga o filtro). Só entram vídeos que podem ser incorporados e que não são shorts (vídeos verticais ficariam com barras pretas nas laterais).

## Sons

Os efeitos ficam em `sounds/` (MP3). Cada arquivo é opcional:

| Arquivo | Quando toca |
|---|---|
| `awp-cs15.mp3`, `awp-cs16.mp3`, `awp-css.mp3`, `awp-csgo.mp3`, `awp-cs2.mp3` | tiro a cada clique, conforme a mira escolhida (sem o arquivo, toca um tiro sintetizado) |
| `oh-fallen.mp3` | "Oh FalleN, stop blowing my mind", a cada 1 minuto, só com o som do site ligado |
| `rubber-duck.mp3` | patinho de borracha ao clicar na AK-47 do painel Info |

Os volumes ficam no topo de `js/sounds.js`. Créditos e licenças em `sounds/CREDITOS.md`. Os sons dos jogos e da narração têm direitos autorais: use arquivos que você possa publicar.
