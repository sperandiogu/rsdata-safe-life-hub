import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
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
    preferenceId: preferenceId,
    payer: {
      email: customerEmail,
    },
  };

  const customization = {
    paymentMethods: {
      creditCard: "all",
      debitCard: "all",
      ticket: "all",
      bankTransfer: "all",
      atm: "all",
      mercadoPago: ["wallet_purchase"],
    },
    visual: {
      style: {
        theme: "default" as const,
      },
    },
  };

  const onSubmit = async () => {
    console.log("Payment submitted");
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
    <div className="mercadopago-checkout-container">
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
