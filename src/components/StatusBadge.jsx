const LABELS = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  en_camino: "Médico en camino",
  en_atencion: "En atención",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export function StatusBadge({ estado }) {
  return (
    <span className={`status-badge status-badge--${estado}`}>
      {LABELS[estado] ?? estado}
    </span>
  );
}
