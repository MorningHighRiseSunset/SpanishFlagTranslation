// Client script: auto-detect-as-you-type with optional manual override
// Localized UI strings
const i18n = {
    en: {
        placeholder: "Type a word or phrase...",
        button: "Translate",
        help: "Use short phrases for best results",
        errorServer: "Cannot reach translation server. Make sure it is running.",
        detectedPrefix: "Detected:",
        translatingTo: "Translating to:",
        manualMode: "Manual mode",
        manualSourceLabel: "I speak:",
        manualTargetLabel: "Translate to:",
        autoOption: "Auto-detect"
    },
    es: {
        placeholder: "Escriba una palabra o frase...",
        button: "Traducir",
        help: "Use frases cortas para mejores resultados",
        errorServer: "No se puede acceder al servidor de traducción. Asegúrate de que esté en ejecución.",
        detectedPrefix: "Detectado:",
        translatingTo: "Traduciendo a:",
        manualMode: "Modo manual",
        manualSourceLabel: "Hablo:",
        manualTargetLabel: "Traducir a:",
        autoOption: "Detección automática"
    }
};

// Friendly names for language codes
const codeToFriendly = { en: 'English', es: 'Spanish', fr: 'French', hi: 'Hindi', zh: 'Mandarin', vi: 'Vietnamese' };

// Manual options (values map to server mapping expectations)
const manualOptions = [
    { key: '', label_en: i18n.en.autoOption, label_es: i18n.es.autoOption },
    { key: 'english', label_en: 'English', label_es: 'Inglés' },
    { key: 'spanish', label_en: 'Spanish (Español)', label_es: 'Español' },
    { key: 'french', label_en: 'French (Français)', label_es: 'Francés' },
    { key: 'hindi', label_en: 'Hindi (हिंदी)', label_es: 'Hindi' },
    { key: 'mandarin', label_en: 'Mandarin (中文)', label_es: 'Mandarín' },
    { key: 'vietnamese', label_en: 'Vietnamese (Tiếng Việt)', label_es: 'Vietnamita' }
];

let detectTimer = null;
const DEBOUNCE_MS = 1500; // Increased from 600ms to avoid interrupting the user mid-word

// Map language codes to speech synthesis language tags
const codeToSpeechLang = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    hi: 'hi-IN',
    zh: 'zh-CN',
    vi: 'vi-VN'
};

// Track the last translation and language for manual playback (for iPhone TTS workaround)
let lastTranslation = { text: '', langCode: '' };

function speakText(text, langCode) {
    // Store for manual playback fallback
    lastTranslation = { text, langCode };
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = codeToSpeechLang[langCode] || 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    // attach basic lifecycle logging to help debug mobile playback issues


    window.speechSynthesis.speak(utterance);
}

// Try to unlock the audio stack on browsers (especially iOS) by resuming
// an AudioContext and playing a very short silent buffer in the same
// user gesture that triggered the translation. Call this from the
// form submit handler before performing async network work.
let __unlockAudioContext = null;
async function unlockAudioOnGesture() {
    try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        if (!__unlockAudioContext) __unlockAudioContext = new C();
        if (__unlockAudioContext.state === 'suspended' && typeof __unlockAudioContext.resume === 'function') {
            await __unlockAudioContext.resume();
        }
        // Play a real short tone to ensure audio device is fully unlocked on iOS
        const buffer = __unlockAudioContext.createBuffer(1, __unlockAudioContext.sampleRate * 0.05, __unlockAudioContext.sampleRate);
        const data = buffer.getChannelData(0);
        // Fill with tiny sine wave (amplitude ~0.001 to be almost silent but trigger audio device)
        const freq = 440; // A note
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.sin((i / buffer.length) * freq * 2 * Math.PI) * 0.001;
        }
        const src = __unlockAudioContext.createBufferSource();
        src.buffer = buffer;
        src.connect(__unlockAudioContext.destination);
        src.start(0);
        // audio unlocked
    } catch (err) {
        // audio unlock failed
    }
}

// Stub debug function (removed - no longer needed)
function debugLog(...args) {
    // console.log('TTS Debug:', ...args);
}

