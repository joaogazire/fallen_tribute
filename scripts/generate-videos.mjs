// Gera o videos.json localmente, fora do site, para que a chave da API
// nunca fique exposta no navegador.
//
// Uso:
//   YT_API_KEY=sua_chave node scripts/generate-videos.mjs [consultas...] [opções]
//
// Sem consultas, usa as padrão (abaixo). Opções:
//   --channel=UC...      limita a um canal (padrão: busca em todo o YouTube)
//   --max-seconds=100    duração máxima de cada clipe
//   --max-videos=80      quantidade máxima na lista final
//   --pages=2            páginas de resultado por consulta (cada página custa 100 de cota)
//   --require=fallen     o título precisa conter este texto ("--require=" desliga o filtro)
//
// Shorts (verticais) são sempre descartados.
import { writeFile } from 'node:fs/promises';

const apiKey = process.env.YT_API_KEY;
if (!apiKey) {
    console.error('Defina a variável de ambiente YT_API_KEY.');
    process.exit(1);
}

const DEFAULT_QUERIES = [
    'fallen highlight cs',
    'fallen ace cs2',
    'fallen clutch csgo',
    'fallen awp highlights'
];

const opts = { channel: '', 'max-seconds': '100', 'max-videos': '80', pages: '2', require: 'fallen' };
const queries = [];
for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([a-z-]+)=(.*)$/);
    if (m && m[1] in opts) opts[m[1]] = m[2];
    else if (!arg.startsWith('--')) queries.push(arg);
    else {
        console.error(`Opção desconhecida: ${arg}`);
        process.exit(1);
    }
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_SECONDS = Math.max(1, parseInt(opts['max-seconds'], 10) || 100);
const MAX_VIDEOS = Math.max(1, parseInt(opts['max-videos'], 10) || 80);
const PAGES = Math.min(5, Math.max(1, parseInt(opts.pages, 10) || 2));
const REQUIRE = opts.require.trim().toLowerCase();
const CHANNEL = CHANNEL_ID.test(opts.channel) ? opts.channel : '';
if (opts.channel && !CHANNEL) {
    console.error('ID de canal inválido.');
    process.exit(1);
}

function isoDurationToSeconds(iso) {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

async function getJson(url) {
    const res = await fetch(url);
    // Nunca inclui a URL na mensagem de erro: ela contém a chave da API
    if (!res.ok) throw new Error(`YouTube API respondeu ${res.status} ${res.statusText}`);
    return res.json();
}

// Busca os IDs de uma consulta, página a página
async function searchIds(query) {
    const ids = [];
    let pageToken = '';
    for (let page = 0; page < PAGES; page++) {
        let url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&order=viewCount&maxResults=50&type=video&videoDuration=short&videoEmbeddable=true&q=${encodeURIComponent(query)}`;
        if (CHANNEL) url += `&channelId=${CHANNEL}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        const data = await getJson(url);
        for (const item of data.items || []) if (item.id?.videoId) ids.push(item.id.videoId);
        pageToken = data.nextPageToken;
        if (!pageToken) break;
    }
    return ids;
}

const candidateIds = new Set();
for (const query of queries.length ? queries : DEFAULT_QUERIES) {
    const ids = await searchIds(query);
    console.log(`"${query}": ${ids.length} resultados`);
    ids.forEach(id => candidateIds.add(id));
}

if (candidateIds.size === 0) {
    console.error('Nenhum vídeo encontrado.');
    process.exit(1);
}

// Detalhes em lotes de 50 (limite da API): duração, título e se pode ser incorporado
const all = [...candidateIds];
const details = [];
for (let i = 0; i < all.length; i += 50) {
    const batch = all.slice(i, i + 50).join(',');
    const data = await getJson(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${batch}&part=contentDetails,snippet,status`);
    details.push(...(data.items || []));
}

// Shorts são verticais e ficam com barras pretas nas laterais no site.
// youtube.com/shorts/ID responde 200 para shorts e redireciona os vídeos normais.
async function isShort(id) {
    try {
        const res = await fetch(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual' });
        return res.status === 200;
    } catch {
        return true; // na dúvida, fica de fora
    }
}

const filtered = details
    .filter(v => VIDEO_ID.test(v.id))
    .filter(v => v.status?.embeddable === true)
    .filter(v => isoDurationToSeconds(v.contentDetails.duration) <= MAX_SECONDS)
    .filter(v => !REQUIRE || String(v.snippet.title).toLowerCase().includes(REQUIRE));

const notShort = [];
for (const v of filtered) {
    if (notShort.length >= MAX_VIDEOS) break;
    if (!(await isShort(v.id))) notShort.push(v);
}

const videos = notShort
    // Só os campos de que o site precisa: o resto da resposta da API é descartado
    .map(v => ({ id: v.id, title: String(v.snippet.title).trim().slice(0, 200) }));

if (videos.length === 0) {
    console.error('Nenhum vídeo passou nos filtros. Tente --max-seconds=180 ou --require= (sem filtro de título).');
    process.exit(1);
}

await writeFile(new URL('../videos.json', import.meta.url), JSON.stringify(videos, null, 2) + '\n');
console.log(`videos.json atualizado com ${videos.length} vídeos (de ${candidateIds.size} candidatos).`);
