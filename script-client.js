// Localization object for UI text
const i18n = {
    en: {
        placeholder: "Type a word or phrase...",
        button: "Translate",
        help: "Use short phrases for best results",
        errorServer: "Cannot reach translation server. Make sure it is running.",
        errorMissing: "Please select both languages before translating."
    },
    es: {
        placeholder: "Escriba una palabra o frase...",
        button: "Traducir",
        help: "Use frases cortas para mejores resultados",
        errorServer: "No se puede acceder al servidor de traducción. Asegúrate de que esté en ejecución.",
        errorMissing: "Por favor, selecciona ambos idiomas antes de traducir."
    },
    fr: {
        placeholder: "Tapez un mot ou une phrase...",
        button: "Traduire",
        help: "Utilisez de courtes phrases pour de meilleurs résultats",
        errorServer: "Impossible d'accéder au serveur de traduction. Assurez-vous qu'il est en cours d'exécution.",
        errorMissing: "Veuillez sélectionner les deux langues avant de traduire."
    },
    hi: {
        placeholder: "एक शब्द या वाक्यांश टाइप करें...",
        button: "अनुवाद करें",
        help: "सर्वोत्तम परिणामों के लिए छोटे वाक्यांशों का उपयोग करें",
        errorServer: "अनुवाद सर्वर तक नहीं पहुंच सकता। सुनिश्चित करें कि यह चल रहा है।",
        errorMissing: "अनुवाद करने से पहले कृपया दोनों भाषाओं का चयन करें।"
    }
};

// Map display names to language codes
const langCodes = {
    'English': 'en',
    'Spanish (Español)': 'es',
    'French (Français)': 'fr',
    'Hindi (हिंदी)': 'hi',
    'Mandarin (中文)': 'zh',
    'Vietnamese (Tiếng Việt)': 'vi'
};

// Reverse map: code to display name
const codeToDisplay = {
    'english': 'English',
    'spanish': 'Spanish (Español)',
    'french': 'French (Français)',
    'hindi': 'Hindi (हिंदी)',
    'mandarin': 'Mandarin (中文)',
    'vietnamese': 'Vietnamese (Tiếng Việt)'
};

let userLanguages = null;

document.addEventListener('DOMContentLoaded', function() {
    // Try to load saved language preferences
    const saved = localStorage.getItem('userLanguages');
    if (saved) {
        userLanguages = JSON.parse(saved);
        initializeApp();
    } else {
        // Set default language pair: Spanish to English
        userLanguages = { source: 'spanish', target: 'english' };
        localStorage.setItem('userLanguages', JSON.stringify(userLanguages));
        // Show modal on first load
        showLanguageModal(true);
    }

    const form = document.getElementById('translateForm');
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const submitBtn = document.getElementById('submitBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const confirmLanguage = document.getElementById('confirmLanguage');

    // Settings button reopens modal
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            showLanguageModal(false);
        });
    }

    // Source language dropdown change
    if (sourceLang) {
        sourceLang.addEventListener('change', function() {
            updateTargetLanguageOptions();
            updateUIText(); // Update UI text immediately when source changes
        });
    }

    // Target language dropdown change
    if (targetLang) {
        targetLang.addEventListener('change', function() {
            const confirmBtn = document.getElementById('confirmLanguage');
            const source = sourceLang.value;
            const target = targetLang.value;
            if (confirmBtn) {
                confirmBtn.disabled = !source || !target;
            }
        });
    }

    // Confirm language button
    if (confirmLanguage) {
        confirmLanguage.addEventListener('click', function() {
            const source = sourceLang.value;
            const target = targetLang.value;
            
            if (!source || !target) {
                alert('Please select both languages');
                return;
            }

            userLanguages = { source, target };
            localStorage.setItem('userLanguages', JSON.stringify(userLanguages));
            hideLanguageModal();
            initializeApp();
        });
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!userLanguages) {
            alert('Please set your language preferences first');
            return;
        }
        await startTranslate();
    });

    // Clear output on input
    input.addEventListener('input', function() {
        if (output.textContent.trim()) {
            clearOutputAnimated(output);
        }
    });
});

function showLanguageModal(isFirstLoad) {
    const modal = document.getElementById('languageModal');
    if (modal) {
        modal.classList.add('show');
        // Disable closing if first load
        if (isFirstLoad) {
            modal.style.pointerEvents = 'auto';
        }
    }
}

function hideLanguageModal() {
    const modal = document.getElementById('languageModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function updateTargetLanguageOptions() {
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const source = sourceLang.value;

    // SPANISH TRANSLATION ASSISTANT LOGIC:
    // - If user speaks Spanish: they can translate TO any other language (except Spanish)
    // - If user speaks any other language: LOCK to Spanish only

    let availableTargets = [];
    
    if (source === 'spanish') {
        // Spanish speaker: allow all languages except Spanish
        availableTargets = ['english', 'french', 'hindi', 'mandarin', 'vietnamese'];
    } else if (source !== '') {
        // Non-Spanish speaker: LOCK to Spanish only
        availableTargets = ['spanish'];
    }

    // Repopulate target dropdown
    targetLang.innerHTML = '<option value="">-- Select --</option>';
    availableTargets.forEach(lang => {
        const opt = document.createElement('option');
        opt.value = lang;
        opt.textContent = codeToDisplay[lang];
        targetLang.appendChild(opt);
    });

    // Auto-select default target language if available
    if (source !== 'spanish' && availableTargets.length === 1) {
        targetLang.value = 'spanish';
    } else if (source === 'spanish' && availableTargets.length > 0) {
        // For Spanish speakers, default to English
        targetLang.value = 'english';
    }

    // Enable confirm button only if both are selected
    const confirmBtn = document.getElementById('confirmLanguage');
    if (confirmBtn) {
        confirmBtn.disabled = !source || !targetLang.value;
    }
}

function initializeApp() {
    if (!userLanguages) return;
    updateUIText();
}

function updateUIText() {
    const input = document.getElementById('input');
    const submitBtn = document.getElementById('submitBtn');
    const help = document.querySelector('.help');
    const sourceLang = document.getElementById('sourceLang');
    
    // Get the source language (either from saved userLanguages or from modal dropdown)
    let sourceLangValue = userLanguages ? userLanguages.source : sourceLang.value;
    
    // Map to language code for i18n
    const sourceLangCode = langCodes[codeToDisplay[sourceLangValue]] || 'en';
    const texts = i18n[sourceLangCode] || i18n.en;

    if (input) input.placeholder = texts.placeholder;
    if (submitBtn) submitBtn.textContent = texts.button;
    if (help) help.textContent = texts.help;
}

function setBusy(busy) {
    document.getElementById('input').disabled = busy;
    document.getElementById('submitBtn').disabled = busy;
}

async function startTranslate() {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const text = input.value.trim();
    
    if (!text) return;
    if (!userLanguages || !userLanguages.source || !userLanguages.target) {
        output.textContent = i18n.en.errorMissing;
        return;
    }

    setBusy(true);
    try {
        const response = await fetch('/.netlify/functions/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                source: userLanguages.source,
                target: userLanguages.target
            })
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();

        if (data.error) {
            output.textContent = 'Error: ' + data.error;
        } else {
            const result = data.result || '';
            typeOutputAnimated(output, result);
        }
    } catch (error) {
        const sourceLangCode = langCodes[codeToDisplay[userLanguages.source]] || 'en';
        const errorMsg = i18n[sourceLangCode]?.errorServer || i18n.en.errorServer;
        output.textContent = errorMsg;
    } finally {
        setBusy(false);
    }
}

function clearOutputAnimated(el) {
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
