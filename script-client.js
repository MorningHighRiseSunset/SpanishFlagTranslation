// SpanishFlagTranslation/script-client.js

const LANG_CODES = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    hindi: 'hi',
    mandarin: 'zh',
    vietnamese: 'vi'
};

window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('userInput');
    const btn = document.getElementById('translateBtn');
    const output = document.getElementById('output');
    // Hide modal and language selection for auto-detect
    const modal = document.getElementById('languageModal');
    if (modal) modal.style.display = 'none';

    btn.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) {
            output.textContent = 'Please enter some text to translate';
            return;
        }

        output.textContent = 'Translating...';

        try {
            // When deployed to Netlify the function will be at /.netlify/functions/translate
            const res = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    text: text,
                    // No source: let server auto-detect
                    target: 'es'
                })
            });

            if (!res.ok) {
                let errMsg = `Translation failed (${res.status})`;
                try {
                    const errBody = await res.json();
                    errMsg = errBody?.error || errMsg;
                } catch {}
                if (res.status === 0 || res.status === 404 || res.status === 502 || res.status === 503) {
                    errMsg = 'Cannot reach translation server. Make sure it is running (see instructions).';
                }
                output.textContent = errMsg;
                return;
            }

            const json = await res.json();
            if (json.translatedText) {
                output.textContent = json.translatedText;
            } else {
                output.textContent = 'Translation succeeded but returned unexpected shape';
                console.warn(json);
            }

        } catch (err) {
            console.error('Client error', err);
            output.textContent = 'Cannot reach translation server. Make sure it is running (see instructions).';
        }
    });
});
