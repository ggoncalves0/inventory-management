import { useEffect } from 'react';

// Título da aba por tela ("Entrar · Estoque", "Produtos · Estoque"): é o que o leitor de tela anuncia
// ao trocar de página e o que identifica a aba entre várias abertas.
export default function useTituloDaPagina(titulo) {
    useEffect(() => {
        document.title = titulo ? `${titulo} · Estoque` : 'Estoque';
    }, [titulo]);
}
