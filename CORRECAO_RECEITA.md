# Correção do Cálculo de Receita

## Problema Identificado

A receita estava aparecendo **100 vezes menor** do que o valor real no painel administrativo.

### Causa Raiz

Havia uma inconsistência entre como os valores são armazenados no banco de dados e como estavam sendo exibidos no frontend:

1. **Banco de Dados**: Os valores são armazenados em REAIS
   - Coluna `amount` na tabela `payments`: `numeric(10,2)` (ex: 99.90)
   - Coluna `price` na tabela `plans`: `numeric(10,2)` (ex: 97.00, 197.00, 997.00)

2. **Frontend**: O código estava **dividindo por 100**, assumindo que os valores estavam em CENTAVOS
   - Exemplo: Se o valor real era R$ 99,90, estava mostrando R$ 0,99

3. **Mercado Pago**: A API do Mercado Pago retorna valores em REAIS, não em centavos
   - Os valores são salvos diretamente do Mercado Pago sem conversão

## Arquivos Corrigidos

### 1. `/src/pages/admin/Dashboard.tsx`
- Linha 266: Receita Total no card
- Linha 173: Receita no gráfico mensal
- Linha 208: Receita por plano
- Linha 461: Valor dos pagamentos na atividade recente

### 2. `/src/components/admin/DashboardStats.tsx`
- Linha 35: Receita Total no card

### 3. `/src/pages/admin/Pagamentos.tsx`
- Linha 131: Exportação CSV
- Linha 205: Card de receita total
- Linha 295: Tabela de pagamentos

### 4. `/src/pages/admin/Assinaturas.tsx`
- Linha 160: Exportação CSV
- Linha 236: Card de receita recorrente
- Linha 335: Tabela de assinaturas

### 5. `/src/components/admin/CustomerDetailsDialog.tsx`
- Linha 206-210: Função `formatCurrency` (renomeado parâmetro de `cents` para `amount`)

## Mudanças Aplicadas

**ANTES:**
```typescript
const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
// Exibição
value: `R$ ${((stats?.totalRevenue || 0) / 100).toLocaleString("pt-BR", { ... })}`
```

**DEPOIS:**
```typescript
const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
// Exibição
value: `R$ ${(stats?.totalRevenue || 0).toLocaleString("pt-BR", { ... })}`
```

A divisão por 100 foi removida em todos os lugares onde valores monetários são exibidos.

## Verificação

Para verificar se a correção está funcionando:

1. **Verifique um Pagamento no Banco**:
```sql
SELECT
  customers.name,
  amount,
  status,
  created_at
FROM payments
JOIN customers ON customers.id = payments.customer_id
WHERE status = 'approved'
LIMIT 5;
```

2. **Compare com o Dashboard**:
   - O valor mostrado no dashboard deve ser IGUAL ao valor no banco
   - Exemplo: Se o banco mostra `99.90`, o dashboard deve mostrar `R$ 99,90`

3. **Teste a Soma Total**:
```sql
SELECT
  SUM(amount) as total_receita,
  COUNT(*) as total_pagamentos
FROM payments
WHERE status = 'approved';
```

O valor de `total_receita` deve corresponder ao "Receita Total" exibido no dashboard.

## Impacto

Todos os valores monetários no painel administrativo agora mostram os valores corretos:

- Dashboard: Receita Total, Gráfico Mensal, Assinaturas por Plano, Atividade Recente
- Página de Pagamentos: Receita Total, Tabela de Pagamentos, Exportação CSV
- Página de Assinaturas: Receita Recorrente, Tabela de Assinaturas, Exportação CSV
- Detalhes do Cliente: Histórico de Pagamentos, Assinaturas

## Observação Importante

Os valores continuam sendo armazenados corretamente no banco de dados. Este era apenas um problema de **exibição** no frontend. Nenhuma alteração foi feita na estrutura do banco de dados ou nas edge functions.

## Correções Adicionais

### Erro: "column plans_2.type does not exist" e "column plans_2.price does not exist"

**Problema**: As queries tentavam buscar as colunas `type` e `price` da tabela `plans`, que não existem.

