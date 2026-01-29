const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  const documentType = cleanDocument.length === 14 ? 'PJ' : 'PF';

  try {
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/customers?document=eq.${cleanDocument}&select=id`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        }
      }
    );

    const existingCustomers = await checkResponse.json();

    if (existingCustomers && existingCustomers.length > 0) {
      return existingCustomers[0].id;
    }

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
        email: customerData.email.toLowerCase(),
        phone: customerData.phone,
      })
    });

    if (!createResponse.ok) {
      throw new Error("Failed to create customer");
    }

    const newCustomer = await createResponse.json();
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
