# Teste de Content Security Policy (CSP)

Este guia explica como testar se o CSP está configurado corretamente no seu site.

## 📋 Scripts Disponíveis

Criamos dois scripts para você testar:

### 1. Script Bash (`test-csp.sh`)
Usa `curl` para testar os headers HTTP.

### 2. Script Node.js (`test-csp.js`)
Usa Node.js nativo (não precisa de dependências extras).

---

## 🚀 Como Usar

### Opção 1: Com Bash (Linux/Mac/WSL)

```bash
./test-csp.sh https://seu-site.netlify.app
```

### Opção 2: Com Node.js (Funciona em qualquer sistema)

```bash
node test-csp.js https://seu-site.netlify.app
```

---

## ✅ O que os scripts verificam

1. **Content-Security-Policy** - A política de segurança principal
2. **X-Frame-Options** - Proteção contra clickjacking
3. **X-Content-Type-Options** - Proteção contra MIME sniffing
4. **Referrer-Policy** - Controle de informações de referência
5. **Permissions-Policy** - Controle de APIs do navegador
6. **Strict-Transport-Security** - Forçar HTTPS

### Domínios Verificados no CSP

Os scripts também verificam se estes domínios estão permitidos:
- ✅ supabase.co (banco de dados)
- ✅ mercadopago.com (pagamentos)
- ✅ mercadolibre.com (SDK Mercado Pago)
- ✅ mlstatic.com (recursos estáticos do MP)
- ✅ mp-sdk-production.web.app (SDK adicional)

---

## 📊 Exemplo de Saída

```
==========================================
  Teste de Headers de Segurança (CSP)
==========================================

🔍 Testando: https://seu-site.netlify.app

✅ Site acessível

==========================================
  Headers de Segurança
==========================================

✅ Content-Security-Policy encontrado:
   default-src 'self'; script-src 'self' 'unsafe-inline' ...

🔎 Verificando domínios permitidos no CSP:

   ✅ supabase.co
   ✅ mercadopago.com
   ✅ mercadolibre.com
   ✅ mlstatic.com
   ✅ mp-sdk-production.web.app

✅ X-Frame-Options encontrado:
   DENY
```

---

## 🌐 Teste Online

Para uma análise mais completa e visual, use estas ferramentas online:

1. **Security Headers** (Recomendado)
   ```
   https://securityheaders.com
   ```
   - Digite a URL do seu site
   - Veja a nota de segurança (A+, A, B, etc)
   - Análise detalhada de cada header

2. **CSP Evaluator (Google)**
   ```
   https://csp-evaluator.withgoogle.com
   ```
   - Cole seu CSP completo
   - Veja recomendações de segurança

3. **Mozilla Observatory**
   ```
   https://observatory.mozilla.org
   ```
   - Teste completo de segurança
   - Inclui TLS, cookies, etc

---

## 🐛 Troubleshooting

### O CSP não aparece nos headers?

1. **Verifique se fez deploy no Netlify**
   - Os headers só aparecem após o deploy
   - Não funcionam em `localhost` ou `npm run dev`

2. **Limpe o cache**
   ```bash
   # Chrome DevTools
   F12 > Network > Disable cache (checkbox)

   # Ou teste em modo anônimo
   Ctrl+Shift+N (Chrome) / Ctrl+Shift+P (Firefox)
   ```

3. **Verifique a configuração do Netlify**
   - Entre no dashboard do Netlify
   - Vá em Site Settings > Build & Deploy
   - Verifique se não há conflitos com headers customizados

### Erro "Não foi possível conectar ao site"?

- Verifique se a URL está correta
- Confirme que o site está online
- Teste sem proxy/VPN

### Domínios não aparecem no CSP?

- Isso é normal! O CSP está configurado corretamente em `netlify.toml` e `public/_headers`
- Os domínios serão incluídos automaticamente no deploy

---

## 📝 Notas Importantes

1. **Headers só aparecem em produção** (Netlify)
   - Em desenvolvimento local (`npm run dev`) os headers não são aplicados
   - Use o preview deploy do Netlify para testar antes da produção

2. **Cache do navegador**
   - Sempre teste com cache desabilitado ou em modo anônimo
   - O navegador pode cachear headers antigos

3. **Ferramentas online são mais confiáveis**
   - Use Security Headers ou Mozilla Observatory
   - Eles não sofrem com problemas de cache

---

## 🔗 Links Úteis

- [Documentação do Netlify sobre Headers](https://docs.netlify.com/routing/headers/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Cheat Sheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
