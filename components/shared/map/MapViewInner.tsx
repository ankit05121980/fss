"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import L from "leaflet";
import { useTheme } from "next-themes";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import { LOCATION_TYPE_META, MODE_META } from "@/lib/utils/constants";
import type { LocationType, Mode, Severity } from "@/lib/data/types";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  type?: LocationType;
  country?: string;
  /** Optional explicit pin colour (defaults to the location-type colour). */
  color?: string;
  /** Emphasize this node with a ring (e.g. current location / excursion origin). */
  highlight?: boolean;
}

export interface MapRoute {
  id: string;
  points: [number, number][];
  color: string;
  /** Ocean lanes are emphasized with a thicker, dashed line. */
  emphasized?: boolean;
  mode?: Mode;
}

export interface MapCircle {
  id: string;
  lat: number;
  lng: number;
  radiusKm: number;
  color: string;
  label: string;
  sublabel?: string;
  impact?: string;
  severity?: Severity;
}

export interface MapTraffic {
  id: string;
  label?: string;
  points: [number, number][];
}

export interface MapViewProps {
  markers: MapMarker[];
  routes?: MapRoute[];
  circles?: MapCircle[];
  traffic?: MapTraffic[];
  height?: number | string;
  zoom?: number;
  center?: [number, number];
}

// Recognizable transport / facility glyphs (render reliably across platforms).
const TYPE_EMOJI: Record<LocationType, string> = {
  MANUFACTURER: "\u{1F3ED}", // factory
  WAREHOUSE: "\u{1F3EC}", // department store
  PORT: "\u2693", // anchor
  CUSTOMS: "\u{1F6C3}", // customs
  "3PL": "\u{1F4E6}", // package
  DC: "\u{1F3E2}", // office building
  HOSPITAL: "\u{1F3E5}", // hospital
};

const MODE_EMOJI: Record<Mode, string> = {
  OCEAN: "\u{1F6A2}", // ship
  AIR: "\u2708\uFE0F", // airplane
  TRUCK: "\u{1F69B}", // truck
  RAIL: "\u{1F686}", // train
};

function markerIcon(marker: MapMarker): L.DivIcon {
  const color = marker.color ?? (marker.type ? LOCATION_TYPE_META[marker.type].color : "#2E75B6");
  const emoji = marker.type ? TYPE_EMOJI[marker.type] : "\u{1F4CD}";
  const ring = marker.highlight
    ? "box-shadow:0 0 0 4px rgba(46,117,182,0.30),0 1px 4px rgba(0,0,0,0.45);"
    : "box-shadow:0 1px 4px rgba(0,0,0,0.45);";
  return L.divIcon({
    className: "nettrace-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:${color};border:2px solid #fff;${ring}font-size:15px;line-height:1">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

function modeBadge(mode: Mode): L.DivIcon {
  return L.divIcon({
    className: "nettrace-mode",
    html: `<div title="${MODE_META[mode].label}" style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#fff;border:1px solid rgba(0,0,0,0.15);box-shadow:0 1px 3px rgba(0,0,0,0.35);font-size:13px;line-height:1">${MODE_EMOJI[mode]}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 5);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 6 });
  }, [map, markers]);
  return null;
}

export default function MapViewInner({
  markers,
  routes = [],
  circles = [],
  traffic = [],
  height = 380,
  zoom = 3,
  center = [40, -30],
}: MapViewProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  // CARTO basemaps — clean, label-rich, free, no token required.
  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="overflow-hidden rounded-lg border border-border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        worldCopyJump
      >
        <TileLayer
          key={dark ? "dark" : "light"}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
          subdomains="abcd"
        />

        {/* Ambient (other) traffic — muted background lanes */}
        {traffic.map((t) => (
          <Polyline
            key={t.id}
            positions={t.points}
            pathOptions={{ color: "#94a3b8", weight: 1.5, opacity: 0.5, dashArray: "2 7", lineCap: "round" }}
          >
            {t.label && (
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">Other traffic</p>
                  <p className="text-muted-foreground">{t.label}</p>
                </div>
              </Popup>
            )}
          </Polyline>
        ))}

        {/* Environmental conditions — weather / congestion / heat zones */}
        {circles.map((c) => (
          <Circle
            key={c.id}
            center={[c.lat, c.lng]}
            radius={c.radiusKm * 1000}
            pathOptions={{
              color: c.color,
              weight: 1.5,
              opacity: 0.7,
              fillColor: c.color,
              fillOpacity: 0.12,
              dashArray: "5 6",
            }}
          >
            <Popup>
              <div className="space-y-0.5 text-xs">
                <p className="text-popover-foreground text-sm font-semibold">{c.label}</p>
                {c.sublabel && <p className="text-muted-foreground">{c.sublabel}</p>}
                {c.impact && <p className="text-muted-foreground">{c.impact}</p>}
                {c.severity && <p className="text-muted-foreground">Severity: {c.severity}</p>}
              </div>
            </Popup>
          </Circle>
        ))}

        {routes.map((route) => {
          const mid = route.points[Math.floor(route.points.length / 2)] ?? route.points[0];
          const start = route.points[0];
          const end = route.points[route.points.length - 1];
          const midpoint: [number, number] = start && end
            ? [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
            : mid;
          return (
            <React.Fragment key={route.id}>
              <Polyline
                positions={route.points}
                pathOptions={{
                  color: route.color,
                  weight: route.emphasized ? 4 : 2.5,
                  opacity: route.emphasized ? 0.95 : 0.75,
                  dashArray: route.emphasized ? "1 8" : undefined,
                  lineCap: "round",
                }}
              />
              {route.mode && (
                <Marker position={midpoint} icon={modeBadge(route.mode)} interactive={false} keyboard={false} />
              )}
            </React.Fragment>
          );
        })}

        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(m)}>
            <Popup>
              <div className="space-y-0.5 text-xs">
                <p className="text-sm font-semibold text-popover-foreground">{m.label}</p>
                {m.type && (
                  <p className="text-muted-foreground">{LOCATION_TYPE_META[m.type].label}</p>
                )}
                {m.country && <p className="text-muted-foreground">{m.country}</p>}
                {!m.type && m.sublabel && <p className="text-muted-foreground">{m.sublabel}</p>}
                <p className="pt-1 font-mono text-[11px] text-muted-foreground">
                  {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds markers={markers} />
      </MapContainer>
    </div>
  );
}
