import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";

// Custom vessel icon (SVG arrow)
function makeVesselIcon(hdg) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="-16 -16 32 32">
      <circle r="14" fill="rgba(0,229,255,0.12)" />
      <polygon points="0,-11 4,6 0,4 -4,6" fill="#00e5ff" stroke="white" stroke-width="0.5"/>
      <circle r="2" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: `<div style="transform:rotate(${hdg}deg);width:32px;height:32px">${svg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "",
  });
}

// Recenter map when follow is on
function FollowVessel({ lat, lon, follow }) {
  const map = useMap();
  useEffect(() => {
    if (follow && lat && lon)
      map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, follow]);
  return null;
}

export default function MapView({ data, track, follow }) {
  if (!data) return <div style={{ flex: 1, background: "#060c14" }} />;

  const { nav, survey } = data;
  const lines = survey?.lines ?? [];
  const activeLine = survey?.active_line ?? 0;

  return (
    <div
      style={{ flex: 1, position: "relative", width: "100%", height: "100%" }}
    >
      <MapContainer
        center={[nav.lat, nav.lon]}
        zoom={13}
        style={{ width: "100%", height: "100vh" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        <FollowVessel lat={nav.lat} lon={nav.lon} follow={follow} />

        {/* Survey lines */}
        {lines.map((ln, i) => {
          const pts = [
            [ln.start.lat, ln.start.lon],
            [ln.end.lat, ln.end.lon],
          ];
          const pct = Math.min(1, (ln.pct ?? 0) / 100);
          const dlat = ln.end.lat - ln.start.lat;
          const dlon = ln.end.lon - ln.start.lon;
          const donePt = [ln.start.lat + dlat * pct, ln.start.lon + dlon * pct];

          return (
            <React.Fragment key={i}>
              {/* Planned (dashed) */}
              <Polyline
                positions={pts}
                pathOptions={{
                  color: i === activeLine ? "#ffb300" : "#7a5500",
                  weight: i === activeLine ? 2 : 1,
                  dashArray: "6 5",
                  opacity: i === activeLine ? 0.9 : 0.45,
                }}
              >
                <Tooltip
                  permanent
                  direction="left"
                  offset={[-6, 0]}
                  className=""
                  opacity={0.85}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "#ffb300",
                    }}
                  >
                    {ln.name}
                  </span>
                </Tooltip>
              </Polyline>

              {/* Completed portion */}
              {pct > 0 && (
                <Polyline
                  positions={[[ln.start.lat, ln.start.lon], donePt]}
                  pathOptions={{
                    color: i < activeLine ? "#00e676" : "#00c853",
                    weight: 2.5,
                    opacity: 0.8,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Vessel track */}
        {track.length > 1 && (
          <Polyline
            positions={track.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: "#00e5ff", weight: 1.5, opacity: 0.5 }}
          />
        )}

        {/* Vessel marker */}
        <Marker
          position={[nav.lat, nav.lon]}
          icon={makeVesselIcon(nav.hdg)}
          zIndexOffset={1000}
        />
      </MapContainer>

      {/* Overlay: active line info */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 48,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          pointerEvents: "none",
        }}
      >
        {lines[activeLine] && (
          <div
            style={{
              background: "rgba(9,13,20,0.88)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--accent)",
              padding: "5px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ color: "var(--text-dim)" }}>ACTIVE LINE </span>
            <span style={{ color: "var(--accent)" }}>
              {lines[activeLine].name}
            </span>
            <span style={{ color: "var(--text-dim)" }}> — </span>
            <span style={{ color: "var(--good)" }}>
              {Math.round(lines[activeLine].pct ?? 0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
