import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CreditCard, TrendingUp, CheckCircle } from "lucide-react";
import CustomerList from "@/components/admin/CustomerList";
import DashboardStats from "@/components/admin/DashboardStats";

interface DashboardData {
  totalCustomers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  successfulPayments: number;
}

const AdminDashboard = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardData> => {
      const { data: customers } = await supabase
        .from("customers")
        .select("id");

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id, status")
        .eq("status", "active");

      const { data: payments } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("status", "approved");

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        totalCustomers: customers?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        totalRevenue,
        successfulPayments: payments?.length || 0,
      };
    },
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-1">RSData - Gestão de Clientes e Assinaturas</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <DashboardStats stats={stats} loading={statsLoading} />

        <Tabs defaultValue="customers" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="analytics">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-6">
            <CustomerList onSelectCustomer={setSelectedCustomer} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios e Análises</CardTitle>
                <CardDescription>
                  Visualize métricas detalhadas sobre suas vendas e assinaturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <p>Relatórios em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
