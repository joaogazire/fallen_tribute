import { startCountdown } from './countdown.js';
import { millisUntilNextMidnightBRT } from './time.js';
import { pickVideo } from './videos.js';
import { showVideo, getCurrentVideoId, setOnEnded, togglePlay, toggleMute } from './player.js';
import { initScope, fireScope } from './scope.js';

async function swapVideo() {
    showVideo(await pickVideo(getCurrentVideoId()));
}

function scheduleDailySwap() {
    // +1s de folga para garantir que já virou o dia
    setTimeout(async () => {
        await swapVideo();
        scheduleDailySwap();
    }, millisUntilNextMidnightBRT() + 1000);
}

let busy = false;
async function nextClip() {
    if (busy) return;
    busy = true;
    try {
        await swapVideo();
    } finally {
        // pausa curta para evitar cliques em sequência
        setTimeout(() => { busy = false; }, 600);
    }
}

const isControl = el => el instanceof Element && el.closest('a, button');

startCountdown();
initScope();
swapVideo();
scheduleDailySwap();

// Clipe acabou: passa para o próximo sozinho, enquanto o contador segue rodando
setOnEnded(nextClip);

// Clique em qualquer lugar (menos nos controles) avança o clipe
document.addEventListener('click', e => {
    if (isControl(e.target)) return;
    fireScope();
    nextClip();
});
document.addEventListener('keydown', e => {
    // Espaço em um botão/link ativa o próprio controle; a seta → sempre avança
    if (e.key === 'ArrowRight' || (e.key === ' ' && !isControl(e.target))) {
        e.preventDefault();
        fireScope();
        nextClip();
    }
});

document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
document.getElementById('muteBtn').addEventListener('click', toggleMute);
