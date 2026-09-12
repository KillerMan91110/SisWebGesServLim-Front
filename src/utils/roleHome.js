export function roleHome(rol) {
  if (rol === "medico") return "/medico";
  if (rol === "admin") return "/admin";
  return "/paciente";
}
