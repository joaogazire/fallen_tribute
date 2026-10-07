import { getList, setList } from './storage.js';

const USED_KEY = 'fallen_used_videos_v4';
const FALLBACK = [{ id: 'Z6tmyec2tac', title: 'CS:GO - FalleN 1 vs 2 Clutch To Win Game @ IEM Katowice 2016' }];

let catalog = null;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_TITLE = 200;

// Aceita só { id, title } com formato válido; descarta qualquer campo extra ou entrada malformada
function sanitize(list) {
    if (!Array.isArray(list)) return [];
    return list
        .filter(v => v && typeof v.id === 'string' && VIDEO_ID.test(v.id))
        .map(v => ({
            id: v.id,
            title: typeof v.title === 'string' ? v.title.trim().slice(0, MAX_TITLE) : ''
        }));
}

// A lista vem de videos.json (gerado por scripts/generate-videos.mjs), sem chamar API no navegador.
export async function loadCatalog() {
    if (catalog) return catalog;
    try {
        const res = await fetch('videos.json');
        if (!res.ok) throw new Error(res.statusText);
        const list = sanitize(await res.json());
        catalog = list.length ? list : FALLBACK;
    } catch (e) {
        console.warn('Não foi possível carregar videos.json, usando vídeo padrão.', e);
        catalog = FALLBACK;
    }
    return catalog;
}

// Escolhe um vídeo aleatório ainda não exibido (diferente do atual, se houver alternativa)
export async function pickVideo(currentId = null) {
    const videos = await loadCatalog();
    let used = getList(USED_KEY).filter(id => typeof id === 'string' && videos.some(v => v.id === id));
    let pool = videos.filter(v => !used.includes(v.id) && v.id !== currentId);

    if (pool.length === 0) {
        used = [];
        pool = videos.filter(v => v.id !== currentId);
        if (pool.length === 0) pool = videos;
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];
    used.push(pick.id);
    setList(USED_KEY, used);
    return pick;
}
