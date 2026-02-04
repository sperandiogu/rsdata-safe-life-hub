import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface CustomerDetailsDialogProps {
  customerId: string;
  open: boolean;
  onClose: () => void;
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  created_at: string;
  addresses: {
    id: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  }[];
  subscriptions: {
    id: string;
    status: string;
    billing_period: string;
    started_at: string;
    expires_at: string;
    mp_subscription_id: string | null;
    created_at: string;
    plans: {
      name: string;
      monthly_price: number;
      annual_price: number;
      description: string | null;
    };
  }[];
  payments: {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    installments: number;
    mp_payment_id: string;
    paid_at: string | null;
    created_at: string;
  }[];
  email_logs: {
    id: string;
    recipient_email: string;
    email_type: string;
    status: string;
    sent_at: string;
    error_message: string | null;
  }[];
}

const CustomerDetailsDialog = ({ customerId, open, onClose }: CustomerDetailsDialogProps) => {
  const { data: customer, isLoading, error: queryError } = useQuery({
    queryKey: ["customer-details", customerId],
    queryFn: async (): Promise<CustomerDetails | null> => {
      console.log("Fetching customer details for:", customerId);

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
            id,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            cep
          ),
          subscriptions (
            id,
            status,
            billing_period,
            started_at,
            expires_at,
            mp_subscription_id,
            created_at,
            plans (
              name,
              monthly_price,
              annual_price,
              description
            )
          ),
          payments (
            id,
            amount,
            status,
            payment_method,
            installments,
            mp_payment_id,
            paid_at,
            created_at
          )
        `)
        .eq("id", customerId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching customer:", error);
        throw error;
      }

      if (!data) {
        console.log("No customer found with ID:", customerId);
        return null;
      }

      console.log("Customer data fetched:", data);

      let emailLogs: any[] = [];

      if (data.payments?.length > 0 || data.subscriptions?.length > 0) {
        const conditions = [];
        if (data.payments && data.payments.length > 0) {
          conditions.push(`payment_id.in.(${data.payments.map((p: any) => p.id).join(",")})`);
        }
        if (data.subscriptions && data.subscriptions.length > 0) {
          conditions.push(`subscription_id.in.(${data.subscriptions.map((s: any) => s.id).join(",")})`);
        }

        if (conditions.length > 0) {
          const { data: logs } = await supabase
            .from("email_logs")
            .select("*")
            .or(conditions.join(","))
            .order("sent_at", { ascending: false });

          emailLogs = logs || [];
        }
      }

      return {
        ...data,
        addresses: data.addresses || [],
        subscriptions: data.subscriptions || [],
        payments: data.payments || [],
        email_logs: emailLogs,
      };
    },
    enabled: open && !!customerId,
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: any }> = {
      active: { variant: "default", label: "Ativa", icon: CheckCircle },
      approved: { variant: "default", label: "Aprovado", icon: CheckCircle },
      cancelled: { variant: "destructive", label: "Cancelada", icon: XCircle },
      pending: { variant: "secondary", label: "Pendente", icon: Clock },
      paused: { variant: "outline", label: "Pausada", icon: Clock },
      sent: { variant: "default", label: "Enviado", icon: CheckCircle },
      failed: { variant: "destructive", label: "Falhou", icon: XCircle },
    };

    const config = variants[status] || { variant: "outline" as const, label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações do cliente
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : queryError ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">
              <XCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="font-semibold">Erro ao carregar dados</p>
            </div>
            <p className="text-sm text-gray-500">{(queryError as Error).message}</p>
          </div>
        ) : customer ? (
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nome Completo</p>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CPF/CNPJ</p>
                      <p className="font-medium">{customer.document}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {customer.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {customer.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Data de Cadastro</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(customer.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID do Cliente</p>
                      <p className="font-mono text-xs bg-gray-100 p-2 rounded">{customer.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {customer.addresses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereços
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customer.addresses.map((address) => (
                      <div key={address.id} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.neighborhood} - {address.city}/{address.state}
                        </p>
                        <p className="text-sm text-gray-600">CEP: {address.cep}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="subscriptions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
                  <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                  <TabsTrigger value="emails">Emails</TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Histórico de Assinaturas ({customer.subscriptions.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {customer.subscriptions.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Nenhuma assinatura encontrada</p>
                      ) : (
                        customer.subscriptions.map((subscription) => (
                          <div key={subscription.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-lg">{subscription.plans.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {subscription.billing_period === "mensal" ? "Mensal" : "Anual"}
                                </p>
                              </div>
                              {getStatusBadge(subscription.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Valor</p>
                                <p className="font-medium flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(
                                    subscription.billing_period === "mensal"
                                      ? subscription.plans.monthly_price
                                      : subscription.plans.annual_price
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Início</p>
                                <p className="font-medium">{formatDate(subscription.started_at)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Término</p>
                                <p className="font-medium">{formatDate(subscription.expires_at)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Criada em</p>
                                <p className="font-medium">{formatDate(subscription.created_at)}</p>
                              </div>
                            </div>

                            {subscription.mp_subscription_id && (
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500">ID Mercado Pago</p>
                                <p className="font-mono text-xs">{subscription.mp_subscription_id}</p>
                              </div>
                            )}

                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-500">ID da Assinatura</p>
                              <p className="font-mono text-xs">{subscription.id}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Histórico de Pagamentos ({customer.payments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {customer.payments.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Nenhum pagamento encontrado</p>
                      ) : (
                        customer.payments.map((payment) => (
                          <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-xl">{formatCurrency(payment.amount)}</h4>
                                <p className="text-sm text-gray-600">
                                  {payment.payment_method} - {payment.installments}x
                                </p>
                              </div>
                              {getStatusBadge(payment.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Data de Criação</p>
                                <p className="font-medium">{formatDateTime(payment.created_at)}</p>
                              </div>
                              {payment.paid_at && (
                                <div>
                                  <p className="text-gray-500">Data de Aprovação</p>
                                  <p className="font-medium">{formatDateTime(payment.paid_at)}</p>
                                </div>
                              )}
                            </div>

                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-500">ID Mercado Pago</p>
                              <p className="font-mono text-xs">{payment.mp_payment_id}</p>
                            </div>

                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-500">ID do Pagamento</p>
                              <p className="font-mono text-xs">{payment.id}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="emails" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Log de Emails ({customer.email_logs.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {customer.email_logs.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Nenhum email encontrado</p>
                      ) : (
                        customer.email_logs.map((log) => (
                          <div key={log.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{log.recipient_email}</p>
                                <p className="text-sm text-gray-600">
                                  Tipo: {log.email_type.replace("_", " ")}
                                </p>
                              </div>
                              {getStatusBadge(log.status)}
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">Enviado em</p>
                              <p className="text-sm">{formatDateTime(log.sent_at)}</p>
                            </div>

                            {log.error_message && (
                              <div className="bg-red-50 p-2 rounded">
                                <p className="text-xs text-red-600">Erro: {log.error_message}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Cliente não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsDialog;
