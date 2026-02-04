-- Script para verificar e criar dados de teste

-- 1. VERIFICAR SE HÁ CLIENTES
SELECT
  COUNT(*) as total_clientes,
  COUNT(DISTINCT addresses.customer_id) as clientes_com_endereco,
  COUNT(DISTINCT subscriptions.customer_id) as clientes_com_assinatura
FROM customers
LEFT JOIN addresses ON addresses.customer_id = customers.id
LEFT JOIN subscriptions ON subscriptions.customer_id = customers.id;

-- 2. VER LISTA DE CLIENTES
SELECT
  c.id,
  c.name,
  c.email,
  c.document,
  c.created_at,
  COUNT(DISTINCT a.id) as num_enderecos,
  COUNT(DISTINCT s.id) as num_assinaturas,
  COUNT(DISTINCT p.id) as num_pagamentos
FROM customers c
LEFT JOIN addresses a ON a.customer_id = c.id
LEFT JOIN subscriptions s ON s.customer_id = c.id
LEFT JOIN payments p ON p.customer_id = c.id
GROUP BY c.id, c.name, c.email, c.document, c.created_at
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. CRIAR CLIENTE DE TESTE (se necessário)
-- Execute este bloco apenas se não houver clientes ou se quiser um cliente de teste

DO $$
DECLARE
  v_customer_id uuid;
  v_address_id uuid;
  v_plan_id uuid;
  v_subscription_id uuid;
BEGIN
  -- Verificar se já existe um cliente de teste
  SELECT id INTO v_customer_id
  FROM customers
  WHERE email = 'teste@rsdata.com'
  LIMIT 1;

  -- Se não existir, criar
  IF v_customer_id IS NULL THEN
    -- Criar cliente
    INSERT INTO customers (name, document, document_type, email, phone)
    VALUES (
      'Cliente Teste RSData',
      '12345678901',
      'PF',
      'teste@rsdata.com',
      '(11) 98765-4321'
    )
    RETURNING id INTO v_customer_id;

    RAISE NOTICE 'Cliente criado com ID: %', v_customer_id;

    -- Criar endereço
    INSERT INTO addresses (
      customer_id,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      is_default
    )
    VALUES (
      v_customer_id,
      '01310-100',
      'Avenida Paulista',
      '1000',
      'Conjunto 42',
      'Bela Vista',
      'São Paulo',
      'SP',
      true
    )
    RETURNING id INTO v_address_id;

    RAISE NOTICE 'Endereço criado com ID: %', v_address_id;

    -- Buscar plano mensal
    SELECT id INTO v_plan_id
    FROM plans
    WHERE type = 'monthly'
    LIMIT 1;

    IF v_plan_id IS NOT NULL THEN
      -- Criar assinatura
      INSERT INTO subscriptions (
        customer_id,
        plan_id,
        status,
        start_date,
        end_date
      )
      VALUES (
        v_customer_id,
        v_plan_id,
        'active',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 month'
      )
      RETURNING id INTO v_subscription_id;

      RAISE NOTICE 'Assinatura criada com ID: %', v_subscription_id;

      -- Criar pagamento
      INSERT INTO payments (
        customer_id,
        subscription_id,
        amount,
        status,
        payment_method,
        installments,
        mp_payment_id,
        approval_date
      )
      VALUES (
        v_customer_id,
        v_subscription_id,
        (SELECT price FROM plans WHERE id = v_plan_id),
        'approved',
        'credit_card',
        1,
        'test_payment_' || gen_random_uuid()::text,
        NOW()
      );

      RAISE NOTICE 'Pagamento criado';
    END IF;

    RAISE NOTICE 'Cliente de teste criado com sucesso!';
  ELSE
    RAISE NOTICE 'Cliente de teste já existe com ID: %', v_customer_id;
  END IF;
END $$;

-- 4. VERIFICAR POLÍTICAS RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'addresses', 'subscriptions', 'payments', 'email_logs')
ORDER BY tablename, policyname;

-- 5. TESTAR QUERY COMPLETA (igual ao componente)
-- Esta query deve retornar dados se tudo estiver OK
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.document,
  c.created_at,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', a.id,
        'street', a.street,
        'number', a.number,
        'complement', a.complement,
        'neighborhood', a.neighborhood,
        'city', a.city,
        'state', a.state,
        'cep', a.cep
      )
    ) FILTER (WHERE a.id IS NOT NULL),
    '[]'
  ) AS addresses,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', s.id,
        'status', s.status,
        'start_date', s.start_date,
        'end_date', s.end_date,
        'mp_subscription_id', s.mp_subscription_id,
        'created_at', s.created_at,
        'plans', jsonb_build_object(
          'name', pl.name,
          'type', pl.type,
          'price', pl.price,
          'description', pl.description
        )
      )
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'
  ) AS subscriptions,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', p.id,
        'amount', p.amount,
        'status', p.status,
        'payment_method', p.payment_method,
        'installments', p.installments,
        'mp_payment_id', p.mp_payment_id,
        'approval_date', p.approval_date,
        'created_at', p.created_at
      )
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'
  ) AS payments
FROM customers c
LEFT JOIN addresses a ON a.customer_id = c.id
LEFT JOIN subscriptions s ON s.customer_id = c.id
LEFT JOIN plans pl ON s.plan_id = pl.id
LEFT JOIN payments p ON p.customer_id = c.id
GROUP BY c.id, c.name, c.email, c.phone, c.document, c.created_at
LIMIT 1;

-- 6. VERIFICAR SE O ADMIN USER EXISTE
SELECT
  au.id,
  au.email,
  au.name,
  au.role,
  au.is_active,
  u.email as auth_email,
  u.created_at
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.id;

-- Se não retornar nada, você precisa criar o admin user primeiro!
-- Veja INSTRUCOES_ADMIN.md para saber como criar
