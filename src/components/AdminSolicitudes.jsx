import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSolicitudesAdmin } from "../services/adminService";
import { StatusBadge } from "./StatusBadge";
import { formatFechaHora, MODALIDADES } from "../utils/formato";

const FILTROS_VACIOS = { q: "", estado: "", modalidad: "", tipo: "", medicoId: "", desde: "", hasta: "" };

const ESTADOS = [
  ["pendiente", "Pendiente"],
  ["aceptada", "Aceptada"],
  ["en_camino", "Médico en camino"],
  ["en_atencion", "En atención"],
  ["finalizada", "Finalizada"],
  ["cancelada", "Cancelada"],
];

/** Listado de todas las solicitudes con filtros, búsqueda y paginación. */
export function AdminSolicitudes({ medicos = [], tipos = [] }) {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ solicitudes: [], total: 0, porPagina: 15 });
  const [claveCargada, setClaveCargada] = useState(null);
  const [error, setError] = useState(null);

  // La búsqueda por texto espera a que el usuario deje de escribir
  useEffect(() => {
    const t = setTimeout(() => {
      setFiltros((f) => (f.q === busqueda.trim() ? f : { ...f, q: busqueda.trim() }));
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // "Cargando" mientras la consulta mostrada no corresponde a los filtros actuales
  const clave = JSON.stringify({ ...filtros, pagina });
  const cargando = clave !== claveCargada;

  useEffect(() => {
    let activo = true;
    getSolicitudesAdmin({ ...filtros, pagina, porPagina: 15 })
      .then((d) => {
        if (!activo) return;
        setDatos(d);
        setError(null);
      })
      .catch(() => activo && setError("No se pudieron cargar las solicitudes."))
      .finally(() => activo && setClaveCargada(JSON.stringify({ ...filtros, pagina })));
    return () => {
      activo = false;
    };
  }, [filtros, pagina]);

  function cambiar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  }

  function limpiar() {
    setFiltros(FILTROS_VACIOS);
    setBusqueda("");
    setPagina(1);
  }

  const totalPaginas = Math.max(1, Math.ceil(datos.total / (datos.porPagina || 15)));
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Todas las solicitudes</h2>
        <span className="form-hint">
          {datos.total} resultado{datos.total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Buscar paciente, médico o N.°"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar solicitudes"
        />
        <select value={filtros.estado} onChange={(e) => cambiar("estado", e.target.value)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {ESTADOS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={filtros.modalidad} onChange={(e) => cambiar("modalidad", e.target.value)} aria-label="Modalidad">
          <option value="">Toda modalidad</option>
          {Object.entries(MODALIDADES).map(([v, m]) => (
            <option key={v} value={v}>
              {m.label}
            </option>
          ))}
        </select>
        <select value={filtros.tipo} onChange={(e) => cambiar("tipo", e.target.value)} aria-label="Procedimiento">
          <option value="">Todo procedimiento</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={filtros.medicoId} onChange={(e) => cambiar("medicoId", e.target.value)} aria-label="Médico">
          <option value="">Todos los médicos</option>
          {medicos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        <label className="filter-date">
          Desde
          <input type="date" value={filtros.desde} onChange={(e) => cambiar("desde", e.target.value)} />
        </label>
        <label className="filter-date">
          Hasta
          <input type="date" value={filtros.hasta} onChange={(e) => cambiar("hasta", e.target.value)} />
        </label>
        {hayFiltros && (
          <button type="button" className="btn btn-outline btn-sm" onClick={limpiar}>
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className={`table-wrap ${cargando ? "is-refreshing" : ""}`}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>N.°</th>
              <th>Creada</th>
              <th>Paciente</th>
              <th>Médico</th>
              <th>Procedimiento</th>
              <th>Estado</th>
              <th className="num">Calif.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {datos.solicitudes.map((s) => (
              <tr key={s.id}>
                <td className="num">#{s.id}</td>
                <td className="nowrap">{formatFechaHora(s.creado_en)}</td>
                <td>{s.paciente_nombre}</td>
                <td>{s.medico_nombre ?? <span className="text-muted">Sin asignar</span>}</td>
                <td>
                  <div className="admin-table-name">{s.tipo_procedimiento}</div>
                  <div className="admin-table-email">
                    {MODALIDADES[s.modalidad]?.icon} {MODALIDADES[s.modalidad]?.label}
                    {s.programada_para ? ` · 📅 ${formatFechaHora(s.programada_para)}` : " · ⚡ Inmediata"}
                  </div>
                </td>
                <td>
                  <StatusBadge estado={s.estado} />
                </td>
                <td className="num">{s.puntaje ? `★ ${s.puntaje}` : "—"}</td>
                <td className="num">
                  <Link to={`/solicitud/${s.id}`} className="btn btn-outline btn-sm">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {!cargando && datos.solicitudes.length === 0 && (
              <tr>
                <td colSpan={8} className="chart-empty">
                  No hay solicitudes con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <nav className="pagination" aria-label="Paginación">
          <button type="button" className="btn btn-outline btn-sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
            ← Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente →
          </button>
        </nav>
      )}
    </section>
  );
}
