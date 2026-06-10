"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  buildRadarData,
  buildTrendData,
  getLatestBySection,
  SECTION_COLORS,
} from "@/lib/tcf";
import { ALL_SECTIONS, ScoreEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface SectionChartProps {
  scores: ScoreEntry[];
}

const PERIOD_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

export function SectionChart({ scores }: SectionChartProps) {
  const [period, setPeriod] = useState(30);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set(ALL_SECTIONS)
  );

  const trendData = buildTrendData(scores, period);
  const latest = getLatestBySection(scores);
  const radarData = buildRadarData(latest);

  const toggleSection = (section: string) => {
    setVisibleSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        if (next.size > 1) next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Trends</CardTitle>
          <CardDescription>Log your first test to see charts.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Percentage Trends</CardTitle>
              <CardDescription>
                Score progress over time by section
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={period === opt.value ? "default" : "outline"}
                  onClick={() => setPeriod(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {ALL_SECTIONS.map((section) => (
              <Button
                key={section}
                size="sm"
                variant={visibleSections.has(section) ? "default" : "outline"}
                style={
                  visibleSections.has(section)
                    ? { backgroundColor: SECTION_COLORS[section] }
                    : undefined
                }
                onClick={() => toggleSection(section)}
              >
                {section}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(parseISO(d), "MMM d")}
                  tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(216 34% 17%)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(216 34% 17%)" }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, ""]}
                  labelFormatter={(d) => format(parseISO(d), "MMM d, yyyy")}
                />
                <Legend />
                {ALL_SECTIONS.filter((s) => visibleSections.has(s)).map(
                  (section) => (
                    <Line
                      key={section}
                      type="monotone"
                      dataKey={section}
                      name={section}
                      stroke={SECTION_COLORS[section]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  )
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section Balance</CardTitle>
          <CardDescription>Latest scores by section (%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(216 34% 17%)" />
                <PolarAngleAxis
                  dataKey="section"
                  tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: "hsl(215 20% 65%)", fontSize: 10 }}
                />
                <Radar
                  name="Latest %"
                  dataKey="percent"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
                <Tooltip formatter={(value: number) => [`${value}%`, "Score"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
