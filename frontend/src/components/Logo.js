import { Boxes } from 'lucide-react';

const Logo = ({ compacto = false }) => (
    <div className="logo">
        <span className="logo-mark">
            <Boxes size={compacto ? 16 : 18} strokeWidth={2.2} />
        </span>
        <span className="logo-text">
            Estoque<span className="logo-dot">.</span>
        </span>
    </div>
);

export default Logo;
