// Gera o videos.json localmente, fora do site, para que a chave da API
// nunca fique exposta no navegador.
//
// Uso: YT_API_KEY=sua_chave node scripts/generate-videos.mjs [canalId] [consulta]
import { writeFile } from 'node:fs/promises';

const apiKey = process.env.YT_API_KEY;
if (!apiKey) {
    console.error('Defina a variável de ambiente YT_API_KEY.');
    process.exit(1);
}

const channelId = /^[A-Za-z0-9_-]{1,64}$/.test(process.argv[2] || '') ? process.argv[2] : '';
const query = process.argv[3] || 'fallen highlight vs cs';
const MAX_SECONDS = 100;
const MAX_VIDEOS = 50;

function isoDurationToSeconds(iso) {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

async function getJson(url) {
    const res = await fetch(url);
    // Nunca inclui a URL na mensagem de erro: ela contém a chave da API
    if (!res.ok) throw new Error(`YouTube API respondeu ${res.status} ${res.statusText}`);
    return res.json();
}

let searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&order=viewCount&maxResults=50&type=video&videoDuration=short&q=${encodeURIComponent(query)}`;
if (channelId) searchUrl += `&channelId=${channelId}`;

const search = await getJson(searchUrl);
const ids = search.items.map(i => i.id?.videoId).filter(Boolean).join(',');
if (!ids) {
    console.error('Nenhum vídeo encontrado.');
    process.exit(1);
}

const details = await getJson(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${ids}&part=contentDetails,snippet`);
const videos = details.items
    .filter(v => VIDEO_ID.test(v.id) && isoDurationToSeconds(v.contentDetails.duration) <= MAX_SECONDS)
    .slice(0, MAX_VIDEOS)
    // Só os campos de que o site precisa: o resto da resposta da API é descartado
    .map(v => ({ id: v.id, title: String(v.snippet.title).trim().slice(0, 200) }));

await writeFile(new URL('../videos.json', import.meta.url), JSON.stringify(videos, null, 2) + '\n');
console.log(`videos.json atualizado com ${videos.length} vídeos.`);