**Causa**: A tabela `plans` tem as seguintes colunas para preços:
- `monthly_price` - Preço mensal
- `annual_price` - Preço anual

E a periodicidade está na coluna `billing_period` da tabela `subscriptions` (valores: "mensal" ou "anual").

**Solução**:
1. Removido `type` da query de `plans`
2. Substituído `price` por `monthly_price` e `annual_price`
3. Adicionado `billing_period` à query de `subscriptions`
4. Atualizada todas as interfaces TypeScript
5. Corrigida a lógica para selecionar o preço correto baseado no `billing_period`

**Arquivos Modificados**:

- `/src/components/admin/CustomerDetailsDialog.tsx`:
  - Linha 54: Adicionado `billing_period` à interface
  - Linha 59-64: Corrigido interface `plans` para usar `monthly_price` e `annual_price`
  - Linha 113: Adicionado `billing_period` à query
  - Linha 119-122: Corrigido query de `plans` para buscar `monthly_price` e `annual_price`
  - Linha 356: Corrigido de `subscription.plans.type` para `subscription.billing_period`
  - Linha 367-375: Corrigido exibição de preço para usar valor correto baseado no `billing_period`

- `/src/pages/admin/Assinaturas.tsx`:
  - Linha 38-42: Corrigido interface para usar `monthly_price` e `annual_price`
  - Linha 103-107: Corrigido query para buscar preços corretos
  - Linha 160: Corrigido CSV export para usar preço baseado em `billing_period`
  - Linha 186: Corrigido cálculo de receita para usar preço baseado em `billing_period`
  - Linha 333-339: Corrigido exibição de preço na tabela

- `/src/pages/admin/Dashboard.tsx`:
  - Linha 182-192: Adicionado `billing_period` à query e corrigido para buscar `monthly_price` e `annual_price`
  - Linha 202-203: Corrigido cálculo de receita por plano para usar preço correto

### Erro: "column subscriptions_1.start_date does not exist"

**Problema**: As queries tentavam buscar as colunas `start_date` e `end_date` da tabela `subscriptions`, que não existem.

**Causa**: A tabela `subscriptions` usa nomes diferentes para essas colunas:
- `started_at` - Data de início da assinatura
- `expires_at` - Data de expiração da assinatura

**Solução**: Substituído todas as ocorrências de `start_date` por `started_at` e `end_date` por `expires_at`.

**Arquivos Modificados**:
- `/src/components/admin/CustomerDetailsDialog.tsx` - Interface e queries corrigidas
- `/src/components/admin/CustomerList.tsx` - Interface e queries corrigidas
- `/src/pages/admin/Assinaturas.tsx` - Interface, queries, CSV export e tabelas corrigidas

### Erro: "column payments_1.approval_date does not exist"

**Problema**: As queries tentavam buscar a coluna `approval_date` da tabela `payments`, que não existe.

**Causa**: A tabela `payments` usa `paid_at` para armazenar a data de pagamento/aprovação, não `approval_date`.

**Solução**: Substituído todas as ocorrências de `approval_date` por `paid_at`.

**Arquivos Modificados**:
- `/src/components/admin/CustomerDetailsDialog.tsx` - Interface e queries de pagamentos corrigidas
- `/src/pages/admin/Pagamentos.tsx` - Interface, queries e CSV export corrigidos

### Erro: "Cannot read properties of null (reading 'name')"

**Problema**: O código tentava acessar propriedades de `payment.customers` sem verificar se o objeto estava presente.

**Causa**: A tabela `payments` tem uma foreign key `customer_id` com `ON DELETE SET NULL`, permitindo valores NULL. Além disso, a query usa LEFT JOIN, que pode retornar null quando não há cliente associado.

**Solução**:
- Adicionada verificação de null no filtro de pagamentos
- Usado optional chaining (`?.`) em todos os acessos a `payment.customers`
- Atualizada interface TypeScript para refletir que `customers` pode ser null: `customers: {...} | null`
- Adicionado fallback "N/A" para exibição quando o cliente não existe

**Arquivos Modificados**:
- `/src/pages/admin/Pagamentos.tsx` - Interface TypeScript, filtro, CSV export e renderização da tabela

## Data da Correção

04/02/2026
