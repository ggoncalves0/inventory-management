import { ArrowRight, X } from 'lucide-react';

// Só o indicador com onClick é clicável (vira <button>); os demais são informativos.
// Dentro de <button> só cabe conteúdo de frase, por isso spans no lugar de divs.
const StatCard = ({ rotulo, valor, detalhe, titulo, alerta = false, onClick, ativo = false, acao }) => {
    const interativo = !!onClick;
    const Elemento = interativo ? 'button' : 'div';
    const classes = ['stat-card', interativo && 'interativo', ativo && 'ativo', alerta && 'alerta'].filter(Boolean).join(' ');
    // Lido de uma vez, o conteúdo virava "Estoque baixo 2 1 esgotado Ver itens" (dois números soltos).
    // O nome acessível contém todo o texto visível, então comandos de voz ("clicar em Ver itens") seguem valendo.
    const nomeAcessivel = interativo
        ? `${rotulo}: ${valor}${detalhe ? ` (${detalhe})` : ''}. ${acao ?? ''}`.trim()
        : undefined;

    return (
        <Elemento
            type={interativo ? 'button' : undefined}
            className={classes}
            onClick={onClick}
            aria-pressed={interativo ? ativo : undefined}
            aria-label={nomeAcessivel}
        >
            <span className="stat-label">{rotulo}</span>
            <strong className="stat-value" title={titulo}>{valor}</strong>
            {(detalhe || acao) && (
                <span className="stat-rodape">
                    {detalhe && <span className="stat-detail">{detalhe}</span>}
                    {acao && (
                        <span className="stat-acao">
                            {acao}
                            {ativo ? <X size={13} aria-hidden="true" /> : <ArrowRight size={13} aria-hidden="true" />}
                        </span>
                    )}
                </span>
            )}
        </Elemento>
    );
};

export default StatCard;
