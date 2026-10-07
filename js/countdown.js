// 20/12/2026 00:00 em Brasília (UTC-3) == 03:00 UTC. O Brasil não adota horário de verão desde 2019.
const COUNTDOWN_DATE = Date.UTC(2026, 11, 20, 3, 0, 0);

const pad = n => String(n).padStart(2, '0');

export function startCountdown() {
    const els = {
        days: document.getElementById('days'),
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds'),
        message: document.getElementById('countdown-message')
    };

    function render(d, h, m, s) {
        els.days.textContent = pad(d);
        els.hours.textContent = pad(h);
        els.minutes.textContent = pad(m);
        els.seconds.textContent = pad(s);
    }

    function tick() {
        const distance = COUNTDOWN_DATE - Date.now();
        if (distance <= 0) {
            clearInterval(timer);
            render(0, 0, 0, 0);
            els.message.hidden = false;
            return;
        }
        const totalSeconds = Math.floor(distance / 1000);
        render(
            Math.floor(totalSeconds / 86400),
            Math.floor((totalSeconds % 86400) / 3600),
            Math.floor((totalSeconds % 3600) / 60),
            totalSeconds % 60
        );
    }

    const timer = setInterval(tick, 1000);
    tick();
}
