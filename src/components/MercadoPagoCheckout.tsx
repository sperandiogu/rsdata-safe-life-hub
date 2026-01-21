import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";
import { MERCADOPAGO_PUBLIC_KEY } from "@/lib/mercadopago";
import { Loader2 } from "lucide-react";

interface MercadoPagoCheckoutProps {
  preferenceId: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export function MercadoPagoCheckout({ preferenceId, onReady, onError }: MercadoPagoCheckoutProps) {
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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#084D6C]" />
        <span className="ml-2 text-[#575756]">Carregando opções de pagamento...</span>
      </div>
    );
  }

  return (
    <div className="mercadopago-checkout-container">
      <Wallet
        initialization={{ preferenceId }}
        customization={{
          texts: {
            action: "pay",
            valueProp: "smart_option",
          },
          visual: {
            buttonBackground: "default",
            borderRadius: "8px",
          },
        }}
        onReady={onReady}
        onError={(error) => {
          console.error("MercadoPago Wallet error:", error);
          onError?.(new Error(String(error)));
        }}
      />
    </div>
  );
}
