import { Badge } from "@/components/ui/badge";
import { formatNclc, scoreToNclc } from "@/lib/nclc";
import { NclcLevel, TcfSection } from "@/lib/types";
import { cn } from "@/lib/utils";

const NCLC_COLORS: Record<NclcLevel, string> = {
  4: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  5: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  6: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  7: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  8: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  9: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  10: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

interface NclcBadgeProps {
  section: TcfSection;
  score: number;
  className?: string;
}

export function NclcBadge({ section, score, className }: NclcBadgeProps) {
  const level = scoreToNclc(section, score);

  if (level === null) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        Below NCLC 4
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(NCLC_COLORS[level], className)}
    >
      {formatNclc(level)}
    </Badge>
  );
}
