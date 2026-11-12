import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../services/socket";
import { getNotificaciones, marcarLeida, marcarTodasLeidas } from "../services/notificacionService";

function hace(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

const soportaNotificaciones = typeof window !== "undefined" && "Notification" in window;

export function NotificationBell({ userId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [permiso, setPermiso] = useState(soportaNotificaciones ? Notification.permission : "denied");
  const contenedor = useRef(null);

  useEffect(() => {
    getNotificaciones()
      .then(({ notificaciones, noLeidas }) => {
        setItems(notificaciones);
        setNoLeidas(noLeidas);
      })
      .catch(() => {});

    const socket = connectSocket();
    const alLlegar = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 30));
      setNoLeidas((c) => c + 1);
      setToasts((prev) => [...prev, n]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== n.id)), 7000);
      // Aviso del sistema operativo cuando la pestaña no está a la vista
      if (soportaNotificaciones && Notification.permission === "granted" && document.hidden) {
        const aviso = new Notification(n.titulo, { body: n.mensaje, tag: `medgo-${n.id}` });
        aviso.onclick = () => {
          window.focus();
          if (n.solicitud_id) navigate(`/solicitud/${n.solicitud_id}`);
        };
      }
    };
    socket.on("notificacion:nueva", alLlegar);
    return () => socket.off("notificacion:nueva", alLlegar);
  }, [userId, navigate]);

  // Cerrar el panel al hacer clic fuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    const escape = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  async function abrir(n) {
    setAbierto(false);
    setToasts((prev) => prev.filter((t) => t.id !== n.id));
    if (!n.leida_en) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida_en: new Date().toISOString() } : x)));
      setNoLeidas((c) => Math.max(0, c - 1));
      marcarLeida(n.id).catch(() => {});
    }
    if (n.solicitud_id) navigate(`/solicitud/${n.solicitud_id}`);
  }

  async function leerTodas() {
    setItems((prev) => prev.map((x) => ({ ...x, leida_en: x.leida_en ?? new Date().toISOString() })));
    setNoLeidas(0);
    marcarTodasLeidas().catch(() => {});
  }

  async function activarAvisos() {
    if (!soportaNotificaciones) return;
    setPermiso(await Notification.requestPermission());
  }

  return (
    <div className="notif" ref={contenedor}>
      <button
        type="button"
        className="notif-bell"
        aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        🔔
        {noLeidas > 0 && <span className="notif-count">{noLeidas > 9 ? "9+" : noLeidas}</span>}
      </button>

      {abierto && (
        <div className="notif-panel" role="dialog" aria-label="Notificaciones">
          <div className="notif-panel-head">
            <strong>Notificaciones</strong>
            {noLeidas > 0 && (
              <button type="button" className="link-button" onClick={leerTodas}>
                Marcar todas como leídas
              </button>
            )}
          </div>
          {soportaNotificaciones && permiso === "default" && (
            <button type="button" className="notif-permiso" onClick={activarAvisos}>
              🔔 Activar avisos del navegador para no perderte tus citas
            </button>
          )}
          <ul className="notif-list">
            {items.length === 0 && <li className="notif-empty">No tienes notificaciones.</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notif-item ${n.leida_en ? "" : "is-unread"}`}
                  onClick={() => abrir(n)}
                >
                  <strong>{n.titulo}</strong>
                  <span>{n.mensaje}</span>
                  <small>{hace(n.creado_en)}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <button key={t.id} type="button" className="toast" onClick={() => abrir(t)}>
            <strong>{t.titulo}</strong>
            <span>{t.mensaje}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
