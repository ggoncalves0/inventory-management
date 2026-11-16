import { useRef, useState } from 'react';
import instance, { mensagemDeErro } from '../services/api';
import Modal from './Modal';
import Field from './Field';
import Button from './Button';
import { formatarCodigo } from '../utils/formatos';

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
// Mesmo limite do backend (validators.py)
const QUANTIDADE_MAX = 2147483647;

// Ajuste rápido: entrada ou saída de N unidades, sem abrir o formulário completo nem fazer conta de cabeça.
function AjusteForm({ produto: produtoInicial, onClose, onAjustado }) {
    // Guardado em estado para o texto não mudar enquanto o modal anima a saída
    const [produto] = useState(produtoInicial);
    const [tipo, setTipo] = useState('entrada');
    const [quantidade, setQuantidade] = useState('');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const campoRef = useRef(null);

    const n = Number(quantidade);
    const informado = quantidade !== '' && n > 0;
    const resultado = tipo === 'entrada' ? produto.quantidade + n : produto.quantidade - n;
    // Avisado enquanto digita, antes de tentar salvar
    let problema = '';
    if (informado && tipo === 'saida' && n > produto.quantidade) {
        problema = `Não há estoque suficiente: saem no máximo ${inteiro.format(produto.quantidade)}.`;
    } else if (informado && resultado > QUANTIDADE_MAX) {
        problema = 'Quantidade acima do permitido.';
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!informado) {
            setErro('Informe quantas unidades.');
            campoRef.current?.focus();
            return;
        }
        if (problema) return;

        setSalvando(true);
        try {
            // Lê o estoque atual antes de gravar: se alguém mexeu nesse meio-tempo, o ajuste vale sobre o valor novo
            const { data: atual } = await instance.get(`/produtos/${produto.id}`);
            const base = Number(atual.quantidade);
            const final = tipo === 'entrada' ? base + n : base - n;
            if (final < 0) {
                setErro(`O estoque mudou para ${inteiro.format(base)} enquanto você ajustava: não dá para tirar ${inteiro.format(n)}.`);
                setSalvando(false);
                return;
            }
            await instance.put(`/produtos/${produto.id}`, {
                nome: atual.nome,
                categoria: atual.categoria,
                quantidade: final,
                preco: atual.preco,
            });
            onAjustado({ id: produto.id, nome: atual.nome, tipo, n, de: base, para: final, mudou: base !== produto.quantidade });
        } catch (err) {
            if (err.response?.status === 401) return; // sessão expirada: a tela já vai para o login
            setErro(err.response?.status === 404
                ? 'Este produto não existe mais (foi excluído por outra pessoa).'
                : mensagemDeErro(err, 'Erro ao ajustar o estoque.'));
            setSalvando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="ajuste-form">
            <div className="modal-header">
                <h2>Ajustar estoque</h2>
                <p>{formatarCodigo(produto.id)} · {produto.nome}</p>
            </div>

            <fieldset className="movimento">
                <legend>Movimento</legend>
                <div className="movimento-opcoes">
                    {[['entrada', 'Entrada'], ['saida', 'Saída']].map(([valor, rotulo]) => (
                        <label key={valor} className={tipo === valor ? 'ativo' : ''}>
                            <input
                                type="radio"
                                name="tipo"
                                value={valor}
                                checked={tipo === valor}
                                onChange={() => { setTipo(valor); setErro(''); }}
                            />
                            {rotulo}
                        </label>
                    ))}
                </div>
            </fieldset>

            <Field
                ref={campoRef}
                label="Quantidade (un.)"
                name="quantidade"
                inputMode="numeric"
                autoComplete="off"
                value={quantidade}
                onChange={(e) => { setQuantidade(e.target.value.replace(/\D/g, '').slice(0, 10)); setErro(''); }}
                erro={erro || problema}
                autoFocus
                // o Modal prioriza este campo no foco inicial (o 1º input do diálogo é o rádio "Entrada")
                data-foco-inicial
            />

            {/* prévia do resultado, anunciada enquanto digita */}
            <p className="ajuste-previa" aria-live="polite" aria-atomic="true">
                Estoque: <strong>{inteiro.format(produto.quantidade)}</strong>
                <span aria-hidden="true"> → </span>
                <span className="sr-only"> passa a </span>
                <strong>{informado && !problema ? inteiro.format(resultado) : '—'}</strong>
            </p>

            <div className="modal-actions">
                <Button type="button" variante="ghost" onClick={onClose} disabled={salvando}>Cancelar</Button>
                <Button type="submit" carregando={salvando}>
                    {tipo === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}
                </Button>
            </div>
        </form>
    );
}

const AjusteEstoqueModal = ({ aberto, produto, onClose, onAjustado, focoAoFechar }) => (
    <Modal aberto={aberto} onClose={onClose} titulo="Ajustar estoque" largura={400} focoAoFechar={focoAoFechar}>
        <AjusteForm produto={produto} onClose={onClose} onAjustado={onAjustado} />
    </Modal>
);

export default AjusteEstoqueModal;