function setBusy(busy) {
  const input = document.getElementById('input');
  if (input) input.disabled = !!busy;
}function clearOutputAnimated(el) {
    const letters = Array.from(el.querySelectorAll('.letter'));
    if (letters.length === 0) {
        el.textContent = '';
        return;
    }
    let index = 0;
    const interval = setInterval(() => {
        if (index < letters.length) {
            letters[index].classList.add('pop-out');
            index++;
        } else {
            clearInterval(interval);
            el.textContent = '';
        }
    }, 35);
}

function typeOutputAnimated(el, text) {
    el.innerHTML = '';
    const chars = text.split('');
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char;
        el.appendChild(span);
        setTimeout(() => {
            span.classList.add('pop-in');
        }, index * 28);
    });
}

function localizeUI() {
    // Use page language to choose locale (default to en)
    const pageLang = (document.documentElement.lang || 'en').slice(0,2).toLowerCase();
    return i18n[pageLang] ? i18n[pageLang] : i18n.en;
}

function populateManualSelects() {
    const locale = localizeUI();
    const src = document.getElementById('manualSource');
    const tgt = document.getElementById('manualTarget');
    if (!src || !tgt) return;
    src.innerHTML = '';
    tgt.innerHTML = '';
    manualOptions.forEach(opt => {
        const o1 = document.createElement('option');
        o1.value = opt.key;
        o1.textContent = locale === i18n.es ? (opt.label_es || opt.label_en) : (opt.label_en || opt.label_es);
        src.appendChild(o1);

        const o2 = document.createElement('option');
        o2.value = opt.key === '' ? 'spanish' : opt.key; // default target options should include spanish first
        o2.textContent = locale === i18n.es ? (opt.label_es || opt.label_en) : (opt.label_en || opt.label_es);
        tgt.appendChild(o2);
    });
}

