import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createRequest, getMyRequests } from "../services/requestService";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const TIPOS_PROCEDIMIENTO = [
  { label: "Vía intravenosa / catéter", icon: "💉" },
  { label: "Inyección", icon: "💊" },
  { label: "Curación de heridas", icon: "🩹" },
  { label: "Toma de signos vitales", icon: "❤️" },
  { label: "Otro", icon: "📋" },
];

const ACTIVOS = ["pendiente", "aceptada", "en_camino", "en_atencion"];

function iconoPara(tipo) {
  return TIPOS_PROCEDIMIENTO.find((t) => t.label === tipo)?.icon ?? "📋";
}

function tiempoDesde(fechaIso) {
  const diffMs = Date.now() - new Date(fechaIso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

export function PatientDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState({
    tipoProcedimiento: TIPOS_PROCEDIMIENTO[0].label,
    descripcion: "",
  });
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setLocationError("No se pudo obtener tu ubicación. Actívala para publicar una solicitud.")
    );
  }, []);

  async function loadRequests() {
    setLoadingList(true);
    try {
      const data = await getMyRequests();
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoadingList(false);
    }
  }

  const stats = useMemo(
    () => ({
      total: requests.length,
      activas: requests.filter((r) => ACTIVOS.includes(r.estado)).length,
      finalizadas: requests.filter((r) => r.estado === "finalizada").length,
    }),
    [requests]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!location) {
      setError("Necesitamos tu ubicación para publicar la solicitud.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createRequest({ ...form, lat: location.lat, lng: location.lng });
      setForm({ tipoProcedimiento: TIPOS_PROCEDIMIENTO[0].label, descripcion: "" });
      loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.error ?? "No se pudo publicar la solicitud."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const primerNombre = user?.nombre?.split(" ")[0];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hola, {primerNombre} 👋</h1>
          <p>Publica una solicitud de atención o revisa el estado de las que ya tienes.</p>
        </div>
      </div>

      <div className="quick-stats dashboard-quick-stats">
        <div className="quick-stat-card">
          <span className="quick-stat-icon">📋</span>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Solicitudes totales</div>
          </div>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-icon">🕒</span>
          <div>
            <div className="stat-value">{stats.activas}</div>
            <div className="stat-label">Activas</div>
          </div>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-icon">✅</span>
          <div>
            <div className="stat-value">{stats.finalizadas}</div>
            <div className="stat-label">Finalizadas</div>
          </div>
        </div>
      </div>

      <section className="panel">
        <h2>Publicar solicitud de atención</h2>
        {error && <p className="form-error">{error}</p>}
        <form className="request-form" onSubmit={handleSubmit}>
          <label>
            Tipo de procedimiento
            <select
              value={form.tipoProcedimiento}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tipoProcedimiento: e.target.value }))
              }
            >
              {TIPOS_PROCEDIMIENTO.map((tipo) => (
                <option key={tipo.label} value={tipo.label}>
                  {tipo.icon} {tipo.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Descripción
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, descripcion: e.target.value }))
              }
              placeholder="Cuéntanos qué necesitas para que el médico se prepare"
              required
            />
          </label>

          {location && (
            <span className="location-indicator">
              Ubicación detectada ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
            </span>
          )}
          {!location && !locationError && (
            <span className="location-indicator location-indicator--pending">
              Obteniendo tu ubicación...
            </span>
          )}
          {locationError && (
            <span className="location-indicator location-indicator--error">{locationError}</span>
          )}

          <button className="btn btn-primary" type="submit" disabled={submitting || !location}>
            {submitting ? "Publicando..." : "Publicar solicitud"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Mis solicitudes</h2>
        {loadingList && <p>Cargando...</p>}

        {!loadingList && requests.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🗒️</span>
            <p>Aún no tienes solicitudes publicadas.</p>
          </div>
        )}

        <div className="request-card-list">
          {requests.map((r) => (
            <Link key={r.id} to={`/solicitud/${r.id}`} className="request-card">
              <span className="request-card-icon">{iconoPara(r.tipo_procedimiento)}</span>
              <div className="request-card-body">
                <strong>{r.tipo_procedimiento}</strong>
                <div className="request-card-meta">{tiempoDesde(r.creado_en)}</div>
              </div>
              <StatusBadge estado={r.estado} />
              <span className="request-card-chevron">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
