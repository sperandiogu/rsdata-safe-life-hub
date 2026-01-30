/*
  # Adicionar campo para ID de assinatura do Mercado Pago
  
  1. Mudanças na tabela `subscriptions`
    - Adiciona coluna `mp_subscription_id` (text, nullable) para armazenar o ID da assinatura recorrente do Mercado Pago
    - Adiciona coluna `mp_preapproval_plan_id` (text, nullable) para armazenar o ID do plano de preapproval
    - Adiciona índice para busca rápida por mp_subscription_id
  
  2. Propósito
    - Permite vincular assinaturas locais com assinaturas recorrentes do Mercado Pago
    - Facilita o rastreamento de cobranças recorrentes mensais
    - mp_subscription_id é preenchido quando o cliente autoriza a assinatura recorrente
    - mp_preapproval_plan_id é preenchido quando criamos o plano no Mercado Pago
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'mp_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN mp_subscription_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'mp_preapproval_plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN mp_preapproval_plan_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_subscription_id ON subscriptions(mp_subscription_id) WHERE mp_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_plan_id ON subscriptions(mp_preapproval_plan_id) WHERE mp_preapproval_plan_id IS NOT NULL;