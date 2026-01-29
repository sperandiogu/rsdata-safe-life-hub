# Configuração de Emails e Webhooks - RSData

## Situação Atual

O sistema já está configurado para enviar emails automaticamente quando um pagamento é aprovado. Implementamos duas estratégias:

1. **Envio Imediato (Fallback)**: Quando o pagamento é aprovado via cartão, os emails são enviados imediatamente
2. **Webhook do Mercado Pago**: Notificações assíncronas quando o status do pagamento muda

## Configurações Necessárias

### 1. Configurar Token do Postmark

**Passos:**

1. Acesse sua conta Postmark em: https://account.postmarkapp.com
2. Vá em **Servers** e selecione seu servidor
3. Copie o **Server API Token**
4. Acesse o painel do Supabase: https://siwrumbueegavdiwzfnb.supabase.co
5. Navegue para: **Edge Functions** → **Configuration** → **Secrets**
6. Adicione a variável de ambiente:
   - Nome: `POSTMARK_SERVER_TOKEN`
   - Valor: Cole o token copiado do Postmark

**Verificar domínio:**
- Certifique-se de que o domínio `rsdata.com.br` está verificado no Postmark
- Vá em **Sender Signatures** e confirme que `store@rsdata.com.br` está ativo

### 2. Configurar Webhook no Mercado Pago

**IMPORTANTE:** O webhook é essencial para receber notificações quando o status do pagamento muda (aprovações, rejeições, etc.)

**Passos:**

1. Acesse o painel do Mercado Pago: https://www.mercadopago.com.br/developers
2. Vá em **Suas integrações** → selecione sua aplicação
3. Clique em **Webhooks** ou **Notificações**
4. Configure uma nova URL de webhook:
   ```
   https://siwrumbueegavdiwzfnb.supabase.co/functions/v1/mercadopago-webhook
   ```
5. Selecione os eventos:
   - ✅ **Pagamentos** (payments)
   - Marque: `payment.created`, `payment.updated`
6. Salve a configuração
7. **Teste a conexão** usando o botão de teste no painel do Mercado Pago

### 3. Verificar Variável do Mercado Pago

Certifique-se de que o Access Token do Mercado Pago está configurado:

1. Acesse: https://siwrumbueegavdiwzfnb.supabase.co
2. Navegue para: **Edge Functions** → **Configuration** → **Secrets**
3. Verifique se existe a variável:
   - Nome: `MERCADOPAGO_ACCESS_TOKEN`
   - Valor: Seu token de acesso do Mercado Pago

Se não existir, adicione:
- Obtenha o token em: https://www.mercadopago.com.br/developers/panel/app
- Vá em **Credenciais** → **Access Token de produção**

## Como Funciona o Fluxo de Emails

### Pagamento Aprovado Imediatamente (Cartão)

```
1. Cliente paga com cartão
2. Mercado Pago aprova na hora
3. Sistema atualiza o banco de dados
4. ✅ EMAILS SÃO ENVIADOS IMEDIATAMENTE
   - Email de confirmação para o cliente
   - Email de notificação para store@rsdata.com.br
5. Webhook do Mercado Pago confirma (backup)
```

### Pagamento Pendente → Aprovado (PIX, Boleto)

```
1. Cliente escolhe PIX ou Boleto
2. Sistema registra como "pendente"
3. Cliente efetua o pagamento
4. ⚡ WEBHOOK DO MERCADO PAGO É CHAMADO
5. Sistema atualiza status para "approved"
6. ✅ EMAILS SÃO ENVIADOS
   - Email de confirmação para o cliente
   - Email de notificação para store@rsdata.com.br
```

## Testando o Sistema

### Teste 1: Pagamento com Cartão

1. Acesse o site e escolha um plano
2. Preencha o formulário
3. Use um cartão de teste do Mercado Pago:
   - Cartão: `5031 4332 1540 6351`
   - CVV: `123`
   - Validade: qualquer data futura
4. Complete o pagamento
5. ✅ Verifique se os emails foram recebidos

### Teste 2: Verificar Logs de Email

Execute no Supabase SQL Editor:

```sql
SELECT
  created_at,
  recipient_email,
  email_type,
  status,
  error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Teste 3: Verificar Webhook

1. Faça um pagamento de teste
2. Acesse o painel do Mercado Pago
3. Vá em **Webhooks** → **Histórico**
4. Verifique se as notificações foram enviadas com sucesso (status 200)

## Solução de Problemas

### Emails não estão sendo enviados

**Verificar:**
1. Token do Postmark está configurado corretamente
2. Domínio está verificado no Postmark
3. Checar logs de erro:
   ```sql
   SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC;
   ```

### Webhook não está sendo chamado

**Verificar:**
1. URL do webhook está correta no painel do Mercado Pago
2. Eventos estão selecionados (payment.created, payment.updated)
3. Testar URL manualmente no painel do Mercado Pago
4. Verificar logs da função no Supabase

### Como visualizar logs das Edge Functions

1. Acesse: https://siwrumbueegavdiwzfnb.supabase.co
2. Vá em **Edge Functions**
3. Selecione a função (ex: `mercadopago-webhook` ou `send-email`)
4. Clique em **Logs** para ver execuções recentes

## Estrutura dos Emails

### Email para Cliente

- **Assunto:** "Pagamento Confirmado - RSData"
- **Conteúdo:**
  - Saudação personalizada
  - Detalhes do plano contratado
  - Datas de início e validade
  - Informação sobre próximos passos (acesso em até 7 dias)
  - Link para WhatsApp de suporte

### Email Interno (para store@rsdata.com.br)

- **Assunto:** "Nova Assinatura: [Nome Cliente] - [Plano]"
- **Conteúdo:**
  - Dados completos do cliente
  - Endereço
  - Detalhes do plano e assinatura
  - Informações do pagamento (método, parcelas, ID do MP)

## Contatos de Suporte

- Email: store@rsdata.com.br
- WhatsApp: +55 51 3720-1416

## URLs Importantes

- Painel Supabase: https://siwrumbueegavdiwzfnb.supabase.co
- Painel Mercado Pago: https://www.mercadopago.com.br/developers
- Painel Postmark: https://account.postmarkapp.com
- Site: https://cadastro.rsdata.com.br
