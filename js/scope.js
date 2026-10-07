import { getValue, setValue } from './storage.js';

// Mira de AWP que segue o mouse. Em telas touch o cursor normal é mantido.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

export function initScope() {
    const el = document.getElementById('scope');
    if (!el || !canHover.matches) return;

    const root = document.documentElement;
    let visible = false;

    // Move a mira direto no evento: o Chrome e o Firefox já entregam o pointermove
    // alinhado ao quadro, então esperar um requestAnimationFrame só somaria um quadro de atraso.
    // A mira já é centralizada no CSS (margem negativa), então não há leitura de layout aqui.
    function move(e) {
        if (e.pointerType !== 'mouse') return;
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        if (!visible) {
            visible = true;
            el.classList.remove('hidden');
            root.classList.add('has-scope');
        }
    }

    // pointerrawupdate chega antes do pointermove (menos latência) onde existe
    const type = 'onpointerrawupdate' in window ? 'pointerrawupdate' : 'pointermove';
    document.addEventListener(type, move, { passive: true });

    root.addEventListener('pointerleave', () => {
        visible = false;
        el.classList.add('hidden');
    });
}

// Pequeno "coice" da mira a cada clique
export function fireScope() {
    const el = document.getElementById('scope');
    if (!el) return;
    el.classList.remove('fire');
    void el.offsetWidth; // reinicia a animação
    el.classList.add('fire');
}

// Aparências da mira, na ordem em que o botão alterna (estilos em src/input.css)
const SKINS = [
    { id: 'cs15', label: '1.5', name: 'CS 1.5' },
    { id: 'cs16', label: '1.6', name: 'CS 1.6' },
    { id: 'css', label: 'CSS', name: 'CS: Source' },
    { id: 'csgo', label: 'GO', name: 'CS:GO' },
    { id: 'cs2', label: 'CS2', name: 'CS2' }
];
const SKIN_KEY = 'fallen_scope_skin';

let currentSkin = 'cs16';
export const getScopeSkin = () => currentSkin;

function applySkin(skin) {
    currentSkin = skin.id;
    const el = document.getElementById('scope');
    const btn = document.getElementById('scopeBtn');
    const label = document.getElementById('scopeLabel');
    if (el) el.dataset.skin = skin.id;
    if (label) label.textContent = skin.label;
    if (btn) btn.setAttribute('aria-label', `Mira: ${skin.name}. Trocar`);
}

export function initScopeSkins() {
    const btn = document.getElementById('scopeBtn');
    let index = SKINS.findIndex(s => s.id === getValue(SKIN_KEY));
    if (index < 0) index = SKINS.findIndex(s => s.id === 'cs16');
    applySkin(SKINS[index]);
    btn?.addEventListener('click', () => {
        index = (index + 1) % SKINS.length;
        applySkin(SKINS[index]);
        setValue(SKIN_KEY, SKINS[index].id);
    });
}
