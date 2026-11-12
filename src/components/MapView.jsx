import { useEffect, useRef } from "react";
import { GeolocateControl, Map, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";
const ROUTE_SOURCE_ID = "route";
const ROUTE_LAYER_ID = "route-line";

export function MapView({ center, zoom = 13, markers = [], route = null, height = 400 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const hasFitRouteRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [center.lng, center.lat],
      zoom,
    });
    map.addControl(new NavigationControl(), "top-right");
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      hasFitRouteRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || (route && route.length >= 2)) return;
    mapRef.current.setCenter([center.lng, center.lat]);
  }, [center.lat, center.lng, route]);

  useEffect(() => {
    if (!mapRef.current) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((point) => {
      const el = document.createElement("div");
      el.className = `map-marker map-marker--${point.color ?? "blue"}`;
      const marker = new Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .setPopup(point.label ? new Popup().setText(point.label) : undefined)
        .addTo(mapRef.current);
      return marker;
    });
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function draw() {
      const valido = route && route.length >= 2;
      const data = {
        type: "FeatureCollection",
        features: valido
          ? [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: route.map((p) => [p.lng, p.lat]),
                },
              },
            ]
          : [],
      };

      const source = map.getSource(ROUTE_SOURCE_ID);
      if (source) {
        source.setData(data);
      } else {
        map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data });
        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#0b6e8a",
            "line-width": 5,
            "line-opacity": 0.85,
          },
        });
      }

      if (valido && !hasFitRouteRef.current) {
        const lngs = route.map((p) => p.lng);
        const lats = route.map((p) => p.lat);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 60, maxZoom: 16 }
        );
        hasFitRouteRef.current = true;
      } else if (!valido) {
        hasFitRouteRef.current = false;
      }
    }

    if (map.isStyleLoaded()) {
      draw();
    } else {
      map.once("load", draw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: 8, overflow: "hidden" }}
    />
  );
}
