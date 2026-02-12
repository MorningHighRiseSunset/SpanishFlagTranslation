#!/usr/bin/env node
/**
 * Script to add subjunctive tenses to Spanish verbs
 * Reads slt_verbs.js and adds subjunctive conjugations
 */

const fs = require('fs');
const path = require('path');

// Mapping of Spanish verbs to their subjunctive conjugations
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
  "haber": {
    "Present Subjunctive": ["haya", "hayas", "haya", "hayamos", "hayáis", "hayan"],
    "Imperfect Subjunctive": ["hubiera", "hubieras", "hubiera", "hubiéramos", "hubierais", "hubieran"],
    "Present Perfect Subjunctive": ["haya habido", "hayas habido", "haya habido", "hayamos habido", "hayáis habido", "hayan habido"],
    "Past Perfect Subjunctive": ["hubiera habido", "hubieras habido", "hubiera habido", "hubiéramos habido", "hubierais habido", "hubieran habido"]
  },
  "hacer": {
    "Present Subjunctive": ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"],
    "Imperfect Subjunctive": ["hiciera", "hicieras", "hiciera", "hiciéramos", "hicierais", "hicieran"],
    "Present Perfect Subjunctive": ["haya hecho", "hayas hecho", "haya hecho", "hayamos hecho", "hayáis hecho", "hayan hecho"],
    "Past Perfect Subjunctive": ["hubiera hecho", "hubieras hecho", "hubiera hecho", "hubiéramos hecho", "hubierais hecho", "hubieran hecho"]
  },
  "poder": {
    "Present Subjunctive": ["pueda", "puedas", "pueda", "podamos", "podáis", "puedan"],
    "Imperfect Subjunctive": ["pudiera", "pudieras", "pudiera", "pudiéramos", "pudierais", "pudieran"],
    "Present Perfect Subjunctive": ["haya podido", "hayas podido", "haya podido", "hayamos podido", "hayáis podido", "hayan podido"],
    "Past Perfect Subjunctive": ["hubiera podido", "hubieras podido", "hubiera podido", "hubiéramos podido", "hubierais podido", "hubieran podido"]
  },
  "decir": {
    "Present Subjunctive": ["diga", "digas", "diga", "digamos", "digáis", "digan"],
    "Imperfect Subjunctive": ["dijera", "dijeras", "dijera", "dijéramos", "dijerais", "dijeran"],
    "Present Perfect Subjunctive": ["haya dicho", "hayas dicho", "haya dicho", "hayamos dicho", "hayáis dicho", "hayan dicho"],
    "Past Perfect Subjunctive": ["hubiera dicho", "hubieras dicho", "hubiera dicho", "hubiéramos dicho", "hubierais dicho", "hubieran dicho"]
  },
  "ir": {
    "Present Subjunctive": ["vaya", "vayas", "vaya", "vayamos", "vayáis", "vayan"],
    "Imperfect Subjunctive": ["fuera", "fueras", "fuera", "fuéramos", "fuerais", "fueran"],
    "Present Perfect Subjunctive": ["haya ido", "hayas ido", "haya ido", "hayamos ido", "hayáis ido", "hayan ido"],
    "Past Perfect Subjunctive": ["hubiera ido", "hubieras ido", "hubiera ido", "hubiéramos ido", "hubierais ido", "hubieran ido"]
  },
  "ver": {
    "Present Subjunctive": ["vea", "veas", "vea", "veamos", "veáis", "vean"],
    "Imperfect Subjunctive": ["viera", "vieras", "viera", "viéramos", "vierais", "vieran"],
    "Present Perfect Subjunctive": ["haya visto", "hayas visto", "haya visto", "hayamos visto", "hayáis visto", "hayan visto"],
    "Past Perfect Subjunctive": ["hubiera visto", "hubieras visto", "hubiera visto", "hubiéramos visto", "hubierais visto", "hubieran visto"]
  },
  "dar": {
    "Present Subjunctive": ["dé", "des", "dé", "demos", "deis", "den"],
    "Imperfect Subjunctive": ["diera", "dieras", "diera", "diéramos", "dierais", "dieran"],
    "Present Perfect Subjunctive": ["haya dado", "hayas dado", "haya dado", "hayamos dado", "hayáis dado", "hayan dado"],
    "Past Perfect Subjunctive": ["hubiera dado", "hubieras dado", "hubiera dado", "hubiéramos dado", "hubierais dado", "hubieran dado"]
  },
  "saber": {
    "Present Subjunctive": ["sepa", "sepas", "sepa", "sepamos", "sepáis", "sepan"],
    "Imperfect Subjunctive": ["supiera", "supieras", "supiera", "supiéramos", "supierais", "supieran"],
    "Present Perfect Subjunctive": ["haya sabido", "hayas sabido", "haya sabido", "hayamos sabido", "hayáis sabido", "hayan sabido"],
    "Past Perfect Subjunctive": ["hubiera sabido", "hubieras sabido", "hubiera sabido", "hubiéramos sabido", "hubierais sabido", "hubieran sabido"]
  },
  "conocer": {
    "Present Subjunctive": ["conozca", "conozcas", "conozca", "conozcamos", "conozcáis", "conozcan"],
    "Imperfect Subjunctive": ["conociera", "conocieras", "conociera", "conociéramos", "conocierais", "conocieran"],
    "Present Perfect Subjunctive": ["haya conocido", "hayas conocido", "haya conocido", "hayamos conocido", "hayáis conocido", "hayan conocido"],
    "Past Perfect Subjunctive": ["hubiera conocido", "hubieras conocido", "hubiera conocido", "hubiéramos conocido", "hubierais conocido", "hubieran conocido"]
  },
  "querer": {
    "Present Subjunctive": ["quiera", "quieras", "quiera", "queramos", "queráis", "quieran"],
    "Imperfect Subjunctive": ["quisiera", "quisieras", "quisiera", "quisiéramos", "quisierais", "quisieran"],
    "Present Perfect Subjunctive": ["haya querido", "hayas querido", "haya querido", "hayamos querido", "hayáis querido", "hayan querido"],
    "Past Perfect Subjunctive": ["hubiera querido", "hubieras querido", "hubiera querido", "hubiéramos querido", "hubierais querido", "hubieran querido"]
  },
  "llegar": {
    "Present Subjunctive": ["llegue", "llegues", "llegue", "lleguemos", "lleguéis", "lleguen"],
    "Imperfect Subjunctive": ["llegara", "llegaras", "llegara", "llegáramos", "llegarais", "llegaran"],
    "Present Perfect Subjunctive": ["haya llegado", "hayas llegado", "haya llegado", "hayamos llegado", "hayáis llegado", "hayan llegado"],
    "Past Perfect Subjunctive": ["hubiera llegado", "hubieras llegado", "hubiera llegado", "hubiéramos llegado", "hubierais llegado", "hubieran llegado"]
  },
  "pasar": {
    "Present Subjunctive": ["pase", "pases", "pase", "pasemos", "paséis", "pasen"],
    "Imperfect Subjunctive": ["pasara", "pasaras", "pasara", "pasáramos", "pasarais", "pasaran"],
    "Present Perfect Subjunctive": ["haya pasado", "hayas pasado", "haya pasado", "hayamos pasado", "hayáis pasado", "hayan pasado"],
    "Past Perfect Subjunctive": ["hubiera pasado", "hubieras pasado", "hubiera pasado", "hubiéramos pasado", "hubierais pasado", "hubieran pasado"]
  },
  "poner": {
    "Present Subjunctive": ["ponga", "pongas", "ponga", "pongamos", "pongáis", "pongan"],
    "Imperfect Subjunctive": ["pusiera", "pusieras", "pusiera", "pusiéramos", "pusierais", "pusieran"],
    "Present Perfect Subjunctive": ["haya puesto", "hayas puesto", "haya puesto", "hayamos puesto", "hayáis puesto", "hayan puesto"],
    "Past Perfect Subjunctive": ["hubiera puesto", "hubieras puesto", "hubiera puesto", "hubiéramos puesto", "hubierais puesto", "hubieran puesto"]
  },
  "parecer": {
    "Present Subjunctive": ["parezca", "parezcas", "parezca", "parezcamos", "parezcáis", "parezcan"],
    "Imperfect Subjunctive": ["pareciera", "parecieras", "pareciera", "pareciéramos", "parecierais", "parecieran"],
    "Present Perfect Subjunctive": ["haya parecido", "hayas parecido", "haya parecido", "hayamos parecido", "hayáis parecido", "hayan parecido"],
    "Past Perfect Subjunctive": ["hubiera parecido", "hubieras parecido", "hubiera parecido", "hubiéramos parecido", "hubierais parecido", "hubieran parecido"]
  },
  "quedar": {
    "Present Subjunctive": ["quede", "quedes", "quede", "quedemos", "quedéis", "queden"],
    "Imperfect Subjunctive": ["quedara", "quedaras", "quedara", "quedáramos", "quedarais", "quedaran"],
    "Present Perfect Subjunctive": ["haya quedado", "hayas quedado", "haya quedado", "hayamos quedado", "hayáis quedado", "hayan quedado"],
    "Past Perfect Subjunctive": ["hubiera quedado", "hubieras quedado", "hubiera quedado", "hubiéramos quedado", "hubierais quedado", "hubieran quedado"]
  },
  "creer": {
    "Present Subjunctive": ["crea", "creas", "crea", "creamos", "creáis", "crean"],
    "Imperfect Subjunctive": ["creyera", "creyeras", "creyera", "creyéramos", "creyerais", "creyeran"],
    "Present Perfect Subjunctive": ["haya creído", "hayas creído", "haya creído", "hayamos creído", "hayáis creído", "hayan creído"],
    "Past Perfect Subjunctive": ["hubiera creído", "hubieras creído", "hubiera creído", "hubiéramos creído", "hubierais creído", "hubieran creído"]
  },
  "hablar": {
    "Present Subjunctive": ["hable", "hables", "hable", "hablemos", "habléis", "hablen"],
    "Imperfect Subjunctive": ["hablara", "hablaras", "hablara", "habláramos", "hablarais", "hablaran"],
    "Present Perfect Subjunctive": ["haya hablado", "hayas hablado", "haya hablado", "hayamos hablado", "hayáis hablado", "hayan hablado"],
    "Past Perfect Subjunctive": ["hubiera hablado", "hubieras hablado", "hubiera hablado", "hubiéramos hablado", "hubierais hablado", "hubieran hablado"]
  },
  "llevar": {
    "Present Subjunctive": ["lleve", "lleves", "lleve", "llevemos", "llevéis", "lleven"],
    "Imperfect Subjunctive": ["llevara", "llevaras", "llevara", "lleváramos", "llevarais", "llevaran"],
    "Present Perfect Subjunctive": ["haya llevado", "hayas llevado", "haya llevado", "hayamos llevado", "hayáis llevado", "hayan llevado"],
    "Past Perfect Subjunctive": ["hubiera llevado", "hubieras llevado", "hubiera llevado", "hubiéramos llevado", "hubierais llevado", "hubieran llevado"]
  },
  "dejar": {
    "Present Subjunctive": ["deje", "dejes", "deje", "dejemos", "dejéis", "dejen"],
    "Imperfect Subjunctive": ["dejara", "dejaras", "dejara", "dejáramos", "dejarais", "dejaran"],
    "Present Perfect Subjunctive": ["haya dejado", "hayas dejado", "haya dejado", "hayamos dejado", "hayáis dejado", "hayan dejado"],
    "Past Perfect Subjunctive": ["hubiera dejado", "hubieras dejado", "hubiera dejado", "hubiéramos dejado", "hubierais dejado", "hubieran dejado"]
  },
  "soltar": {
    "Present Subjunctive": ["suelte", "sueltes", "suelte", "soltemos", "soltéis", "suelten"],
    "Imperfect Subjunctive": ["soltara", "soltaras", "soltara", "soltáramos", "soltarais", "soltaran"],
    "Present Perfect Subjunctive": ["haya soltado", "hayas soltado", "haya soltado", "hayamos soltado", "hayáis soltado", "hayan soltado"],
    "Past Perfect Subjunctive": ["hubiera soltado", "hubieras soltado", "hubiera soltado", "hubiéramos soltado", "hubierais soltado", "hubieran soltado"]
  },
  "seguir": {
    "Present Subjunctive": ["siga", "sigas", "siga", "sigamos", "sigáis", "sigan"],
    "Imperfect Subjunctive": ["siguiera", "siguieras", "siguiera", "siguiéramos", "siguierais", "siguieran"],
    "Present Perfect Subjunctive": ["haya seguido", "hayas seguido", "haya seguido", "hayamos seguido", "hayáis seguido", "hayan seguido"],
    "Past Perfect Subjunctive": ["hubiera seguido", "hubieras seguido", "hubiera seguido", "hubiéramos seguido", "hubierais seguido", "hubieran seguido"]
  },
  "encontrar": {
    "Present Subjunctive": ["encuentre", "encuentres", "encuentre", "encontremos", "encontréis", "encuentren"],
    "Imperfect Subjunctive": ["encontrara", "encontraras", "encontrara", "encontáramos", "encontrarais", "encontraran"],
    "Present Perfect Subjunctive": ["haya encontrado", "hayas encontrado", "haya encontrado", "hayamos encontrado", "hayáis encontrado", "hayan encontrado"],
    "Past Perfect Subjunctive": ["hubiera encontrado", "hubieras encontrado", "hubiera encontrado", "hubiéramos encontrado", "hubierais encontrado", "hubieran encontrado"]
  },
  "llamar": {
    "Present Subjunctive": ["llame", "llames", "llame", "llamemos", "llaméis", "llamen"],
    "Imperfect Subjunctive": ["llamara", "llamaras", "llamara", "llamáramos", "llamarais", "llamaran"],
    "Present Perfect Subjunctive": ["haya llamado", "hayas llamado", "haya llamado", "hayamos llamado", "hayáis llamado", "hayan llamado"],
    "Past Perfect Subjunctive": ["hubiera llamado", "hubieras llamado", "hubiera llamado", "hubiéramos llamado", "hubierais llamado", "hubieran llamado"]
  },
  "mirar": {
    "Present Subjunctive": ["mire", "mires", "mire", "miremos", "miréis", "miren"],
    "Imperfect Subjunctive": ["mirara", "miraras", "mirara", "miráramos", "mirarais", "miraran"],
    "Present Perfect Subjunctive": ["haya mirado", "hayas mirado", "haya mirado", "hayamos mirado", "hayáis mirado", "hayan mirado"],
    "Past Perfect Subjunctive": ["hubiera mirado", "hubieras mirado", "hubiera mirado", "hubiéramos mirado", "hubierais mirado", "hubieran mirado"]
  },
  "vivir": {
    "Present Subjunctive": ["viva", "vivas", "viva", "vivamos", "viváis", "vivan"],
    "Imperfect Subjunctive": ["viviera", "vivieras", "viviera", "viviéramos", "vivierais", "vivieran"],
    "Present Perfect Subjunctive": ["haya vivido", "hayas vivido", "haya vivido", "hayamos vivido", "hayáis vivido", "hayan vivido"],
    "Past Perfect Subjunctive": ["hubiera vivido", "hubieras vivido", "hubiera vivido", "hubiéramos vivido", "hubierais vivido", "hubieran vivido"]
  },
  "sentir": {
    "Present Subjunctive": ["sienta", "sientas", "sienta", "sintamos", "sintáis", "sientan"],
    "Imperfect Subjunctive": ["sintiera", "sintieras", "sintiera", "sintiéramos", "sintierais", "sintieran"],
    "Present Perfect Subjunctive": ["haya sentido", "hayas sentido", "haya sentido", "hayamos sentido", "hayáis sentido", "hayan sentido"],
    "Past Perfect Subjunctive": ["hubiera sentido", "hubieras sentido", "hubiera sentido", "hubiéramos sentido", "hubierais sentido", "hubieran sentido"]
  },
  "salir": {
    "Present Subjunctive": ["salga", "salgas", "salga", "salgamos", "salgáis", "salgan"],
    "Imperfect Subjunctive": ["saliera", "salieras", "saliera", "saliéramos", "salierais", "salieran"],
    "Present Perfect Subjunctive": ["haya salido", "hayas salido", "haya salido", "hayamos salido", "hayáis salido", "hayan salido"],
    "Past Perfect Subjunctive": ["hubiera salido", "hubieras salido", "hubiera salido", "hubiéramos salido", "hubierais salido", "hubieran salido"]
  },
  "volver": {
    "Present Subjunctive": ["vuelva", "vuelvas", "vuelva", "volvamos", "volváis", "vuelvan"],
    "Imperfect Subjunctive": ["volviera", "volvieras", "volviera", "volviéramos", "volvierais", "volvieran"],
    "Present Perfect Subjunctive": ["haya vuelto", "hayas vuelto", "haya vuelto", "hayamos vuelto", "hayáis vuelto", "hayan vuelto"],
    "Past Perfect Subjunctive": ["hubiera vuelto", "hubieras vuelto", "hubiera vuelto", "hubiéramos vuelto", "hubierais vuelto", "hubieran vuelto"]
  },
};

