// Abertura: "FALLEN TOLEDO" no centro. Depois de 2s, FALLEN desliza até o título
// (esquerda) e TOLEDO até o timer (direita), virando o timer no fim do trajeto.
const HOLD = 2000;
const MOVE = 900;
const EASE = 'cubic-bezier(0.7, 0, 0.2, 1)';

export function playIntro() {
    const root = document.documentElement;
    const intro = document.getElementById('intro');
    const title = document.getElementById('title');
    const timer = document.getElementById('timer');
    const done = () => {
        intro?.remove();
        root.classList.remove('intro');
    };

    if (!intro || !title || !timer || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        done();
        return;
    }

    const left = intro.querySelector('[data-intro-left]');
    const right = intro.querySelector('[data-intro-right]');
    const bg = intro.querySelector('[data-intro-bg]');

    // Título e timer ficam escondidos pela animação (não mais pela classe) até os nomes chegarem
    const total = HOLD + MOVE;
    title.animate([{ opacity: 0 }, { opacity: 0 }], { duration: total });
    timer.animate(
        [{ opacity: 0 }, { opacity: 0, offset: (HOLD + MOVE * 0.6) / total }, { opacity: 1 }],
        { duration: total }
    );
    root.classList.remove('intro');

    setTimeout(() => {
        const from = (el, to) => {
            const a = el.getBoundingClientRect();
            return { a, b: to.getBoundingClientRect() };
        };
        const l = from(left, title);
        const r = from(right, timer);
        const opts = { duration: MOVE, easing: EASE, fill: 'forwards' };

        // Mesmo tamanho de fonte do título: basta alinhar o canto superior esquerdo
        left.animate(
            [{ transform: 'none' }, { transform: `translate(${l.b.left - l.a.left}px, ${l.b.top - l.a.top}px)` }],
            opts
        );
        // TOLEDO alinha pela direita com o timer e some enquanto os números aparecem
        right.animate(
            [
                { transform: 'none', opacity: 1 },
                { opacity: 1, offset: 0.6 },
                { transform: `translate(${r.b.right - r.a.right}px, ${r.b.top - r.a.top}px)`, opacity: 0 }
            ],
            opts
        );
        bg.animate([{ opacity: 1 }, { opacity: 0 }], opts).finished.then(done);
    }, HOLD);
}
