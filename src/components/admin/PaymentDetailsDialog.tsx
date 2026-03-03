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

interface PaymentDetailsDialogProps {
  paymentId: string;
  open: boolean;
  onClose: () => void;
}

interface PaymentDetails {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  installments: number;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  external_reference: string | null;
  paid_at: string | null;
  created_at: string;
  customers: {
    name: string;
    email: string;
    phone: string;
    document: string;
  } | null;
  subscriptions: {
    id: string;
    status: string;
    billing_period: string;
    started_at: string | null;
    expires_at: string | null;
    plans: {
      name: string;
    };
  } | null;
}

const PaymentDetailsDialog = ({ paymentId, open, onClose }: PaymentDetailsDialogProps) => {
  const { data: payment, isLoading, error: queryError } = useQuery({
    queryKey: ["payment-details", paymentId],
    queryFn: async (): Promise<PaymentDetails | null> => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          status,
          payment_method,
          installments,
          mp_payment_id,
          mp_preference_id,
          external_reference,
          paid_at,
          created_at,
          customers (
            name,
            email,
            phone,
            document
          ),
          subscriptions (
            id,
            status,
            billing_period,
            started_at,
            expires_at,
            plans (
              name
            )
          )
        `)
        .eq("id", paymentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open && !!paymentId,
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
      approved:  { variant: "default",     label: "Aprovado",    icon: CheckCircle },
      active:    { variant: "default",     label: "Ativa",       icon: CheckCircle },
      pending:   { variant: "secondary",   label: "Pendente",    icon: Clock },
      rejected:  { variant: "destructive", label: "Rejeitado",   icon: XCircle },
      cancelled: { variant: "destructive", label: "Cancelado",   icon: XCircle },
      refunded:  { variant: "outline",     label: "Reembolsado", icon: XCircle },
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
            <CreditCard className="h-5 w-5" />
            Detalhes do Pagamento
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações do pagamento
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
        ) : payment ? (
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">

              {/* Payment info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Valor</p>
                      <p className="font-semibold text-xl flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Método</p>
                      <p className="font-medium flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {payment.payment_method || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Parcelas</p>
                      <p className="font-medium">{payment.installments}x</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Criado em</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(payment.created_at)}
                      </p>
                    </div>
                    {payment.paid_at && (
                      <div>
                        <p className="text-sm text-gray-500">Aprovado em</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(payment.paid_at)}
                        </p>
                      </div>
                    )}
                  </div>
                  {payment.mp_payment_id && (
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">ID Mercado Pago</p>
                      <p className="font-mono text-xs">{payment.mp_payment_id}</p>
                    </div>
                  )}
                  {payment.mp_preference_id && (
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Preference ID (MP)</p>
                      <p className="font-mono text-xs">{payment.mp_preference_id}</p>
                    </div>
                  )}
                  {payment.external_reference && (
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Referência Externa</p>
                      <p className="font-mono text-xs">{payment.external_reference}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">ID do Pagamento</p>
                    <p className="font-mono text-xs">{payment.id}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer info */}
              {payment.customers && (
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
                        <p className="font-medium">{payment.customers.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{payment.customers.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{payment.customers.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">CPF/CNPJ</p>
                        <p className="font-medium font-mono text-sm">{payment.customers.document}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subscription info */}
              {payment.subscriptions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Assinatura Vinculada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Plano</p>
                        <p className="font-medium">{payment.subscriptions.plans?.name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        {getStatusBadge(payment.subscriptions.status)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Período</p>
                        <p className="font-medium capitalize">{payment.subscriptions.billing_period}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Início</p>
                        <p className="font-medium">{formatDate(payment.subscriptions.started_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Término</p>
                        <p className="font-medium">{formatDate(payment.subscriptions.expires_at)}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">ID da Assinatura</p>
                      <p className="font-mono text-xs">{payment.subscriptions.id}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Pagamento não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsDialog;
