"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuditRow } from "./audit-row";
import type { AuditLog, MilestoneStatus, PayoutStatus } from "@/lib/types";

interface Props {
  milestoneId: string;
  initial: AuditLog[];
}

export function LiveMilestoneAudit({ milestoneId, initial }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<AuditLog[]>(initial);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const lastSigRef = useRef<string | null>(null);
  const lastStatusRef = useRef<{ m: MilestoneStatus | null; p: PayoutStatus | null }>({
    m: null,
    p: null,
  });

  useEffect(() => {
    setEvents(initial);
  }, [initial]);

  useEffect(() => {
    let stopped = false;
    async function tick() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const latest = events[0]?.created_at;
        const url = `/api/milestones/${milestoneId}/audit${latest ? `?since=${encodeURIComponent(latest)}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const newEvents: AuditLog[] = json?.data?.events ?? [];
        const milestone = json?.data?.milestone ?? null;
        if (newEvents.length > 0) {
          setEvents((cur) => {
            const seen = new Set(cur.map((e) => e.id));
            const merged = [...newEvents.filter((e) => !seen.has(e.id)).reverse(), ...cur];
            return merged.slice(0, 50);
          });
          setFlashIds((cur) => {
            const next = new Set(cur);
            newEvents.forEach((e) => next.add(e.id));
            return next;
          });
          // Pull fresh server state (status chips, payout panel, timeline) without full reload.
          router.refresh();
        }
        // Also trigger a refresh if status transitioned (e.g., payout hit 'confirmed').
        if (milestone) {
          const prev = lastStatusRef.current;
          if (
            (prev.m !== null && prev.m !== milestone.status) ||
            (prev.p !== null && prev.p !== milestone.payout_status)
          ) {
            router.refresh();
          }
          lastStatusRef.current = { m: milestone.status, p: milestone.payout_status };
          lastSigRef.current = milestone.payout_tx_signature;
        }
      } catch {
        // ignore transient failures
      }
    }
    const iv = window.setInterval(tick, 2500);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [milestoneId, events, router]);

  useEffect(() => {
    if (flashIds.size === 0) return;
    const t = window.setTimeout(() => setFlashIds(new Set()), 2200);
    return () => window.clearTimeout(t);
  }, [flashIds]);

  if (events.length === 0) {
    return <div className="card p-6 text-sm text-ink-500 text-center">No events yet.</div>;
  }
  return (
    <div className="card divide-y divide-ink-100 overflow-hidden">
      {events.map((e) => (
        <div
          key={e.id}
          className={`transition-colors duration-[2000ms] ${
            flashIds.has(e.id) ? "bg-emerald-50" : "bg-transparent"
          }`}
        >
          <AuditRow event={e} compact />
        </div>
      ))}
    </div>
  );
}
