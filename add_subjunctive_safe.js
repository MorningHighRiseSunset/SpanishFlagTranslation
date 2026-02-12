const fs = require('fs');
const path = require('path');

// Read the file
const filePath = './slt_verbs.js';
const content = fs.readFileSync(filePath, 'utf-8');

// Define subjunctive conjugations for all verbs
const subjunctiveConjugations = {
  "ser": {
    "Present Subjunctive": ["sea", "seas", "sea", "seamos", "seáis", "sean"],
    "Imperfect Subjunctive": ["fuera", "fueras", "fuera", "fuéramos", "fuerais", "fueran"],
    "Present Perfect Subjunctive": ["haya sido", "hayas sido", "haya sido", "hayamos sido", "hayáis sido", "hayan sido"],
    "Past Perfect Subjunctive": ["hubiera sido", "hubieras sido", "hubiera sido", "hubiéramos sido", "hubierais sido", "hubieran sido"]
  },
  "estar": {
    "Present Subjunctive": ["esté", "estés", "esté", "estemos", "estéis", "estén"],
    "Imperfect Subjunctive": ["estuviera", "estuvieras", "estuviera", "estuviéramos", "estuvierais", "estuvieran"],
    "Present Perfect Subjunctive": ["haya estado", "hayas estado", "haya estado", "hayamos estado", "hayáis estado", "hayan estado"],
    "Past Perfect Subjunctive": ["hubiera estado", "hubieras estado", "hubiera estado", "hubiéramos estado", "hubierais estado", "hubieran estado"]
  },
  "tener": {
    "Present Subjunctive": ["tenga", "tengas", "tenga", "tengamos", "tengáis", "tengan"],
    "Imperfect Subjunctive": ["tuviera", "tuvieras", "tuviera", "tuviéramos", "tuvierais", "tuvieran"],
    "Present Perfect Subjunctive": ["haya tenido", "hayas tenido", "haya tenido", "hayamos tenido", "hayáis tenido", "hayan tenido"],
    "Past Perfect Subjunctive": ["hubiera tenido", "hubieras tenido", "hubiera tenido", "hubiéramos tenido", "hubierais tenido", "hubieran tenido"]
  },
  "hacer": {
    "Present Subjunctive": ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"],
    "Imperfect Subjunctive": ["hiciera", "hicieras", "hiciera", "hiciéramos", "hicierais", "hicieran"],
    "Present Perfect Subjunctive": ["haya hecho", "hayas hecho", "haya hecho", "hayamos hecho", "hayáis hecho", "hayan hecho"],
    "Past Perfect Subjunctive": ["hubiera hecho", "hubieras hecho", "hubiera hecho", "hubiéramos hecho", "hubierais hecho", "hubieran hecho"]
  }
};

// Split into lines
const lines = content.split('\n');

// Process the file
let processedCount = 0;
const processedVerbs = {};

for (let i = 0; i < lines.length; i++) {
  // Look for spanish: "verbname" lines
  const spanishMatch = lines[i].match(/spanish:\s*"([^"]+)"/);
  
  if (spanishMatch) {
    const verbName = spanishMatch[1];
    
    // Only process verbs we have subjunctive conjugations for
    if (subjunctiveConjugations[verbName]) {
      // Track which conjugations we've seen
      if (!processedVerbs[verbName]) {
        processedVerbs[verbName] = 0;
      }
      processedVerbs[verbName]++;
      
      // Find the closing brace of the conjugations object for this verb
      let conjIdx = i;
      while (conjIdx < lines.length && !lines[conjIdx].includes('"conjugations"')) {
        conjIdx++;
      }
      
      // Find the line with "Conditional Perfect" for this verb  
      let condIdx = conjIdx;
      while (condIdx < lines.length && !lines[condIdx].includes('"Conditional Perfect"')) {
        condIdx++;
      }
      
      if (condIdx < lines.length) {
        // Find the closing bracket of Conditional Perfect
        let closingIdx = condIdx;
        while (closingIdx < lines.length && !lines[closingIdx].match(/\],?\s*$/)) {
          closingIdx++;
        }
        
        // Check if subjunctive already exists (don't add twice)
        let hasSubjunctive = false;
        for (let j = condIdx; j < closingIdx + 2 && j < lines.length; j++) {
          if (lines[j].includes('Subjunctive')) {
            hasSubjunctive = true;
            break;
          }
        }
        
        if (!hasSubjunctive && closingIdx < lines.length) {
          // Add subjunctive conjugations
          const subj = subjunctiveConjugations[verbName];
          const newLines = [
            '      "Present Subjunctive": ' + JSON.stringify(subj["Present Subjunctive"]) + ',',
            '      "Imperfect Subjunctive": ' + JSON.stringify(subj["Imperfect Subjunctive"]) + ',',
            '      "Present Perfect Subjunctive": ' + JSON.stringify(subj["Present Perfect Subjunctive"]) + ',',
            '      "Past Perfect Subjunctive": ' + JSON.stringify(subj["Past Perfect Subjunctive"])
          ];
          
          // Insert after the Conditional Perfect closing bracket
          lines.splice(closingIdx + 1, 0, ...newLines);
          processedCount++;
          
          // Adjust loop index
          i += newLines.length;
        }
      }
    }
  }
}

// Write the file back
fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

console.log('Successfully processed the following verbs:');
for (const [verb, count] of Object.entries(processedVerbs)) {
  console.log(`  ${verb}: ${count} occurrence(s) updated`);
}
console.log(`Total additions: ${processedCount}`);
