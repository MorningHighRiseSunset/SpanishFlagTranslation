// Netlify function: enhanced translator with intent parsing and quoted-phrase handling
// Copied from project root and adjusted to run under netlify/functions/

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const path = require('path');

// Load language aliases shipped with the site (falls back gracefully)
let languageAliases = {};
try {
  // when this file is in netlify/functions, language_aliases.json is two levels up
  languageAliases = require(path.join(__dirname, '..', '..', 'language_aliases.json'));
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
    const textErr = await apiRes.text();
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
    const textErr = await apiRes.text();
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
  try {
    if (!GOOGLE_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Server: API key not configured' }) };
    const body = JSON.parse(event.body || '{}');
    const { text, source, target: explicitTarget } = body || {};
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Missing `text` in request body' }) };

    let detectedSource = source;
    if (!detectedSource) {
      try {
        detectedSource = await callGoogleDetect(text);
      } catch (e) {
        detectedSource = null;
      }
    }

    let quotedPhrase = null;
    let quotedFromOriginal = false;
    const quotedMatch = text.match(/["'«»“”‹›](.+?)["'«»“”‹›]/);
    if (quotedMatch && quotedMatch[1] && quotedMatch[1].trim()) {
      quotedPhrase = quotedMatch[1].trim();
      quotedFromOriginal = true;
    }

    let englishText;
    try {
      if (detectedSource && detectedSource !== 'en') {
        const t = await callGoogleTranslate(text, 'en', detectedSource);
        englishText = t.translatedText || String(text);
      } else {
        englishText = String(text);
      }
    } catch (err) {
      englishText = String(text);
    }

    const patterns = [
      /how\s+(?:do\s+i|do\s+you)\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /how\s+to\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /what\s+is\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /(?:can\s+you\s+)?translate\s+(.+?)\s+(?:to|into)\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /how\s+would\s+i\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i,
      /how\s+do\s+i\s+say\s+(.+?)\s+in\s+([a-zA-Z\u00C0-\u024F\s]+)/i
    ];

    let match = null;
    for (const p of patterns) {
      const m = englishText.match(p);
      if (m) { match = m; break; }
    }

    if (match) {
      const phraseEnglish = match[1].trim().replace(/["'«»“”‹›]/g, '');
      const langName = match[2].trim().toLowerCase();
      const targetCode = mapLanguageNameToCode(langName);
      if (targetCode) {
        try {
          if (quotedPhrase && quotedFromOriginal) {
            const sourceForPhrase = detectedSource || source || undefined;
            const translated = await callGoogleTranslate(quotedPhrase, targetCode, sourceForPhrase);
            return { statusCode: 200, body: JSON.stringify({ translatedText: translated.translatedText, raw: translated }) };
          }

          const translated = await callGoogleTranslate(phraseEnglish, targetCode, 'en');
          return { statusCode: 200, body: JSON.stringify({ translatedText: translated.translatedText, raw: translated }) };
        } catch (err) {
          return { statusCode: 502, body: JSON.stringify({ error: 'Translation provider error', details: err.details || String(err) }) };
        }
      }
    }

    const finalTarget = explicitTarget || 'es';
    try {
      const sourceForTranslate = (detectedSource && detectedSource !== finalTarget) ? detectedSource : undefined;
      const translated = await callGoogleTranslate(text, finalTarget, sourceForTranslate);
      return { statusCode: 200, body: JSON.stringify({ translatedText: translated.translatedText, raw: translated }) };
    } catch (err) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Translation provider error', details: err.details || String(err) }) };
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: String(err) }) };
  }
};
