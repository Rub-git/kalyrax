'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Users,
  Share2,
  Target,
  Trophy,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface GrowthMetrics {
  totalPlansGenerated: number;
  totalChallengesStarted: number;
  totalChallengesCompleted: number;
  totalSharesCreated: number;
  totalShareClicks: number;
  totalUsersRegistered: number;
  activationRate: number;
  challengeCompletionRate: number;
  shareRate: number;
  viralCoefficient: number;
}

interface FunnelStage {
  stage: string;
  count: number;
}

interface AnalyticsData {
  metrics: GrowthMetrics;
  funnel: FunnelStage[];
  dailyCounts: Record<string, { date: string; count: number }[]>;
  period: { days: number; startDate: string };
}

export default function AnalyticsDashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState('');

  const t = (en: string, es: string) => (language === 'es' ? es : en);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/growth/analytics?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (err) {
      setError(t('Failed to load analytics', 'Error al cargar análisis'));
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Prepare chart data
  const funnelChartData = data?.funnel?.map((stage, index) => ({
    ...stage,
    fill: [
      '#22c55e', // green
      '#3b82f6', // blue
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
    ][index % 5],
  })) || [];

  // Prepare line chart data
  const dailyChartData: { date: string; plans: number; challenges: number; shares: number; users: number }[] = [];
  if (data?.dailyCounts) {
    const dates = new Set<string>();
    Object.values(data.dailyCounts).forEach((counts) => {
      counts.forEach((c) => dates.add(c.date));
    });
    Array.from(dates)
      .sort()
      .forEach((date) => {
        dailyChartData.push({
          date: date.substring(5), // MM-DD format
          plans: data.dailyCounts['PLAN_GENERATED']?.find((c) => c.date === date)?.count || 0,
          challenges: data.dailyCounts['CHALLENGE_STARTED']?.find((c) => c.date === date)?.count || 0,
          shares: data.dailyCounts['SHARE_CREATED']?.find((c) => c.date === date)?.count || 0,
          users: data.dailyCounts['USER_REGISTERED']?.find((c) => c.date === date)?.count || 0,
        });
      });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              {t('Growth Analytics', 'Análisis de Crecimiento')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('Track viral metrics and user acquisition', 'Rastrea métricas virales y adquisición de usuarios')}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {[7, 14, 30, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-red-500">{error}</CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title={t('Plans Generated', 'Planes Generados')}
                value={data.metrics.totalPlansGenerated}
                icon={<Target className="h-5 w-5" />}
                color="green"
              />
              <MetricCard
                title={t('Challenges Started', 'Retos Iniciados')}
                value={data.metrics.totalChallengesStarted}
                icon={<Trophy className="h-5 w-5" />}
                color="blue"
              />
              <MetricCard
                title={t('Shares Created', 'Compartidos')}
                value={data.metrics.totalSharesCreated}
                icon={<Share2 className="h-5 w-5" />}
                color="amber"
              />
              <MetricCard
                title={t('New Users (from shares)', 'Usuarios Nuevos')}
                value={data.metrics.totalUsersRegistered}
                icon={<Users className="h-5 w-5" />}
                color="purple"
              />
            </div>

            {/* Rate Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RateCard
                title={t('Activation Rate', 'Tasa de Activación')}
                value={data.metrics.activationRate}
                description={t('Plans → Challenges', 'Planes → Retos')}
              />
              <RateCard
                title={t('Completion Rate', 'Tasa de Completado')}
                value={data.metrics.challengeCompletionRate}
                description={t('Started → Completed', 'Iniciados → Completados')}
              />
              <RateCard
                title={t('Share Rate', 'Tasa de Compartido')}
                value={data.metrics.shareRate}
                description={t('Challenges → Shares', 'Retos → Compartidos')}
              />
              <RateCard
                title={t('Viral Coefficient', 'Coeficiente Viral')}
                value={data.metrics.viralCoefficient}
                description={t('Users per Share', 'Usuarios por Compartido')}
                isCoefficient
              />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Funnel Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    {t('Viral Funnel', 'Embudo Viral')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="stage" type="category" width={120} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    {t('Daily Trends', 'Tendencias Diarias')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="plans" stroke="#22c55e" name={t('Plans', 'Planes')} strokeWidth={2} />
                        <Line type="monotone" dataKey="challenges" stroke="#3b82f6" name={t('Challenges', 'Retos')} strokeWidth={2} />
                        <Line type="monotone" dataKey="shares" stroke="#f59e0b" name={t('Shares', 'Compartidos')} strokeWidth={2} />
                        <Line type="monotone" dataKey="users" stroke="#8b5cf6" name={t('Users', 'Usuarios')} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Funnel Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Conversion Funnel Detail', 'Detalle del Embudo de Conversión')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t('Stage', 'Etapa')}</th>
                        <th className="text-right py-3 px-4">{t('Count', 'Cantidad')}</th>
                        <th className="text-right py-3 px-4">{t('Conversion', 'Conversión')}</th>
                        <th className="text-right py-3 px-4">{t('Drop-off', 'Abandono')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.funnel.map((stage, index) => {
                        const prev = index > 0 ? data.funnel[index - 1].count : stage.count;
                        const conversion = prev > 0 ? ((stage.count / prev) * 100).toFixed(1) : '100.0';
                        const dropoff = prev > 0 ? (((prev - stage.count) / prev) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={stage.stage} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4 font-medium">{stage.stage}</td>
                            <td className="py-3 px-4 text-right font-semibold">{stage.count.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-blue-700">{conversion}%</td>
                            <td className="py-3 px-4 text-right text-red-500">{dropoff}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'amber' | 'purple';
}) {
  const colors = {
    green: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-500',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RateCard({
  title,
  value,
  description,
  isCoefficient,
}: {
  title: string;
  value: number;
  description: string;
  isCoefficient?: boolean;
}) {
  const displayValue = isCoefficient ? value.toFixed(2) : `${value.toFixed(1)}%`;
  const isGood = isCoefficient ? value >= 0.5 : value >= 20;
  const isBad = isCoefficient ? value < 0.1 : value < 5;

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${
            isGood ? 'text-blue-700' : isBad ? 'text-red-500' : 'text-gray-900 dark:text-white'
          }`}>
            {displayValue}
          </span>
          {isGood && <ArrowUp className="h-4 w-4 text-blue-500" />}
          {isBad && <ArrowDown className="h-4 w-4 text-red-500" />}
          {!isGood && !isBad && <Minus className="h-4 w-4 text-gray-400" />}
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
