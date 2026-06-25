import { CONTEXT_KIND_META } from "@/lib/utils/constants";
import type { MapContextEvent, TrafficLane } from "@/lib/data/types";

/** Convert environmental events into MapView circle props. */
export function toMapCircles(events: MapContextEvent[]) {
  return events.map((e) => ({
    id: e.id,
    lat: e.lat,
    lng: e.lng,
    radiusKm: e.radiusKm,
    color: CONTEXT_KIND_META[e.kind].color,
    label: e.label,
    sublabel: e.description,
    impact: e.impact,
    severity: e.severity,
  }));
}

/** Convert ambient traffic lanes into MapView traffic props. */
export function toMapTraffic(lanes: TrafficLane[]) {
  return lanes.map((l) => ({ id: l.id, label: l.label, points: l.points }));
}
