import { startCountdown } from './countdown.js';
import { millisUntilNextMidnightBRT } from './time.js';
import { pickVideo } from './videos.js';
import { showVideo, getCurrentVideoId, setOnEnded, whenPlaying, togglePlay, toggleMute } from './player.js';
import { initScope, fireScope } from './scope.js';
import { initInfo, isInfoOpen } from './info.js';
import { wipeTransition } from './wipe.js';

// Cor de destaque alterna a cada clipe: ciano <-> magenta
const ACCENTS = ['#00d2ff', '#ff3df2'];
let clipCount = 0;

function applyAccent() {
    document.documentElement.style.setProperty('--accent', ACCENTS[clipCount % ACCENTS.length]);
}

// Primeiro clipe: entra direto, sem cortina
async function firstClip() {
    showVideo(await pickVideo(getCurrentVideoId()));
}

// Demais clipes: a cortina cobre, troca o clipe e só revela quando ele toca
async function nextClipWithWipe() {
    const video = await pickVideo(getCurrentVideoId());
    const nextAccent = ACCENTS[(clipCount + 1) % ACCENTS.length];
    await wipeTransition(nextAccent, async () => {
        clipCount++;
        applyAccent();
        showVideo(video);
        await whenPlaying();
    });
}

function scheduleDailySwap() {
    // +1s de folga para garantir que já virou o dia
    setTimeout(async () => {
        await nextClipWithWipe();
        scheduleDailySwap();
    }, millisUntilNextMidnightBRT() + 1000);
}

let busy = false;
async function nextClip() {
    if (busy) return;
    busy = true;
    try {
        await nextClipWithWipe();
    } finally {
        busy = false;
    }
}

const isControl = el => el instanceof Element && el.closest('a, button');

applyAccent();
startCountdown();
initScope();
initInfo();
firstClip();
scheduleDailySwap();

// Clipe acabou: passa para o próximo sozinho, enquanto o contador segue rodando
setOnEnded(nextClip);

// Clique em qualquer lugar (menos nos controles e no painel Info) avança o clipe
document.addEventListener('click', e => {
    if (isInfoOpen() || isControl(e.target)) return;
    fireScope();
    nextClip();
});
document.addEventListener('keydown', e => {
    if (isInfoOpen()) return;
    // Espaço em um botão/link ativa o próprio controle; a seta → sempre avança
    if (e.key === 'ArrowRight' || (e.key === ' ' && !isControl(e.target))) {
        e.preventDefault();
        fireScope();
        nextClip();
    }
});

document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
document.getElementById('muteBtn').addEventListener('click', toggleMute);
