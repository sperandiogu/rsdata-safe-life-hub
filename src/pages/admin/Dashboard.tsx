import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Users,
  CreditCard,
  TrendingUp,
  CheckCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  totalCustomers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  successfulPayments: number;
  monthlyGrowth: number;
  revenueGrowth: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  customers: number;
}

interface SubscriptionByPlan {
  name: string;
  count: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  customer_name: string;
  amount?: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao sincronizar assinaturas");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions-by-plan"] });
      toast({
        title: "Sincronização concluída",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardData> => {
      const { data: customers } = await supabase.from("customers").select("id, created_at");

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id, status")
        .eq("status", "active");

      const { data: payments } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("status", "approved");

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const newCustomersThisMonth = customers?.filter(
        (c) => new Date(c.created_at) > lastMonth
      ).length || 0;

      const monthlyGrowth = customers?.length
        ? ((newCustomersThisMonth / customers.length) * 100)
        : 0;

      return {
        totalCustomers: customers?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        totalRevenue,
        successfulPayments: payments?.length || 0,
        monthlyGrowth,
        revenueGrowth: 12.5,
      };
    },
    refetchInterval: 30000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ["revenue-chart"],
    queryFn: async (): Promise<RevenueData[]> => {
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at, status")
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      const monthlyData: Record<string, { revenue: number; customers: Set<string> }> = {};

      payments?.forEach((payment) => {
        const date = new Date(payment.created_at);
        const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, customers: new Set() };
        }

        monthlyData[monthKey].revenue += payment.amount;
      });

      return Object.entries(monthlyData)
        .slice(-6)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          customers: data.customers.size,
        }));
    },
  });

  const { data: subscriptionsByPlan } = useQuery({
    queryKey: ["subscriptions-by-plan"],
    queryFn: async (): Promise<SubscriptionByPlan[]> => {
      const { data } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          billing_period,
          plans (
            name,
            monthly_price,
            annual_price
          )
        `)
        .eq("status", "active");

      const planCounts: Record<string, { count: number; revenue: number }> = {};

      data?.forEach((sub: any) => {
        const planName = sub.plans.name;
        if (!planCounts[planName]) {
          planCounts[planName] = { count: 0, revenue: 0 };
        }
        planCounts[planName].count += 1;
        const price = sub.billing_period === "mensal" ? sub.plans.monthly_price : sub.plans.annual_price;
        planCounts[planName].revenue += price;
      });

      return Object.entries(planCounts).map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }));
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async (): Promise<RecentActivity[]> => {
      const { data: payments } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          status,
          created_at,
          customers (
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      return (
        payments?.map((p: any) => ({
          id: p.id,
          type: "payment",
          customer_name: p.customers?.name || "Desconhecido",
          amount: p.amount,
          status: p.status,
          created_at: p.created_at,
        })) || []
      );
    },
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const statCards = [
    {
      title: "Total de Clientes",
      value: stats?.totalCustomers || 0,
      change: `+${stats?.monthlyGrowth.toFixed(1)}%`,
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Assinaturas Ativas",
      value: stats?.activeSubscriptions || 0,
      change: "+8.2%",
      trend: "up",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Receita Total",
      value: `R$ ${(stats?.totalRevenue || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: `+${stats?.revenueGrowth.toFixed(1)}%`,
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Pagamentos Aprovados",
      value: stats?.successfulPayments || 0,
      change: "+4.3%",
      trend: "up",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu negócio</p>
        </div>
        <Button
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Sincronizando..." : "Sincronizar com MP"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon
                    className={`h-4 w-4 ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) =>
                    `R$ ${value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Receita"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Assinaturas por Plano</CardTitle>
            <CardDescription>Distribuição de assinaturas ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={subscriptionsByPlan || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {subscriptionsByPlan?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
          <CardDescription>Últimas transações e eventos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity?.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      Pagamento •{" "}
                      {new Date(activity.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">
                    R$ {(activity.amount || 0).toFixed(2)}
                  </span>
                  <Badge
                    variant={activity.status === "approved" ? "default" : "secondary"}
                  >
                    {activity.status === "approved" ? "Aprovado" : activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
