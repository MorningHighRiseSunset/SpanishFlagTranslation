const fs = require('fs');

// Read the file
const filePath = './slt_verbs.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Subjunctive forms for hacer
const subjunctiveForms = `      "Present Subjunctive": ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"],
      "Imperfect Subjunctive": ["hiciera", "hicieras", "hiciera", "hiciéramos", "hicierais", "hicieran"],
      "Present Perfect Subjunctive": ["haya hecho", "hayas hecho", "haya hecho", "hayamos hecho", "hayáis hecho", "hayan hecho"],
      "Past Perfect Subjunctive": ["hubiera hecho", "hubieras hecho", "hubiera hecho", "hubiéramos hecho", "hubierais hecho", "hubieran hecho"]`;

// Pattern to match hacer entries: find "haría..." array closing and the } closing right after
// This pattern looks for the "Conditional Perfect" line and the closing brace
const pattern = /("Conditional Perfect": \[.*?\])\s*\n(\s*\}\s*\n\s*\},)/g;

// First check if this pattern exists
const matches = content.match(pattern);
console.log(`Found ${matches ? matches.length : 0} hacer verb entries to update`);

// Replace with the same content plus subjunctive forms
const replacement = `$1,\n${subjunctiveForms}\n$2`;

// Count replace operations as we go
let count = 0;
content = content.replace(pattern, (match) => {
  // Only replace if this is part of a "hacer" verb
  const beforeMatch = content.substring(Math.max(0, content.indexOf(match) - 200), content.indexOf(match));
  if (beforeMatch.includes('spanish: "hacer"')) {
    count++;
    return match.replace(/("Conditional Perfect": \[.*?\])\s*\n(\s*\}\s*\n\s*\},)/, `$1,\n${subjunctiveForms}\n$2`);
  }
  return match;
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`Successfully added subjunctive forms to ${count} hacer verb entries`);