function getRegularSubjunctive(infinitive, pastParticiple) {
  const stem = infinitive.slice(0, -2);  // Remove -ar, -er, -ir
  const ending = infinitive.slice(-2);
  
  let presentSubj, imperfectSubj;
  
  if (ending === 'ar') {
    presentSubj = [stem+'e', stem+'es', stem+'e', stem+'emos', stem+'éis', stem+'en'];
    imperfectSubj = [stem+'ara', stem+'aras', stem+'ara', stem+'áramos', stem+'arais', stem+'aran'];
  } else { // -er and -ir
    presentSubj = [stem+'a', stem+'as', stem+'a', stem+'amos', stem+'áis', stem+'an'];
    imperfectSubj = [stem+'iera', stem+'ieras', stem+'iera', stem+'iéramos', stem+'ierais', stem+'ieran'];
  }
  
  return {
    "Present Subjunctive": presentSubj,
    "Imperfect Subjunctive": imperfectSubj,
    "Present Perfect Subjunctive": presentSubj.map(c => 'haya ' + pastParticiple),
    "Past Perfect Subjunctive": presentSubj.map(c => 'hubiera ' + pastParticiple)
  };
}

// Read the file
const filePath = path.join(__dirname, 'slt_verbs.js');
let content = fs.readFileSync(filePath, 'utf8');

