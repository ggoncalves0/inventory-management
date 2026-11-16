import { useEffect, useState } from 'react';

// Usado quando o mesmo bloco muda de container conforme a largura (CSS sozinho não move elementos entre containers).
export default function useMediaQuery(consulta) {
    const [casa, setCasa] = useState(() => window.matchMedia(consulta).matches);

    useEffect(() => {
        const lista = window.matchMedia(consulta);
        const atualizar = () => setCasa(lista.matches);
        atualizar();
        lista.addEventListener('change', atualizar);
        return () => lista.removeEventListener('change', atualizar);
    }, [consulta]);

    return casa;
}
