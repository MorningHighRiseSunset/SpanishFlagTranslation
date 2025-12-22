import { verbs } from './slt_verbs.js';

// --- Needed definitions from oldsltscript.js ---
const pronouns = ["I", "You", "He", "We", "You all", "They"];
const spanishPronouns = ["Yo", "Tú", "Él/Ella/Usted", "Nosotros", "Vosotros", "Ellos/Ellas/Ustedes"];
const tenses = [
  "Present", "Preterite", "Imperfect", "Future", "Conditional",
  "Present Perfect", "Past Perfect", "Future Perfect", "Conditional Perfect"
];

const englishNotePrompts = [
  "Translate: What's your favorite food?",
  "Translate: I like apples!",
  "Translate: Where do you live?",
  "Translate: My name is Ana.",
  "Translate: I am learning Spanish.",
  "Translate: Do you have any pets?",
  "Translate: It's raining today.",
  "Translate: I want to travel to Spain.",
  "Translate: How old are you?",
  "Translate: I don't understand.",
  // --- Added prompts ---
  "Translate: What time is it?",
  "Translate: I am going to the store.",
  "Translate: She is my friend.",
  "Translate: We are studying Spanish.",
  "Translate: Can you help me?",
  "Translate: I don't know the answer.",
  "Translate: Where is the bathroom?",
  "Translate: I am tired.",
  "Translate: I need water.",
  "Translate: How much does it cost?",
  "Translate: I like to read books.",
  "Translate: He is very funny.",
  "Translate: I want to eat something.",
  "Translate: The weather is nice today.",
  "Translate: I have a question.",
  // --- Newest prompts ---
  "Translate: I am learning new words.",
  "Translate: What is your name?",
  "Translate: I have two brothers.",
  "Translate: Where are you from?",
  "Translate: I like to play soccer.",
  "Translate: The book is on the table.",
  "Translate: I am going to bed.",
  "Translate: She is a teacher.",
  "Translate: We are friends.",
  "Translate: I don't speak much Spanish.",
  "Translate: Can you repeat that, please?",
  "Translate: I am hungry.",
  "Translate: The cat is black.",
  "Translate: I live in a big city.",
  "Translate: What do you want to do today?"
];

const englishToSpanishPrompts = {
  "Translate: What's your favorite food?": "¿Cuál es tu comida favorita?",
  "Translate: I like apples!": "¡Me gustan las manzanas!",
  "Translate: Where do you live?": "¿Dónde vives?",
  "Translate: My name is Ana.": "Me llamo Ana.",
  "Translate: I am learning Spanish.": "Estoy aprendiendo español.",
  "Translate: Do you have any pets?": "¿Tienes mascotas?",
  "Translate: It's raining today.": "Hoy está lloviendo.",
  "Translate: I want to travel to Spain.": "Quiero viajar a España.",
  "Translate: How old are you?": "¿Cuántos años tienes?",
  "Translate: I don't understand.": "No entiendo.",
  // --- Added translations ---
  "Translate: What time is it?": "¿Qué hora es?",
  "Translate: I am going to the store.": "Voy a la tienda.",
  "Translate: She is my friend.": "Ella es mi amiga.",
  "Translate: We are studying Spanish.": "Estamos estudiando español.",
  "Translate: Can you help me?": "¿Puedes ayudarme?",
  "Translate: I don't know the answer.": "No sé la respuesta.",
  "Translate: Where is the bathroom?": "¿Dónde está el baño?",
  "Translate: I am tired.": "Estoy cansado.",
  "Translate: I need water.": "Necesito agua.",
  "Translate: How much does it cost?": "¿Cuánto cuesta?",
  "Translate: I like to read books.": "Me gusta leer libros.",
  "Translate: He is very funny.": "Él es muy gracioso.",
  "Translate: I want to eat something.": "Quiero comer algo.",
  "Translate: The weather is nice today.": "Hace buen tiempo hoy.",
  "Translate: I have a question.": "Tengo una pregunta."
};
// --- Newest translations ---
// The rest of the translations should be outside this object or added with proper commas if continuing the object.
// (Table rows should be built as strings inside a function, not as JSX.)

// --- Accent-insensitive normalization helper ---
function normalizeSpanish(str) {
  return str
    .normalize("NFD") // decompose accents
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/ñ/g, "n") // treat ñ as n for matching
    .replace(/Ñ/g, "N");
}

