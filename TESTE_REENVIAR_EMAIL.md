# Script para Reenviar Emails de Pagamentos Aprovados

Este script permite reenviar emails de confirmação para pagamentos que já foram aprovados, útil para:
- Testar o sistema de emails
- Recuperar emails não enviados
- Enviar emails manualmente após configurar o Postmark

## Como Usar

### 1. Listar Pagamentos Aprovados

Execute no **SQL Editor** do Supabase:

```sql
SELECT
  p.id,
  p.external_reference,
  p.mp_payment_id,
  p.status,
  p.paid_at,
  c.name as customer_name,
  c.email as customer_email,
  s.id as subscription_id,
  pl.name as plan_name,
  s.billing_period
FROM payments p
JOIN customers c ON p.customer_id = c.id
JOIN subscriptions s ON p.subscription_id = s.id
JOIN plans pl ON s.plan_id = pl.id
WHERE p.status = 'approved'
ORDER BY p.paid_at DESC
LIMIT 10;
```

### 2. Verificar se Emails Foram Enviados

```sql
SELECT
  el.created_at,
  el.email_type,
  el.recipient_email,
  el.status,
  el.error_message,
  p.external_reference
FROM email_logs el
JOIN payments p ON el.payment_id = p.id
WHERE p.external_reference = 'COLE_AQUI_O_EXTERNAL_REFERENCE'
ORDER BY el.created_at DESC;
```

### 3. Reenviar Email para um Pagamento Específico

**IMPORTANTE:** Antes de executar, você precisa:
1. Ter configurado o `POSTMARK_SERVER_TOKEN` no Supabase
2. Substituir `EXTERNAL_REFERENCE_DO_PAGAMENTO` pelo valor real

Execute este SQL para preparar os dados:

```sql
SELECT
  p.id as payment_id,
  p.external_reference,
  p.amount,
  c.name as customer_name,
  c.email as customer_email,
  c.document,
  c.phone,
  s.id as subscription_id,
  s.billing_period,
  s.started_at,
  s.expires_at,
  pl.name as plan_name,
  a.street,
  a.number,
  a.complement,
  a.neighborhood,
  a.city,
  a.state,
  a.cep,
  p.mp_payment_id,
  p.payment_method,
  p.installments,
  p.paid_at
FROM payments p
JOIN customers c ON p.customer_id = c.id
JOIN subscriptions s ON p.subscription_id = s.id
JOIN plans pl ON s.plan_id = pl.id
LEFT JOIN addresses a ON c.id = a.customer_id AND a.is_default = true
WHERE p.external_reference = 'EXTERNAL_REFERENCE_DO_PAGAMENTO';
```

### 4. Chamar a Edge Function Manualmente

Depois de obter os dados acima, você pode chamar a função via cURL ou usando a interface do Supabase:

#### Via cURL (Terminal):

```bash
# Email para o cliente
curl -X POST \
  'https://siwrumbueegavdiwzfnb.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_SUPABASE_SERVICE_ROLE_KEY' \
  -d '{
    "action": "send_customer_confirmation",
    "data": {
      "customerName": "Nome do Cliente",
      "customerEmail": "cliente@email.com",
      "planName": "Nome do Plano",
      "planType": "monthly",
      "planPrice": 99.90,
      "subscriptionStartDate": "2024-01-20T12:00:00Z",
      "subscriptionEndDate": "2024-02-20T12:00:00Z"
    },
    "paymentId": "uuid-do-payment",
    "subscriptionId": "uuid-da-subscription"
  }'

# Email interno
curl -X POST \
  'https://siwrumbueegavdiwzfnb.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_SUPABASE_SERVICE_ROLE_KEY' \
  -d '{
    "action": "send_internal_notification",
    "data": {
      "customerName": "Nome do Cliente",
      "customerDocument": "000.000.000-00",
      "customerEmail": "cliente@email.com",
      "customerPhone": "(11) 99999-9999",
      "addressStreet": "Rua Exemplo",
      "addressNumber": "123",
      "addressComplement": "Apto 45",
      "addressNeighborhood": "Centro",
      "addressCity": "Porto Alegre",
      "addressState": "RS",
      "addressCep": "90000-000",
      "planName": "Nome do Plano",
      "planType": "monthly",
      "planPrice": 99.90,
      "subscriptionId": "uuid-da-subscription",
      "subscriptionStartDate": "2024-01-20T12:00:00Z",
      "subscriptionEndDate": "2024-02-20T12:00:00Z",
      "paymentId": "uuid-do-payment",
      "mercadoPagoPaymentId": "123456789",
      "paymentMethod": "credit_card",
      "installments": 1,
      "approvalDate": "2024-01-20T12:00:00Z"
    },
    "paymentId": "uuid-do-payment",
    "subscriptionId": "uuid-da-subscription"
  }'
```

