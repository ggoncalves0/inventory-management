import { ArrowRight, X } from 'lucide-react';

// Só o indicador com onClick é clicável (vira <button>); os demais são informativos.
// Dentro de <button> só cabe conteúdo de frase, por isso spans no lugar de divs.
const StatCard = ({ rotulo, valor, detalhe, titulo, alerta = false, onClick, ativo = false, acao }) => {
    const interativo = !!onClick;
    const Elemento = interativo ? 'button' : 'div';
    const classes = ['stat-card', interativo && 'interativo', ativo && 'ativo', alerta && 'alerta'].filter(Boolean).join(' ');

    return (
        <Elemento
            type={interativo ? 'button' : undefined}
            className={classes}
            onClick={onClick}
            aria-pressed={interativo ? ativo : undefined}
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
