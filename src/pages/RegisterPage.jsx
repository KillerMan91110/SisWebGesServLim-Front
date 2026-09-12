import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../utils/roleHome";

const ESPECIALIDADES = [
  "Medicina general",
  "Enfermería",
  "Pediatría",
  "Geriatría",
];

export function RegisterPage() {
  const { registerPaciente, registerMedico } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    rol: "paciente",
    cmpColegiatura: "",
    especialidad: ESPECIALIDADES[0],
  });
  const [error, setError] = useState(null);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (form.rol === "medico") {
        const data = await registerMedico(form);
        setPendingMessage(data.mensaje);
      } else {
        const user = await registerPaciente(form);
        navigate(roleHome(user.rol));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ?? "No se pudo completar el registro."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <img
          src="/EmbarazadPaciente.png"
          alt=""
          style={{ objectPosition: "18% 35%" }}
        />
        <div className="auth-visual-text">
          <h2>Únete a MedGo</h2>
          <p>
            Como paciente, solicita atención en minutos. Como profesional de
            salud, súmate a la red de médicos verificados.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        {pendingMessage ? (
          <div className="auth-form">
            <h1>Registro recibido</h1>
            <p>{pendingMessage}</p>
            <Link to="/login">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <h1>Crear cuenta</h1>
            {error && <p className="form-error">{error}</p>}

            <label>
              Soy
              <select
                value={form.rol}
                onChange={(e) => update("rol", e.target.value)}
              >
                <option value="paciente">Paciente</option>
                <option value="medico">Médico / profesional de salud</option>
              </select>
            </label>

            <label>
              Nombre completo
              <input
                value={form.nombre}
                onChange={(e) => update("nombre", e.target.value)}
                required
              />
            </label>
            <label>
              Correo
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={8}
              />
            </label>
            <label>
              Teléfono
              <input
                value={form.telefono}
                onChange={(e) => update("telefono", e.target.value)}
              />
            </label>

            {form.rol === "medico" && (
              <>
                <label>
                  N.º de colegiatura (CMP)
                  <input
                    value={form.cmpColegiatura}
                    onChange={(e) => update("cmpColegiatura", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Especialidad
                  <select
                    value={form.especialidad}
                    onChange={(e) => update("especialidad", e.target.value)}
                  >
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="form-hint">
                  Tu colegiatura será validada por un administrador antes de
                  que puedas recibir solicitudes.
                </p>
              </>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
            <p>
              ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
