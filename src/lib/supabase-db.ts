import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CustomerData {
  name: string;
  document: string;
  email: string;
  phone: string;
}

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

interface PaymentData {
  externalReference: string;
  mpPreferenceId: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
}

export async function findOrCreateCustomer(customerData: CustomerData): Promise<string> {
  const cleanDocument = customerData.document.replace(/\D/g, '');
  const cleanEmail = customerData.email.toLowerCase().trim();
  const documentType = cleanDocument.length === 14 ? 'PJ' : 'PF';

  try {
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/customers?or=(document.eq.${cleanDocument},email.eq.${cleanEmail})&select=id,document,email`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        }
      }
    );

    const existingCustomers = await checkResponse.json();

    if (existingCustomers && existingCustomers.length > 0) {
      console.log("✅ Customer já existe:", {
        id: existingCustomers[0].id,
        document: existingCustomers[0].document,
        email: existingCustomers[0].email
      });
      return existingCustomers[0].id;
    }

    console.log("🆕 Criando novo customer...");
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        name: customerData.name,
        document: cleanDocument,
        document_type: documentType,
        email: cleanEmail,
        phone: customerData.phone,
      })
    });

    if (!createResponse.ok) {
      if (createResponse.status === 409) {
        console.log("⚠️ Erro 409 ao criar customer, buscando por documento ou email...");
        const retryCheckResponse = await fetch(
          `${supabaseUrl}/rest/v1/customers?or=(document.eq.${cleanDocument},email.eq.${cleanEmail})&select=id,document,email`,
          {
            headers: {
              "Authorization": `Bearer ${supabaseAnonKey}`,
              "apikey": supabaseAnonKey,
            }
          }
        );

        const retryCustomers = await retryCheckResponse.json();

        if (retryCustomers && retryCustomers.length > 0) {
          console.log("✅ Customer encontrado na segunda tentativa:", {
            id: retryCustomers[0].id,
            document: retryCustomers[0].document,
            email: retryCustomers[0].email
          });
          return retryCustomers[0].id;
        }
      }

      const errorText = await createResponse.text();
      console.error("❌ Erro ao criar customer:", createResponse.status, errorText);
      throw new Error(`Failed to create customer: ${createResponse.status} ${errorText}`);
    }

    const newCustomer = await createResponse.json();
    console.log("✅ Novo customer criado:", newCustomer[0].id);
    return newCustomer[0].id;
  } catch (error) {
    console.error("Error finding or creating customer:", error);
    throw error;
  }
}

export async function createOrUpdateAddress(customerId: string, addressData: AddressData): Promise<string> {
  try {
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/addresses?customer_id=eq.${customerId}&is_default=eq.true&select=id`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        }
      }
    );

    const existingAddresses = await checkResponse.json();

    if (existingAddresses && existingAddresses.length > 0) {
      const addressId = existingAddresses[0].id;

      await fetch(`${supabaseUrl}/rest/v1/addresses?id=eq.${addressId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          cep: addressData.cep,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement || null,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state.toUpperCase(),
        })
      });

      return addressId;
    }

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        customer_id: customerId,
        cep: addressData.cep,
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement || null,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state.toUpperCase(),
        is_default: true,
      })
    });

    if (!createResponse.ok) {
      throw new Error("Failed to create address");
    }

    const newAddress = await createResponse.json();
    return newAddress[0].id;
  } catch (error) {
    console.error("Error creating or updating address:", error);
    throw error;
  }
}

export async function getPlanByPlanId(planId: string): Promise<string> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/plans?plan_id=eq.${planId}&select=id`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        }
      }
    );

    const plans = await response.json();

    if (!plans || plans.length === 0) {
      throw new Error(`Plan with id ${planId} not found`);
    }

    return plans[0].id;
  } catch (error) {
    console.error("Error getting plan:", error);
    throw error;
  }
}

export async function createSubscription(
  customerId: string,
  planId: string,
  billingPeriod: 'mensal' | 'anual'
): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        customer_id: customerId,
        plan_id: planId,
        billing_period: billingPeriod,
        status: 'pending',
      })
    });

    if (!response.ok) {
      throw new Error("Failed to create subscription");
    }

    const subscription = await response.json();
    return subscription[0].id;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

export async function createPayment(paymentData: PaymentData): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        external_reference: paymentData.externalReference,
        mp_preference_id: paymentData.mpPreferenceId,
        customer_id: paymentData.customerId,
        subscription_id: paymentData.subscriptionId,
        status: "pending",
        amount: paymentData.amount,
      })
    });

    if (!response.ok) {
      throw new Error("Failed to create payment");
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
}
