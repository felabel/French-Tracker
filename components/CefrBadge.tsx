import { Badge } from "@/components/ui/badge";
import { scoreToCefr } from "@/lib/tcf";
import { CefrLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const CEFR_COLORS: Record<CefrLevel, string> = {
  A1: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  A2: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  B1: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  B2: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  C1: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  C2: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300",
};

export function CefrBadge({ score }: { score: number }) {
  const level = scoreToCefr(score);
  return (
    <Badge variant="outline" className={cn(CEFR_COLORS[level])}>
      {level}
    </Badge>
  );
}
