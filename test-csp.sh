#!/bin/bash

# Script para testar Content Security Policy e outros headers de segurança

echo "=========================================="
echo "  Teste de Headers de Segurança (CSP)"
echo "=========================================="
echo ""

# Configuração
if [ -z "$1" ]; then
  echo "❌ Erro: URL não fornecida"
  echo ""
  echo "Uso: ./test-csp.sh <URL>"
  echo "Exemplo: ./test-csp.sh https://seu-site.netlify.app"
  echo ""
  exit 1
fi

URL="$1"

echo "🔍 Testando: $URL"
echo ""

# Função para extrair e formatar headers
check_header() {
  local header_name="$1"
  local header_value=$(curl -s -I "$URL" | grep -i "^$header_name:" | sed "s/^$header_name: //I" | tr -d '\r')

  if [ -n "$header_value" ]; then
    echo "✅ $header_name encontrado:"
    echo "   $header_value"
    echo ""
    return 0
  else
    echo "❌ $header_name NÃO encontrado"
    echo ""
    return 1
  fi
}

# Função para verificar domínios no CSP
check_csp_domains() {
  local csp_value="$1"

  echo "🔎 Verificando domínios permitidos no CSP:"
  echo ""

  # Lista de domínios esperados
  domains=(
    "supabase.co"
    "mercadopago.com"
    "mercadolibre.com"
    "mlstatic.com"
    "mp-sdk-production.web.app"
  )

  for domain in "${domains[@]}"; do
    if echo "$csp_value" | grep -q "$domain"; then
      echo "   ✅ $domain"
    else
      echo "   ❌ $domain (não encontrado)"
    fi
  done
  echo ""
}

# Testar conectividade
echo "📡 Testando conectividade..."
if ! curl -s --head "$URL" > /dev/null; then
  echo "❌ Erro: Não foi possível conectar ao site"
  echo "   Verifique se a URL está correta e o site está online"
  exit 1
fi
echo "✅ Site acessível"
echo ""

echo "=========================================="
echo "  Headers de Segurança"
echo "=========================================="
echo ""

# Verificar CSP
csp_value=$(curl -s -I "$URL" | grep -i "^Content-Security-Policy:" | sed "s/^Content-Security-Policy: //I" | tr -d '\r')
check_header "Content-Security-Policy"

if [ -n "$csp_value" ]; then
  check_csp_domains "$csp_value"
fi

# Outros headers de segurança importantes
check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "Referrer-Policy"
check_header "Permissions-Policy"
check_header "Strict-Transport-Security"

echo "=========================================="
echo "  Todos os Headers HTTP"
echo "=========================================="
echo ""
curl -s -I "$URL"

echo ""
echo "=========================================="
echo "  Teste Online Recomendado"
echo "=========================================="
echo ""
echo "Para análise detalhada, use:"
echo "🔗 https://securityheaders.com/?q=$URL"
echo ""
