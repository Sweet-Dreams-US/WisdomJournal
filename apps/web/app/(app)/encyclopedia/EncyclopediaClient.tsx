"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Flame, FileText, MessageCircle, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import type { KnowledgeWebData } from "@/lib/data/get-knowledge-web";
import type { UserProfile, EncyclopediaStats, CategoryBreakdown } from "@wisdom-journal/shared";
import { getCategoryStyle } from "@/lib/category-utils";
import StreakFlame from "@/components/visualizations/StreakFlame";
import WisdomSearch from "@/components/app/WisdomSearch";

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
      <div className="text-stardust/40 text-sm font-body animate-pulse">
        Loading your knowledge web...
      </div>
    </div>
  );
}

interface Props {
  webData: KnowledgeWebData | null;
  profile: UserProfile | null;
  stats: EncyclopediaStats | null;
}

export default function EncyclopediaClient({ webData, profile, stats }: Props) {
  const [activeTab, setActiveTab] = useState<"web" | "radar" | "categories" | "search">("web");

  const displayName = profile?.full_name?.split(" ")[0] ?? "Your";

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-twilight font-heading">
          {displayName}&apos;s Encyclopedia
        </h1>
        <p className="text-sm text-charcoal/60 mt-1 font-body">
          Your living knowledge web — every response adds a node, every category grows your constellation.
        </p>
      </div>

      {/* Stats + Streak Flame */}
      {stats && (
        <div className="grid grid-cols-[1fr_auto] gap-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<FileText className="w-4 h-4" />}
              label="Responses"
              value={stats.total_responses}
              color="text-deep-sky"
            />
            <StatCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Words Written"
              value={stats.total_word_count.toLocaleString()}
              color="text-golden-hour"
            />
            <StatCard
              icon={<Flame className="w-4 h-4" />}
              label="Longest Streak"
              value={`${stats.longest_streak} day${stats.longest_streak !== 1 ? "s" : ""}`}
              color="text-sunrise-coral"
            />
            <StatCard
              icon={<MessageCircle className="w-4 h-4" />}
              label="Queries Received"
              value={stats.total_queries_received}
              color="text-sky-blue"
            />
          </div>
          <Card padding="md" className="flex items-center justify-center min-w-[120px]">
            <StreakFlame
              currentStreak={stats.current_streak}
              longestStreak={stats.longest_streak}
            />
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-soft-gray rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("web")}
          className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all ${
            activeTab === "web"
              ? "bg-white text-twilight shadow-sm"
              : "text-charcoal/60 hover:text-charcoal"
          }`}
        >
          Knowledge Web
        </button>
        <button
          onClick={() => setActiveTab("radar")}
          className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all ${
            activeTab === "radar"
              ? "bg-white text-twilight shadow-sm"
              : "text-charcoal/60 hover:text-charcoal"
          }`}
        >
          Wisdom Shape
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all ${
            activeTab === "categories"
              ? "bg-white text-twilight shadow-sm"
              : "text-charcoal/60 hover:text-charcoal"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all ${
            activeTab === "search"
              ? "bg-white text-twilight shadow-sm"
              : "text-charcoal/60 hover:text-charcoal"
          }`}
        >
          Search
        </button>
      </div>

      {/* Content */}
      {activeTab === "web" && (
        <>
          {webData ? (
            <KnowledgeWeb data={webData} />
          ) : (
            <Card padding="lg" className="text-center">
              <BookOpen className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
              <p className="text-charcoal/60 font-body text-sm">
                Start answering questions to see your knowledge web grow.
              </p>
            </Card>
          )}
          <p className="text-xs text-charcoal/40 mt-2 font-body text-center">
            Drag nodes to explore. Hover for details. Brighter nodes = more responses.
          </p>
        </>
      )}

      {activeTab === "radar" && stats && (
        <div className="flex flex-col items-center">
          {stats.category_breakdown.length > 0 ? (
            <>
              <CategoryRadar categories={stats.category_breakdown} size={450} />
              <p className="text-xs text-charcoal/40 mt-3 font-body text-center">
                Your wisdom shape — each axis is a category. The more you write, the further it extends.
              </p>
            </>
          ) : (
            <Card padding="lg" className="text-center w-full">
              <p className="text-charcoal/60 font-body text-sm">
                Answer questions across categories to see your wisdom shape emerge.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "search" && (
        <Card padding="md">
          <WisdomSearch autoFocus />
        </Card>
      )}

      {activeTab === "categories" && stats && (
        <div className="grid gap-3">
          {stats.category_breakdown
            .sort((a, b) => b.response_count - a.response_count)
            .map((cat) => (
              <CategoryRow key={cat.category_id} category={cat} maxResponses={stats.total_responses} />
            ))}
          {stats.category_breakdown.length === 0 && (
            <Card padding="lg" className="text-center">
              <p className="text-charcoal/60 font-body text-sm">
                No responses yet. Answer your first question to start building your encyclopedia.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-charcoal/50 font-body">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </Card>
  );
}

interface CategoryInsight {
  summary: string;
  themes: string[];
  patterns: string[];
  response_count?: number;
}

function CategoryRow({
  category,
  maxResponses,
}: {
  category: CategoryBreakdown;
  maxResponses: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [insight, setInsight] = useState<CategoryInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const style = getCategoryStyle(category.slug);
  const Icon = style.icon;
  const pct = maxResponses > 0 ? (category.response_count / maxResponses) * 100 : 0;

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
    <Card padding="md">
      <button onClick={handleToggle} className="w-full text-left">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${style.bgColor} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-5 h-5 ${style.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-charcoal truncate">
                {category.name}
              </p>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-xs text-charcoal/50 font-body">
                  {category.response_count} response{category.response_count !== 1 ? "s" : ""} ·{" "}
                  {category.word_count.toLocaleString()} words
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-charcoal/40 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
            <div className="w-full h-2 bg-soft-gray rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${style.bgColor}`}
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-soft-gray">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-charcoal/50 font-body">
              <Sparkles className="w-4 h-4 text-golden-hour animate-pulse" />
              Generating insights...
            </div>
          )}
          {insight && (
            <div className="space-y-3 text-sm">
              {insight.summary && (
                <p className="text-charcoal/70 font-body leading-relaxed">
                  {insight.summary}
                </p>
              )}
              {insight.themes && insight.themes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-charcoal/50 mb-1.5">Recurring Themes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {insight.themes.map((theme) => (
                      <span key={theme} className="px-2 py-0.5 rounded-full bg-golden-hour/10 text-golden-hour text-xs">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {insight.patterns && insight.patterns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-charcoal/50 mb-1.5">Patterns</p>
                  <ul className="space-y-1">
                    {insight.patterns.map((pattern) => (
                      <li key={pattern} className="text-charcoal/60 font-body text-xs">
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {category.response_count === 0 && (
                <p className="text-charcoal/50 font-body">
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
