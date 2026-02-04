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

## Data da Correção

04/02/2026
