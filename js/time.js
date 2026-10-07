const TIME_ZONE = 'America/Sao_Paulo';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const clockFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
});

// Milissegundos até a próxima meia-noite no horário de Brasília
export function millisUntilNextMidnightBRT(now = Date.now()) {
    const parts = Object.fromEntries(
        clockFormat.formatToParts(now).map(p => [p.type, Number(p.value)])
    );
    const elapsed = ((parts.hour * 60 + parts.minute) * 60 + parts.second) * 1000 + (now % 1000);
    return MS_PER_DAY - elapsed;
}
