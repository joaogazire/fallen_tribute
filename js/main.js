import { startCountdown } from './countdown.js';
import { millisUntilNextMidnightBRT } from './time.js';
import { pickVideo } from './videos.js';
import { showVideo, getCurrentVideoId, togglePlay, toggleMute } from './player.js';

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

startCountdown();
swapVideo();
scheduleDailySwap();

const nextBtn = document.getElementById('nextVideoBtn');
nextBtn.addEventListener('click', async () => {
    nextBtn.disabled = true;
    try {
        await swapVideo();
    } finally {
        // pequena pausa para evitar cliques rápidos
        setTimeout(() => { nextBtn.disabled = false; }, 800);
    }
});
document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
document.getElementById('muteBtn').addEventListener('click', toggleMute);
