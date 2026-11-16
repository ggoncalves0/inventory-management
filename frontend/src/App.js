import { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, useIsPresent } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthLayout from './components/AuthLayout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProductList from './components/ProductList';
import Loader from './components/Loader';

// Os guards continuam renderizando a página durante a animação de saída,
// em vez de desmontá-la de uma vez quando o token muda.
function PrivateRoute({ children }) {
  const { token, usuario } = useAuth();
  const presente = useIsPresent();
  const jaEntrou = useRef(false);
  if (usuario) jaEntrou.current = true;

  if (!presente) return jaEntrou.current ? children : null;
  if (!token) {
    return jaEntrou.current
      ? <>{children}<Navigate to="/" replace /></>
      : <Navigate to="/" replace />;
  }
  if (!usuario) return <Loader />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { token } = useAuth();
  const presente = useIsPresent();
  if (token && presente) return <>{children}<Navigate to="/produtos" replace /></>;
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  // Login e registro compartilham o AuthLayout; a troca entre eles é animada lá dentro.
  const chave = location.pathname.startsWith('/produtos') ? 'app' : 'auth';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={chave}>
        <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
        </Route>
        <Route path="/produtos" element={<PrivateRoute><ProductList /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AnimatedRoutes />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
