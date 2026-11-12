import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { acceptConsent, getMe } from "../services/authService";

// Cuentas creadas antes de existir el consentimiento deben aceptarlo para seguir usando el sistema.
export function ConsentGate() {
  const { user, setProfile, logout } = useAuth();
  const location = useLocation();
  const [estado, setEstado] = useState("verificando");
  const [acepto, setAcepto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.consentimiento_datos_en) {
      setEstado("aceptado");
      return;
    }
    // La sesión guardada puede ser antigua: se consulta el estado real en el servidor
    getMe()
      .then((u) => {
        setProfile(u);
        setEstado(u.consentimiento_datos_en ? "aceptado" : "pendiente");
      })
      .catch(() => setEstado("aceptado")); // si falla la consulta no se bloquea la app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function aceptar() {
    setGuardando(true);
    setError(null);
    try {
      setProfile(await acceptConsent());
      setEstado("aceptado");
    } catch {
      setError("No se pudo registrar tu aceptación. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  // La política debe poder leerse aunque el aviso esté pendiente
  if (estado !== "pendiente" || location.pathname === "/privacidad") return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="consent-titulo">
      <div className="modal">
        <span className="modal-icon" aria-hidden="true">🔒</span>
        <h2 id="consent-titulo">Protección de tus datos personales</h2>
        <p>
          Actualizamos nuestra política de privacidad. Para seguir usando MedGo necesitamos tu
          autorización para tratar tus datos personales y de salud, conforme a la Ley N.° 29733.
        </p>
        <ul>
          <li>Solo los usamos para coordinar y registrar tu atención médica.</li>
          <li>Tu información clínica solo la ven el médico que te atiende y la administración.</li>
          <li>Puedes pedir acceso, corrección o eliminación de tus datos en cualquier momento.</li>
        </ul>
        <label className="consent-check">
          <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
          <span>
            He leído y acepto la{" "}
            <Link to="/privacidad" target="_blank" rel="noreferrer">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={logout}>
            Cerrar sesión
          </button>
          <button type="button" className="btn btn-primary" disabled={!acepto || guardando} onClick={aceptar}>
            {guardando ? "Guardando..." : "Aceptar y continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
