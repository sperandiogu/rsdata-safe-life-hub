# Segurança da Aplicação

Este documento descreve as políticas de segurança implementadas na aplicação RSData Safe Life Hub.

## Content Security Policy (CSP)

A aplicação implementa uma Content Security Policy robusta para proteger contra ataques XSS (Cross-Site Scripting) e injeção de dados maliciosos.

### Configuração

A CSP está configurada em três locais para garantir máxima compatibilidade:

1. **netlify.toml** - Configuração principal para deploy no Netlify
2. **public/_headers** - Arquivo de headers HTTP para Netlify
3. **index.html** - Meta tag como fallback

### Diretivas CSP

#### `default-src 'self'`
Por padrão, apenas recursos da mesma origem são permitidos.

#### `script-src`
Permite scripts de:
- `'self'` - Scripts do próprio domínio
- `'unsafe-inline'` - Scripts inline (necessário para GTM init script no `<head>` do index.html)
- `'unsafe-eval'` - Eval de JavaScript (necessário para MercadoPago SDK Payment Brick)
- `https://www.googletagmanager.com` - Google Tag Manager (gtm.js)
- `https://sdk.mercadopago.com` - MercadoPago SDK (injetado via `@mercadopago/sdk-js`)
- `https://http2.mlstatic.com` - Recursos estáticos do MercadoPago (chunks JS carregados pelo SDK)

#### `style-src`
Permite estilos de:
- `'self'` - Estilos do próprio domínio
- `'unsafe-inline'` - Estilos inline (componentes React, chart.tsx dangerouslySetInnerHTML, progress.tsx, MercadoPago Brick)
- `https://http2.mlstatic.com` - CSS do MercadoPago Payment Brick
- `https://fonts.googleapis.com` - Google Fonts (pode ser carregado via GTM)

#### `font-src`
Permite fontes de:
- `'self'` - Fontes do próprio domínio
- `https://fonts.gstatic.com` - Google Fonts (pode ser carregado via GTM)
- `https://http2.mlstatic.com` - Fontes do MercadoPago Brick
- `data:` - Fontes em formato data URI (Vite bundle)

#### `img-src`
Permite imagens de:
- `'self'` - Imagens do próprio domínio
- `data:` - Imagens em formato data URI
- `blob:` - Imagens blob (export CSV com URL.createObjectURL)
- `https:` - Todas as imagens HTTPS (favicon rsdata.com.br, CDN greatsoftwares.com.br, lovable.dev OG, ícones MercadoPago, pixels do GA)

#### `connect-src`
Permite conexões (fetch/XHR) para:
- `'self'` - Mesma origem
- `https://siwrumbueegavdiwzfnb.supabase.co` - API Supabase (PostgREST + Edge Functions)
- `https://api.mercadopago.com` - API do MercadoPago (pagamentos, assinaturas)
- `https://events.mercadopago.com` - Tracking interno do MercadoPago SDK
- `https://sdk.mercadopago.com` - Fetch calls internos do SDK MercadoPago
- `https://http2.mlstatic.com` - Recursos dinâmicos do MercadoPago
- `https://publica.cnpj.ws` - Consulta CNPJ (FormularioAssinatura.tsx)
- `https://viacep.com.br` - Consulta CEP (FormularioAssinatura.tsx)
- `https://hook.us2.make.com` - Webhook Make.com (FormularioAssinatura.tsx)
- `https://www.google-analytics.com` - Google Analytics Universal
- `https://analytics.google.com` - Google Analytics 4
- `https://www.googletagmanager.com` - Google Tag Manager
- `https://stats.g.doubleclick.net` - Google Ads/DoubleClick conversions (via GTM)
- `https://region1.google-analytics.com` - GA4 regional endpoint

#### `frame-src`
Permite iframes de:
- `'self'` - Mesma origem
- `https://www.googletagmanager.com` - GTM noscript iframe (index.html)
- `https://sdk.mercadopago.com` - MercadoPago Payment Brick (renderiza em iframe)
- `https://*.mercadopago.com` - Redirects de pagamento MercadoPago
- `https://*.mercadolibre.com` - Recursos compartilhados MercadoPago/MercadoLibre

#### `object-src 'self'`
Permite objetos embarcados da mesma origem (necessário para `<object>` do PDF de termos em FormularioAssinatura.tsx).

#### `base-uri 'self'`
Restringe a tag `<base>` à mesma origem.

#### `form-action`
Permite submissão de formulários para:
- `'self'` - Mesma origem
- `https://*.mercadopago.com` - Redirects de processamento de pagamento

#### `frame-ancestors 'self'`
Permite que a página seja incorporada apenas na mesma origem (proteção contra clickjacking).
**Nota:** Esta diretiva só funciona via header HTTP (netlify.toml/_headers), não via meta tag.

#### `upgrade-insecure-requests`
Força o upgrade de todas as requisições HTTP para HTTPS.

## Outros Headers de Segurança

### X-Frame-Options: SAMEORIGIN
Permite que a página seja incorporada apenas em iframes da mesma origem.

### X-Content-Type-Options: nosniff
Previne que navegadores façam "MIME sniffing" e interpretem arquivos como um tipo diferente do declarado.

### X-XSS-Protection: 1; mode=block
Ativa a proteção XSS do navegador e bloqueia a página se um ataque for detectado.

### Referrer-Policy: strict-origin-when-cross-origin
Envia o referrer completo para requisições da mesma origem, mas apenas a origem para requisições cross-origin.

### Permissions-Policy
Desabilita APIs sensíveis que não são utilizadas:
- `camera=()` - Desabilita acesso à câmera
- `microphone=()` - Desabilita acesso ao microfone
- `geolocation=()` - Desabilita acesso à localização
- `interest-cohort=()` - Desabilita FLoC do Google

## Cache Headers

Recursos estáticos (JavaScript, CSS, imagens) são configurados com cache de 1 ano (31536000 segundos) com a diretiva `immutable`, pois o Vite adiciona hash aos nomes dos arquivos.

## Recomendações de Segurança

### Para Desenvolvimento

1. **Não commite credenciais**: O arquivo `.env` está no `.gitignore`, mas sempre verifique antes de commitar.

2. **Teste a CSP localmente**: Use as ferramentas de desenvolvedor do navegador para verificar se há violações de CSP.

3. **Atualize as diretivas CSP**: Se adicionar novos serviços externos, atualize a CSP em todos os três locais (netlify.toml, _headers, index.html).

### Para Produção

1. **Monitore violações de CSP**: Configure um endpoint de relatório CSP para monitorar violações.

2. **Revise periodicamente**: Revise as diretivas CSP periodicamente e remova domínios não utilizados.

3. **Atualize dependências**: Mantenha todas as dependências atualizadas para evitar vulnerabilidades conhecidas.

4. **Considere remover 'unsafe-inline' e 'unsafe-eval'**: Quando possível, refatore o código para não precisar dessas diretivas.

## Testando a CSP

Para testar se a CSP está funcionando corretamente:

1. Abra as ferramentas de desenvolvedor do navegador
2. Acesse a aba "Console"
3. Navegue pela aplicação
4. Verifique se há erros de CSP no console
5. Todos os recursos devem carregar sem violar a política

## Próximos Passos de Segurança

1. Implementar CSP Report-Only mode primeiro para monitorar violações
2. Adicionar Subresource Integrity (SRI) para recursos externos
3. Implementar HSTS (HTTP Strict Transport Security)
4. Considerar implementar Certificate Transparency
5. Adicionar rate limiting nas APIs
6. Implementar autenticação de dois fatores (2FA)
