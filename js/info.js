// Painel "Info": abre sobre a tela, fecha com Voltar ou Esc e devolve o foco.
const panel = document.getElementById('info-panel');
const app = document.getElementById('app');
const openBtn = document.getElementById('infoBtn');
const closeBtn = document.getElementById('infoCloseBtn');

export const isInfoOpen = () => panel.classList.contains('open');

function setOpen(open) {
    panel.classList.toggle('open', open);
    panel.inert = !open;
    app.inert = open; // quem usa teclado não "escapa" para trás do painel
    openBtn.setAttribute('aria-expanded', String(open));
    (open ? closeBtn : openBtn).focus({ preventScroll: true });
}

export function initInfo() {
    openBtn.addEventListener('click', () => setOpen(true));
    closeBtn.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isInfoOpen()) setOpen(false);
    });
}
