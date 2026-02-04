# Instruções para Configurar o Admin

## Criar Usuário Administrador

Para acessar o painel administrativo, você precisa criar um usuário admin no Supabase.

### Passos:

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá para seu projeto RSData
3. No menu lateral, clique em **Authentication** > **Users**
4. Clique em **Add user** > **Create new user**
5. Preencha:
   - Email: seu-email@exemplo.com
   - Password: sua-senha-segura
   - Marque a opção **Auto Confirm User**
6. Clique em **Create user**

7. Após criar o usuário, você precisa adicionar ele na tabela `admin_users`. Vá para **SQL Editor** e execute:

```sql
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

Substitua `'seu-email@exemplo.com'` pelo email que você cadastrou.

## Acessar o Painel

1. Acesse: `/admin/login`
2. Faça login com o email e senha cadastrados
3. Você será redirecionado para o dashboard administrativo

## Funcionalidades Disponíveis

### Autenticação
- Login seguro com email e senha
- Sessão persistente
- Logout automático ao fechar
- Rotas protegidas

### Sincronização com Mercado Pago
- Botão "Sincronizar com MP" no Dashboard e na página de Assinaturas
- Atualiza automaticamente o status das assinaturas
- Verifica status no Mercado Pago e atualiza no banco de dados
- Mostra resultado da sincronização com número de registros atualizados

### Dashboard
- Métricas em tempo real
- Gráficos de receita e crescimento
- Timeline de atividades recentes
- Estatísticas de clientes e assinaturas

### Gerenciamento
- **Clientes**: Visualizar, buscar e exportar dados
- **Assinaturas**: Gerenciar e sincronizar com Mercado Pago
- **Pagamentos**: Monitorar transações
- **Analytics**: Análises detalhadas de desempenho

## Sincronização com Mercado Pago

A função de sincronização:
1. Busca todas as assinaturas com `mp_subscription_id`
2. Consulta o status atual no Mercado Pago
3. Atualiza o status no banco de dados se houver mudança
4. Retorna um relatório completo da sincronização

Status mapeados:
- `authorized` (MP) → `active` (Sistema)
- `paused` (MP) → `paused` (Sistema)
- `cancelled` (MP) → `cancelled` (Sistema)
- `pending` (MP) → `pending` (Sistema)

## Segurança

- Todas as rotas admin são protegidas
- Apenas usuários autenticados podem acessar
- RLS habilitado em todas as tabelas
- Senhas criptografadas no Supabase Auth
- Tokens JWT para autenticação

## Troubleshooting

### Problema: "Cliente não encontrado"

Se ao clicar em "Ver Detalhes" aparecer "Cliente não encontrado":

1. **Verifique o Console do Navegador** (F12):
   - Procure por logs como "Fetching customer details"
   - Veja se há erros em vermelho

2. **Execute o Script de Teste**:
   - Abra o arquivo `TEST_DATA.sql`
   - Execute no SQL Editor do Supabase
   - Isso criará um cliente de teste se necessário

3. **Verifique se está autenticado**:
   - Faça logout e login novamente em `/admin/login`
   - Certifique-se de que seu usuário está na tabela `admin_users`

4. **Leia o guia completo**:
   - Abra o arquivo `DEBUG_CUSTOMER_DETAILS.md`
   - Siga todos os passos de diagnóstico

### Problema: Não consigo fazer login

1. Verifique se criou o usuário em Authentication > Users
2. Verifique se adicionou o usuário na tabela `admin_users`
3. Certifique-se de que `is_active = true`

### Problema: Sincronização não funciona

1. Verifique se o `MP_ACCESS_TOKEN` está configurado no Supabase
2. Verifique se há assinaturas com `mp_subscription_id` preenchido
3. Veja os logs da edge function no Supabase Dashboard
