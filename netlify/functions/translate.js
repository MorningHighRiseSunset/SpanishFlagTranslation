// Netlify function: enhanced translator with intent parsing and quoted-phrase handling
// This file was migrated from the local server implementation so behavior is consistent

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// Safe debug: log presence of the API key (masked) so we can tell if Netlify injected it
try {
  if (GOOGLE_API_KEY) {
    const masked = `${GOOGLE_API_KEY.slice(0, 6)}...${GOOGLE_API_KEY.slice(-4)}`;
    console.log('GOOGLE_API_KEY present:', true, 'masked:', masked);
  } else {
    console.log('GOOGLE_API_KEY present:', false);
  }
} catch (e) {
  // Defensive: don't let logging errors break the function
  console.log('Error while logging GOOGLE_API_KEY presence', String(e));
}
const path = require('path');

// Load language aliases shipped with the site (falls back gracefully)
let languageAliases = {};
try {
  // try a few likely locations for the shipped language_aliases.json depending on where this file lives
  // 1) when this file is in netlify/functions -> ../../language_aliases.json
  // 2) when this file is in project root -> ./language_aliases.json
  try {
    languageAliases = require(path.join(__dirname, '..', '..', 'language_aliases.json'));
  } catch (e1) {
    try {
      languageAliases = require(path.join(__dirname, 'language_aliases.json'));
    } catch (e2) {
      languageAliases = {};
    }
  }
} catch (e) {
  languageAliases = {};
}

const canonicalToCode = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  hindi: 'hi',
  mandarin: 'zh',
  vietnamese: 'vi',
  portuguese: 'pt',
  german: 'de',
  italian: 'it',
  arabic: 'ar',
  japanese: 'ja',
  korean: 'ko',
  russian: 'ru'
};

const aliasToCode = {};
Object.keys(languageAliases).forEach((canonical) => {
  const list = languageAliases[canonical] || [];
  const code = canonicalToCode[String(canonical).trim().toLowerCase()] || String(canonical).trim().toLowerCase();
  list.forEach((a) => {
    aliasToCode[String(a).trim().toLowerCase()] = code;
  });
  aliasToCode[String(canonical).trim().toLowerCase()] = code;
});

// Ensure canonical names from our built-in map are available even if the shipped
// language_aliases.json couldn't be loaded into the function bundle.
Object.keys(canonicalToCode).forEach((canonical) => {
  aliasToCode[String(canonical).trim().toLowerCase()] = canonicalToCode[canonical];
});

const fallbackMap = {
  en: 'en', es: 'es', fr: 'fr', hi: 'hi', zh: 'zh', vi: 'vi', pt: 'pt', de: 'de', it: 'it', ar: 'ar', ja: 'ja', ko: 'ko', ru: 'ru'
};

function mapLanguageNameToCode(name) {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();
  if (!n) return null;
  if (aliasToCode[n]) return aliasToCode[n];
  if (fallbackMap[n]) return fallbackMap[n];
  const cleaned = n.replace(/[^a-z]/g, '');
  if (aliasToCode[cleaned]) return aliasToCode[cleaned];
  if (fallbackMap[cleaned]) return fallbackMap[cleaned];
  if (/^[a-z]{2}$/.test(cleaned)) return cleaned;
  return null;
}

