import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

const CHAVE = 'tema';
// Ordem do ciclo a cada clique
const TEMAS = ['sistema', 'light', 'dark'];
const INFO = {
    sistema: { icone: Monitor, nome: 'do sistema' },
    light: { icone: Sun, nome: 'claro' },
    dark: { icone: Moon, nome: 'escuro' },
};

function lerTema() {
    try {
        const salvo = localStorage.getItem(CHAVE);
        return TEMAS.includes(salvo) ? salvo : 'sistema';
    } catch {
        return 'sistema';
    }
}

// "sistema" remove o atributo e deixa o prefers-color-scheme decidir (ver tokens em base.css)
export function aplicarTema(tema = lerTema()) {
    const raiz = document.documentElement;
    if (tema === 'sistema') delete raiz.dataset.theme;
    else raiz.dataset.theme = tema;
}

const ThemeToggle = ({ className = '' }) => {
    const [tema, setTema] = useState(lerTema);
    const proximo = TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length];
    const { icone: Icone, nome } = INFO[tema];

    const trocar = () => {
        try {
            if (proximo === 'sistema') localStorage.removeItem(CHAVE);
            else localStorage.setItem(CHAVE, proximo);
        } catch {
            // sem localStorage (modo privado restrito): troca só nesta sessão
        }
        aplicarTema(proximo);
        setTema(proximo);
    };

    return (
        <button
            type="button"
            className={`theme-toggle ${className}`}
            onClick={trocar}
            aria-label={`Tema ${nome}. Mudar para tema ${INFO[proximo].nome}`}
            title={`Tema ${nome}`}
        >
            <Icone size={16} aria-hidden="true" />
        </button>
    );
};

export default ThemeToggle;
