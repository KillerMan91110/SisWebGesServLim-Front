# MedGo — Frontend

Plataforma de atención médica a domicilio bajo demanda (tipo Uber/InDrive): el paciente publica una solicitud de atención, un médico verificado cercano la acepta, y ambos coordinan por chat y seguimiento en tiempo real en el mapa.

Proyecto de tesis — Universidad Privada del Norte.

## Stack

- React + Vite
- React Router
- MapLibre GL JS (mapa y geolocalización)
- Socket.io (chat y ubicación en tiempo real)
- Axios

## Requisitos

- Node.js 18+
- El backend de este proyecto corriendo (repo aparte) en `http://localhost:4000`

## Cómo correr

```bash
npm install
cp .env.example .env
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Variables de entorno

Ver `.env.example`:

- `VITE_API_URL` — URL base de la API del backend
- `VITE_SOCKET_URL` — URL del servidor de Socket.io
