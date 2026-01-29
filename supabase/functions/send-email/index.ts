import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  emailType: "customer_confirmation" | "internal_notification";
  paymentId?: string;
  subscriptionId?: string;
  metadata?: Record<string, unknown>;
}

interface CustomerEmailData {
  customerName: string;
  customerEmail: string;
  planName: string;
  planType: string;
  planPrice: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

interface InternalNotificationData {
  customerName: string;
  customerDocument: string;
  customerEmail: string;
  customerPhone: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressCep: string;
  planName: string;
  planType: string;
  planPrice: number;
  subscriptionId: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  paymentId: string;
  mercadoPagoPaymentId: string;
  paymentMethod: string;
  installments: number;
  approvalDate: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function generateCustomerEmailHtml(data: CustomerEmailData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado - RSData</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #084D6C; padding: 30px 40px; text-align: center;">
              <img src="https://cadastro.rsdata.com.br/rsdata-logo.png" alt="RSData" height="40" style="display: block; margin: 0 auto;">
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 70px; height: 70px; background-color: #22c55e; border-radius: 50%; display: inline-block; line-height: 70px;">
                <span style="color: white; font-size: 36px;">&#10003;</span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 10px; text-align: center;">
              <h1 style="margin: 0; color: #22c55e; font-size: 28px; font-weight: 600;">Pagamento Confirmado!</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Ola, <strong>${data.customerName}</strong>!<br>
                Recebemos seu pagamento com sucesso.
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 20px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 20px; color: #084D6C; font-size: 18px; font-weight: 600; border-bottom: 2px solid #084D6C; padding-bottom: 10px;">Detalhes da Assinatura</h2>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plano:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${data.planName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tipo:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${data.planType === "monthly" ? "Mensal" : "Anual"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valor:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatCurrency(data.planPrice)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Inicio:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatDate(data.subscriptionStartDate)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Validade:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatDate(data.subscriptionEndDate)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #eff6ff; border-left: 4px solid #084D6C; padding: 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #084D6C;">Proximos passos:</strong><br>
                  Entraremos em contato por e-mail em ate <strong>7 dias</strong> para enviar seu acesso ao sistema.
                </p>
              </div>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center;">
              <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">Precisa de ajuda?</p>
              <a href="https://wa.me/555137201416" style="display: inline-block; background-color: #25D366; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                Fale conosco pelo WhatsApp
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                RSData - Solucoes em Tecnologia
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Este e-mail foi enviado automaticamente. Por favor, nao responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateCustomerEmailText(data: CustomerEmailData): string {
  return `
PAGAMENTO CONFIRMADO - RSDATA

Ola, ${data.customerName}!

Recebemos seu pagamento com sucesso.

DETALHES DA ASSINATURA
----------------------
Plano: ${data.planName}
Tipo: ${data.planType === "monthly" ? "Mensal" : "Anual"}
Valor: ${formatCurrency(data.planPrice)}
Inicio: ${formatDate(data.subscriptionStartDate)}
Validade: ${formatDate(data.subscriptionEndDate)}

PROXIMOS PASSOS
---------------
Entraremos em contato por e-mail em ate 7 dias para enviar seu acesso ao sistema.

PRECISA DE AJUDA?
-----------------
Fale conosco pelo WhatsApp: https://wa.me/555137201416

--
RSData - Solucoes em Tecnologia
Este e-mail foi enviado automaticamente. Por favor, nao responda.
`;
}

function generateInternalNotificationHtml(data: InternalNotificationData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Assinatura - RSData</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #084D6C; padding: 25px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <img src="https://cadastro.rsdata.com.br/rsdata-logo.png" alt="RSData" height="35">
                  </td>
                  <td style="text-align: right;">
                    <span style="color: #22c55e; background-color: rgba(34, 197, 94, 0.2); padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">NOVA VENDA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <h1 style="margin: 0; color: #111827; font-size: 22px; font-weight: 600;">Nova Assinatura Realizada</h1>
              <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">${formatDate(data.approvalDate)} as ${new Date(data.approvalDate).toLocaleTimeString("pt-BR")}</p>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; color: #084D6C; font-size: 16px; font-weight: 600;">Dados do Cliente</h2>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 120px;">Nome:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">CPF/CNPJ:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.customerDocument}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">E-mail:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.customerEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Telefone:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.customerPhone}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Address -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; color: #084D6C; font-size: 16px; font-weight: 600;">Endereco</h2>
                    <p style="margin: 0; color: #111827; font-size: 13px; line-height: 1.6;">
                      ${data.addressStreet}, ${data.addressNumber}${data.addressComplement ? ` - ${data.addressComplement}` : ""}<br>
                      ${data.addressNeighborhood}<br>
                      ${data.addressCity} - ${data.addressState}<br>
                      CEP: ${data.addressCep}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Plan & Subscription -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; color: #084D6C; font-size: 16px; font-weight: 600;">Plano e Assinatura</h2>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 120px;">Plano:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.planName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Tipo:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.planType === "monthly" ? "Mensal" : "Anual"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Valor:</td>
                        <td style="padding: 6px 0; color: #22c55e; font-size: 13px; font-weight: 600;">${formatCurrency(data.planPrice)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">ID Assinatura:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 11px; font-family: monospace;">${data.subscriptionId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Inicio:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${formatDate(data.subscriptionStartDate)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Validade:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${formatDate(data.subscriptionEndDate)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Info -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #86efac;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; color: #166534; font-size: 16px; font-weight: 600;">Pagamento Aprovado</h2>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 120px;">ID Pagamento:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 11px; font-family: monospace;">${data.paymentId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">MP Payment ID:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.mercadoPagoPaymentId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Metodo:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Parcelas:</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 500;">${data.installments}x</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Notificacao interna - RSData
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateInternalNotificationText(data: InternalNotificationData): string {
  return `
NOVA ASSINATURA REALIZADA - RSDATA
==================================
Data: ${formatDate(data.approvalDate)} as ${new Date(data.approvalDate).toLocaleTimeString("pt-BR")}

DADOS DO CLIENTE
----------------
Nome: ${data.customerName}
CPF/CNPJ: ${data.customerDocument}
E-mail: ${data.customerEmail}
Telefone: ${data.customerPhone}

ENDERECO
--------
${data.addressStreet}, ${data.addressNumber}${data.addressComplement ? ` - ${data.addressComplement}` : ""}
${data.addressNeighborhood}
${data.addressCity} - ${data.addressState}
CEP: ${data.addressCep}

PLANO E ASSINATURA
------------------
Plano: ${data.planName}
Tipo: ${data.planType === "monthly" ? "Mensal" : "Anual"}
Valor: ${formatCurrency(data.planPrice)}
ID Assinatura: ${data.subscriptionId}
Inicio: ${formatDate(data.subscriptionStartDate)}
Validade: ${formatDate(data.subscriptionEndDate)}

PAGAMENTO APROVADO
------------------
ID Pagamento: ${data.paymentId}
MP Payment ID: ${data.mercadoPagoPaymentId}
Metodo: ${data.paymentMethod}
Parcelas: ${data.installments}x

--
Notificacao interna - RSData
`;
}

async function sendEmailWithPostmark(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  from: string = "noreply@rsdata.com.br"
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN");

  if (!postmarkToken) {
    return { success: false, error: "POSTMARK_SERVER_TOKEN not configured" };
  }

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken,
      },
      body: JSON.stringify({
        From: from,
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: "outbound",
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, messageId: result.MessageID };
    } else {
      return { success: false, error: result.Message || "Failed to send email" };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const { action } = payload;

    if (action === "send_customer_confirmation") {
      const { data, paymentId, subscriptionId } = payload as {
        action: string;
        data: CustomerEmailData;
        paymentId: string;
        subscriptionId: string;
      };

      const htmlBody = generateCustomerEmailHtml(data);
      const textBody = generateCustomerEmailText(data);
      const subject = "Pagamento Confirmado - RSData";

      const result = await sendEmailWithPostmark(data.customerEmail, subject, htmlBody, textBody);

      await supabase.from("email_logs").insert({
        recipient_email: data.customerEmail,
        email_type: "customer_confirmation",
        payment_id: paymentId,
        subscription_id: subscriptionId,
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
        metadata: { messageId: result.messageId, customerName: data.customerName },
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.success ? 200 : 500,
      });
    }

    if (action === "send_internal_notification") {
      const { data, paymentId, subscriptionId } = payload as {
        action: string;
        data: InternalNotificationData;
        paymentId: string;
        subscriptionId: string;
      };

      const htmlBody = generateInternalNotificationHtml(data);
      const textBody = generateInternalNotificationText(data);
      const subject = `Nova Assinatura: ${data.customerName} - ${data.planName}`;
      const internalEmail = "store@rsdata.com.br";

      const result = await sendEmailWithPostmark(internalEmail, subject, htmlBody, textBody);

      await supabase.from("email_logs").insert({
        recipient_email: internalEmail,
        email_type: "internal_notification",
        payment_id: paymentId,
        subscription_id: subscriptionId,
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
        metadata: { messageId: result.messageId, customerName: data.customerName },
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.success ? 200 : 500,
      });
    }

    if (action === "send_raw") {
      const emailPayload = payload as EmailPayload;
      const result = await sendEmailWithPostmark(
        emailPayload.to,
        emailPayload.subject,
        emailPayload.htmlBody,
        emailPayload.textBody
      );

      if (emailPayload.paymentId || emailPayload.subscriptionId) {
        await supabase.from("email_logs").insert({
          recipient_email: emailPayload.to,
          email_type: emailPayload.emailType,
          payment_id: emailPayload.paymentId || null,
          subscription_id: emailPayload.subscriptionId || null,
          status: result.success ? "sent" : "failed",
          error_message: result.error || null,
          metadata: emailPayload.metadata || null,
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.success ? 200 : 500,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
