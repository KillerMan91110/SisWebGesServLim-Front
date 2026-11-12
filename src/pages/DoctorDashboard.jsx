import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapView } from "../components/MapView";
import { StatusBadge } from "../components/StatusBadge";
import {
  acceptRequest,
  getAgenda,
  getAttendedRequests,
  getNearbyRequests,
} from "../services/requestService";
import {
  getPerfilMedico,
  setDireccionConsultorio,
  setDisponibilidad,
} from "../services/medicoService";
import { formatFechaHora, MODALIDADES } from "../utils/formato";
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
  const [agenda, setAgenda] = useState([]);
  const [consultorio, setConsultorio] = useState("");
  const [consultorioGuardado, setConsultorioGuardado] = useState(null);
  const [ubicConsultorio, setUbicConsultorio] = useState(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [nuevas, setNuevas] = useState(() => new Set());
  const [fuenteUbicacion, setFuenteUbicacion] = useState("buscando");
  const [radioKm, setRadioKm] = useState(20);

  useEffect(() => {
    getAttendedRequests()
      .then(setAtendidas)
      .catch(() => setAtendidas([]));
    getAgenda()
      .then(setAgenda)
      .catch(() => setAgenda([]));
    getPerfilMedico()
      .then((perfil) => {
        setDisponible(perfil.disponible);
        setConsultorio(perfil.direccion_consultorio ?? "");
        if (perfil.consultorio_lat != null) {
          setUbicConsultorio({ lat: perfil.consultorio_lat, lng: perfil.consultorio_lng });
        }
      })
      .catch(() => {});
  }, []);

  // Ubicar el consultorio: con el GPS del médico o buscando la dirección escrita
  function usarMiUbicacionComoConsultorio() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicConsultorio({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("No se pudo obtener tu ubicación. Activa el permiso de ubicación del navegador.")
    );
  }

  async function buscarDireccionEnMapa() {
    if (!consultorio.trim()) return;
    setBuscandoDireccion(true);
    setError(null);
    try {
      const q = encodeURIComponent(`${consultorio}, Lima, Perú`);
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pe&limit=1&q=${q}`,
        { headers: { "Accept-Language": "es" } }
      );
      const [lugar] = await r.json();
      if (!lugar) {
        setError("No se encontró esa dirección. Prueba con «Usar mi ubicación actual» estando en el consultorio.");
        return;
      }
      setUbicConsultorio({ lat: Number(lugar.lat), lng: Number(lugar.lon) });
    } catch {
      setError("No se pudo buscar la dirección. Inténtalo de nuevo.");
    } finally {
      setBuscandoDireccion(false);
    }
  }

  async function handleGuardarConsultorio(e) {
    e.preventDefault();
    setConsultorioGuardado(null);
    try {
      const perfil = await setDireccionConsultorio(consultorio, ubicConsultorio);
      setConsultorio(perfil.direccion_consultorio ?? "");
      setConsultorioGuardado(
        perfil.consultorio_lat != null
          ? "Dirección y ubicación en el mapa guardadas."
          : "Dirección guardada. Marca también la ubicación en el mapa para el seguimiento."
      );
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo guardar la dirección del consultorio.");
    }
  }

  // Ubicación: GPS del navegador; si falla, la última guardada del médico; si no hay, centro de Lima.
  useEffect(() => {
    let resuelto = false;
    const usarGuardada = () =>
      getPerfilMedico()
        .then((perfil) => {
          if (resuelto) return;
          if (perfil.lat_actual != null && perfil.lng_actual != null) {
            setLocation({ lat: perfil.lat_actual, lng: perfil.lng_actual });
            setFuenteUbicacion("guardada");
          } else {
            setFuenteUbicacion("aproximada");
          }
        })
        .catch(() => setFuenteUbicacion("aproximada"));

    if (!navigator.geolocation) {
      usarGuardada();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resuelto = true;
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFuenteUbicacion("gps");
      },
      usarGuardada,
      { timeout: 8000 }
    );
  }, []);

  // Refs para que los eventos en tiempo real usen siempre la ubicación y radio actuales
  const ubicacionRef = useRef(location);
  const radioRef = useRef(radioKm);
  ubicacionRef.current = location;
  radioRef.current = radioKm;

  useEffect(() => {
    loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, radioKm]);

  useEffect(() => {
    const socket = connectSocket();
    // Una solicitud nueva aparece al instante y queda resaltada como "Nueva"
    const onNueva = (s) => {
      if (s?.id) setNuevas((prev) => new Set(prev).add(s.id));
      loadNearby();
    };
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
      const { lat, lng } = ubicacionRef.current;
      const data = await getNearbyRequests(lat, lng, radioRef.current * 1000);
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

  function handleRestaurarRechazadas() {
    setRechazadas(new Set());
    try {
      localStorage.removeItem(rechazadasKey(user.id));
    } catch {
      // sin localStorage: basta con limpiar el estado
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

  const primerNombre = user?.nombre?.split(" ").slice(0, 2).join(" ");

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hola, {primerNombre} 🩺</h1>
          <p>Revisa las solicitudes cercanas, tu agenda de citas y tus atenciones.</p>
        </div>
      </div>

      <div className="quick-stats dashboard-quick-stats">
        <div className="quick-stat-card">
          <span className="quick-stat-icon">📍</span>
          <div>
            <div className="stat-value">{visibleRequests.length}</div>
            <div className="stat-label">Solicitudes cercanas</div>
          </div>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-icon">📅</span>
          <div>
            <div className="stat-value">{agenda.length}</div>
            <div className="stat-label">Citas en agenda</div>
          </div>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-icon">✅</span>
          <div>
            <div className="stat-value">{atendidas.filter((a) => a.estado === "finalizada").length}</div>
            <div className="stat-label">Atenciones finalizadas</div>
          </div>
        </div>
      </div>

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
        <div className="map-toolbar">
          <span className={`location-indicator ${fuenteUbicacion === "gps" ? "" : "location-indicator--pending"}`}>
            {fuenteUbicacion === "gps" && "Usando tu ubicación actual"}
            {fuenteUbicacion === "buscando" && "Obteniendo tu ubicación..."}
            {fuenteUbicacion === "guardada" && "Sin GPS: usando tu última ubicación registrada"}
            {fuenteUbicacion === "aproximada" &&
              "Sin GPS: activa la ubicación del navegador para ver solicitudes cercanas"}
          </span>
          <label className="radio-select">
            Radio
            <select value={radioKm} onChange={(e) => setRadioKm(Number(e.target.value))}>
              {[5, 10, 20, 50].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </label>
        </div>
        <MapView center={location} markers={markers} zoom={13} height={420} />
      </section>

      <section className="panel">
        <h2>Detalle de solicitudes</h2>
        {error && <p className="form-error">{error}</p>}
        {visibleRequests.length === 0 && (
          <p className="form-hint">No hay solicitudes pendientes en un radio de {radioKm} km.</p>
        )}
        {requests.length > visibleRequests.length && (
          <button type="button" className="btn btn-outline btn-sm" onClick={handleRestaurarRechazadas}>
            Mostrar {requests.length - visibleRequests.length} solicitud(es) que ocultaste
          </button>
        )}
        <ul className="request-list">
          {visibleRequests.map((r) => (
            <li
              key={r.id}
              className={`request-list-item request-list-item--card ${nuevas.has(r.id) ? "is-new" : ""}`}
            >
              <div>
                <strong>
                  {r.tipo_procedimiento}
                  {nuevas.has(r.id) && <span className="new-badge">🆕 Nueva</span>}
                </strong>
                <div className="tag-row">
                  <span className="tag">
                    {MODALIDADES[r.modalidad]?.icon} {MODALIDADES[r.modalidad]?.label}
                  </span>
                  {r.programada_para ? (
                    <span className="tag tag--cita">📅 {formatFechaHora(r.programada_para)}</span>
                  ) : (
                    <span className="tag tag--urgente">⚡ Inmediata</span>
                  )}
                  {r.distancia_metros != null && (
                    <span className="tag">
                      📍 {r.distancia_metros < 1000
                        ? `${r.distancia_metros} m`
                        : `${(r.distancia_metros / 1000).toFixed(1)} km`}
                    </span>
                  )}
                </div>
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
                  Ocultar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>📅 Mi agenda de citas</h2>
        {agenda.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🗓️</span>
            <p>No tienes citas programadas pendientes.</p>
          </div>
        )}
        <ul className="agenda-list">
          {agenda.map((c) => (
            <li key={c.id}>
              <Link to={`/solicitud/${c.id}`} className="agenda-item">
                <span className="agenda-date">
                  <b>{new Date(c.programada_para).toLocaleDateString("es-PE", { day: "2-digit" })}</b>
                  {new Date(c.programada_para).toLocaleDateString("es-PE", { month: "short" })}
                </span>
                <span className="agenda-body">
                  <strong>{c.tipo_procedimiento}</strong>
                  <small>
                    {new Date(c.programada_para).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {c.paciente_nombre} · {MODALIDADES[c.modalidad]?.icon}{" "}
                    {MODALIDADES[c.modalidad]?.label}
                  </small>
                </span>
                <StatusBadge estado={c.estado} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>🏥 Mi consultorio</h2>
        <p className="form-hint">
          Los pacientes que elijan «En consultorio» verán esta dirección y el mapa con la ruta
          hasta aquí.
        </p>
        <form className="request-form" onSubmit={handleGuardarConsultorio}>
          <label>
            Dirección del consultorio
            <input
              value={consultorio}
              maxLength={255}
              placeholder="Ej.: Av. Puente Piedra 123, consultorio 4"
              onChange={(e) => setConsultorio(e.target.value)}
            />
          </label>
          <div className="consultorio-ubicar">
            <button type="button" className="btn btn-outline btn-sm" onClick={usarMiUbicacionComoConsultorio}>
              📍 Usar mi ubicación actual
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={buscarDireccionEnMapa}
              disabled={buscandoDireccion || !consultorio.trim()}
            >
              {buscandoDireccion ? "Buscando..." : "🔎 Ubicar la dirección en el mapa"}
            </button>
          </div>
          {ubicConsultorio ? (
            <MapView
              center={ubicConsultorio}
              markers={[{ ...ubicConsultorio, label: "Mi consultorio", color: "green" }]}
              zoom={16}
              height={200}
            />
          ) : (
            <p className="form-hint">
              📍 Aún no marcaste el consultorio en el mapa. Sin esa ubicación, el paciente no verá la
              ruta hasta aquí.
            </p>
          )}
          {consultorioGuardado && <p className="form-success">✔ {consultorioGuardado}</p>}
          <button className="btn btn-primary" type="submit">
            Guardar consultorio
          </button>
        </form>
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
