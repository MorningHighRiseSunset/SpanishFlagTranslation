const fs = require('fs');
const path = './slt_verbs.js';
const backup = './slt_verbs.js.bak';

let src = fs.readFileSync(path, 'utf8');
fs.writeFileSync(backup, src, 'utf8');
console.log('Backup written to', backup);

const lines = src.split('\n');
const hacerIdxs = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('spanish: "hacer"')) hacerIdxs.push(i);
}
console.log('Found hacer at lines:', hacerIdxs.map(i => i+1).join(', '));

const subj = [
  '      "Present Subjunctive": ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"],',
  '      "Imperfect Subjunctive": ["hiciera", "hicieras", "hiciera", "hiciéramos", "hicierais", "hicieran"],',
  '      "Present Perfect Subjunctive": ["haya hecho", "hayas hecho", "haya hecho", "hayamos hecho", "hayáis hecho", "hayan hecho"],',
  '      "Past Perfect Subjunctive": ["hubiera hecho", "hubieras hecho", "hubiera hecho", "hubiéramos hecho", "hubierais hecho", "hubieran hecho"]'
];

let totalAdded = 0;
for (let idx of hacerIdxs) {
  // find conjugations start after this index
  let conj = idx;
  while (conj < lines.length && !lines[conj].includes('conjugations')) conj++;
  if (conj >= lines.length) continue;

  // find the "Conditional Perfect" line within the conjugations block
  let condLine = conj;
  let found = false;
  while (condLine < lines.length && !lines[condLine].includes('}')) { // stop at object end
    if (lines[condLine].includes('"Conditional Perfect"')) { found = true; break; }
    condLine++;
  }
  if (!found) {
    console.log('No Conditional Perfect found for hacer at', idx+1); continue;
  }

  // check if subjunctive already present between condLine and end of conjugations
  let checkLine = condLine + 1;
  let conjugEnd = checkLine;
  while (conjugEnd < lines.length && !lines[conjugEnd].trim().startsWith('}')) conjugEnd++;

  let already = false;
  for (let j = condLine+1; j < conjugEnd; j++) {
    if (lines[j].includes('Present Subjunctive')) { already = true; break; }
  }
  if (already) { console.log('Subjunctive already present for hacer at', idx+1); continue; }

  // insert subjunctive lines after the Conditional Perfect line
  const insertPos = condLine + 1;
  lines.splice(insertPos, 0, ...subj);
  totalAdded++;
  // adjust subsequent indices
  for (let k = 0; k < hacerIdxs.length; k++) if (hacerIdxs[k] > idx) hacerIdxs[k] += subj.length;
  console.log('Inserted subjunctive for hacer at approx line', idx+1);
}

if (totalAdded > 0) {
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Wrote', totalAdded, 'insertions to', path);
} else {
  console.log('No insertions made.');
}
