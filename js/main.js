import { startCountdown } from './countdown.js';
import { millisUntilNextMidnightBRT } from './time.js';
import { pickVideo } from './videos.js';
import { showVideo, getCurrentVideoId, setOnEnded, whenPlaying, togglePlay, toggleMute, setVolume, isSoundOn } from './player.js';
import { initScope, initScopeSkins, fireScope, getScopeSkin } from './scope.js';
import { playShot, playSqueak, startQuoteLoop } from './sounds.js';
import { initInfo, isInfoOpen } from './info.js';
import { wipeTransition } from './wipe.js';
import { playIntro } from './intro.js';

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

// Tiro: coice da mira + som da AWP da versão escolhida
function shoot() {
    fireScope();
    playShot(getScopeSkin());
}

const isControl = el => el instanceof Element && el.closest('a, button, input');

applyAccent();
playIntro();
startCountdown();
initScope();
initScopeSkins();
startQuoteLoop(isSoundOn);
initInfo();
firstClip();
scheduleDailySwap();

// Clipe acabou: passa para o próximo sozinho, enquanto o contador segue rodando
setOnEnded(nextClip);

// Clique em qualquer lugar (menos nos controles e no painel Info) avança o clipe
document.addEventListener('click', e => {
    if (isInfoOpen() || isControl(e.target)) return;
    shoot();
    nextClip();
});
document.addEventListener('keydown', e => {
    // Setas na barra de volume mudam o volume, não o clipe
    if (isInfoOpen() || e.target instanceof HTMLInputElement) return;
    // Espaço em um botão/link ativa o próprio controle; a seta → sempre avança
    if (e.key === 'ArrowRight' || (e.key === ' ' && !isControl(e.target))) {
        e.preventDefault();
        shoot();
        nextClip();
    }
});

document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
document.querySelector('.ak-credit')?.addEventListener('click', playSqueak);
document.getElementById('muteBtn').addEventListener('click', toggleMute);
document.getElementById('volumeSlider').addEventListener('input', e => setVolume(Number(e.target.value)));
