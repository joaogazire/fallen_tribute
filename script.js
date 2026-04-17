// Countdown target: 2026-12-20 00:00 BRT (UTC-3)
const countdownDate = Date.UTC(2026, 11, 20, 3, 0, 0);

// Countdown timer
const timer = setInterval(function() {
    const distance = countdownDate - Date.now();

    if (distance < 0) {
        clearInterval(timer);
        updateTimerDOM(0, 0, 0, 0);
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    updateTimerDOM(days, hours, minutes, seconds);
}, 1000);

function updateTimerDOM(d, h, m, s) {
    // update DOM with zero-padded values
    document.getElementById("days").textContent = String(d).padStart(2, '0');
    document.getElementById("hours").textContent = String(h).padStart(2, '0');
    document.getElementById("minutes").textContent = String(m).padStart(2, '0');
    document.getElementById("seconds").textContent = String(s).padStart(2, '0');
}

// Video logic
const YT_API_KEY = "SUA_CHAVE_API_AQUI"; // optional API key
const YT_CHANNEL_ID = "";

const STATIC_LIST_KEY = "fallen_static_list_v3";
const STATIC_NEXT_INDEX_KEY = "fallen_static_next_index_v3";
const STORAGE_KEY_USED = "fallen_used_videos_v3";
const STORAGE_KEY_CACHE = "fallen_candidates_cache_v3";

let staticCandidates = getLocalStorageData(STATIC_LIST_KEY);
if (!Array.isArray(staticCandidates) || staticCandidates.length === 0) {
    staticCandidates = [{ id: "Z6tmyec2tac", title: "CS:GO - FalleN 1 vs 2 Clutch To Win Game @ IEM Katowice 2016" }];
}

// Convert ISO 8601 duration (PT1M30S) to seconds
function isoDurationToSeconds(iso) {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    const hours = parseInt(m[1] || 0, 10);
    const minutes = parseInt(m[2] || 0, 10);
    const seconds = parseInt(m[3] || 0, 10);
    return hours * 3600 + minutes * 60 + seconds;
}

// Fetch candidates via YouTube Data API (filter <=100s)
async function fetchCandidateVideosFromApi(apiKey, channelId, query = "fallen highlight vs cs") {
    try {
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&order=viewCount&maxResults=50&type=video&videoDuration=short&q=${encodeURIComponent(query)}`;
        if (channelId) searchUrl += `&channelId=${channelId}`;
        const res = await fetch(searchUrl);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const ids = data.items.map(i => i.id?.videoId).filter(Boolean).join(",");
        if (!ids) return [];
        const vidUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${ids}&part=contentDetails,snippet`;
        const res2 = await fetch(vidUrl);
        if (!res2.ok) throw new Error("Video details failed");
        const data2 = await res2.json();
        const top10Videos = data2.items.filter(it => isoDurationToSeconds(it.contentDetails.duration) <= 100).slice(0,10).map(it => ({ id: it.id, title: it.snippet.title }));
        if (top10Videos.length > 0) { staticCandidates = top10Videos; setLocalStorageData(STATIC_LIST_KEY, staticCandidates); }
        return top10Videos;
    } catch (e) {
        console.error("YouTube API error:", e);
        return [];
    }
}

// LocalStorage helpers
function getLocalStorageData(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setLocalStorageData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

async function getCandidates() {
    // 1. Tenta carregar do cache para poupar a cota da API
    let candidates = getLocalStorageData(STORAGE_KEY_CACHE);
    
    // 2. Se o cache estiver vazio e a chave da API existir, faz o fetch
    if (candidates.length === 0 && YT_API_KEY) {
        candidates = await fetchCandidateVideosFromApi(YT_API_KEY, YT_CHANNEL_ID);
        if (candidates.length > 0) {
            setLocalStorageData(STORAGE_KEY_CACHE, candidates);
        }
    }

    // 3. Fallback estático caso a API falhe ou não encontre nada
    if (candidates.length === 0) {
        candidates = staticCandidates;
    }
    
    return candidates;
}

// Ensure static list has at least `min` items
async function ensureStaticListSize(min = 50) {
    let list = getLocalStorageData(STATIC_LIST_KEY) || [];
    const existing = new Set(list.map(i => i.id));

    if (list.length >= min) { staticCandidates = list; return; }
    if (!YT_API_KEY) { staticCandidates = list; return; }
    const fetched = await fetchCandidateVideosFromApi(YT_API_KEY, YT_CHANNEL_ID);
    for (const v of fetched) { if (!existing.has(v.id)) { list.push(v); existing.add(v.id); if (list.length >= min) break; } }
    setLocalStorageData(STATIC_LIST_KEY, list); staticCandidates = list;
}

function getNextFromStaticList() {
    const list = getLocalStorageData(STATIC_LIST_KEY) || staticCandidates || [];
    if (!list.length) return null;
    let idx = parseInt(localStorage.getItem(STATIC_NEXT_INDEX_KEY) || '0', 10);
    if (isNaN(idx) || idx < 0) idx = 0;
    if (idx >= list.length) idx = 0;
    const video = list[idx];
    idx = (idx + 1) % list.length;
    localStorage.setItem(STATIC_NEXT_INDEX_KEY, String(idx));
    return video;
}

async function pickUnusedVideo() {
    let candidates = await getCandidates();
    let used = getLocalStorageData(STORAGE_KEY_USED);
    let unused = candidates.filter(c => !used.includes(c.id));

    // Se todos foram usados (ou se a API retornou novos vídeos mas todos os antigos já rodaram)
    if (unused.length === 0) {
        used = []; // Reseta o histórico de usados
        setLocalStorageData(STORAGE_KEY_USED, used);
        
        // Limpa o cache para forçar a API a buscar vídeos mais recentes na próxima iteração
        localStorage.removeItem(STORAGE_KEY_CACHE); 
        
        // Se ainda tínhamos candidatos na memória, recicla o primeiro, senão aborta
        if (candidates.length > 0) {
            unused = candidates;
        } else {
            return null; 
        }
    }

    // Escolhe um vídeo aleatório da lista de não-usados
    const pick = unused[Math.floor(Math.random() * unused.length)];
    used.push(pick.id);
    setLocalStorageData(STORAGE_KEY_USED, used);
    
    return pick;
}

// UI and scheduling
let player = null; let pendingVideo = null; let currentVideoId = null;

function onYouTubeIframeAPIReady() {
        player = new YT.Player('videoPlayer', {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            controls: 0,
            playsinline: 1,
            fs: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        try { player.setPlaybackQuality('highres'); } catch (e) { try { player.setPlaybackQuality('hd1080'); } catch {} }
    }
}

function onPlayerReady() {
    try { player.mute(); } catch {}
    if (pendingVideo) { player.loadVideoById({ videoId: pendingVideo.id, startSeconds: 0 }); try { player.playVideo(); } catch {} pendingVideo = null; }
    else { try { player.playVideo(); } catch {} }
}

function setVideoDOM(id, title) {
    const matchDiv = document.getElementById("match"); if (matchDiv) matchDiv.textContent = title || "FalleN Highlight";
    currentVideoId = id;
    if (player && typeof player.loadVideoById === 'function') {
        try { player.loadVideoById({ videoId: id, startSeconds: 0 }); player.mute(); try { player.playVideo(); } catch {} }
        catch (e) { console.error('Erro ao carregar vídeo no player:', e); pendingVideo = { id, title }; }
    } else pendingVideo = { id, title };
}

// Compute ms until next midnight in BRT
function millisUntilNextMidnightBRT() {
    const nowMs = Date.now();
    const brtOffsetMs = -3 * 60 * 60 * 1000; // UTC-3
    const nowBrtMs = nowMs + brtOffsetMs;
    
    const msInDay = 24 * 60 * 60 * 1000;
    const msSinceMidnight = nowBrtMs % msInDay;
    
    return msInDay - msSinceMidnight;
}

async function scheduleDailySwap() {
    const chosenVideo = await pickUnusedVideo(); if (chosenVideo) setVideoDOM(chosenVideo.id, chosenVideo.title);
    const msUntilMidnight = millisUntilNextMidnightBRT(); setTimeout(() => { scheduleDailySwap(); }, msUntilMidnight + 1000);
}

// Inicia a aplicação
scheduleDailySwap();

// Função pública chamada pelo botão 'Próximo'
async function playNextVideo() {
    const btn = document.getElementById('nextVideoBtn');
    if (btn) btn.disabled = true;
    try {
        // 1) Se temos API, tente buscar candidatos frescos (<=100s) diferentes do atual
        if (YT_API_KEY) {
            try {
                const candidates = await fetchCandidateVideosFromApi(YT_API_KEY, YT_CHANNEL_ID);
                const filtered = candidates.filter(c => c.id !== currentVideoId);
                if (filtered.length > 0) {
                    // preferir não usados
                    const used = getLocalStorageData(STORAGE_KEY_USED);
                    const unused = filtered.filter(c => !used.includes(c.id));
                    const pool = unused.length ? unused : filtered;
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    // marcar como usado
                    if (!used.includes(pick.id)) {
                        used.push(pick.id);
                        setLocalStorageData(STORAGE_KEY_USED, used);
                    }
                    setVideoDOM(pick.id, pick.title);
                    return;
                }
            } catch (e) {
                console.warn('Erro buscando candidatos via API no Next:', e);
            }
        }

        // 2) Preferir próximo sequencial da lista estática (garantir tamanho mínimo primeiro)
        await ensureStaticListSize(50);
        let nextStatic = getNextFromStaticList();
        if (nextStatic && nextStatic.id === currentVideoId) {
            nextStatic = getNextFromStaticList();
        }
        if (nextStatic) {
            setVideoDOM(nextStatic.id, nextStatic.title);
            return;
        }

        // 3) Fallback: comportamento antigo de escolher um não usado aleatório
        const next = await pickUnusedVideo();
        if (next && next.id !== currentVideoId) {
            setVideoDOM(next.id, next.title);
        }
    } catch (e) {
        console.error('Erro ao buscar próximo vídeo:', e);
    } finally {
        if (btn) {
            // reativa após pequena pausa para evitar cliques rápidos
            setTimeout(() => { btn.disabled = false; }, 800);
        }
    }
}

// Expor globalmente para garantir que onclick inline funcione
window.playNextVideo = playNextVideo;