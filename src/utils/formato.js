export const MODALIDADES = {
  domicilio: { label: "A domicilio", icon: "🏠" },
  consultorio: { label: "En consultorio", icon: "🏥" },
};

export function formatFechaHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFecha(iso) {
  if (!iso) return "—";
  // 'YYYY-MM-DD' se interpreta como fecha local, sin corrimiento por zona horaria
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
}

export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const nac = new Date(`${fechaNacimiento}T00:00:00`);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// Valor para <input type="datetime-local"> en hora local
export function aInputLocal(fecha) {
  const p = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}T${p(
    fecha.getHours()
  )}:${p(fecha.getMinutes())}`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