// --- Practice Mode: Spanish → English ---
practiceFormEs.onsubmit = function(e) {
  e.preventDefault();
  const input = practiceInputEs.value.trim().toLowerCase();
  if (!input) return;

  let found = null;
  // 1. Try to match full conjugated forms (now accent-insensitive)
  for (let verb of verbs) {
    for (let t of tenses) {
      if (!verb.conjugations[t]) continue;
      for (let i = 0; i < spanishPronouns.length; ++i) {
        const sp = verb.conjugations[t][i];
        if (
          sp &&
          (
            normalizeSpanish(`${spanishPronouns[i]} ${sp}`.toLowerCase()) === normalizeSpanish(input) ||
            normalizeSpanish(sp.toLowerCase()) === normalizeSpanish(input)
          )
        ) {
          found = {verb, tense: t, pronounIdx: i};
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }

  // 2. If not found, try to match infinitive (e.g., "aprender"), accent-insensitive
  if (!found) {
    for (let verb of verbs) {
      if (normalizeSpanish(verb.spanish.toLowerCase()) === normalizeSpanish(input)) {
        found = {verb, tense: null, pronounIdx: null, isInfinitive: true};
        break;
      }
    }
  }

  const englishBox = document.getElementById('practiceInputEsEnglish');
  if (!found) {
    englishBox.value = '';
    practiceResults.innerHTML = `<div style="color:red; padding: 10px; background-color: #fee; border: 1px solid #fcc; border-radius: 4px;">
      <strong>Could not find a matching verb.</strong><br>
      <small style="color: #666;">This tool is specifically designed for Spanish verbs (e.g., "ser", "estar", "hacer"). 
      For translating other words or phrases, please use the general translation tool below.</small>
    </div>`;
    return;
  }

  // 3. If infinitive, show all tenses for all pronouns
  if (found.isInfinitive) {
    // Tab UI for multiple meanings
    let tabHtml = '';
    let meanings = Array.isArray(found.verb.english) ? found.verb.english : [found.verb.english];
    let meaningIdx = 0;
    tabHtml = `<div id="meaningTabsEs" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">` +
      meanings.map((m, idx) =>
        `<button class="meaning-tab-es${idx === meaningIdx ? ' active' : ''}" data-meaning-idx="${idx}">${m}</button>`
      ).join('') +
      `</div>`;

    englishBox.value = meanings[meaningIdx];
    let html = tabHtml;
    html += `<h3>English equivalents for <b>${found.verb.spanish}</b> (all pronouns)</h3>`;
    html += `<table border="1" style="width:100%;text-align:center;">
      <tr>
        <th>Pronoun</th>
        <th>Tense</th>
        <th>Spanish</th>
        <th>English</th>
      </tr>`;
    for (let i = 0; i < spanishPronouns.length; ++i) {
      for (let t of tenses) {
        let sp = found.verb.conjugations[t] ? found.verb.conjugations[t][i] : "(not available)";
        if (sp === "(not available)") continue; // <-- Only render if available
        let eng = buildEnglishPhrase(found.verb, t, i, meaningIdx);
        html += `<tr>
          <td>${spanishPronouns[i]}</td>
          <td>
            ${t}
            <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
          </td>
          <td>
            ${sp}
            <button type="button" class="speak-btn" data-text="${spanishPronouns[i]} ${sp}" title="Hear pronunciation">🔊</button>
          </td>
          <td>
            ${eng}
            <button type="button" class="speak-btn-en" data-text="${eng}" title="Hear English pronunciation">🔊</button>
          </td>
        </tr>`;
      }
    }
    html += `</table>`;
    practiceResults.innerHTML = html;

    // Tab click handler for Spanish→English
    if (meanings.length > 1) {
      document.querySelectorAll('.meaning-tab-es').forEach(btn => {
        btn.onclick = () => {
          let idx = parseInt(btn.getAttribute('data-meaning-idx'));
          englishBox.value = meanings[idx];
          // Re-render table for selected meaning
          let html = `<div id="meaningTabsEs" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">` +
            meanings.map((m, j) =>
              `<button class="meaning-tab-es${j === idx ? ' active' : ''}" data-meaning-idx="${j}">${m}</button>`
            ).join('') +
            `</div>`;
          html += `<h3>English equivalents for <b>${found.verb.spanish}</b> (all pronouns)</h3>`;
          html += `<table border="1" style="width:100%;text-align:center;">
            <tr>
              <th>Pronoun</th>
              <th>Tense</th>
              <th>Spanish</th>
              <th>English</th>
            </tr>`;
          for (let i = 0; i < spanishPronouns.length; ++i) {
            for (let t of tenses) {
              let sp = found.verb.conjugations[t] ? found.verb.conjugations[t][i] : "(not available)";
              if (sp === "(not available)") continue; // <-- Only render if available
              let eng = buildEnglishPhrase(found.verb, t, i, idx);
              html += `<tr>
                <td>${spanishPronouns[i]}</td>
                <td>
                  ${t}
                  <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
                </td>
                <td>
                  ${sp}
                  <button type="button" class="speak-btn" data-text="${spanishPronouns[i]} ${sp}" title="Hear pronunciation">🔊</button>
                </td>
                <td>
                  ${eng}
                  <button type="button" class="speak-btn-en" data-text="${eng}" title="Hear English pronunciation">🔊</button>
                </td>
              </tr>`;
            }
          }
          html += `</table>`;
          practiceResults.innerHTML = html;
        };
      });
    }
    return;
  }

  // Set the English translation in the output field
  let meanings = Array.isArray(found.verb.english) ? found.verb.english : [found.verb.english];
  let meaningIdx = 0;
  englishBox.value = `${pronouns[found.pronounIdx]} ${buildEnglishPhrase(found.verb, found.tense, found.pronounIdx, meaningIdx).replace(pronouns[found.pronounIdx] + ' ', '')}`;

  // Tab UI for multiple meanings
  let tabHtml = '';
  if (meanings.length > 1) {
    tabHtml = `<div id="meaningTabsEs" style="display:flex;gap:8px;margin-bottom:8px;">` +
      meanings.map((m, idx) =>
        `<button class="meaning-tab-es${idx === meaningIdx ? ' active' : ''}" data-meaning-idx="${idx}">${m}</button>`
      ).join('') +
      `</div>`;
  }

  let html = tabHtml;
  html += `<h3>English equivalents for <b>${found.verb.spanish}</b> (${spanishPronouns[found.pronounIdx]})</h3>`;
  html += `<table border="1" style="width:100%;text-align:center;">
    <tr>
      <th>Tense</th>
      <th>English</th>
      <th>Spanish</th>
    </tr>`;
  tenses.forEach(t => {
    let eng = buildEnglishPhrase(found.verb, t, found.pronounIdx, meaningIdx);
    let sp = found.verb.conjugations[t] ? found.verb.conjugations[t][found.pronounIdx] : "(not available)";
    if (sp === "(not available)") return; // <-- Only render if available
    html += `<tr>
      <td>
        ${t}
        <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
      </td>
      <td>
        ${eng}
        <button type="button" class="speak-btn-en" data-text="${eng}" title="Hear English pronunciation">🔊</button>
      </td>
      <td>
        ${sp}
        <button type="button" class="speak-btn" data-text="${spanishPronouns[found.pronounIdx]} ${sp}" title="Hear pronunciation">🔊</button>
      </td>
    </tr>`;
  });
  html += `</table>`;
  practiceResults.innerHTML = html;
};

// --- Practice Mode: English → Spanish ---
practiceFormEn.onsubmit = function(e) {
  e.preventDefault();
  const input = practiceInputEn.value.trim();
  if (!input) return;

  // If this is a tab click, meaningIdx is passed in the event
  let meaningIdx = (e && typeof e.meaningIdx === "number") ? e.meaningIdx : 0;

  // Always use parseEnglishPhrase to get the correct meaningIdx for the input
  const result = parseEnglishPhrase(input, meaningIdx);
  const spanishBox = document.getElementById('practiceInputEnSpanish');
  if (!result) {
    spanishBox.value = '';
    practiceResults.innerHTML = `<div style="color:red; padding: 10px; background-color: #fee; border: 1px solid #fcc; border-radius: 4px;">
      <strong>Could not find a matching verb.</strong><br>
      <small style="color: #666;">This tool is specifically designed for Spanish verbs (e.g., "to be", "to have", "to do"). 
      For translating other words or phrases, please use the general translation tool below.</small>
    </div>`;
    return;
  }

  // Use allCandidates if present, otherwise just the single result
  let allCandidates = result.allCandidates || [result];
  let currentIdx = meaningIdx;
  let candidate = allCandidates[currentIdx] || allCandidates[0];

  let verb = candidate.verb;
  meaningIdx = candidate.meaningIdx || 0;
  const pronounIdx = (typeof candidate.pronounIdx === "number") ? candidate.pronounIdx : 0;
  const detectedTense = candidate.tense || "Present";

  // Special filtering for "to have (auxiliary)" and "to have (possession)"
  const englishMeaning = Array.isArray(verb.english) ? verb.english[meaningIdx] : verb.english;
  let filteredTenses;
  if (englishMeaning === "to have (auxiliary)") {
    // Only show perfect tenses that are available (or their mapped simple tense is available)
    filteredTenses = [
      "Present Perfect", "Past Perfect", "Future Perfect", "Conditional Perfect"
    ].filter(t =>
      (t === "Present Perfect" && verb.conjugations["Present"]) ||
      (t === "Past Perfect" && verb.conjugations["Imperfect"]) ||
      (t === "Future Perfect" && verb.conjugations["Future"]) ||
      (t === "Conditional Perfect" && verb.conjugations["Conditional"])
    );
  } else if (englishMeaning === "to have (possession)") {
    filteredTenses = [
      "Present", "Preterite", "Imperfect", "Future", "Conditional"
    ].filter(t => verb.conjugations[t]);
  } else {
    filteredTenses = tenses.filter(t => verb.conjugations[t]);
  }

  // Tab UI for multiple meanings 
  let tabHtml = '';
  if (allCandidates.length > 1) {
    tabHtml = `<div id="meaningTabs" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">` +
      allCandidates.map((c, idx) => {
        let label;
        if (Array.isArray(c.verb.english)) {
          const meaning = c.verb.english[c.meaningIdx];
          if (meaning === "to have (auxiliary)") label = "haber (auxiliary) / to have (auxiliary)";
          else if (meaning === "to have (possession)" || meaning === "to have (shows possession)") label = "tener (shows possession) / to have (shows possession)";
          else label = `${c.verb.spanish} / ${meaning.replace(/^to /, '')}`;
        } else {
          label = `${c.verb.spanish} / ${c.verb.english.replace(/^to /, '')}`;
        }
        return `<button class="meaning-tab${idx === currentIdx ? ' active' : ''}" data-meaning-idx="${idx}">${label}</button>`;
      }).join('') +
      `</div>`;
  }

  let tenseToShow = detectedTense || "Present";
  let spanish = verb.conjugations[tenseToShow] ? verb.conjugations[tenseToShow][pronounIdx] : "(not available)";
  spanishBox.value = `${spanishPronouns[pronounIdx]} ${spanish}`;

  let html = tabHtml;
  html += `<h3>Spanish conjugations for <b>${englishMeaning}</b> (${pronouns[pronounIdx]})`;
  if (detectedTense) html += ` <span style="font-size:0.9em;color:#666;">[${detectedTense}]</span>`;
  html += `</h3>`;
  html += `<table border="1" style="width:100%;text-align:center;">
    <tr>
      <th>Tense</th>
      <th>Spanish</th>
      <th>English</th>
    </tr>`;
  filteredTenses.forEach(t => {
    // For "to have (auxiliary)", map perfect tenses to simple tenses for haber
    let conjugation;
    if (englishMeaning === "to have (auxiliary)") {
      if (t === "Present Perfect") conjugation = verb.conjugations["Present"] ? verb.conjugations["Present"][pronounIdx] : "(not available)";
      else if (t === "Past Perfect") conjugation = verb.conjugations["Imperfect"] ? verb.conjugations["Imperfect"][pronounIdx] : "(not available)";
      else if (t === "Future Perfect") conjugation = verb.conjugations["Future"] ? verb.conjugations["Future"][pronounIdx] : "(not available)";
      else if (t === "Conditional Perfect") conjugation = verb.conjugations["Conditional"] ? verb.conjugations["Conditional"][pronounIdx] : "(not available)";
      else conjugation = "(not available)";
    } else {
      conjugation = verb.conjugations[t] ? verb.conjugations[t][pronounIdx] : "(not available)";
    }
    if (conjugation === "(not available)") return; // <-- Only render if available
    let english = buildEnglishPhrase(verb, t, pronounIdx, meaningIdx);
    let highlight = (detectedTense && t === detectedTense) ? ' style="background:#e0e7ff;font-weight:bold;"' : '';
    html += `<tr${highlight}>
      <td>
        ${t}
        <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
      </td>
      <td>
        ${conjugation}
        <button type="button" class="speak-btn" data-text="${spanishPronouns[pronounIdx]} ${conjugation}" title="Hear pronunciation">🔊</button>
      </td>
      <td>
        ${english}
        <button type="button" class="speak-btn-en" data-text="${english}" title="Hear English pronunciation">🔊</button>
      </td>
    </tr>`;
  });
  html += `</table>`;
  practiceResults.innerHTML = html;

  // Tab click handler
  if (allCandidates.length > 1) {
    document.querySelectorAll('.meaning-tab').forEach(btn => {
      btn.onclick = () => {
        practiceFormEn.onsubmit({
          preventDefault: () => {},
          target: practiceFormEn,
          meaningIdx: parseInt(btn.getAttribute('data-meaning-idx'))
        });
      };
    });
  }
};

// --- Quiz Mode: Spanish → English ---
function startQuiz() {
  // Pick a random verb, tense, and pronoun
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const availableTenses = tenses.filter(t => verb.conjugations[t]);
  const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
  const pronounIdx = Math.floor(Math.random() * pronouns.length);
  const spanish = verb.conjugations[tense][pronounIdx];
  const english = buildEnglishPhrase(verb, tense, pronounIdx);

  quizState = { verb, tense, pronounIdx, spanish, english };

  quizPrompt.innerHTML = `
    <div>
      <b>Translate this Spanish phrase to English:</b>
      <div style="font-size:1.5em;margin:1em 0;">
        <span style="color:#4f46e5;font-weight:bold">${spanishPronouns[pronounIdx]} ${spanish}</span>
      </div>
      <div style="font-size:0.9em;color:#888;">Verb: <b>${verb.spanish}</b> (${verb.english})<br>Tense: <b>${tense}</b></div>
    </div>
  `;
  quizInput.style.display = '';
  quizInput.value = '';
  quizForm.querySelector('button[type="submit"]').style.display = '';
  quizFeedback.innerHTML = '';
}

quizForm.onsubmit = e => {
  e.preventDefault();
  if (!quizState) return;
  const userAnswer = quizInput.value.trim().toLowerCase();
  const correctAnswer = quizState.english.toLowerCase();

  if (userAnswer === correctAnswer) {
    // Show all tenses for this verb and pronoun
    let html = `<div style="color:green;font-weight:bold;">Correct!</div>`;
    html += `<h4>All tenses for <b>${quizState.verb.english}</b> (${pronouns[quizState.pronounIdx]})</h4>`;
    html += `<table border="1" style="width:100%;text-align:center;">
      <tr>
        <th>Tense</th>
        <th>Spanish</th>
        <th>English</th>
      </tr>`;
    tenses.forEach(t => {
      const sp = quizState.verb.conjugations[t] ? quizState.verb.conjugations[t][quizState.pronounIdx] : "(not available)";
      if (sp === "(not available)") return; // <-- Only render if available
      const en = buildEnglishPhrase(quizState.verb, t, quizState.pronounIdx);
      html += `<tr>
        <td>
          ${t}
          <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
        </td>
        <td>${sp}</td>
        <td>${en}</td>
      </tr>`;
    });
    html += `</table>`;
    html += `<button onclick="startQuiz()" style="margin-top:1em;">Next</button>`;
    quizFeedback.innerHTML = html;
    quizInput.style.display = 'none';
    quizForm.querySelector('button[type="submit"]').style.display = 'none';
  } else {
    quizFeedback.innerHTML = `<span style="color:red;">Incorrect. Try again!</span>
      <br>
      <button id="showAnswerBtn" style="margin-top:0.7em;">Show Answer</button>`;
    // Add event listener for Show Answer button
    document.getElementById('showAnswerBtn').onclick = function() {
      let html = `<div style="color:#2563eb;font-weight:bold;">Answer: ${quizState.english}</div>`;
      html += `<h4>All tenses for <b>${quizState.verb.english}</b> (${pronouns[quizState.pronounIdx]})</h4>`;
      html += `<table border="1" style="width:100%;text-align:center;">
        <tr>
          <th>Tense</th>
          <th>Spanish</th>
          <th>English</th>
        </tr>`;
      tenses.forEach(t => {
        const sp = quizState.verb.conjugations[t] ? quizState.verb.conjugations[t][quizState.pronounIdx] : "(not available)";
        if (sp === "(not available)") return; // <-- Only render if available
        const en = buildEnglishPhrase(quizState.verb, t, quizState.pronounIdx);
        html += `<tr>
          <td>
            ${t}
            <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
          </td>
          <td>${sp}</td>
          <td>${en}</td>
        </tr>`;
      });
      html += `</table>`;
      html += `<button onclick="startQuiz()" style="margin-top:1em;">Next</button>`;
      quizFeedback.innerHTML = html;
      quizInput.style.display = 'none';
      quizForm.querySelector('button[type="submit"]').style.display = 'none';
    };
  }
};

// --- Tense Info Popup Logic ---
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('tense-info-btn')) {
    const tense = e.target.getAttribute('data-tense');
    const def = tenseDefinitions[tense] || "No definition available.";
    showTensePopup(tense, def, e.target);
  }
});

