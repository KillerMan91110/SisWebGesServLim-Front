import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createRequest, getMyRequests } from "../services/requestService";
import { StatusBadge } from "../components/StatusBadge";

const TIPOS_PROCEDIMIENTO = [
  "Vía intravenosa / catéter",
  "Inyección",
  "Curación de heridas",
  "Toma de signos vitales",
  "Otro",
];

export function PatientDashboard() {
  const [requests, setRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState({
    tipoProcedimiento: TIPOS_PROCEDIMIENTO[0],
    descripcion: "",
  });
  const [location, setLocation] = useState(null);
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
      () => setError("No se pudo obtener tu ubicación. Actívala para publicar una solicitud.")
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
      setForm({ tipo_procedimiento: TIPOS_PROCEDIMIENTO[0], descripcion: "" });
      loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.error ?? "No se pudo publicar la solicitud."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard">
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
                <option key={tipo} value={tipo}>
                  {tipo}
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
          <p className="form-hint">
            {location
              ? `Ubicación detectada (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
              : "Obteniendo tu ubicación..."}
          </p>
          <button type="submit" disabled={submitting || !location}>
            {submitting ? "Publicando..." : "Publicar solicitud"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Mis solicitudes</h2>
        {loadingList && <p>Cargando...</p>}
        {!loadingList && requests.length === 0 && (
          <p>Aún no tienes solicitudes publicadas.</p>
        )}
        <ul className="request-list">
          {requests.map((r) => (
            <li key={r.id}>
              <Link to={`/solicitud/${r.id}`} className="request-list-item">
                <span>{r.tipo_procedimiento}</span>
                <StatusBadge estado={r.estado} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
