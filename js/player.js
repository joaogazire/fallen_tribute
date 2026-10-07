let player = null;
let pending = null;
let currentVideoId = null;
let muted = true;
let volume = 100;
let onEnded = () => {};
let playingWaiters = [];

const matchEl = () => document.getElementById('match');

export const setOnEnded = fn => { onEnded = fn; };
// Resolve quando o vídeo começar a tocar (ou após o limite de tempo)
export const whenPlaying = (timeout = 1500) => new Promise(resolve => {
    const timer = setTimeout(resolve, timeout);
    playingWaiters.push(() => { clearTimeout(timer); resolve(); });
});

export const getCurrentVideoId = () => currentVideoId;
export const isSoundOn = () => !muted;

function syncButtons(state) {
    const playing = state === YT.PlayerState.PLAYING;
    const playBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    if (playBtn) {
        playBtn.setAttribute('aria-label', playing ? 'Pausar vídeo' : 'Reproduzir vídeo');
        playBtn.querySelector('[data-icon=pause]').classList.toggle('hidden', !playing);
        playBtn.querySelector('[data-icon=play]').classList.toggle('hidden', playing);
    }
    const slider = document.getElementById('volumeSlider');
    if (slider) slider.value = String(muted ? 0 : volume);
    if (muteBtn) {
        muteBtn.setAttribute('aria-label', muted ? 'Ativar som' : 'Desativar som');
        muteBtn.setAttribute('aria-pressed', String(!muted));
        muteBtn.querySelector('[data-icon=muted]').classList.toggle('hidden', !muted);
        muteBtn.querySelector('[data-icon=sound]').classList.toggle('hidden', muted);
    }
}

// Sem legendas: o YouTube liga as automáticas sozinho quando o vídeo está mudo,
// então o módulo de legendas é descarregado sempre que um clipe começa a tocar
function hideCaptions() {
    try {
        player.unloadModule('captions');
        player.unloadModule('cc');
    } catch { /* nem todo vídeo tem legendas */ }
}

function onStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        try { player.setPlaybackQuality('highres'); } catch { /* qualidade é só uma sugestão */ }
        hideCaptions();
    }
    if (event.data === YT.PlayerState.ENDED) onEnded();
    if (event.data === YT.PlayerState.PLAYING) {
        playingWaiters.forEach(resolve => resolve());
        playingWaiters = [];
    }
    syncButtons(event.data);
}

function onReady() {
    player.mute(); // autoplay só é permitido sem som
    if (pending) {
        player.loadVideoById({ videoId: pending.id, startSeconds: 0 });
        pending = null;
    }
    player.playVideo();
}

// A API do YouTube chama esta função global quando está pronta
window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('videoPlayer', {
        height: '100%',
        width: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, controls: 0, playsinline: 1, fs: 0, disablekb: 1, iv_load_policy: 3, cc_load_policy: 0, cc_lang_pref: 'none' },
        events: { onReady: onReady, onStateChange: onStateChange }
    });
};

const apiScript = document.createElement('script');
apiScript.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(apiScript);

export function showVideo({ id, title }) {
    currentVideoId = id;
    const el = matchEl();
    if (el) el.textContent = title || 'FalleN Highlight';

    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById({ videoId: id, startSeconds: 0 });
        player.setVolume(volume);
        if (muted) player.mute(); else player.unMute();
        player.playVideo();
    } else {
        pending = { id, title };
    }
}

export function togglePlay() {
    if (!player || typeof player.getPlayerState !== 'function') return;
    if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
}

export function toggleMute() {
    if (!player || typeof player.mute !== 'function') return;
    muted = !muted;
    if (!muted && volume === 0) volume = 50; // desmutar com a barra no zero voltaria mudo
    applySound();
}

// Barra de volume: arrastar até o zero muta, subir dela desmuta
export function setVolume(value) {
    volume = Math.min(100, Math.max(0, Math.round(value) || 0));
    muted = volume === 0;
    if (!player || typeof player.setVolume !== 'function') return;
    applySound();
}

function applySound() {
    player.setVolume(volume);
    if (muted) player.mute(); else player.unMute();
    syncButtons(player.getPlayerState());
}
