import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  MinusCircle,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { quelleLabel, statusLabel, type PruefStatus, type Quelle } from "@/types/domain";
import { cn } from "@/lib/utils";

interface Darstellung {
  icon: LucideIcon;
  farbe: string;
  chip: string;
}

export const statusDarstellung: Record<PruefStatus, Darstellung> = {
  erfuellt: {
    icon: CheckCircle2,
    farbe: "text-ok",
    chip: "bg-ok-bg text-ok",
  },
  mangel: {
    icon: XCircle,
    farbe: "text-err",
    chip: "bg-err-bg text-err",
  },
  pruefen: {
    icon: AlertTriangle,
    farbe: "text-warn",
    chip: "bg-warn-bg text-warn",
  },
  offen: {
    icon: Circle,
    farbe: "text-warn",
    chip: "bg-warn-bg text-warn",
  },
  keine_anhaltspunkte: {
    icon: MinusCircle,
    farbe: "text-neutral",
    chip: "bg-neutral-bg text-neutral",
  },
  nicht_anwendbar: {
    icon: MinusCircle,
    farbe: "text-neutral",
    chip: "bg-neutral-bg text-neutral",
  },
};

export function StatusIcon({
  status,
  className,
}: {
  status: PruefStatus;
  className?: string;
}) {
  const Icon = statusDarstellung[status].icon;
  return (
    <Icon
      aria-hidden="true"
      className={cn("size-[18px] shrink-0", statusDarstellung[status].farbe, className)}
    />
  );
}

export function StatusChip({
  status,
  text,
  className,
}: {
  status: PruefStatus;
  text?: string;
  className?: string;
}) {
  const Icon = statusDarstellung[status].icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[13px] font-medium",
        statusDarstellung[status].chip,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {text ?? statusLabel[status]}
    </span>
  );
}

export function QuelleBadge({ quelle }: { quelle: Quelle }) {
  const stil =
    quelle === "ki"
      ? "bg-ki-bg text-ki"
      : quelle === "manuell"
        ? "border border-border text-muted-foreground"
        : "bg-neutral-bg text-neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[12px] font-medium",
        stil,
      )}
    >
      {quelleLabel[quelle]}
    </span>
  );
}
