import { useEffect, useRef, useState } from "react";

// Ruta real por calles (OSRM, sobre datos de OpenStreetMap) entre dos puntos, con
// distancia y tiempo estimado. Se recalcula solo si el origen se movió más de
// 80 m o pasaron 45 s, para no saturar el servicio. Si falla, línea recta.
const OSRM = "https://router.project-osrm.org/route/v1/driving";

function metros(a, b) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useRuta(origen, destino) {
  const [ruta, setRuta] = useState(null);
  const ultimo = useRef({ origen: null, destino: null, en: 0 });

  const oLat = origen?.lat;
  const oLng = origen?.lng;
  const dLat = destino?.lat;
  const dLng = destino?.lng;

  useEffect(() => {
    if ([oLat, oLng, dLat, dLng].some((v) => v == null)) return;
    const o = { lat: oLat, lng: oLng };
    const d = { lat: dLat, lng: dLng };
    const prev = ultimo.current;
    const mismoDestino = prev.destino && metros(prev.destino, d) < 10;
    const poco = prev.origen && metros(prev.origen, o) < 80 && Date.now() - prev.en < 45000;
    if (mismoDestino && poco) return;
    ultimo.current = { origen: o, destino: d, en: Date.now() };

    const lineaRecta = {
      puntos: [o, d],
      distanciaM: metros(o, d),
      duracionS: null,
      aproximada: true,
    };

    const control = new AbortController();
    fetch(`${OSRM}/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`, {
      signal: control.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        const r = json.routes?.[0];
        if (!r) throw new Error("sin ruta");
        setRuta({
          puntos: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
          distanciaM: r.distance,
          duracionS: r.duration,
          aproximada: false,
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setRuta(lineaRecta);
      });
    return () => control.abort();
  }, [oLat, oLng, dLat, dLng]);

  // Sin origen o destino no hay ruta que mostrar
  return [oLat, oLng, dLat, dLng].some((v) => v == null) ? null : ruta;
}

export function textoDistancia(m) {
  if (m == null) return "—";
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function textoDuracion(s) {
  if (s == null) return null;
  const min = Math.max(1, Math.round(s / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}
