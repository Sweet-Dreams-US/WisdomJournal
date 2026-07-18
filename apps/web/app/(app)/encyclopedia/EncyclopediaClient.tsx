"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen, Flame, FileText, MessageCircle, BarChart3, ChevronDown,
  Sparkles, Zap, TrendingUp, Award,
} from "lucide-react";
import Card from "@/components/ui/Card";
import type { KnowledgeWebData } from "@/lib/data/get-knowledge-web";
import type { CategoryTrend } from "@/lib/data/get-category-trends";
import type { GrowthStats } from "@/lib/data/get-growth-stats";
import type { UserProfile, EncyclopediaStats, CategoryBreakdown } from "@wisdom-journal/shared";
import { getCategoryStyle } from "@/lib/category-utils";
import StreakFlame from "@/components/visualizations/StreakFlame";
import GrowthChart from "@/components/visualizations/GrowthChart";
import RhythmChart from "@/components/visualizations/RhythmChart";

// Dynamic imports to avoid SSR issues with D3
const KnowledgeWeb = dynamic(
  () => import("@/components/visualizations/KnowledgeWeb"),
  { ssr: false, loading: () => <KnowledgeWebSkeleton /> }
);

const CategoryRadar = dynamic(
  () => import("@/components/visualizations/CategoryRadar"),
  { ssr: false }
);

function KnowledgeWebSkeleton() {
  return (
    <div className="w-full h-[600px] rounded-3xl bg-gradient-to-br from-[#111b33] to-[#0a0e1a] flex items-center justify-center">
      <div className="text-stardust/40 text-sm font-body animate-breathe">
        Loading your knowledge web...
      </div>
    </div>
  );
}

/** Animated number counter with ease-out cubic */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

