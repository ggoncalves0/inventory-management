import { motion } from 'motion/react';
import { LoaderCircle } from 'lucide-react';

const Loader = () => (
    <motion.div
        className="loader-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="status"
    >
        <LoaderCircle className="spin" size={18} aria-hidden="true" />
        Carregando…
    </motion.div>
);

export default Loader;
