import { api } from "./api";

export function getPublicDoctors() {
  return api.get("/medicos/publicos").then((res) => res.data.medicos);
}

export function setDisponibilidad({ disponible, lat, lng }) {
  return api
    .patch("/medicos/disponibilidad", { disponible, lat, lng })
    .then((res) => res.data.perfil);
}
