import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";
import { MERCADOPAGO_PUBLIC_KEY } from "@/lib/mercadopago";
import { Loader2 } from "lucide-react";

interface MercadoPagoCheckoutProps {
  preferenceId: string;
  amount: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onSubmit?: (formData: unknown) => void;
}

export function MercadoPagoCheckout({
  preferenceId,
  amount,
  onReady,
  onError,
  onSubmit
}: MercadoPagoCheckoutProps) {
  const [isInitialized, setIsInitialized] = useState(false);

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

  const handlePaymentSubmit = async (formData: { formData: unknown }) => {
    console.log("Payment form submitted:", formData);
    onSubmit?.(formData);
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
      <Payment
        initialization={{
          amount: amount,
          preferenceId: preferenceId,
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
            atm: "all",
            mercadoPago: "all",
          },
          visual: {
            style: {
              theme: "default",
            },
          },
        }}
        onSubmit={handlePaymentSubmit}
        onReady={onReady}
        onError={(error) => {
          console.error("MercadoPago Payment error:", error);
          onError?.(new Error(String(error)));
        }}
      />
    </div>
  );
}
