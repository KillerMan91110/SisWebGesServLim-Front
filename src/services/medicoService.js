import { api } from "./api";

export function getPublicDoctors() {
  return api.get("/medicos/publicos").then((res) => res.data.medicos);
}

export function setDisponibilidad({ disponible, lat, lng }) {
  return api
    .patch("/medicos/disponibilidad", { disponible, lat, lng })
    .then((res) => res.data.perfil);
}

export function getPerfilMedico() {
  return api.get("/medicos/perfil").then((res) => res.data.perfil);
}

export function setDireccionConsultorio(direccionConsultorio) {
  return api
    .patch("/medicos/perfil/consultorio", { direccionConsultorio })
    .then((res) => res.data.perfil);
}

export function getMedicosCercanos(lat, lng, radio = 10000) {
  return api
    .get("/medicos/cercanos", { params: { lat, lng, radio } })
    .then((res) => res.data.medicos);
}
