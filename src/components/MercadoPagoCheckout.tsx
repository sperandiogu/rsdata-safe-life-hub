import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import type { ICardPaymentBrickPayer } from "@mercadopago/sdk-react/bricks/cardPayment/type";
import { useEffect, useState } from "react";
import { MERCADOPAGO_PUBLIC_KEY } from "@/lib/mercadopago";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MercadoPagoCheckoutProps {
  preferenceId: string;
  amount: number;
  planName: string;
  planType: string;
  customerEmail: string;
  customerDocument: string;
  customerName: string;
  externalReference: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

interface CardPaymentFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: ICardPaymentBrickPayer;
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
  onReady,
  onError,
}: MercadoPagoCheckoutProps) {
  const [isInitialized, setIsInitialized] = useState(false);
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

  const initialization = {
    amount: amount,
    payer: {
      email: customerEmail,
    },
  };

  const customization = {
    visual: {
      style: {
        theme: "default",
      },
    },
    paymentMethods: {
      maxInstallments: 12,
    },
  };

  const onSubmit = async (formData: CardPaymentFormData) => {
    console.log("Payment form submitted:", formData);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const cleanDocument = customerDocument.replace(/\D/g, "");

      const paymentPayload = {
        token: formData.token,
        issuerId: formData.issuer_id || "",
        paymentMethodId: formData.payment_method_id,
        transactionAmount: Number(formData.transaction_amount),
        installments: Number(formData.installments),
        description: `RSData - Plano ${planName} (${planType})`,
        payer: {
          email: customerEmail,
          identification: {
            type: cleanDocument.length === 14 ? "CNPJ" : "CPF",
            number: cleanDocument,
          },
        },
        externalReference: externalReference,
      };

      console.log("Sending payment payload:", paymentPayload);

      const paymentResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-card-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(paymentPayload),
        }
      );

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok) {
        console.error("Payment error response:", paymentResult);
        const errorMessage = paymentResult.message || paymentResult.error || "Erro ao processar pagamento";
        const errorDetails = paymentResult.details ? JSON.stringify(paymentResult.details) : "";
        throw new Error(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`);
      }

      await fetch(`${supabaseUrl}/rest/v1/payments?external_reference=eq.${externalReference}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          mp_payment_id: paymentResult.id,
          status: paymentResult.status,
          updated_at: new Date().toISOString(),
        })
      });

      navigate(`/pagamento-confirmado?status=${paymentResult.status}&external_reference=${externalReference}`);

      return paymentResult;
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  };

  const onErrorCallback = (error: unknown) => {
    console.error("MercadoPago CardPayment error:", error);
    onError?.(new Error(String(error)));
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
    <div className="mercadopago-checkout-container">
      <CardPayment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onErrorCallback}
      />
    </div>
  );
}
