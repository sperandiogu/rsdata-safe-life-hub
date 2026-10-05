import { initMercadoPago, Payment, CardPayment } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";
import { MERCADOPAGO_PUBLIC_KEY, processCardPayment } from "@/lib/mercadopago";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { IPaymentBrickCustomization, IPaymentFormData } from "@mercadopago/sdk-react/esm/bricks/payment/type";
import type { ICardPaymentFormData, ICardPaymentBrickPayer } from "@mercadopago/sdk-react/esm/bricks/cardPayment/type";
import type { IBrickError } from "@mercadopago/sdk-react/esm/bricks/util/types/common";

interface MercadoPagoCheckoutProps {
  preferenceId: string;
  amount: number;
  planName: string;
  planType: string;
  customerEmail: string;
  customerDocument: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  externalReference: string;
  subscriptionId?: string;
  isSubscription?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_high_risk: "Pagamento recusado pela análise de segurança do Mercado Pago. Tente com outro cartão.",
  cc_rejected_insufficient_amount: "Cartão sem limite suficiente. Tente com outro cartão.",
  cc_rejected_call_for_authorize: "Seu banco precisa autorizar este pagamento. Ligue para o banco e tente novamente.",
  cc_rejected_bad_filled_security_code: "Código de segurança do cartão inválido.",
  cc_rejected_bad_filled_date: "Data de validade do cartão inválida.",
  cc_rejected_duplicated_payment: "Você já fez um pagamento com esse valor. Verifique seu e-mail antes de tentar de novo.",
};

export function MercadoPagoCheckout({
  preferenceId,
  amount,
  planName,
  planType,
  customerEmail,
  customerDocument,
  customerName,
  externalReference,
  subscriptionId,
  isSubscription = false,
  customerPhone,
  customerAddress,
  onReady,
  onError,
}: MercadoPagoCheckoutProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (MERCADOPAGO_PUBLIC_KEY) {
      try {
        initMercadoPago(MERCADOPAGO_PUBLIC_KEY, {
          locale: "pt-BR",
        });
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing MercadoPago:", error);
        onError?.(error as Error);
      }
    } else {
      console.error("MercadoPago public key not configured");
      onError?.(new Error("MercadoPago public key not configured"));
    }
  }, [onError]);

  const onSubmitSubscription = async (formData: ICardPaymentFormData<ICardPaymentBrickPayer>) => {
    setIsProcessing(true);
    try {
      const subscriptionData = {
        cardToken: formData.token,
        email: customerEmail,
        amount: amount,
        planName: planName,
        externalReference: externalReference,
        subscriptionId: subscriptionId,
        paymentMethodId: formData.payment_method_id,
        installments: formData.installments,
        issuerId: formData.issuer_id,
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-authorized-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Subscription rejected:", errorData);
        throw new Error("Não foi possível autorizar o cartão. Confira os dados ou tente com outro cartão.");
      }

      const result = await response.json();
      navigate(`/pagamento-confirmado?status=approved&external_reference=${externalReference}&subscription_id=${result.subscriptionId}`);
    } catch (error) {
      console.error("Error processing subscription:", error);
      setIsProcessing(false);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const onSubmitPayment = async ({ formData }: IPaymentFormData) => {
    setIsProcessing(true);
    try {
      const cleanDocument = customerDocument.replace(/\D/g, "");
      const isCompany = cleanDocument.length === 14;
      // The brick collects the cardholder's document; MP's anti-fraud matches it against the card
      const brickDocument = formData.payer?.identification;

      const paymentData = {
        formData: {
          token: formData.token,
          issuer_id: String(formData.issuer_id || ""),
          payment_method_id: formData.payment_method_id,
          transaction_amount: amount,
          installments: Number(formData.installments) || 1,
          payer: {
            email: customerEmail,
            first_name: customerName.split(" ")[0],
            last_name: customerName.split(" ").slice(1).join(" ") || customerName,
            identification: brickDocument?.number ? brickDocument : {
              type: isCompany ? "CNPJ" : "CPF",
              number: cleanDocument,
            },
            phone: customerPhone ? {
              area_code: customerPhone.replace(/\D/g, "").substring(0, 2),
              number: customerPhone.replace(/\D/g, "").substring(2),
            } : undefined,
            address: customerAddress ? {
              zip_code: customerAddress.cep.replace(/\D/g, ""),
              street_name: customerAddress.street,
              street_number: customerAddress.number,
              neighborhood: customerAddress.neighborhood,
              city: customerAddress.city,
              federal_unit: customerAddress.state,
            } : undefined,
          },
        },
        externalReference,
        planName,
        planType,
        customerName,
        customerPhone,
        customerAddress,
      };

      const result = await processCardPayment(paymentData);

      if (result.status === "approved") {
        navigate(`/pagamento-confirmado?status=approved&external_reference=${externalReference}&payment_id=${result.id}`);
      } else if (result.status === "pending" || result.status === "in_process") {
        navigate(`/pagamento-confirmado?status=pending&external_reference=${externalReference}&payment_id=${result.id}`);
      } else {
        setIsProcessing(false);
        onError?.(new Error(
          REJECTION_MESSAGES[result.status_detail] ?? `Pagamento recusado (${result.status_detail}). Tente com outro cartão.`
        ));
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setIsProcessing(false);
      onError?.(new Error("Não foi possível processar o pagamento. Tente novamente ou use outro cartão."));
    }
  };

  const onErrorCallback = (error: IBrickError) => {
    // non_critical errors fire during normal card entry and the brick shows them inline
    if (error.type !== "critical") {
      console.warn("MercadoPago Brick warning:", error);
      return;
    }
    console.error("MercadoPago Brick error:", error);
    onError?.(new Error("Erro ao carregar opções de pagamento. Recarregue a página e tente novamente."));
  };

  const paymentCustomization: IPaymentBrickCustomization = {
    paymentMethods: {
      creditCard: "all",
      debitCard: "all",
      ticket: [],
      bankTransfer: [],
      atm: [],
      mercadoPago: [],
    },
    visual: {
      style: { theme: "default" },
      hidePaymentButton: false,
      hideFormTitle: false,
    },
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#084D6C]" />
        <span className="ml-2 text-[#575756]">Carregando opcoes de pagamento...</span>
      </div>
    );
  }

  return (
    <div className="mercadopago-checkout-container relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#084D6C]" />
            <span className="text-[#575756] font-medium">Processando pagamento...</span>
          </div>
        </div>
      )}

      {isSubscription ? (
        <CardPayment
          initialization={{
            amount: amount,
            payer: {
              email: customerEmail,
            },
          }}
          customization={{
            visual: {
              style: { theme: "default" },
              hideFormTitle: false,
            },
          }}
          onSubmit={onSubmitSubscription}
          onReady={() => {
            console.log("MercadoPago CardPayment ready");
            onReady?.();
          }}
          onError={onErrorCallback}
        />
      ) : (
        <Payment
          initialization={
            preferenceId && preferenceId.trim() !== ""
              ? { amount, preferenceId, payer: { email: customerEmail } }
              : { amount, payer: { email: customerEmail } }
          }
          customization={paymentCustomization}
          onSubmit={onSubmitPayment}
          onReady={() => {
            console.log("MercadoPago Payment ready");
            onReady?.();
          }}
          onError={onErrorCallback}
        />
      )}
    </div>
  );
}