function showTensePopup(tense, def, anchor) {
  let old = document.getElementById('tense-popup');
  if (old) old.remove();

  const popup = document.createElement('div');
  popup.id = 'tense-popup';
  popup.style.position = 'absolute';
  popup.style.background = '#fff';
  popup.style.border = '1px solid #a78bfa';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 4px 16px rgba(60,60,120,0.12)';
  popup.style.padding = '12px 18px';
  popup.style.zIndex = 1000;
  popup.style.maxWidth = '260px';
  popup.innerHTML = `<b>${tense}</b><br><span style="font-size:0.98em;">${def}</span>`;

  const rect = anchor.getBoundingClientRect();
  popup.style.left = (window.scrollX + rect.right + 8) + 'px';
  popup.style.top = (window.scrollY + rect.top - 8) + 'px';

  document.body.appendChild(popup);

  setTimeout(() => {
    document.addEventListener('mousedown', function handler(ev) {
      if (!popup.contains(ev.target)) {
        popup.remove();
        document.removeEventListener('mousedown', handler);
      }
    });
  }, 10);
}

// --- Helper: Parse English phrase to verb/tense/pronoun ---
function parseEnglishPhrase(phrase, meaningIdx = 0) {
  phrase = phrase.trim().toLowerCase();

  // Collect all possible matches (for ambiguous verbs like "to have")
  let candidates = [];
  for (let verb of verbs) {
    let meanings = Array.isArray(verb.english) ? verb.english : [verb.english];
    for (let idx = 0; idx < meanings.length; ++idx) {
      // Remove parenthetical notes for matching
      let meaningRaw = meanings[idx].toLowerCase();
      let meaningNoParen = meaningRaw.replace(/\s*\(.*?\)\s*/g, '').trim();
      let base = meaningRaw.replace(/^to /, '').split(',')[0].trim();

      // Try to match exact phrase for all tenses/pronouns
      for (let t of tenses) {
        if (!verb.conjugations[t]) continue;
        for (let i = 0; i < pronouns.length; ++i) {
          const eng = buildEnglishPhrase(verb, t, i, idx).toLowerCase();
          if (phrase === eng) {
            return { verb, tense: t, pronounIdx: i, meaningIdx: idx };
          }
        }
      }

      // Try to match base infinitive, or phrase matches meaning without parens
      if (
        phrase === meaningRaw ||
        phrase === meaningNoParen ||
        meaningRaw.startsWith(phrase) ||
        meaningNoParen.startsWith(phrase) ||
        phrase === base
      ) {
        candidates.push({ verb, tense: null, pronounIdx: null, meaningIdx: idx });
      }
    }
  }

  // If multiple candidates, return the first and attach all for tab UI
  if (candidates.length > 0) {
    let result = candidates[0];
    result.allCandidates = candidates;
    return result;
  }

  // Fallback: try to match verb and pronoun
  for (let verb of verbs) {
    let meanings = Array.isArray(verb.english) ? verb.english : [verb.english];
    for (let idx = 0; idx < meanings.length; ++idx) {
      let base = meanings[idx].replace(/^to /, '').split(',')[0].trim().toLowerCase();
      if (phrase.includes(base)) {
        for (let i = 0; i < pronouns.length; ++i) {
          if (phrase.includes(pronouns[i].toLowerCase())) {
            return { verb, pronounIdx: i, meaningIdx: idx };
          }
        }
        return { verb, pronounIdx: 0, meaningIdx: idx };
      }
    }
  }
  return null;
}

