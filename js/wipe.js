// Cortina colorida que varre a tela da esquerda para a direita na troca de clipe.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const EASING = 'cubic-bezier(0.7, 0, 0.3, 1)';

const slide = (el, from, to, duration) =>
    el.animate([{ transform: `translateX(${from})` }, { transform: `translateX(${to})` }],
        { duration, easing: EASING, fill: 'forwards' }).finished;

// 1) cobre a tela  2) roda onCovered (troca o clipe, espera ele tocar)  3) revela
export async function wipeTransition(color, onCovered) {
    const el = document.getElementById('wipe');
    if (!el || reduceMotion.matches || typeof el.animate !== 'function') {
        await onCovered();
        return;
    }
    el.style.background = color;
    await slide(el, '-101%', '0%', 280);
    try {
        await onCovered();
    } finally {
        await slide(el, '0%', '101%', 320);
        el.getAnimations().forEach(a => a.cancel());
        el.style.transform = 'translateX(-101%)';
    }
}
