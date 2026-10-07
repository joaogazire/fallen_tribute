// Wrappers seguros do localStorage: podem lançar erro em modo privado ou com dados bloqueados.
export function getList(key) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function setList(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // sem persistência: o site continua funcionando
    }
}

export function getValue(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function setValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // sem persistência: o site continua funcionando
    }
}
