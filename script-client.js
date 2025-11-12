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
    const form = document.getElementById('translateForm');
    // Hide modal and language selection for auto-detect
    const modal = document.getElementById('languageModal');
    if (modal) modal.style.display = 'none';

    // Animated output helpers
    function clearOutputAnimated(el){
        return new Promise((resolve) => {
            const letters = Array.from(el.querySelectorAll('.letter'));
            if (letters.length === 0) { el.textContent = ''; resolve(); return; }
            let i = letters.length - 1;
            const step = () => {
                if (i < 0) { el.innerHTML = ''; resolve(); return; }
                const span = letters[i];
                span.classList.remove('pop-in');
                span.classList.add('pop-out');
                i--;
                setTimeout(step, 35);
            };
            step();
        });
    }

    function typeOutputAnimated(el, text){
        return new Promise((resolve) => {
            el.innerHTML = '';
            const chars = Array.from(String(text));
            chars.forEach((ch, idx) => {
                const span = document.createElement('span');
                span.className = 'letter';
                span.textContent = ch;
                el.appendChild(span);
                // stagger
                setTimeout(() => span.classList.add('pop-in'), idx * 28);
            });
            // resolve after last char animation
            setTimeout(() => resolve(), Math.max(250, chars.length * 28 + 60));
        });
    }

    async function showMessage(msg){
        await clearOutputAnimated(output);
        await typeOutputAnimated(output, msg);
    }

    const setBusy = (busy) => { btn.disabled = busy; input.disabled = busy; };

    const startTranslate = async () => {
        const text = input.value.trim();
    if (!text) { await showMessage('Please enter some text to translate (Por favor, introduce texto para traducir)'); return; }

    setBusy(true);
    await showMessage('Translating... (Traduciendo...)');

        try {
            // When deployed to Netlify the function will be at /.netlify/functions/translate
            const res = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({ text: text, target: 'es' })
            });

            if (!res.ok) {
                let errMsg = `Translation failed (${res.status}) (Error de traducción ${res.status})`;
                try {
                    const errBody = await res.json();
                    errMsg = errBody?.error || errMsg;
                } catch {}
                if (res.status === 0 || res.status === 404 || res.status === 502 || res.status === 503) {
                    errMsg = 'Cannot reach translation server. Make sure it is running. (No se puede acceder al servidor de traducción. Asegúrate de que esté en ejecución.)';
                }
                await showMessage(errMsg);
                setBusy(false);
                return;
            }

            const json = await res.json();
            if (json.translatedText) {
                await showMessage(json.translatedText);
            } else {
                await showMessage('Translation succeeded but returned unexpected shape (La traducción tuvo éxito pero devolvió una forma inesperada)');
                console.warn(json);
            }

        } catch (err) {
            console.error('Client error', err);
            await showMessage('Cannot reach translation server. Make sure it is running. (No se puede acceder al servidor de traducción. Asegúrate de que esté en ejecución.)');
        } finally {
            setBusy(false);
        }
    };

    // Wire up both click and form submit / Enter key
    btn.addEventListener('click', startTranslate);
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); startTranslate(); });
});
