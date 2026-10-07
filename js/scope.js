// Mira de AWP que segue o mouse. Em telas touch o cursor normal é mantido.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

export function initScope() {
    const el = document.getElementById('scope');
    if (!el || !canHover.matches) return;

    const half = el.offsetWidth ? el.offsetWidth / 2 : 80;
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let queued = false;

    function paint() {
        queued = false;
        el.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
    }

    document.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        x = e.clientX;
        y = e.clientY;
        el.classList.remove('hidden');
        document.documentElement.classList.add('has-scope');
        if (!queued) {
            queued = true;
            requestAnimationFrame(paint);
        }
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', () => el.classList.add('hidden'));
    document.documentElement.addEventListener('pointerenter', () => el.classList.remove('hidden'));
}

// Pequeno "coice" da mira a cada clique
export function fireScope() {
    const el = document.getElementById('scope');
    if (!el) return;
    el.classList.remove('fire');
    void el.offsetWidth; // reinicia a animação
    el.classList.add('fire');
}
