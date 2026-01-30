import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";
import { MERCADOPAGO_PUBLIC_KEY, processCardPayment } from "@/lib/mercadopago";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { IPaymentBrickCustomization } from "@mercadopago/sdk-react/bricks/payment/type";

interface MercadoPagoCheckoutProps {
  preferenceId: string;
  amount: number;
  planName: string;
  planType: string;
  customerEmail: string;
  customerDocument: string;
  customerName: string;
  externalReference: string;
  subscriptionId?: string;
  isSubscription?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

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

  const initialization = isSubscription ? {
    amount: amount,
    payer: {
      email: customerEmail,
    },
  } : {
    amount: amount,
    preferenceId: preferenceId,
    payer: {
      email: customerEmail,
    },
  };

  const customization: IPaymentBrickCustomization = {
    paymentMethods: {
      creditCard: "all",
      debitCard: "all",
      ticket: [],
      bankTransfer: [],
      atm: [],
    },
    visual: {
      style: {
        theme: "default",
      },
    },
  };

  const onSubmit = async (formData: { formData: Record<string, unknown> }) => {
    setIsProcessing(true);

    try {
      const cleanDocument = customerDocument.replace(/\D/g, "");
      const isCompany = cleanDocument.length === 14;

      if (isSubscription) {
        const subscriptionData = {
          cardToken: formData.formData.token as string,
          email: customerEmail,
          amount: amount,
          planName: planName,
          externalReference: externalReference,
          subscriptionId: subscriptionId,
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
          const error = await response.json();
          throw new Error(error.message || "Failed to create subscription");
        }

        const result = await response.json();

        navigate(`/pagamento-confirmado?status=approved&external_reference=${externalReference}&subscription_id=${result.subscriptionId}`);
      } else {
        const paymentData = {
          formData: {
            token: formData.formData.token as string,
            issuer_id: String(formData.formData.issuer_id || ""),
            payment_method_id: formData.formData.payment_method_id as string,
            transaction_amount: amount,
            installments: Number(formData.formData.installments) || 1,
            payer: {
              email: customerEmail,
              identification: {
                type: isCompany ? "CNPJ" : "CPF",
                number: cleanDocument,
              },
            },
          },
          externalReference,
          planName,
          planType,
        };

        const result = await processCardPayment(paymentData);

        if (result.status === "approved") {
          navigate(`/pagamento-confirmado?status=approved&external_reference=${externalReference}&payment_id=${result.id}`);
        } else if (result.status === "pending" || result.status === "in_process") {
          navigate(`/pagamento-confirmado?status=pending&external_reference=${externalReference}&payment_id=${result.id}`);
        } else {
          onError?.(new Error(`Pagamento ${result.status}: ${result.status_detail}`));
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const onErrorCallback = (error: unknown) => {
    console.error("MercadoPago Payment error:", error);
    onError?.(new Error(String(error)));
  };

  const onReadyCallback = () => {
    console.log("MercadoPago Payment ready");
    onReady?.();
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
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={onReadyCallback}
        onError={onErrorCallback}
      />
    </div>
  );
}