// --- Helper: Build English phrase for a verb/tense/pronoun ---
function buildEnglishPhrase(verb, tense, pronounIdx, meaningIdx = 0) {
  const pronoun = pronouns[pronounIdx];
  let meanings = Array.isArray(verb.english) ? verb.english : [verb.english];
  // --- Patch: always show "shows possession" in UI ---
  let meaning = meanings[meaningIdx];
  if (meaning === "to have (possession)") {
    meaning = "to have (shows possession)";
    meanings[meaningIdx] = meaning;
  }
  let base = meaning.replace(/^to /, '').split(',')[0].trim();

  // Remove parenthetical notes for matching irregulars
  let normalizedMeaning = meaning.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();

  // Irregulars lookup (expand as needed)
const irregulars = {
  // Core irregular verbs
  "to be": { preterite: pronoun === "I" ? "was" : (["He", "She", "It"].includes(pronoun) ? "was" : "were"), pastPart: "been" },
  "to have": { preterite: "had", pastPart: "had" },
  "to do": { preterite: "did", pastPart: "done" },
  "to go": { preterite: "went", pastPart: "gone" },
  "to come": { preterite: "came", pastPart: "come" },
  "to take": { preterite: "took", pastPart: "taken" },
  "to make": { preterite: "made", pastPart: "made" },
  "to say": { preterite: "said", pastPart: "said" },
  "to see": { preterite: "saw", pastPart: "seen" },
  "to get": { preterite: "got", pastPart: "gotten" },
  "to know": { preterite: "knew", pastPart: "known" },
  "to think": { preterite: "thought", pastPart: "thought" },
  "to become": { preterite: "became", pastPart: "become" },
  "to begin": { preterite: "began", pastPart: "begun" },
  "to break": { preterite: "broke", pastPart: "broken" },
  "to bring": { preterite: "brought", pastPart: "brought" },
  "to buy": { preterite: "bought", pastPart: "bought" },
  "to choose": { preterite: "chose", pastPart: "chosen" },
  "to drink": { preterite: "drank", pastPart: "drunk" },
  "to drive": { preterite: "drove", pastPart: "driven" },
  "to eat": { preterite: "ate", pastPart: "eaten" },
  "to fall": { preterite: "fell", pastPart: "fallen" },
  "to feel": { preterite: "felt", pastPart: "felt" },
  "to find": { preterite: "found", pastPart: "found" },
  "to fly": { preterite: "flew", pastPart: "flown" },
  "to forget": { preterite: "forgot", pastPart: "forgotten" },
  "to give": { preterite: "gave", pastPart: "given" },
  "to grow": { preterite: "grew", pastPart: "grown" },
  "to hear": { preterite: "heard", pastPart: "heard" },
  "to hold": { preterite: "held", pastPart: "held" },
  "to keep": { preterite: "kept", pastPart: "kept" },
  "to leave": { preterite: "left", pastPart: "left" },
  "to let": { preterite: "let", pastPart: "let" },
  "to lose": { preterite: "lost", pastPart: "lost" },
  "to mean": { preterite: "meant", pastPart: "meant" },
  "to meet": { preterite: "met", pastPart: "met" },
  "to pay": { preterite: "paid", pastPart: "paid" },
  "to put": { preterite: "put", pastPart: "put" },
  "to read": { preterite: "read", pastPart: "read" },
  "to run": { preterite: "ran", pastPart: "run" },
  "to sell": { preterite: "sold", pastPart: "sold" },
  "to send": { preterite: "sent", pastPart: "sent" },
  "to set": { preterite: "set", pastPart: "set" },
  "to sit": { preterite: "sat", pastPart: "sat" },
  "to sleep": { preterite: "slept", pastPart: "slept" },
  "to speak": { preterite: "spoke", pastPart: "spoken" },
  "to spend": { preterite: "spent", pastPart: "spent" },
  "to stand": { preterite: "stood", pastPart: "stood" },
  "to swim": { preterite: "swam", pastPart: "swum" },
  "to teach": { preterite: "taught", pastPart: "taught" },
  "to tell": { preterite: "told", pastPart: "told" },
  "to understand": { preterite: "understood", pastPart: "understood" },
  "to wear": { preterite: "wore", pastPart: "worn" },
  "to win": { preterite: "won", pastPart: "won" },
  "to write": { preterite: "wrote", pastPart: "written" },
  "to lead": { preterite: "led", pastPart: "led" },
  "to lend": { preterite: "lent", pastPart: "lent" },
  "to tear": { preterite: "tore", pastPart: "torn" },
  
  // Multi-word verbs
  "to take off": { preterite: "took off", pastPart: "taken off" },
  "to sit down": { preterite: "sat down", pastPart: "sat down" },
  "to stand up": { preterite: "stood up", pastPart: "stood up" },
  "to wake up": { preterite: "woke up", pastPart: "woken up" },
  "to fall asleep": { preterite: "fell asleep", pastPart: "fallen asleep" },
  "to put to sleep": { preterite: "put to sleep", pastPart: "put to sleep" },
  "to come back": { preterite: "came back", pastPart: "come back" },
  "to take a risk": { preterite: "took a risk", pastPart: "taken a risk" },
  "to fall short": { preterite: "fell short", pastPart: "fallen short" },
  "to run over": { preterite: "ran over", pastPart: "run over" },
  "to point out": { preterite: "pointed out", pastPart: "pointed out" },
  
  // Regular verbs with spelling changes (double consonant)
  "to stab": { preterite: "stabbed", pastPart: "stabbed" },
  "to plan": { preterite: "planned", pastPart: "planned" },
  "to stop": { preterite: "stopped", pastPart: "stopped" },
  "to admit": { preterite: "admitted", pastPart: "admitted" },
  "to prefer": { preterite: "preferred", pastPart: "preferred" },
  "to travel": { preterite: "traveled", pastPart: "traveled" },
  "to control": { preterite: "controlled", pastPart: "controlled" },
  "to refer": { preterite: "referred", pastPart: "referred" },
  "to occur": { preterite: "occurred", pastPart: "occurred" },
  "to permit": { preterite: "permitted", pastPart: "permitted" },
  "to regret": { preterite: "regretted", pastPart: "regretted" },
  "to commit": { preterite: "committed", pastPart: "committed" },
  "to submit": { preterite: "submitted", pastPart: "submitted" },
  "to equip": { preterite: "equipped", pastPart: "equipped" },
  "to omit": { preterite: "omitted", pastPart: "omitted" },
  "to worship": { preterite: "worshipped", pastPart: "worshipped" },
  "to format": { preterite: "formatted", pastPart: "formatted" },
  "to target": { preterite: "targeted", pastPart: "targeted" },
  
  // New verbs added (regular forms)
  "to deserve": { preterite: "deserved", pastPart: "deserved" },
  "to sound": { preterite: "sounded", pastPart: "sounded" },
  "to trip": { preterite: "tripped", pastPart: "tripped" },
  "to stumble": { preterite: "stumbled", pastPart: "stumbled" },
  "to signal": { preterite: "signaled", pastPart: "signaled" },
  "to assume": { preterite: "assumed", pastPart: "assumed" },
  "to pretend": { preterite: "pretended", pastPart: "pretended" },
  "to convince": { preterite: "convinced", pastPart: "convinced" },
  "to catalog": { preterite: "cataloged", pastPart: "cataloged" },
  "to kill": { preterite: "killed", pastPart: "killed" },
  "to train": { preterite: "trained", pastPart: "trained" },
  "to maintain": { preterite: "maintained", pastPart: "maintained" },
  "to order": { preterite: "ordered", pastPart: "ordered" },
  "to torture": { preterite: "tortured", pastPart: "tortured" },
  "to saturate": { preterite: "saturated", pastPart: "saturated" },
  "to mortify": { preterite: "mortified", pastPart: "mortified" },
  "to guide": { preterite: "guided", pastPart: "guided" },
  "to heal": { preterite: "healed", pastPart: "healed" },
  "to cure": { preterite: "cured", pastPart: "cured" },
  "to hang": { preterite: "hung", pastPart: "hung" },
  
  // Other regular verbs
  "to return": { preterite: "returned", pastPart: "returned" },
  "to detach": { preterite: "detached", pastPart: "detached" },
  "to try": { preterite: "tried", pastPart: "tried" },
  "to test": { preterite: "tested", pastPart: "tested" },
  "to prove": { preterite: "proved", pastPart: "proven" },
  "to place": { preterite: "placed", pastPart: "placed" },
  "to position": { preterite: "positioned", pastPart: "positioned" },
  "to reach": { preterite: "reached", pastPart: "reached" },
  "to achieve": { preterite: "achieved", pastPart: "achieved" },
  "to attain": { preterite: "attained", pastPart: "attained" },
  "to straighten": { preterite: "straightened", pastPart: "straightened" },
  "to straighten up": { preterite: "straightened up", pastPart: "straightened up" },
  "to hinder": { preterite: "hindered", pastPart: "hindered" },
  "to obstruct": { preterite: "obstructed", pastPart: "obstructed" },
  "to get in the way": { preterite: "got in the way", pastPart: "gotten in the way" },
  "to roam": { preterite: "roamed", pastPart: "roamed" },
  "to stroll": { preterite: "strolled", pastPart: "strolled" },
  "to discover": { preterite: "discovered", pastPart: "discovered" },
  "to fail": { preterite: "failed", pastPart: "failed" },
  "to falter": { preterite: "faltered", pastPart: "faltered" },
  "to hesitate": { preterite: "hesitated", pastPart: "hesitated" },
  "to prioritize": { preterite: "prioritized", pastPart: "prioritized" },
  "to hit": { preterite: "hit", pastPart: "hit" },
  "to embark": { preterite: "embarked", pastPart: "embarked" },
  "to board": { preterite: "boarded", pastPart: "boarded" },
  "to influence": { preterite: "influenced", pastPart: "influenced" },
  "to affect": { preterite: "affected", pastPart: "affected" },
  "to demand": { preterite: "demanded", pastPart: "demanded" },
  "to require": { preterite: "required", pastPart: "required" }
};

  // Try to find irregular by normalized meaning (for multi-meaning verbs)
  let irregularKey = normalizedMeaning;
  // Also check for multi-word verbs (e.g., "fall asleep")
  if (!irregulars[irregularKey] && meaning.toLowerCase().startsWith("to ")) {
    let multiWordKey = meaning.toLowerCase();
    if (irregulars[multiWordKey]) irregularKey = multiWordKey;
  }
  // Improved regular verb past tense logic: double consonant if CVC and ends with single consonant (not w, x, y)
  function regularPast(base) {
    if (/([aeiou][^aeiouwxy])$/.test(base)) {
      return base + base.slice(-1) + "ed";
    }
    if (base.endsWith("e")) return base + "d";
    return base + "ed";
  }
  let preterite = regularPast(base);
  let pastPart = preterite;
  if (irregulars[irregularKey]) {
    preterite = irregulars[irregularKey].preterite;
    pastPart = irregulars[irregularKey].pastPart;
  }

  // Present 3rd person singular
  let present = base;
  // Special case for "to have (shows possession)" present tense
  if (
    meaning === "to have (shows possession)" &&
    tense === "Present"
  ) {
    if (["He", "She", "It"].includes(pronoun)) {
      present = "has";
    } else {
      present = "have";
    }
    return `${pronoun} ${present}`;
  } else if (pronoun === "He") {
    if (base.endsWith('y')) present = base.slice(0, -1) + "ies";
    else if (base.endsWith('o') || base.endsWith('ch') || base.endsWith('s') || base.endsWith('sh') || base.endsWith('x') || base.endsWith('z'))
      present = base + "es";
    else present = base + "s";
  }

  // Handle reflexive verbs in English
  const reflexivePronouns = {
    "I": "myself",
    "You": "yourself", 
    "He": "himself",
    "We": "ourselves",
    "You all": "yourselves",
    "They": "themselves"
  };

  // Check if this is a reflexive verb
  const isReflexive = verb.spanish && verb.spanish.endsWith("se");
  
  // Continuous tenses
  switch (tense) {
    case "Present":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} risk ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} ${present}`;
    case "Preterite":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} risked ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} ${preterite}`;
    case "Imperfect":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} used to risk ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} used to ${base}`;
    case "Future":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} will risk ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} will ${base}`;
    case "Conditional":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} would risk ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} would ${base}`;
    case "Present Perfect":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} ${["He"].includes(pronoun) ? "has" : "have"} risked ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} ${["He"].includes(pronoun) ? "has" : "have"} ${pastPart}`;
    case "Past Perfect":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} had risked ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} had ${pastPart}`;
    case "Future Perfect":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} will have risked ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} will have ${pastPart}`;
    case "Conditional Perfect":
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} would have risked ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} would have ${pastPart}`;
    default:
      if (isReflexive && base.includes("risk oneself")) {
        return `${pronoun} risk ${reflexivePronouns[pronoun]}`;
      }
      return `${pronoun} ${base}`;
  }
}

// --- Practice/Quiz Mode Toggle ---
document.getElementById('practiceModeBtn').addEventListener('click', function() {
  document.getElementById('practiceSection').style.display = '';
  document.getElementById('quizSection').style.display = 'none';
});
document.getElementById('quizModeBtn').addEventListener('click', function() {
  document.getElementById('practiceSection').style.display = 'none';
  document.getElementById('quizSection').style.display = '';
});