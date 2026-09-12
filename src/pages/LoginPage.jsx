import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../utils/roleHome";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleHome(user.rol));
    } catch (err) {
      setError(
        err.response?.data?.error ?? "No se pudo iniciar sesión. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <img src="/JovenPaciente.png" alt="" />
        <div className="auth-visual-text">
          <h2>Bienvenido de vuelta</h2>
          <p>Ingresa para solicitar atención o gestionar tus solicitudes activas.</p>
        </div>
      </div>
      <div className="auth-form-side">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Ingresar</h1>
        {error && <p className="form-error">{error}</p>}
        <label>
          Correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        <p>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
      </div>
    </div>
  );
}