// Use a regex to find and process each verb object
// This is a bit tricky since we can't easily parse JS objects as JSON
// We'll use a more targeted approach

// Extract all verb objects and rebuild the file with subjunctive conjugations
const verbMatches = content.match(/\{[\s\S]*?spanish:\s*"([^"]+)"[\s\S]*?\}/g);
console.log(`Found ${verbMatches ? verbMatches.length : 0} verb entries`);

if (verbMatches) {
  let modifiedContent = content;
  
  // Process content to add subjunctive conjugations to verbs that don't have them
  modifiedContent = modifiedContent.replace(
    /("Conditional Perfect":\s*\[[^\]]*\])([\s]*}[\s]*},?[\s]*{[\s\S]*?spanish:\s*"([^"]+)")/g,
    (match, conditionalPerfect, space, spanishVerb) => {
      // Check if this verb already has subjunctive forms
      if (!match.includes("Present Subjunctive")) {
        console.log(`Adding subjunctive forms to: ${spanishVerb}`);
        
        // Get subjunctive forms
        let subjunctiveForms = subjunctiveConjugations[spanishVerb];
        if (!subjunctiveForms) {
          // Extract past participle if not in our mapping
          console.log(`No mapping found for ${spanishVerb}, skipping subjunctive`);
          return match;
        }
        
        // Format subjunctive conjugations
        let subjunctiveStr = `,\n      "Present Subjunctive": ${JSON.stringify(subjunctiveForms["Present Subjunctive"])},\n`;
        subjunctiveStr += `      "Imperfect Subjunctive": ${JSON.stringify(subjunctiveForms["Imperfect Subjunctive"])},\n`;
        subjunctiveStr += `      "Present Perfect Subjunctive": ${JSON.stringify(subjunctiveForms["Present Perfect Subjunctive"])},\n`;
        subjunctiveStr += `      "Past Perfect Subjunctive": ${JSON.stringify(subjunctiveForms["Past Perfect Subjunctive"])}`;
        
        return conditionalPerfect + subjunctiveStr + space + "{" + space.slice(-1) + "spanish:" + space.slice(-1) + `"${spanishVerb}"`;
      }
      return match;
    }
  );
  
  // Write the modified content back
  fs.writeFileSync(filePath, modifiedContent, 'utf8');
  console.log('File updated successfully!');
} else {
  console.log('Could not find verb entries');
}
