import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapView } from "../components/MapView";
import { StatusBadge } from "../components/StatusBadge";
import {
  acceptRequest,
  getAttendedRequests,
  getNearbyRequests,
} from "../services/requestService";
import { setDisponibilidad } from "../services/medicoService";
import { connectSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 };

function rechazadasKey(userId) {
  return `medgo:rechazadas:${userId}`;
}

function leerRechazadas(userId) {
  try {
    const stored = localStorage.getItem(rechazadasKey(userId));
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState(LIMA_CENTER);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [disponible, setDisponible] = useState(false);
  const [togglingDisponible, setTogglingDisponible] = useState(false);
  const [atendidas, setAtendidas] = useState([]);
  const [rechazadas, setRechazadas] = useState(() => leerRechazadas(user.id));

  useEffect(() => {
    getAttendedRequests()
      .then(setAtendidas)
      .catch(() => setAtendidas([]));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    );
  }, []);

  useEffect(() => {
    loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng]);

  useEffect(() => {
    const socket = connectSocket();
    const onNueva = () => loadNearby();
    const onTomada = ({ id }) => setRequests((prev) => prev.filter((r) => r.id !== id));
    socket.on("solicitud:nueva", onNueva);
    socket.on("solicitud:tomada", onTomada);
    return () => {
      socket.off("solicitud:nueva", onNueva);
      socket.off("solicitud:tomada", onTomada);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNearby() {
    try {
      const data = await getNearbyRequests(location.lat, location.lng);
      setRequests(data);
    } catch {
      setRequests([]);
    }
  }

  async function handleToggleDisponible() {
    setTogglingDisponible(true);
    setError(null);
    try {
      const perfil = await setDisponibilidad({
        disponible: !disponible,
        lat: location.lat,
        lng: location.lng,
      });
      setDisponible(perfil.disponible);
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo actualizar tu disponibilidad.");
    } finally {
      setTogglingDisponible(false);
    }
  }

  function handleReject(id) {
    setRechazadas((prev) => {
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem(rechazadasKey(user.id), JSON.stringify([...next]));
      } catch {
        // localStorage no disponible (modo privado, etc.): el rechazo solo dura esta sesión
      }
      return next;
    });
  }

  async function handleAccept(id) {
    setAcceptingId(id);
    setError(null);
    try {
      await acceptRequest(id);
      navigate(`/solicitud/${id}`);
    } catch (err) {
      setError(
        err.response?.data?.error ?? "No se pudo aceptar la solicitud. Puede que otro médico ya la haya tomado."
      );
      loadNearby();
    } finally {
      setAcceptingId(null);
    }
  }

  const visibleRequests = requests.filter((r) => !rechazadas.has(r.id));

  const markers = visibleRequests.map((r) => ({
    lat: r.lat,
    lng: r.lng,
    label: r.tipo_procedimiento,
    color: "orange",
  }));

  return (
    <div className="dashboard">
      <section className="panel">
        <div className="request-header">
          <h2>Solicitudes cercanas</h2>
          <button
            className={`btn btn-sm ${disponible ? "btn-success" : "btn-outline"}`}
            onClick={handleToggleDisponible}
            disabled={togglingDisponible}
          >
            {disponible ? "🟢 En línea" : "⚪ Fuera de línea"}
          </button>
        </div>
        <MapView center={location} markers={markers} zoom={13} height={420} />
      </section>

      <section className="panel">
        <h2>Detalle de solicitudes</h2>
        {error && <p className="form-error">{error}</p>}
        {visibleRequests.length === 0 && <p>No hay solicitudes activas cerca de ti.</p>}
        <ul className="request-list">
          {visibleRequests.map((r) => (
            <li key={r.id} className="request-list-item request-list-item--card">
              <div>
                <strong>{r.tipo_procedimiento}</strong>
                <p>{r.descripcion}</p>
              </div>
              <div className="request-list-item-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAccept(r.id)}
                  disabled={acceptingId === r.id}
                >
                  {acceptingId === r.id ? "Aceptando..." : "Aceptar"}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleReject(r.id)}
                  disabled={acceptingId === r.id}
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel dashboard-full">
        <h2>Mis atenciones</h2>
        {atendidas.length === 0 && <p>Todavía no has atendido ninguna solicitud.</p>}
        <ul className="request-list">
          {atendidas.map((s) => (
            <li key={s.id}>
              <Link to={`/solicitud/${s.id}`} className="request-list-item">
                <span>{s.tipo_procedimiento}</span>
                <span className="request-list-item-meta">
                  {s.puntaje ? `★ ${s.puntaje}/5` : "Sin calificar"}
                </span>
                <StatusBadge estado={s.estado} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
