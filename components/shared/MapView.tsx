"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { MapViewProps } from "@/components/shared/map/MapViewInner";

// Leaflet requires `window`; load the map only on the client.
const MapViewInner = dynamic(() => import("@/components/shared/map/MapViewInner"), {
  ssr: false,
  loading: () => <Skeleton className="w-full rounded-lg" style={{ height: 380 }} />,
});

export type { MapMarker, MapRoute, MapViewProps } from "@/components/shared/map/MapViewInner";

export function MapView(props: MapViewProps) {
  return <MapViewInner {...props} />;
}