/** Circular progress ring with animated stroke */
function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 4,
  color = "#4A90D9",
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (progress / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-charcoal/[0.06]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

interface Props {
  webData: KnowledgeWebData | null;
  profile: UserProfile | null;
  stats: EncyclopediaStats | null;
  categoryTrends?: CategoryTrend[];
  growth?: GrowthStats | null;
}

export default function EncyclopediaClient({
  webData,
  profile,
  stats,
  categoryTrends = [],
  growth = null,
}: Props) {
  const [activeTab, setActiveTab] = useState<"web" | "radar" | "categories" | "growth">("web");

  const displayName = profile?.full_name?.split(" ")[0] ?? "Your";

  // Derived stats
  const categoriesCovered = stats?.category_breakdown?.filter((c) => c.response_count > 0).length ?? 0;
  const totalCategories = stats?.category_breakdown?.length ?? 11;
  const coveragePercent = totalCategories > 0 ? Math.round((categoriesCovered / totalCategories) * 100) : 0;
  const avgWordsPerResponse =
    stats && stats.total_responses > 0
      ? Math.round(stats.total_word_count / stats.total_responses)
      : 0;

  const tabs = [
    { key: "web" as const, label: "Knowledge Web" },
    { key: "radar" as const, label: "Wisdom Shape" },
    { key: "categories" as const, label: "Categories" },
    { key: "growth" as const, label: "Growth" },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="display-title">
          {displayName}&apos;s Encyclopedia
        </h1>
        <p className="text-sm text-charcoal/50 mt-1 font-medium">
          Your living knowledge web — every response adds a node, every category grows your constellation.
        </p>
      </div>

      {/* Hero Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {/* Primary stat — Streak Flame */}
          <Card variant="elevated" padding="md" className="col-span-2 lg:col-span-1 lg:row-span-2 flex flex-col items-center justify-center animate-blur-in">
            <StreakFlame
              currentStreak={stats.current_streak}
              longestStreak={stats.longest_streak}
            />
          </Card>

          {/* Responses */}
          <div className="animate-stagger-in" style={{ animationDelay: "0.1s" }}>
            <Card padding="md" className="h-full group hover:shadow-card-glow transition-all duration-500">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-deep-sky/15 to-deep-sky/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <FileText className="w-4 h-4 text-deep-sky" />
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-success/50 animate-bounce-subtle" />
              </div>
              <p className="display-title">
                <AnimatedNumber value={stats.total_responses} />
              </p>
              <p className="text-[11px] text-charcoal/40 font-semibold uppercase tracking-wider mt-0.5">
                Responses
              </p>
            </Card>
          </div>

          {/* Words Written */}
          <div className="animate-stagger-in" style={{ animationDelay: "0.2s" }}>
            <Card padding="md" className="h-full group hover:shadow-glow-warm transition-all duration-500">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-golden-hour/15 to-golden-hour/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <BarChart3 className="w-4 h-4 text-golden-hour" />
                </div>
                <Zap className="w-3.5 h-3.5 text-golden-hour/40 animate-orbit" />
              </div>
              <p className="display-title">
                <AnimatedNumber value={stats.total_word_count} duration={1800} />
              </p>
              <p className="text-[11px] text-charcoal/40 font-semibold uppercase tracking-wider mt-0.5">
                Words Written
              </p>
            </Card>
          </div>

          {/* Category Coverage with ring */}
          <div className="animate-stagger-in" style={{ animationDelay: "0.3s" }}>
            <Card padding="md" className="h-full group hover:shadow-card-glow transition-all duration-500">
              <div className="flex items-start justify-between mb-2">
                <ProgressRing progress={coveragePercent} size={36} strokeWidth={3} color="#6366f1">
                  <span className="text-[10px] font-bold text-twilight">{coveragePercent}%</span>
                </ProgressRing>
                <Award className="w-3.5 h-3.5 text-[#6366f1]/40" />
              </div>
              <p className="text-lg font-bold text-twilight tracking-tight">
                {categoriesCovered}<span className="text-charcoal/30 font-normal">/{totalCategories}</span>
              </p>
              <p className="text-[11px] text-charcoal/40 font-semibold uppercase tracking-wider mt-0.5">
                Categories
              </p>
            </Card>
          </div>

          {/* Queries Received */}
          <div className="animate-stagger-in" style={{ animationDelay: "0.4s" }}>
            <Card padding="md" className="h-full group hover:shadow-card-glow transition-all duration-500">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-blue/15 to-sky-blue/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <MessageCircle className="w-4 h-4 text-sky-blue" />
                </div>
                <span className="text-[10px] text-charcoal/30 font-mono">
                  ~{avgWordsPerResponse}w/r
                </span>
              </div>
              <p className="display-title">
                <AnimatedNumber value={stats.total_queries_received} />
              </p>
              <p className="text-[11px] text-charcoal/40 font-semibold uppercase tracking-wider mt-0.5">
                Queries Received
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Tabs — pill style */}
      <div className="flex gap-1 mb-5 p-1 bg-charcoal/[0.03] rounded-2xl w-fit backdrop-blur-sm border border-charcoal/[0.04]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold font-body transition-all duration-300 ${
              activeTab === tab.key
                ? "bg-white text-twilight shadow-sm shadow-charcoal/[0.06]"
                : "text-charcoal/50 hover:text-charcoal/70 hover:bg-white/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "web" && (
        <div className="animate-fade-in">
          {webData ? (
            <KnowledgeWeb data={webData} />
          ) : (
            <Card padding="lg" className="text-center">
              <BookOpen className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
              <p className="text-charcoal/50 font-body text-sm">
                Start answering questions to see your knowledge web grow.
              </p>
            </Card>
          )}
          <p className="text-[11px] text-charcoal/35 mt-3 font-body text-center">
            Drag nodes to explore. Hover for details. Brighter nodes = more responses.
          </p>
        </div>
      )}

      {activeTab === "radar" && stats && (
        <div className="flex flex-col items-center animate-scale-in">
          {stats.category_breakdown.length > 0 ? (
            <>
              <CategoryRadar categories={stats.category_breakdown} size={450} />
              <p className="text-[11px] text-charcoal/35 mt-3 font-body text-center">
                Your wisdom shape — each axis is a category. The more you write, the further it extends.
              </p>
            </>
          ) : (
            <Card padding="lg" className="text-center w-full">
              <p className="text-charcoal/50 font-body text-sm">
                Answer questions across categories to see your wisdom shape emerge.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "categories" && stats && (
        <div className="grid gap-3 animate-fade-in-up">
          {stats.category_breakdown
            .sort((a, b) => b.response_count - a.response_count)
            .map((cat, i) => {
              const trend = categoryTrends.find((t) => t.category_id === cat.category_id);
              return (
                <div
                  key={cat.category_id}
                  className="animate-stagger-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <CategoryRow category={cat} maxResponses={stats.total_responses} trend={trend} />
                </div>
              );
            })}
          {stats.category_breakdown.length === 0 && (
            <Card padding="lg" className="text-center">
              <p className="text-charcoal/50 font-body text-sm">
                No responses yet. Answer your first question to start building your encyclopedia.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "growth" && (
        <div className="space-y-4 animate-fade-in-up">
          <Card padding="lg">
            <div className="mb-6">
              <h2 className="font-heading text-lg text-twilight">The archive grows</h2>
              <p className="text-xs text-charcoal/45 font-body mt-1">
                Every entry adds to a record only you could write. This is how it has accumulated, word by word.
              </p>
            </div>
            <GrowthChart points={growth?.cumulative ?? []} />
          </Card>

          <Card padding="lg">
            <div className="mb-6">
              <h2 className="font-heading text-lg text-twilight">Your rhythm</h2>
              <p className="text-xs text-charcoal/45 font-body mt-1">
                The days of the week your writing naturally gathers on.
              </p>
            </div>
            <RhythmChart byWeekday={growth?.byWeekday ?? []} />
          </Card>
        </div>
      )}
    </div>
  );
}

interface CategoryInsight {
  summary: string;
  themes: string[];
  patterns: string[];
  response_count?: number;
}

function TrendIndicator({ trend }: { trend?: CategoryTrend }) {
  if (!trend) return null;

  const { recent_count, previous_count } = trend;

  // If both are zero, no trend to show
  if (recent_count === 0 && previous_count === 0) return null;

  let arrow: string;
  let colorClass: string;
  let pctChange: number;

  if (previous_count === 0 && recent_count > 0) {
    arrow = "\u2191";
    colorClass = "text-success";
    pctChange = 100;
  } else if (previous_count > 0) {
    pctChange = Math.round(((recent_count - previous_count) / previous_count) * 100);
    if (pctChange > 0) {
      arrow = "\u2191";
      colorClass = "text-success";
    } else if (pctChange < 0) {
      arrow = "\u2193";
      colorClass = "text-error";
      pctChange = Math.abs(pctChange);
    } else {
      arrow = "\u2192";
      colorClass = "text-charcoal/40";
    }
  } else {
    arrow = "\u2193";
    colorClass = "text-error";
    pctChange = 100;
  }

  return (
    <span className={`text-xs font-medium ${colorClass}`} title="30-day trend vs previous 30 days">
      {arrow} {pctChange}%
    </span>
  );
}

function CategoryRow({
  category,
  maxResponses,
  trend,
}: {
  category: CategoryBreakdown;
  maxResponses: number;
  trend?: CategoryTrend;
}) {
  const [expanded, setExpanded] = useState(false);
  const [insight, setInsight] = useState<CategoryInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  const style = getCategoryStyle(category.slug);
  const Icon = style.icon;
  const pct = maxResponses > 0 ? (category.response_count / maxResponses) * 100 : 0;

  // Animate bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(Math.max(pct, 2)), 200);
    return () => clearTimeout(timer);
  }, [pct]);

  async function loadInsight() {
    if (insight || loading || category.response_count === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/insights/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: category.category_id,
          category_name: category.name,
        }),
      });
      if (res.ok) {
        setInsight(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !insight) {
      loadInsight();
    }
  }

  return (
    <Card padding="md" className="group hover:shadow-card-glow transition-all duration-300">
      <button onClick={handleToggle} className="w-full text-left">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${style.bgColor} flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
          >
            <Icon className={`w-5 h-5 ${style.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold text-charcoal truncate tracking-tight">
                {category.name}
              </p>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-[11px] text-charcoal/40 font-medium">
                  {category.response_count} response{category.response_count !== 1 ? "s" : ""} ·{" "}
                  {category.word_count.toLocaleString()} words
                </span>
                <TrendIndicator trend={trend} />
                <ChevronDown
                  className={`w-4 h-4 text-charcoal/30 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
            <div className="w-full h-1.5 bg-charcoal/[0.04] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bgColor}`}
                style={{
                  width: `${barWidth}%`,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-charcoal/[0.06] animate-fade-in-up">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-charcoal/50 font-body">
              <Sparkles className="w-4 h-4 text-golden-hour animate-breathe" />
              Generating insights...
            </div>
          )}
          {insight && (
            <div className="space-y-3 text-sm animate-blur-in">
              {insight.summary && (
                <p className="text-charcoal/60 font-body leading-relaxed">
                  {insight.summary}
                </p>
              )}
              {insight.themes && insight.themes.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-charcoal/40 mb-1.5 uppercase tracking-wider">Recurring Themes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {insight.themes.map((theme, i) => (
                      <span
                        key={theme}
                        className="px-2.5 py-0.5 rounded-full bg-golden-hour/10 text-golden-hour text-xs font-medium animate-scale-in"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {insight.patterns && insight.patterns.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-charcoal/40 mb-1.5 uppercase tracking-wider">Patterns</p>
                  <ul className="space-y-1.5">
                    {insight.patterns.map((pattern, i) => (
                      <li
                        key={pattern}
                        className="text-charcoal/55 font-body text-xs leading-relaxed flex items-start gap-2 animate-slide-in-left"
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <span className="w-1 h-1 rounded-full bg-deep-sky/40 flex-shrink-0 mt-1.5" />
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {category.response_count === 0 && (
                <p className="text-charcoal/40 font-body">
                  Answer questions in this category to unlock insights.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
