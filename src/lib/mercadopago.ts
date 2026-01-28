export const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || "";

export interface PaymentPreferenceRequest {
  plan: {
    name: string;
    type: string;
    price: number;
    planId: string;
  };
  customer: {
    email: string;
    name: string;
    document: string;
    phone: string;
    address: {
      cep: string;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
    };
  };
  externalReference?: string;
}

export interface PaymentPreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export async function createPaymentPreference(
  data: PaymentPreferenceRequest
): Promise<PaymentPreferenceResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-preference`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create payment preference");
  }

  return response.json();
}

export function generateExternalReference(planId: string): string {
  return `rsdata_${planId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CardPaymentRequest {
  formData: {
    token: string;
    issuer_id: string;
    payment_method_id: string;
    transaction_amount: number;
    installments: number;
    payer: {
      email: string;
      identification: {
        type: string;
        number: string;
      };
    };
  };
  externalReference: string;
  planName: string;
  planType: string;
}

export interface CardPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
}

export async function processCardPayment(
  data: CardPaymentRequest
): Promise<CardPaymentResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/process-card-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to process payment");
  }

  return response.json();
}
