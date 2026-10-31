import { motion } from 'motion/react';
import { Boxes } from 'lucide-react';

const Loader = () => (
    <motion.div
        className="loader-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="status"
        aria-label="Carregando"
    >
        <div className="loader-orb">
            <span className="loader-ring" />
            <Boxes size={26} />
        </div>
    </motion.div>
);

export default Loader;
