// Efeitos sonoros: tiro da AWP (um por versão do CS) e o "Oh FalleN, stop blowing my mind".
// Os arquivos ficam em sounds/ (veja o README). Sem o arquivo do tiro, toca um tiro sintetizado
// com timbre próximo de cada jogo; sem o arquivo da narração, ela simplesmente não toca.
const SHOT_VOLUME = 0.12;
const QUOTE_VOLUME = 0.35;
const QUOTE_EVERY = 60_000;

const SHOT_FILES = {
    cs15: 'sounds/awp-cs15.mp3',
    cs16: 'sounds/awp-cs16.mp3',
    css: 'sounds/awp-css.mp3',
    csgo: 'sounds/awp-csgo.mp3',
    cs2: 'sounds/awp-cs2.mp3'
};
const QUOTE_FILE = 'sounds/oh-fallen.mp3';

// Tiro sintetizado: estalo de ruído filtrado + "soco" grave + cauda.
// GoldSrc (1.5/1.6) é seco e agudo; Source mais encorpado; GO e CS2 graves e com eco longo.
const SYNTH = {
    cs15: { crack: 4200, decay: 0.16, thump: 0.6, tail: 0 },
    cs16: { crack: 3600, decay: 0.2, thump: 0.7, tail: 0.05 },
    css: { crack: 2800, decay: 0.3, thump: 0.85, tail: 0.25 },
    csgo: { crack: 2200, decay: 0.42, thump: 1, tail: 0.45 },
    cs2: { crack: 2500, decay: 0.5, thump: 1, tail: 0.6 }
};

let ctx = null;
const buffers = new Map(); // caminho -> AudioBuffer | null (null = arquivo ausente)

// O navegador só libera áudio depois de um gesto do usuário
function audio() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

async function load(path) {
    if (buffers.has(path)) return buffers.get(path);
    buffers.set(path, null); // evita buscar de novo enquanto carrega ou se falhar
    try {
        const res = await fetch(path);
        if (!res.ok) return null;
        const buf = await audio().decodeAudioData(await res.arrayBuffer());
        buffers.set(path, buf);
        return buf;
    } catch {
        return null;
    }
}

function playBuffer(buf, volume) {
    const ac = audio();
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    gain.gain.value = volume;
    src.buffer = buf;
    src.connect(gain).connect(ac.destination);
    src.start();
}

function synthShot(p) {
    const ac = audio();
    const t = ac.currentTime;
    const out = ac.createGain();
    out.gain.value = SHOT_VOLUME;
    out.connect(ac.destination);

    // Estalo: ruído branco passando por um passa-baixa que fecha rápido
    const len = Math.ceil(ac.sampleRate * (p.decay + p.tail + 0.1));
    const noise = ac.createBuffer(1, len, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = noise;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(p.crack, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + p.decay);
    const env = ac.createGain();
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
    src.connect(lp).connect(env).connect(out);

    // Soco grave: seno que despenca de tom
    const osc = ac.createOscillator();
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    const thump = ac.createGain();
    thump.gain.setValueAtTime(p.thump, t);
    thump.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(thump).connect(out);

    // Cauda: eco curto realimentado, abafado
    if (p.tail > 0) {
        const delay = ac.createDelay();
        delay.delayTime.value = 0.09;
        const feedback = ac.createGain();
        feedback.gain.value = p.tail * 0.6;
        const damp = ac.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 900;
        env.connect(delay);
        delay.connect(damp).connect(feedback).connect(delay);
        damp.connect(out);
    }

    src.start(t);
    osc.start(t);
    osc.stop(t + 0.3);
}

export async function playShot(skin) {
    if (!audio()) return;
    const buf = await load(SHOT_FILES[skin]);
    if (buf) playBuffer(buf, SHOT_VOLUME);
    else synthShot(SYNTH[skin] || SYNTH.cs16);
}

// A cada minuto, com o som do site ligado e a aba visível, toca a narração
export function startQuoteLoop(isSoundOn) {
    // Qualquer clique ou tecla já libera o áudio para a narração
    for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, audio, { once: true });
    setInterval(async () => {
        if (!ctx || !isSoundOn() || document.visibilityState !== 'visible') return;
        const buf = await load(QUOTE_FILE);
        if (buf) playBuffer(buf, QUOTE_VOLUME);
    }, QUOTE_EVERY);
}

// Patinho de borracha (crédito da AK-47 no painel Info).
// Som: "Rubber Duck Squeaker", de Dragonhawk12, Wikimedia Commons, CC BY-SA 4.0 (veja sounds/CREDITOS.md)
const SQUEAK_FILE = 'sounds/rubber-duck.mp3';
const SQUEAK_VOLUME = 0.3;

export async function playSqueak() {
    if (!audio()) return;
    const buf = await load(SQUEAK_FILE);
    if (buf) playBuffer(buf, SQUEAK_VOLUME);
}
