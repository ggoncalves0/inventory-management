import { useEffect } from 'react';
import { motion } from 'motion/react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Logo from './Logo';
import useTituloDaPagina from '../utils/useTituloDaPagina';

// Segundos entre as tentativas automáticas
const INTERVALO = 10;

// O servidor não respondeu ao abrir o app (fora do ar, reiniciando, sem rede). A sessão continua:
// o token fica guardado, o app tenta de novo sozinho e entra assim que o servidor responder.
const SemConexao = () => {
    const { erroConexao, verificando, tentarDeNovo, logout } = useAuth();
    useTituloDaPagina('Sem conexão');

    // Nova tentativa automática a cada INTERVALO segundos (o timer recomeça depois de cada tentativa)
    useEffect(() => {
        if (verificando) return undefined;
        const timer = setTimeout(tentarDeNovo, INTERVALO * 1000);
        return () => clearTimeout(timer);
    }, [verificando, tentarDeNovo]);

    return (
        <motion.main className="sem-conexao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Logo />
            <section className="sem-conexao-cartao cantoneiras" aria-labelledby="titulo-sem-conexao">
                <CloudOff size={28} aria-hidden="true" />
                <h1 id="titulo-sem-conexao">Sem conexão com o servidor</h1>
                <p>
                    {erroConexao} Sua sessão continua aberta: o app tenta de novo a cada {INTERVALO} segundos
                    e entra sozinho assim que o servidor responder.
                </p>
                <p className="sem-conexao-status" role="status">{verificando ? 'Tentando conectar…' : ''}</p>
                <div className="sem-conexao-acoes">
                    {/* sem "carregando" (que desabilita): botão desabilitado perde o foco a cada tentativa automática */}
                    <Button
                        icon={RefreshCw}
                        className={verificando ? 'girando' : ''}
                        onClick={tentarDeNovo}
                        aria-busy={verificando || undefined}
                        autoFocus
                    >
                        Tentar de novo
                    </Button>
                    <Button variante="ghost" onClick={logout}>Sair</Button>
                </div>
            </section>
        </motion.main>
    );
};

export default SemConexao;
