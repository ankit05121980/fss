"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import type { Mode } from "@/lib/data/types";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  color: string;
}

export interface MapRoute {
  id: string;
  points: [number, number][];
  color: string;
  /** Ocean lanes are emphasized with a thicker, dashed line. */
  emphasized?: boolean;
  mode?: Mode;
}

export interface MapViewProps {
  markers: MapMarker[];
  routes?: MapRoute[];
  height?: number | string;
  zoom?: number;
  center?: [number, number];
}

function circleIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "lumenore-marker",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.25),0 1px 3px rgba(0,0,0,0.4)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
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
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [map, markers]);
  return null;
}

export default function MapViewInner({
  markers,
  routes = [],
  height = 380,
  zoom = 3,
  center = [40, -30],
}: MapViewProps) {
  return (
    <div className="border-border overflow-hidden rounded-lg border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{
              color: route.color,
              weight: route.emphasized ? 4 : 2.5,
              opacity: route.emphasized ? 0.95 : 0.7,
              dashArray: route.emphasized ? "1 8" : undefined,
              lineCap: "round",
            }}
          />
        ))}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={circleIcon(m.color)}>
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{m.label}</p>
                {m.sublabel && <p className="text-muted-foreground">{m.sublabel}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds markers={markers} />
      </MapContainer>
    </div>
  );
}