### 5. Script Automatizado (PostgreSQL Function)

Você pode criar uma função no banco para facilitar o reenvio:

```sql
CREATE OR REPLACE FUNCTION resend_payment_emails(p_external_reference TEXT)
RETURNS TABLE (
  email_type TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_payment_record RECORD;
  v_address_record RECORD;
  v_result TEXT;
BEGIN
  -- Buscar dados do pagamento
  SELECT
    p.id as payment_id,
    p.amount,
    p.mp_payment_id,
    p.payment_method,
    p.installments,
    p.paid_at,
    c.name as customer_name,
    c.email as customer_email,
    c.document,
    c.phone,
    s.id as subscription_id,
    s.billing_period,
    s.started_at,
    s.expires_at,
    pl.name as plan_name
  INTO v_payment_record
  FROM payments p
  JOIN customers c ON p.customer_id = c.id
  JOIN subscriptions s ON p.subscription_id = s.id
  JOIN plans pl ON s.plan_id = pl.id
  WHERE p.external_reference = p_external_reference
    AND p.status = 'approved';

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'error'::TEXT, 'not_found'::TEXT, 'Payment not found or not approved'::TEXT;
    RETURN;
  END IF;

  -- Buscar endereço
  SELECT * INTO v_address_record
  FROM addresses
  WHERE customer_id = (SELECT customer_id FROM payments WHERE external_reference = p_external_reference)
    AND is_default = true;

  -- Aqui você precisaria chamar a edge function via HTTP
  -- Por limitações do PostgreSQL, isso requer extensões como http ou pg_net

  RETURN QUERY SELECT 'info'::TEXT, 'prepared'::TEXT, 'Data prepared - call edge function manually'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usar:
-- SELECT * FROM resend_payment_emails('rsdata_PLAN_123_TIMESTAMP');
```

## Testar Envio de Email Simples

Para testar se o Postmark está configurado corretamente:

```bash
curl -X POST \
  'https://siwrumbueegavdiwzfnb.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_SUPABASE_SERVICE_ROLE_KEY' \
  -d '{
    "action": "send_raw",
    "to": "seu-email@teste.com",
    "subject": "Teste de Email - RSData",
    "htmlBody": "<h1>Teste</h1><p>Se você recebeu este email, o Postmark está funcionando!</p>",
    "textBody": "TESTE\n\nSe você recebeu este email, o Postmark está funcionando!",
    "emailType": "customer_confirmation"
  }'
```

## Verificar Logs de Tentativas

```sql
-- Ver todas as tentativas de envio
SELECT
  created_at,
  recipient_email,
  email_type,
  status,
  error_message,
  metadata
FROM email_logs
ORDER BY created_at DESC
LIMIT 20;

-- Ver falhas
SELECT
  created_at,
  recipient_email,
  email_type,
  error_message
FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Ver emails enviados com sucesso
SELECT
  created_at,
  recipient_email,
  email_type,
  metadata->>'messageId' as postmark_message_id
FROM email_logs
WHERE status = 'sent'
ORDER BY created_at DESC;
```

## Dicas

1. **Sempre teste primeiro** com seu próprio email antes de reenviar para clientes
2. **Verifique os logs** antes de reenviar para evitar duplicatas
3. **Configure o Postmark** antes de tentar qualquer envio
4. **Salve o SERVICE_ROLE_KEY** em um local seguro - nunca commite no código
