const fs = require('fs');

// Read the file
const filePath = './slt_verbs.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Split into lines for easier manipulation
const lines = content.split('\n');

// Find all "hacer" entries and store their indices
const hacerIndices = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('spanish: "hacer"')) {
    hacerIndices.push(i);
  }
}

console.log(`Found hacer entries at line numbers: ${hacerIndices.map(i => i + 1).join(', ')}`);

// For each hacer entry, find the "Conditional Perfect" line and add subjunctive after it
for (let hacerIdx of hacerIndices) {
  // Find the conjugations object for this hacer
  let conjIdx = hacerIdx;
  while (conjIdx < lines.length && !lines[conjIdx].includes('"conjugations"')) {
    conjIdx++;
  }
  
  // Find the "Conditional Perfect" line
  let condPerfIdx = conjIdx;
  while (condPerfIdx < lines.length && !lines[condPerfIdx].includes('"Conditional Perfect"')) {
    condPerfIdx++;
  }
  
  if (condPerfIdx < lines.length) {
    // Find the closing bracket with comma
    let closingIdx = condPerfIdx;
    while (closingIdx < lines.length && !lines[closingIdx].includes('],')) {
      closingIdx++;
    }
    
    if (closingIdx < lines.length) {
      console.log(`Adding subjunctive to hacer entry starting at line ${hacerIdx + 1}, inserting after line ${closingIdx + 1}`);
      
      // Create subjunctive lines
      const subjunctiveLines = [
        '      "Present Subjunctive": ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"],',
        '      "Imperfect Subjunctive": ["hiciera", "hicieras", "hiciera", "hiciéramos", "hicierais", "hicieran"],',
        '      "Present Perfect Subjunctive": ["haya hecho", "hayas hecho", "haya hecho", "hayamos hecho", "hayáis hecho", "hayan hecho"],',
        '      "Past Perfect Subjunctive": ["hubiera hecho", "hubieras hecho", "hubiera hecho", "hubiéramos hecho", "hubierais hecho", "hubieran hecho"]'
      ];
      
      // Insert the lines at the right position
      lines.splice(closingIdx + 1, 0, ...subjunctiveLines);
      
      // Adjust indices for subsequent iterations
      for (let j = 0; j < hacerIndices.length; j++) {
        if (hacerIndices[j] > closingIdx) {
          hacerIndices[j] += subjunctiveLines.length;
        }
      }
    }
  }
}

// Write the file back
fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

console.log('Successfully added subjunctive forms to all hacer verbs');
