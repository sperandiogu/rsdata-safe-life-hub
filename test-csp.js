#!/usr/bin/env node

/**
 * Script para testar Content Security Policy e outros headers de segurança
 * Uso: node test-csp.js <URL>
 * Exemplo: node test-csp.js https://seu-site.netlify.app
 */

const https = require('https');
const http = require('http');

const url = process.argv[2];

if (!url) {
  console.error('❌ Erro: URL não fornecida\n');
  console.error('Uso: node test-csp.js <URL>');
  console.error('Exemplo: node test-csp.js https://seu-site.netlify.app\n');
  process.exit(1);
}

console.log('==========================================');
console.log('  Teste de Headers de Segurança (CSP)');
console.log('==========================================\n');
console.log(`🔍 Testando: ${url}\n`);

const urlObj = new URL(url);
const client = urlObj.protocol === 'https:' ? https : http;

const options = {
  method: 'HEAD',
  hostname: urlObj.hostname,
  port: urlObj.port,
  path: urlObj.pathname + urlObj.search,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; CSP-Tester/1.0)'
  }
};

const req = client.request(options, (res) => {
  console.log('✅ Site acessível');
  console.log(`   Status: ${res.statusCode} ${res.statusMessage}\n`);

  console.log('==========================================');
  console.log('  Headers de Segurança');
  console.log('==========================================\n');

  const securityHeaders = [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'strict-transport-security'
  ];

  securityHeaders.forEach(header => {
    const value = res.headers[header];
    if (value) {
      console.log(`✅ ${header}:`);
      console.log(`   ${value}\n`);
    } else {
      console.log(`❌ ${header} NÃO encontrado\n`);
    }
  });

  // Verificar domínios no CSP
  const csp = res.headers['content-security-policy'];
  if (csp) {
    console.log('==========================================');
    console.log('  Domínios Permitidos no CSP');
    console.log('==========================================\n');

    const expectedDomains = [
      'supabase.co',
      'mercadopago.com',
      'mercadolibre.com',
      'mlstatic.com',
      'mp-sdk-production.web.app'
    ];

    expectedDomains.forEach(domain => {
      if (csp.includes(domain)) {
        console.log(`   ✅ ${domain}`);
      } else {
        console.log(`   ❌ ${domain} (não encontrado)`);
      }
    });
    console.log('');
  }

  console.log('==========================================');
  console.log('  Todos os Headers HTTP');
  console.log('==========================================\n');
  Object.keys(res.headers).forEach(key => {
    console.log(`${key}: ${res.headers[key]}`);
  });

  console.log('\n==========================================');
  console.log('  Teste Online Recomendado');
  console.log('==========================================\n');
  console.log('Para análise detalhada, use:');
  console.log(`🔗 https://securityheaders.com/?q=${encodeURIComponent(url)}\n`);
});

req.on('error', (error) => {
  console.error('❌ Erro ao conectar ao site:');
  console.error(`   ${error.message}\n`);
  process.exit(1);
});

req.end();
