// Rascunho do formulário de produto aberto. Se a sessão expirar no meio do preenchimento,
// o que foi digitado fica guardado nesta aba e o formulário reabre depois do novo login.
// sessionStorage: some quando a aba fecha, então não sobra rascunho em computador compartilhado.
const CHAVE = 'estoque:rascunho-produto';

export function salvarRascunho(rascunho) {
    try {
        sessionStorage.setItem(CHAVE, JSON.stringify(rascunho));
    } catch {
        // sem sessionStorage (modo privado restrito): segue sem rascunho
    }
}

export function lerRascunho() {
    try {
        return JSON.parse(sessionStorage.getItem(CHAVE));
    } catch {
        return null;
    }
}

export function limparRascunho() {
    try {
        sessionStorage.removeItem(CHAVE);
    } catch {
        // idem
    }
}
