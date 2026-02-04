import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Eye, Filter, Calendar, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  billing_period: string;
  created_at: string;
  customers: {
    name: string;
    email: string;
  };
  plans: {
    name: string;
    price: number;
    type: string;
  };
}

const Assinaturas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
      queryClient.invalidateQueries({ queryKey: ["subscriptions-list"] });
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

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["subscriptions-list"],
    queryFn: async (): Promise<Subscription[]> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          start_date,
          end_date,
          billing_period,
          created_at,
          customers (
            name,
            email
          ),
          plans (
            name,
            price,
            type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const matchesSearch =
      sub.customers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customers.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plans.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      active: { variant: "default", label: "Ativa" },
      cancelled: { variant: "destructive", label: "Cancelada" },
      pending: { variant: "secondary", label: "Pendente" },
      paused: { variant: "outline", label: "Pausada" },
    };

    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    if (!filteredSubscriptions) return;

    const headers = [
      "Cliente",
      "Email",
      "Plano",
      "Valor",
      "Status",
      "Início",
      "Término",
      "Período",
    ];
    const rows = filteredSubscriptions.map((sub) => [
      sub.customers.name,
      sub.customers.email,
      sub.plans.name,
      sub.plans.price.toFixed(2),
      sub.status,
      new Date(sub.start_date).toLocaleDateString("pt-BR"),
      new Date(sub.end_date).toLocaleDateString("pt-BR"),
      sub.billing_period,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `assinaturas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const stats = {
    total: subscriptions?.length || 0,
    active: subscriptions?.filter((s) => s.status === "active").length || 0,
    cancelled: subscriptions?.filter((s) => s.status === "cancelled").length || 0,
    revenue:
      subscriptions
        ?.filter((s) => s.status === "active")
        .reduce((sum, s) => sum + s.plans.price, 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assinaturas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as assinaturas ativas e canceladas
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita Recorrente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {stats.revenue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lista de Assinaturas</CardTitle>
              <CardDescription>Visualize e gerencie todas as assinaturas</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                {syncMutation.isPending ? "Sincronizando..." : "Sincronizar MP"}
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, email ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Término</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhuma assinatura encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions?.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.customers.name}</div>
                            <div className="text-sm text-gray-500">
                              {subscription.customers.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{subscription.plans.name}</TableCell>
                        <TableCell>
                          R${" "}
                          {subscription.plans.price.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.billing_period}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(subscription.start_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {new Date(subscription.end_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Assinaturas;
