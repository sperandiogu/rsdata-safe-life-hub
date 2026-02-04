import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Download, Eye, Filter, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerDetailsDialog from "@/components/admin/CustomerDetailsDialog";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  created_at: string;
  subscriptions?: {
    id: string;
    status: string;
    plans: {
      name: string;
    };
  }[];
}

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          name,
          email,
          phone,
          document,
          created_at,
          subscriptions (
            id,
            status,
            plans (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.document.includes(searchTerm);

    const hasActiveSubscription = customer.subscriptions?.some((sub) => sub.status === "active");
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && hasActiveSubscription) ||
      (statusFilter === "inactive" && !hasActiveSubscription);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (customer: Customer) => {
    const hasActive = customer.subscriptions?.some((sub) => sub.status === "active");
    if (hasActive) {
      return <Badge variant="default">Ativo</Badge>;
    }
    return <Badge variant="secondary">Inativo</Badge>;
  };

  const exportToCSV = () => {
    if (!filteredCustomers) return;

    const headers = ["Nome", "Email", "Telefone", "CPF/CNPJ", "Status", "Data de Cadastro"];
    const rows = filteredCustomers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone,
      customer.document,
      customer.subscriptions?.some((sub) => sub.status === "active") ? "Ativo" : "Inativo",
      new Date(customer.created_at).toLocaleDateString("pt-BR"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os seus clientes cadastrados ({filteredCustomers?.length || 0} total)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Visualize e gerencie todos os clientes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
                placeholder="Buscar por nome, email ou CPF/CNPJ..."
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
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="font-mono text-sm">{customer.document}</TableCell>
                        <TableCell>{getStatusBadge(customer)}</TableCell>
                        <TableCell>
                          {customer.subscriptions && customer.subscriptions.length > 0 ? (
                            <span className="text-sm text-gray-600">
                              {customer.subscriptions[0].plans.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Sem assinatura</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomerId(customer.id)}
                          >
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

      {selectedCustomerId && (
        <CustomerDetailsDialog
          customerId={selectedCustomerId}
          open={!!selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
};

export default Clientes;
