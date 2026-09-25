export function euro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export function datum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function uhrzeit(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr"
  );
}

export function datumZeit(iso: string): string {
  return `${datum(iso)}, ${uhrzeit(iso)}`;
}

/** "heute, 09:42 Uhr" bzw. "24.09.2026, 16:10 Uhr" – bezogen auf das Demo-Datum */
export function eingangLabel(iso: string, heuteIso = "2026-09-25T08:00:00"): string {
  const a = new Date(iso);
  const b = new Date(heuteIso);
  const gleich =
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  return gleich ? `heute, ${uhrzeit(iso)}` : datumZeit(iso);
}

export function fristDatum(basisIso: string, wochen: number): string {
  const d = new Date(basisIso);
  d.setDate(d.getDate() + wochen * 7);
  return datum(d.toISOString());
}
