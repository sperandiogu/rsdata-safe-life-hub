import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerDetailsDialog from "./CustomerDetailsDialog";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  created_at: string;
  addresses?: {
    street: string;
    number: string;
    city: string;
    state: string;
  }[];
  subscriptions?: {
    id: string;
    status: string;
    started_at: string;
    expires_at: string;
    plans: {
      name: string;
    };
  }[];
}

interface CustomerListProps {
  onSelectCustomer?: (customerId: string) => void;
}

const CustomerList = ({ onSelectCustomer }: CustomerListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
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
          addresses (
            street,
            number,
            city,
            state
          ),
          subscriptions (
            id,
            status,
            started_at,
            expires_at,
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

  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.document.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      active: { variant: "default", label: "Ativa" },
      cancelled: { variant: "destructive", label: "Cancelada" },
      pending: { variant: "secondary", label: "Pendente" },
      paused: { variant: "outline", label: "Pausada" },
    };

    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetails = (customerId: string) => {
    setSelectedCustomerId(customerId);
    onSelectCustomer?.(customerId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full mb-4" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Gerencie e visualize todos os clientes cadastrados ({filteredCustomers?.length || 0} clientes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredCustomers?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhum cliente encontrado</p>
              </div>
            ) : (
              filteredCustomers?.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-500">CPF/CNPJ: {customer.document}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.addresses?.[0] && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {customer.addresses[0].city} - {customer.addresses[0].state}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Cadastrado em {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        {customer.subscriptions && customer.subscriptions.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">Assinaturas:</span>
                            {customer.subscriptions.map((sub) => (
                              <div key={sub.id} className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{sub.plans.name}</span>
                                {getStatusBadge(sub.status)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(customer.id)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCustomerId && (
        <CustomerDetailsDialog
          customerId={selectedCustomerId}
          open={!!selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </>
  );
};

export default CustomerList;
