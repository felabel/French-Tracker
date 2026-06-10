import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CefrBadge } from "@/components/CefrBadge";
import { NclcBadge } from "@/components/NclcBadge";
import {
  deltaPercent,
  formatDelta,
  formatPercent,
  SECTION_LABELS,
} from "@/lib/tcf";
import { getMinScoreForNclc, getNclcProgress } from "@/lib/nclc";
import { NclcLevel, TCF_MAX_SCORE, TcfSection } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatCardProps {
  section: TcfSection;
  score: number | null;
  delta?: number | null;
  deltaLabel?: string;
  target?: number;
  nclcTarget?: NclcLevel;
}

export function StatCard({
  section,
  score,
  delta,
  deltaLabel,
  target,
  nclcTarget,
}: StatCardProps) {
  const hasScore = score !== null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {section} — {SECTION_LABELS[section]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasScore ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{score}</span>
              <span className="text-sm text-muted-foreground">
                / {TCF_MAX_SCORE}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {formatPercent(score)}
              </span>
              <NclcBadge section={section} score={score} />
              <CefrBadge score={score} />
              {delta !== null && delta !== undefined && (
                <Badge
                  variant="outline"
                  className={cn(
                    delta > 0 &&
                      "border-emerald-500/40 text-emerald-400",
                    delta < 0 && "border-red-500/40 text-red-400",
                    delta === 0 && "text-muted-foreground"
                  )}
                >
                  {formatDelta(delta)}
                  {deltaLabel ? ` ${deltaLabel}` : ""}
                </Badge>
              )}
            </div>
            {nclcTarget && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Target: NCLC {nclcTarget} (min {getMinScoreForNclc(section, nclcTarget)})
                  </span>
                  <span>
                    {score >= getMinScoreForNclc(section, nclcTarget)
                      ? "Reached"
                      : `${Math.round(getNclcProgress(section, score, nclcTarget))}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${getNclcProgress(section, score, nclcTarget)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {!nclcTarget && target && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>CEFR target: {target}</span>
                  <span>{formatPercent(Math.min(score, target))}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, (score / target) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No scores yet</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryStatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function getSectionDelta(
  current: number,
  previous: number | undefined
): number | null {
  if (previous === undefined) return null;
  return deltaPercent(current, previous);
}