async function startTranslate() {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const detectLabel = document.getElementById('detectedInfo');
    if (!input || !output) return;
    const text = input.value.trim();
    if (!text) return;

    setBusy(true);
    try {
        // Build payload depending on manual mode
        const manualToggle = document.getElementById('manualToggle');
        const manualSource = document.getElementById('manualSource');
        const manualTarget = document.getElementById('manualTarget');

        const payload = { text };
        if (manualToggle && manualToggle.checked) {
            if (manualSource && manualSource.value) payload.source = manualSource.value;
            if (manualTarget && manualTarget.value) payload.target = manualTarget.value;
        }

        const response = await fetch('/.netlify/functions/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();

        if (data.error) {
            output.textContent = 'Error: ' + data.error;
        } else {
            const result = data.result || '';
            typeOutputAnimated(output, result);

            // Show play button for manual TTS on iPhone
            const playBtn = document.getElementById('playBtn');
            if (playBtn) playBtn.style.display = 'inline-block';

            // Determine source/target codes for deciding whether to speak
            const manualToggleEl = document.getElementById('manualToggle');
            const manualSourceEl = document.getElementById('manualSource');
            const manualTargetEl = document.getElementById('manualTarget');

            // Map manual-select keys to short codes (keeps mapping local to Spanish flag only)
            const manualKeyToCode = {
                english: 'en',
                spanish: 'es',
                french: 'fr',
                hindi: 'hi',
                mandarin: 'zh',
                vietnamese: 'vi'
            };

            const detectedSource = data.detectedSource || null;
            const usedTarget = data.targetUsed || null;



            // Prefer detected/returned codes; fall back to manual selection when manual mode is on
            const effectiveSource = detectedSource || (manualToggleEl && manualToggleEl.checked && manualSourceEl && manualSourceEl.value ? manualKeyToCode[manualSourceEl.value] : null);
            const effectiveTarget = usedTarget || (manualToggleEl && manualToggleEl.checked && manualTargetEl && manualTargetEl.value ? manualKeyToCode[manualTargetEl.value] : null);



            // TTS disabled - only play when user clicks Play button
            // Store translation for manual playback
            if ((effectiveSource === 'en' && effectiveTarget === 'es') || (effectiveSource === 'es' && effectiveTarget === 'en')) {
                lastTranslation = { text: result, langCode: effectiveTarget || 'es' };
            }

            // Update detection/target display
            if (detectLabel) {
                if (manualToggleEl && manualToggleEl.checked) {
                    const s = manualSourceEl && manualSourceEl.value ? manualSourceEl.value : localeString('autoOption');
                    const t = manualTargetEl && manualTargetEl.value ? manualTargetEl.value : '—';
                    detectLabel.textContent = `Manual: ${friendlyNameFromManualKey(s)} → ${friendlyNameFromManualKey(t)}`;
                } else {
                    const det = data.detectedSource || null;
                    const targ = data.targetUsed || null;
                    const detectedName = det ? (codeToFriendly[det] || det) : '—';
                    const targetName = targ ? (codeToFriendly[targ] || targ) : '—';
                    const locale = localizeUI();
                    detectLabel.textContent = `${locale.detectedPrefix} ${detectedName} → ${locale.translatingTo} ${targetName}`;
                }
            }
        }
    } catch (error) {
        const locale = localizeUI();
        output.textContent = locale.errorServer;
    } finally {
        setBusy(false);
    }
}

// Debounced detection-only call: updates detected language / target display but
// does not render or speak the translation. Keeps auto-detection while forcing
// the user to press Submit to see/hear the actual translation.
async function startDetect() {
    const input = document.getElementById('input');
    const detectLabel = document.getElementById('detectedInfo');
    if (!input || !detectLabel) return;
    const text = input.value.trim();
    if (!text) {
        detectLabel.textContent = 'Detected: — → Translating to: —';
        return;
    }

    try {
        const payload = { text };
        const response = await fetch('/.netlify/functions/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) return; // leave detection UI unchanged on error
        const data = await response.json();
        const det = data.detectedSource || null;
        const targ = data.targetUsed || null;
        const detectedName = det ? (codeToFriendly[det] || det) : '—';
        const targetName = targ ? (codeToFriendly[targ] || targ) : '—';
        const locale = localizeUI();
        detectLabel.textContent = `${locale.detectedPrefix} ${detectedName} → ${locale.translatingTo} ${targetName}`;
    } catch (e) {
        // ignore silently; detection is best-effort
    }
}

function friendlyNameFromManualKey(key) {
    if (!key) return localizeUI().autoOption || 'Auto';
    // map manual select keys to display names
    const m = manualOptions.find(o => o.key === key);
    if (!m) return key;
    const locale = localizeUI();
    return locale === i18n.es ? (m.label_es || m.label_en) : (m.label_en || m.label_es);
}

function localeString(k) {
    const l = localizeUI();
    return l[k] || k;
}

// Initialize UI
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('translateForm');
  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const detectBar = document.getElementById('detectBar');
  const detectedInfo = document.getElementById('detectedInfo');
  const manualToggle = document.getElementById('manualToggle');
  const manualControls = document.getElementById('manualControls');
  const manualSource = document.getElementById('manualSource');
  const manualTarget = document.getElementById('manualTarget');

  // Localize placeholder/button/help
  const locale = localizeUI();
  if (input) input.placeholder = locale.placeholder;
  
  const help = document.querySelector('.help');
  if (help) help.textContent = locale.help;
  const manualToggleLabel = document.getElementById('manualToggleLabel');
  if (manualToggleLabel) manualToggleLabel.textContent = locale.manualMode;
  const srcLabel = document.querySelector('label[for="manualSource"]');
  const tgtLabel = document.querySelector('label[for="manualTarget"]');
  if (srcLabel) srcLabel.textContent = locale.manualSourceLabel;
  if (tgtLabel) tgtLabel.textContent = locale.manualTargetLabel;    populateManualSelects();

    // Hide manual controls initially
    if (manualControls) manualControls.style.display = 'none';

            // Submit handler
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await startTranslate();
        });
    }

    // Debounced input -> only run detection (do NOT perform full translation).
    // Full translation + TTS require pressing Submit (Enter/Go or Translate button).
    if (input) {
        input.addEventListener('input', function() {
            if (output && output.textContent.trim()) clearOutputAnimated(output);
            if (detectTimer) clearTimeout(detectTimer);
            detectTimer = setTimeout(() => startDetect(), DEBOUNCE_MS);
        });
    }

    // Manual toggle
    if (manualToggle) {
        manualToggle.addEventListener('change', function() {
            const manualOn = manualToggle.checked;
            if (manualControls) manualControls.style.display = manualOn ? 'flex' : 'none';
            // re-run translate to respect manual mode change
            startTranslate();
        });
    }

    // Play button: manual TTS trigger
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            // Unlock audio on gesture
            await unlockAudioOnGesture();
            if (lastTranslation.text && lastTranslation.langCode) {
                speakText(lastTranslation.text, lastTranslation.langCode);
            }
        });
    }

});
