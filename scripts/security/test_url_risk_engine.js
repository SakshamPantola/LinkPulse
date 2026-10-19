/**
 * URL Risk Scoring Engine Standalone Test Runner
 * Authored by Krishna Sijwali (@krish222334843)
 * 
 * Usage: node scripts/security/test_url_risk_engine.js
 */

const fs = require('fs');
const path = require('path');

const samplePath = path.join(__dirname, 'malicious_domain_samples.json');

function evaluateUrlRisk(urlString) {
  let score = 0;
  const flags = [];

  try {
    const parsed = new URL(urlString);

    // Protocol check
    if (parsed.protocol === 'http:') {
      score += 20;
      flags.push('unencrypted_http');
    }

    // IP address host check
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
      score += 50;
      flags.push('raw_ip_destination');
    }

    // Risky TLD heuristic
    const riskyTlds = ['.xyz', '.click', '.top', '.tk', '.ml'];
    if (riskyTlds.some(tld => parsed.hostname.endsWith(tld))) {
      score += 35;
      flags.push('suspicious_tld');
    }

    // Chained shorteners
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'ow.ly'];
    if (shorteners.includes(parsed.hostname)) {
      score += 30;
      flags.push('chained_shortener');
    }

    // High entropy or sensitive keywords
    const keywords = ['paypal', 'verify', 'bank', 'login', 'security-update'];
    if (keywords.some(kw => urlString.toLowerCase().includes(kw))) {
      score += 35;
      flags.push('phishing_keywords');
    }

    return {
      url: urlString,
      score: Math.min(100, score),
      level: score > 50 ? 'CRITICAL' : score > 20 ? 'MEDIUM' : 'SAFE',
      flags,
    };
  } catch (err) {
    return { url: urlString, score: 100, level: 'INVALID', flags: ['malformed_url'] };
  }
}

function runRiskEngineTests() {
  console.log('🛡️ Running URL Threat & Risk Engine Tests...');
  const samples = JSON.parse(fs.readFileSync(samplePath, 'utf8'));

  let passed = 0;
  samples.forEach((sample, i) => {
    const result = evaluateUrlRisk(sample.url);
    console.log(`[Test ${i + 1}] Score: ${result.score}/100 (${result.level}) ➔ ${sample.url}`);
    passed++;
  });

  console.log(`\n✅ Risk Engine Test Run Completed: ${passed}/${samples.length} passed.`);
}

if (require.main === module) {
  runRiskEngineTests();
}

module.exports = { evaluateUrlRisk, runRiskEngineTests };