async function callGoogleDetect(q) {
  const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_API_KEY}`;
  const payload = { q: String(q) };
  const apiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!apiRes.ok) {
    // Log Google Detect response for debugging (do not log API key)
    let textErr = '';
    try {
      textErr = await apiRes.text();
    } catch (e) {
      textErr = String(e);
    }
    console.log('Google Detect failed', { status: apiRes.status, body: textErr.slice(0,2000) });
    const err = new Error('Google detect error');
    err.status = apiRes.status;
    err.details = textErr;
    throw err;
  }
  const json = await apiRes.json();
  if (json && json.data && json.data.detections && json.data.detections[0] && json.data.detections[0][0]) {
    return json.data.detections[0][0].language;
  }
  throw new Error('Invalid response from Google Detect');
}

async function callGoogleTranslate(q, target, source) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
  const payload = { q: String(q), target: target, format: 'text' };
  if (source) payload.source = source;


  const apiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!apiRes.ok) {
    // Log Google Translate response for debugging (trim large bodies)
    let textErr = '';
    try {
      textErr = await apiRes.text();
    } catch (e) {
      textErr = String(e);
    }
    console.log('Google Translate failed', { status: apiRes.status, body: textErr.slice(0,2000) });
    const err = new Error('Google API error');
    err.status = apiRes.status;
    err.details = textErr;
    throw err;
  }

  const json = await apiRes.json();

  if (json && json.data && json.data.translations && json.data.translations[0]) {
    return json.data.translations[0];
  }
  const err = new Error('Invalid response from Google Translate');
  err.raw = json;
  throw err;
}

exports.handler = async function(event) {
  console.log('translate handler invoked');
  try {
    console.log('Incoming event body (raw):', typeof event.body === 'string' ? event.body.slice(0,1000) : event.body);
    if (!GOOGLE_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Server: API key not configured' }) };
    const body = JSON.parse(event.body || '{}');
    console.log('Parsed request body:', { text: body.text ? '[REDACTED]' : undefined, source: body.source, target: body.target });
    const { text, source: userSource, target: userTarget } = body || {};
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Missing `text` in request body' }) };

    // Map user language names (from dropdown) to codes (be resilient if mapping fails)
    let sourceCode = null;
    if (userSource) {
      sourceCode = mapLanguageNameToCode(userSource);
      if (!sourceCode) console.log('Could not map source language:', userSource);
    }

    let targetCode = 'es'; // default to Spanish (client will set explicit language pair)
     if (userTarget) {
       const mapped = mapLanguageNameToCode(userTarget);
       if (mapped) {
         targetCode = mapped;
       } else {
         console.log('Could not map target language:', userTarget, 'falling back to', targetCode);
       }
     }    // Translate user's input to English to parse intent (skip if already English)
    // Debug: log resolved language codes
    console.log('Resolved language codes', { sourceCode, targetCode });
    let englishText;
    try {
      if (sourceCode && sourceCode !== 'en') {
        const t = await callGoogleTranslate(text, 'en', sourceCode);
        englishText = t.translatedText || String(text);
      } else {
        englishText = String(text);
      }
    } catch (err) {
      englishText = String(text);
    }

    // Multi-language patterns: English, Spanish, French
    const patterns = [
      // English patterns
      /how\s+(?:do\s+i|do\s+you)\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /how\s+to\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /what\s+is\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /(?:can\s+you\s+)?translate\s+(.+?)\s+(?:to|into)\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /how\s+would\s+i\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /how\s+do\s+i\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      // Spanish patterns: ¿Cómo se dice X en Y?
      /¿?\s*cómo\s+se\s+dice\s+(.+?)\s+en\s+([a-záéíóúüñ\s]+)\s*\??/i,
      /¿?\s*qué\s+significa\s+(.+?)\s+en\s+([a-záéíóúüñ\s]+)\s*\??/i,
      // French patterns: Comment dit-on X en Y?
      /comment\s+(?:dit|on\s+dit)\s+(.+?)\s+en\s+([a-zA-Zàâäéèêëîïôöùûüœæç\s]+)/i,
      /qu'est-ce\s+que\s+c'est\s+(.+?)\s+en\s+([a-zA-Zàâäéèêëîïôöùûüœæç\s]+)/i
    ];

    let match = null;
    for (const p of patterns) {
      const m = englishText.match(p) || text.match(p);
      if (m) { match = m; break; }
    }

    if (match) {
      const phraseToTranslate = match[1].trim().replace(/["'«»""‹›]/g, '');
      const langName = match[2].trim().toLowerCase();
      const extractedTargetCode = mapLanguageNameToCode(langName);
      
      if (extractedTargetCode) {
        try {
          // Translate the extracted phrase to the target language mentioned in the question
          const translated = await callGoogleTranslate(phraseToTranslate, extractedTargetCode, sourceCode);
          // Return both the human-friendly result and the raw provider response for debugging
              return {
                statusCode: 200,
                body: JSON.stringify({ result: translated.translatedText })
              };
        } catch (err) {
          return { statusCode: 502, body: JSON.stringify({ error: 'Translation provider error', details: err.details || String(err) }) };
        }
      }
    }

    // Fallback: translate from source to target language using user's preference
    try {
      console.log('Calling Google Translate for fallback', { text: text.slice(0,200), targetCode, sourceCode });
      const translated = await callGoogleTranslate(text, targetCode, sourceCode);
      return {
        statusCode: 200,
        body: JSON.stringify({ result: translated.translatedText })
      };
    } catch (err) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Translation provider error', details: err.details || String(err) }) };
    }

  } catch (err) {
    console.error('Unhandled error in translate handler:', err);
    const errorDetails = err && err.stack ? err.stack : String(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: errorDetails }) };
  }
};
