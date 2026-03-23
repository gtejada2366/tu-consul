import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/auth-context";

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    const { error } = await signIn(email, password);

    if (error) {
      setLoginError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    toast.success("¡Bienvenido!");
    navigate("/agenda");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-[12px] bg-primary items-center justify-center mb-4">
            <span className="text-white text-2xl font-semibold">TC</span>
          </div>
          <h1 className="text-[1.75rem] font-semibold text-foreground mb-2">
            Bienvenido a Tu Consul
          </h1>
          <p className="text-[0.875rem] text-foreground-secondary">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-surface border border-border rounded-[12px] p-6 sm:p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="ejemplo@tuconsul.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-[0.75rem]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground-secondary">Recordarme</span>
              </label>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => toast.info("Próximamente: Recuperación de contraseña")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {loginError && (
              <p className="text-[0.8125rem] text-danger bg-danger/10 border border-danger/20 rounded-[8px] px-3 py-2 text-center">
                {loginError}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </div>

        <p className="text-center text-[0.75rem] text-foreground-secondary mt-6">
          © 2026 Tu Consul. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
}
