# Debug: Cliente Não Encontrado

## Problema
Ao clicar em "Ver Detalhes" de um cliente, aparece a mensagem "Cliente não encontrado".

## Diagnóstico

O componente CustomerDetailsDialog agora tem logs de console. Para debugar:

1. Abra o console do navegador (F12)
2. Clique em "Ver Detalhes" de um cliente
3. Verifique os logs que aparecem:
   - `Fetching customer details for: [ID]` - Mostra qual ID está sendo buscado
   - `Customer data fetched:` - Mostra os dados que foram retornados
   - `Error fetching customer:` - Mostra se houve algum erro

## Possíveis Causas e Soluções

### 1. Problema de RLS (Row Level Security)

Se você não estiver autenticado como admin, as políticas RLS podem estar bloqueando o acesso.

**Solução:**
- Certifique-se de que você está logado no painel admin
- Verifique se o usuário admin está na tabela `admin_users`
- Execute no SQL Editor do Supabase:

```sql
-- Verificar se o admin user existe
SELECT * FROM admin_users;

-- Se não existir, criar um admin user
-- Primeiro, crie o usuário em Authentication > Users no dashboard
-- Depois execute:
INSERT INTO admin_users (id, email, name, role, is_active)
SELECT
  id,
  email,
  'Administrador',
  'admin',
  true
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

### 2. Cliente Não Existe no Banco

**Solução:**
Verifique se há clientes cadastrados:

```sql
-- Verificar clientes
SELECT id, name, email FROM customers LIMIT 10;
```

### 3. Problema com Relacionamentos

As tabelas relacionadas (addresses, subscriptions, payments) podem não ter dados.

**Solução:**
Verificar se os relacionamentos estão corretos:

```sql
-- Verificar estrutura das foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('addresses', 'subscriptions', 'payments');
```

### 4. Problema de Permissões

As políticas RLS podem estar muito restritivas.

**Solução:**
Verificar políticas RLS:

```sql
-- Ver todas as políticas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('customers', 'addresses', 'subscriptions', 'payments', 'email_logs');
```

### 5. Dados de Teste

Se não houver clientes, crie um cliente de teste:

```sql
-- Criar cliente de teste
INSERT INTO customers (name, document, document_type, email, phone)
VALUES (
  'Cliente Teste',
  '12345678901',
  'PF',
  'teste@exemplo.com',
  '(11) 99999-9999'
)
RETURNING *;

-- Criar endereço para o cliente
-- Substitua [CUSTOMER_ID] pelo ID retornado acima
INSERT INTO addresses (customer_id, cep, street, number, neighborhood, city, state)
VALUES (
  '[CUSTOMER_ID]',
  '01310-100',
  'Av. Paulista',
  '1000',
  'Bela Vista',
  'São Paulo',
  'SP'
);
```

## Teste Rápido

Execute este teste no SQL Editor para verificar se a query funciona:

```sql
-- Buscar um cliente com todos os relacionamentos
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.document,
  c.created_at,
  json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL) AS addresses,
  json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL) AS subscriptions,
  json_agg(DISTINCT p.*) FILTER (WHERE p.id IS NOT NULL) AS payments
FROM customers c
LEFT JOIN addresses a ON a.customer_id = c.id
LEFT JOIN subscriptions s ON s.customer_id = c.id
LEFT JOIN payments p ON p.customer_id = c.id
GROUP BY c.id
LIMIT 1;
```

Se esta query funcionar e retornar dados, o problema é de autenticação/RLS.
Se não retornar dados, não há clientes cadastrados.

## Como Resolver

1. **Verifique os logs do console** - Isso dirá exatamente qual é o erro
2. **Certifique-se de estar autenticado** - Faça login em `/admin/login`
3. **Verifique se há dados** - Execute as queries SQL acima
4. **Teste com um cliente real** - Use um cliente que você sabe que existe

## Melhorias Aplicadas

O componente CustomerDetailsDialog foi melhorado com:
- Uso de `.maybeSingle()` ao invés de `.single()` (mais seguro)
- Logs de console detalhados para debug
- Tratamento de erros melhorado
- Verificação de dados nulos antes de processar
- Mensagem de erro mais descritiva quando há falha

## Suporte

Se o problema persistir após seguir estes passos, copie os logs do console e as mensagens de erro que aparecem.
