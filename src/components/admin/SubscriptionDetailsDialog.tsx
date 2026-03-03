import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  FileText,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface SubscriptionDetailsDialogProps {
  subscriptionId: string;
  open: boolean;
  onClose: () => void;
}

interface SubscriptionDetails {
  id: string;
  status: string;
  billing_period: string;
  started_at: string | null;
  expires_at: string | null;
  mp_subscription_id: string | null;
  created_at: string;
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    document: string;
  };
  plans: {
    name: string;
    monthly_price: number;
    annual_price: number;
    description: string | null;
  };
  payments: {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    installments: number;
    mp_payment_id: string | null;
    paid_at: string | null;
    created_at: string;
  }[];
}

const SubscriptionDetailsDialog = ({ subscriptionId, open, onClose }: SubscriptionDetailsDialogProps) => {
  const { data: subscription, isLoading, error: queryError } = useQuery({
    queryKey: ["subscription-details", subscriptionId],
    queryFn: async (): Promise<SubscriptionDetails | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          billing_period,
          started_at,
          expires_at,
          mp_subscription_id,
          created_at,
          customers (
            id,
            name,
            email,
            phone,
            document
          ),
          plans (
            name,
            monthly_price,
            annual_price,
            description
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
        .eq("id", subscriptionId)
        .maybeSingle();

      if (error) throw error;
      return data
        ? { ...data, payments: data.payments || [] }
        : null;
    },
    enabled: open && !!subscriptionId,
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
      active:    { variant: "default",     label: "Ativa",     icon: CheckCircle },
      approved:  { variant: "default",     label: "Aprovado",  icon: CheckCircle },
      cancelled: { variant: "destructive", label: "Cancelada", icon: XCircle },
      pending:   { variant: "secondary",   label: "Pendente",  icon: Clock },
      paused:    { variant: "outline",     label: "Pausada",   icon: Clock },
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

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Assinatura
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações da assinatura
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : queryError ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto mb-2 text-red-600" />
            <p className="font-semibold text-red-600">Erro ao carregar dados</p>
            <p className="text-sm text-gray-500">{(queryError as Error).message}</p>
          </div>
        ) : subscription ? (
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">

              {/* Subscription info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Assinatura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Plano</p>
                      <p className="font-medium">{subscription.plans.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      {getStatusBadge(subscription.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Período</p>
                      <p className="font-medium capitalize">{subscription.billing_period}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valor</p>
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
                      <p className="text-sm text-gray-500">Início</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(subscription.started_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Término</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(subscription.expires_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Criada em</p>
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
                </CardContent>
              </Card>

              {/* Customer info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium">{subscription.customers.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{subscription.customers.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium">{subscription.customers.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CPF/CNPJ</p>
                      <p className="font-medium font-mono text-sm">{subscription.customers.document}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment history */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagamentos ({subscription.payments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.payments.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhum pagamento encontrado</p>
                  ) : (
                    subscription.payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-xl">{formatCurrency(payment.amount)}</h4>
                            <p className="text-sm text-gray-600">
                              {payment.payment_method || "N/A"} — {payment.installments}x
                            </p>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Criado em</p>
                            <p className="font-medium">{formatDateTime(payment.created_at)}</p>
                          </div>
                          {payment.paid_at && (
                            <div>
                              <p className="text-gray-500">Aprovado em</p>
                              <p className="font-medium">{formatDateTime(payment.paid_at)}</p>
                            </div>
                          )}
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">ID Mercado Pago</p>
                          <p className="font-mono text-xs">{payment.mp_payment_id || "Pendente"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Assinatura não encontrada</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDetailsDialog;
