import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import { TrendingUp, Users, DollarSign, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyData {
  month: string;
  revenue: number;
  customers: number;
  subscriptions: number;
  payments: number;
}

interface PaymentMethodData {
  name: string;
  value: number;
  count: number;
}

const Analytics = () => {
  const { data: monthlyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["monthly-trends"],
    queryFn: async (): Promise<MonthlyData[]> => {
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at, status, customer_id")
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("created_at")
        .order("created_at", { ascending: true });

      const monthlyData: Record<
        string,
        {
          revenue: number;
          customers: Set<string>;
          subscriptions: number;
          payments: number;
        }
      > = {};

      payments?.forEach((payment) => {
        const date = new Date(payment.created_at);
        const monthKey = date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            revenue: 0,
            customers: new Set(),
            subscriptions: 0,
            payments: 0,
          };
        }

        monthlyData[monthKey].revenue += payment.amount;
        monthlyData[monthKey].customers.add(payment.customer_id);
        monthlyData[monthKey].payments += 1;
      });

      subscriptions?.forEach((sub) => {
        const date = new Date(sub.created_at);
        const monthKey = date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].subscriptions += 1;
        }
      });

      return Object.entries(monthlyData)
        .slice(-12)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue / 100,
          customers: data.customers.size,
          subscriptions: data.subscriptions,
          payments: data.payments,
        }));
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async (): Promise<PaymentMethodData[]> => {
      const { data } = await supabase
        .from("payments")
        .select("payment_method, amount, status")
        .eq("status", "approved");

      const methodData: Record<string, { value: number; count: number }> = {};

      data?.forEach((payment) => {
        if (!methodData[payment.payment_method]) {
          methodData[payment.payment_method] = { value: 0, count: 0 };
        }
        methodData[payment.payment_method].value += payment.amount;
        methodData[payment.payment_method].count += 1;
      });

      return Object.entries(methodData).map(([name, data]) => ({
        name,
        value: data.value / 100,
        count: data.count,
      }));
    },
  });

  const { data: conversionData } = useQuery({
    queryKey: ["conversion-rates"],
    queryFn: async () => {
      const { data: customers } = await supabase
        .from("customers")
        .select("id, created_at");

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("customer_id, status");

      const { data: payments } = await supabase
        .from("payments")
        .select("customer_id, status")
        .eq("status", "approved");

      const customersWithSubscriptions = new Set(
        subscriptions?.map((s) => s.customer_id)
      );
      const customersWithPayments = new Set(payments?.map((p) => p.customer_id));

      const conversionRate = customers?.length
        ? (customersWithSubscriptions.size / customers.length) * 100
        : 0;

      const paymentRate = customers?.length
        ? (customersWithPayments.size / customers.length) * 100
        : 0;

      return {
        totalLeads: customers?.length || 0,
        subscribers: customersWithSubscriptions.size,
        paying: customersWithPayments.size,
        conversionRate,
        paymentRate,
      };
    },
  });

  const COLORS = ["#084D6C", "#10b981", "#f59e0b", "#ef4444", "#0a5e87"];

  if (trendsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Análise detalhada de desempenho e métricas do negócio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-[#084D6C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionData?.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {conversionData?.subscribers} de {conversionData?.totalLeads} leads convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionData?.paymentRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {conversionData?.paying} clientes pagantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#084D6C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {(
                (monthlyTrends?.reduce((sum, m) => sum + m.revenue, 0) || 0) /
                (monthlyTrends?.reduce((sum, m) => sum + m.payments, 0) || 1)
              ).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Valor médio por transação</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Crescimento Mensal</CardTitle>
            <CardDescription>
              Evolução de receita, clientes e assinaturas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Receita (R$)"
                  stroke="#084D6C"
                  fill="#084D6C"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="subscriptions"
                  name="Assinaturas"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Mês</CardTitle>
            <CardDescription>Comparativo mensal de receita</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyTrends || []}>
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
                <Bar dataKey="revenue" name="Receita" fill="#084D6C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>Distribuição por forma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={paymentMethods || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethods?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    `R$ ${value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novos Clientes por Mês</CardTitle>
          <CardDescription>Aquisição de clientes ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="customers"
                name="Novos Clientes"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
