"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/hooks/api";
import type { ShipmentDetail } from "@/lib/data/access";
import type {
  Batch,
  Carrier,
  ColdChainKpis,
  ColdShipmentSummary,
  ControlTowerAnalytics,
  ExecutiveAnalytics,
  PartnerAnalytics,
  Product,
  RecallAnalytics,
  RiskEvent,
  SearchResult,
  Shipment,
  TraceResult,
  TrendPoint,
} from "@/lib/data/types";

export function useExecutive() {
  return useQuery({
    queryKey: ["analytics", "executive"],
    queryFn: () => fetchJson<ExecutiveAnalytics>("/api/analytics/executive"),
  });
}

export function useControlTower() {
  return useQuery({
    queryKey: ["analytics", "control-tower"],
    queryFn: () => fetchJson<ControlTowerAnalytics>("/api/analytics/control-tower"),
  });
}

export interface ColdChainAnalytics {
  kpis: ColdChainKpis;
  excursionTrend: TrendPoint[];
  coldShipments: ColdShipmentSummary[];
  hero: ShipmentDetail | null;
}

export function useColdChain() {
  return useQuery({
    queryKey: ["analytics", "cold-chain"],
    queryFn: () => fetchJson<ColdChainAnalytics>("/api/analytics/cold-chain"),
  });
}

export function useRecallAnalytics() {
  return useQuery({
    queryKey: ["analytics", "recall"],
    queryFn: () => fetchJson<RecallAnalytics>("/api/analytics/recall"),
  });
}

export function usePartnersAnalytics() {
  return useQuery({
    queryKey: ["analytics", "partners"],
    queryFn: () => fetchJson<PartnerAnalytics>("/api/analytics/partners"),
  });
}

export function useShipmentDetail(id: string | null) {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: () => fetchJson<ShipmentDetail>(`/api/shipments/${id}`),
    enabled: !!id,
  });
}

export function useMapContext() {
  return useQuery({
    queryKey: ["map-context"],
    queryFn: () => fetchJson<import("@/lib/data/types").MapContext>("/api/map-context"),
    staleTime: 30 * 60 * 1000,
  });
}

export function useShipmentJourney(shipmentId: string | null) {
  return useQuery({
    queryKey: ["journey", shipmentId],
    queryFn: () =>
      fetchJson<import("@/lib/data/types").ShipmentJourney>(`/api/shipments/${shipmentId}/journey`),
    enabled: !!shipmentId,
  });
}

export function useTrace(query: string | null, type?: string) {
  return useQuery({
    queryKey: ["trace", query, type ?? "auto"],
    queryFn: () =>
      fetchJson<TraceResult>(
        `/api/trace?q=${encodeURIComponent(query ?? "")}${type ? `&type=${type}` : ""}`,
      ),
    enabled: !!query,
    retry: false,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchJson<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => fetchJson<RiskEvent[]>("/api/risk-events?resolved=false"),
  });
}

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: () => fetchJson<Product[]>("/api/products") });
}

export function useBatches() {
  return useQuery({ queryKey: ["batches"], queryFn: () => fetchJson<Batch[]>("/api/batches") });
}

export function useCarriers() {
  return useQuery({ queryKey: ["carriers"], queryFn: () => fetchJson<Carrier[]>("/api/carriers") });
}

export function useShipments() {
  return useQuery({
    queryKey: ["shipments"],
    queryFn: () => fetchJson<Shipment[]>("/api/shipments"),
  });
}

export function usePredictive() {
  return useQuery({
    queryKey: ["predictive"],
    queryFn: () => fetchJson<import("@/lib/data/types").PredictiveBundle>("/api/predictive"),
    retry: false,
  });
}

export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => fetchJson<import("@/lib/data/types").Insight[]>("/api/insights"),
    retry: false,
  });
}
