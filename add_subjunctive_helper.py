#!/usr/bin/env python3
"""
Helper script to add subjunctive conjugations to Spanish verbs.
This generates the subjunctive forms based on verb stem patterns.
"""

import json
import re

# Subjunctive conjugation patterns based on Spanish grammar rules
# For regular verbs, these follow the standard patterns
# For irregular verbs, we'll provide manual mappings

SUBJUNCTIVE_CONJUGATIONS = {
    # Key: Spanish infinitive, Value: dict of tense -> conjugations
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
    "tomar": {
        "Present Subjunctive": ["tome", "tomes", "tome", "tomemos", "toméis", "tomen"],
        "Imperfect Subjunctive": ["tomara", "tomaras", "tomara", "tomáramos", "tomarais", "tomaran"],
        "Present Perfect Subjunctive": ["haya tomado", "hayas tomado", "haya tomado", "hayamos tomado", "hayáis tomado", "hayan tomado"],
        "Past Perfect Subjunctive": ["hubiera tomado", "hubieras tomado", "hubiera tomado", "hubiéramos tomado", "hubierais tomado", "hubieran tomado"]
    },
    "probar": {
        "Present Subjunctive": ["pruebe", "pruebes", "pruebe", "probemos", "probéis", "prueben"],
        "Imperfect Subjunctive": ["probara", "probaras", "probara", "probáramos", "probarais", "probaran"],
        "Present Perfect Subjunctive": ["haya probado", "hayas probado", "haya probado", "hayamos probado", "hayáis probado", "hayan probado"],
        "Past Perfect Subjunctive": ["hubiera probado", "hubieras probado", "hubiera probado", "hubiéramos probado", "hubierais probado", "hubieran probado"]
    },
    "pedir": {
        "Present Subjunctive": ["pida", "pidas", "pida", "pidamos", "pidáis", "pidan"],
        "Imperfect Subjunctive": ["pidiera", "pidieras", "pidiera", "pidiéramos", "pidierais", "pidieran"],
        "Present Perfect Subjunctive": ["haya pedido", "hayas pedido", "haya pedido", "hayamos pedido", "hayáis pedido", "hayan pedido"],
        "Past Perfect Subjunctive": ["hubiera pedido", "hubieras pedido", "hubiera pedido", "hubiéramos pedido", "hubierais pedido", "hubieran pedido"]
    },
    "responder": {
        "Present Subjunctive": ["responda", "respondas", "responda", "respondamos", "respondáis", "respondan"],
        "Imperfect Subjunctive": ["respondiera", "respondieras", "respondiera", "respondiéramos", "respondierais", "respondieran"],
        "Present Perfect Subjunctive": ["haya respondido", "hayas respondido", "haya respondido", "hayamos respondido", "hayáis respondido", "hayan respondido"],
        "Past Perfect Subjunctive": ["hubiera respondido", "hubieras respondido", "hubiera respondido", "hubiéramos respondido", "hubierais respondido", "hubieran respondido"]
    },
    "abrir": {
        "Present Subjunctive": ["abra", "abras", "abra", "abramos", "abráis", "abran"],
        "Imperfect Subjunctive": ["abriera", "abrieras", "abriera", "abriéramos", "abrierais", "abrieran"],
        "Present Perfect Subjunctive": ["haya abierto", "hayas abierto", "haya abierto", "hayamos abierto", "hayáis abierto", "hayan abierto"],
        "Past Perfect Subjunctive": ["hubiera abierto", "hubieras abierto", "hubiera abierto", "hubiéramos abierto", "hubierais abierto", "hubieran abierto"]
    },
    "cerrar": {
        "Present Subjunctive": ["cierre", "cierres", "cierre", "cerremos", "cerréis", "cierren"],
        "Imperfect Subjunctive": ["cerrara", "cerraras", "cerrara", "cerráramos", "cerrarais", "cerraran"],
        "Present Perfect Subjunctive": ["haya cerrado", "hayas cerrado", "haya cerrado", "hayamos cerrado", "hayáis cerrado", "hayan cerrado"],
        "Past Perfect Subjunctive": ["hubiera cerrado", "hubieras cerrado", "hubiera cerrado", "hubiéramos cerrado", "hubierais cerrado", "hubieran cerrado"]
    },
    "perder": {
        "Present Subjunctive": ["pierda", "pierdas", "pierda", "perdamos", "perdáis", "pierdan"],
        "Imperfect Subjunctive": ["perdiera", "perdieras", "perdiera", "perdiéramos", "perdierais", "perdieran"],
        "Present Perfect Subjunctive": ["haya perdido", "hayas perdido", "haya perdido", "hayamos perdido", "hayáis perdido", "hayan perdido"],
        "Past Perfect Subjunctive": ["hubiera perdido", "hubieras perdido", "hubiera perdido", "hubiéramos perdido", "hubierais perdido", "hubieran perdido"]
    },
    "ganar": {
        "Present Subjunctive": ["gane", "ganes", "gane", "ganemos", "ganéis", "ganen"],
        "Imperfect Subjunctive": ["ganara", "ganaras", "ganara", "ganáramos", "ganarais", "ganaran"],
        "Present Perfect Subjunctive": ["haya ganado", "hayas ganado", "haya ganado", "hayamos ganado", "hayáis ganado", "hayan ganado"],
        "Past Perfect Subjunctive": ["hubiera ganado", "hubieras ganado", "hubiera ganado", "hubiéramos ganado", "hubierais ganado", "hubieran ganado"]
    },
    "pagar": {
        "Present Subjunctive": ["pague", "pagues", "pague", "paguemos", "paguéis", "paguen"],
        "Imperfect Subjunctive": ["pagara", "pagaras", "pagara", "pagáramos", "pagarais", "pagaran"],
        "Present Perfect Subjunctive": ["haya pagado", "hayas pagado", "haya pagado", "hayamos pagado", "hayáis pagado", "hayan pagado"],
        "Past Perfect Subjunctive": ["hubiera pagado", "hubieras pagado", "hubiera pagado", "hubiéramos pagado", "hubierais pagado", "hubieran pagado"]
    },
    "traer": {
        "Present Subjunctive": ["traiga", "traigas", "traiga", "traigamos", "traigáis", "traigan"],
        "Imperfect Subjunctive": ["trajera", "trajeras", "trajera", "trajéramos", "trajerais", "trajeran"],
        "Present Perfect Subjunctive": ["haya traído", "hayas traído", "haya traído", "hayamos traído", "hayáis traído", "hayan traído"],
        "Past Perfect Subjunctive": ["hubiera traído", "hubieras traído", "hubiera traído", "hubiéramos traído", "hubierais traído", "hubieran traído"]
    },
    "comer": {
        "Present Subjunctive": ["coma", "comas", "coma", "comamos", "comáis", "coman"],
        "Imperfect Subjunctive": ["comiera", "comieras", "comiera", "comiéramos", "comierais", "comieran"],
        "Present Perfect Subjunctive": ["haya comido", "hayas comido", "haya comido", "hayamos comido", "hayáis comido", "hayan comido"],
        "Past Perfect Subjunctive": ["hubiera comido", "hubieras comido", "hubiera comido", "hubiéramos comido", "hubierais comido", "hubieran comido"]
    },
    "dormir": {
        "Present Subjunctive": ["duerma", "duermas", "duerma", "durmamos", "durmáis", "duerman"],
        "Imperfect Subjunctive": ["durmiera", "durmieras", "durmiera", "durmiéramos", "durmierais", "durmieran"],
        "Present Perfect Subjunctive": ["haya dormido", "hayas dormido", "haya dormido", "hayamos dormido", "hayáis dormido", "hayan dormido"],
        "Past Perfect Subjunctive": ["hubiera dormido", "hubieras dormido", "hubiera dormido", "hubiéramos dormido", "hubierais dormido", "hubieran dormido"]
    },
    "estudiar": {
        "Present Subjunctive": ["estudie", "estudies", "estudie", "estudiemos", "estudiéis", "estudien"],
        "Imperfect Subjunctive": ["estudiara", "estudiaras", "estudiara", "estudiáramos", "estudiarais", "estudiaran"],
        "Present Perfect Subjunctive": ["haya estudiado", "hayas estudiado", "haya estudiado", "hayamos estudiado", "hayáis estudiado", "hayan estudiado"],
        "Past Perfect Subjunctive": ["hubiera estudiado", "hubieras estudiado", "hubiera estudiado", "hubiéramos estudiado", "hubierais estudiado", "hubieran estudiado"]
    },
    "conducir": {
        "Present Subjunctive": ["conduzca", "conduzcas", "conduzca", "conduzcamos", "conduzcáis", "conduzcan"],
        "Imperfect Subjunctive": ["condujera", "condujeras", "condujera", "condujéramos", "condujerais", "condujeran"],
        "Present Perfect Subjunctive": ["haya conducido", "hayas conducido", "haya conducido", "hayamos conducido", "hayáis conducido", "hayan conducido"],
        "Past Perfect Subjunctive": ["hubiera conducido", "hubieras conducido", "hubiera conducido", "hubiéramos conducido", "hubierais conducido", "hubieran conducido"]
    },
    "comprar": {
        "Present Subjunctive": ["compre", "compres", "compre", "compremos", "compréis", "compren"],
        "Imperfect Subjunctive": ["comprara", "compraras", "comprara", "compráramos", "comprarais", "compraran"],
        "Present Perfect Subjunctive": ["haya comprado", "hayas comprado", "haya comprado", "hayamos comprado", "hayáis comprado", "hayan comprado"],
        "Past Perfect Subjunctive": ["hubiera comprado", "hubieras comprado", "hubiera comprado", "hubiéramos comprado", "hubierais comprado", "hubieran comprado"]
    },
    "vender": {
        "Present Subjunctive": ["venda", "vendas", "venda", "vendamos", "vendáis", "vendan"],
        "Imperfect Subjunctive": ["vendiera", "vendieras", "vendiera", "vendiéramos", "vendierais", "vendieran"],
        "Present Perfect Subjunctive": ["haya vendido", "hayas vendido", "haya vendido", "hayamos vendido", "hayáis vendido", "hayan vendido"],
        "Past Perfect Subjunctive": ["hubiera vendido", "hubieras vendido", "hubiera vendido", "hubiéramos vendido", "hubierais vendido", "hubieran vendido"]
    },
}

def get_regular_subjunctive(spanish_verb, present_tense):
    """
    Generate subjunctive forms for regular verbs based on verb stem and type.
    spanish_verb: infinitive form (e.g., "hablar", "comer", "vivir")
    present_tense: list of present indicative conjugations
    """
    
    # Get the stem from the present yo form
    stem = present_tense[0].rstrip('o')
    
    # Determine verb type from infinitive ending
    if spanish_verb.endswith('ar'):
        # -ar verbs
        subj_present = [stem + 'e', stem + 'es', stem + 'e', stem + 'emos', stem + 'éis', stem + 'en']
        subj_imperfect = [stem + 'ara', stem + 'aras', stem + 'ara', stem + 'áramos', stem + 'arais', stem + 'aran']
    elif spanish_verb.endswith('er'):
        # -er verbs
        subj_present = [stem + 'a', stem + 'as', stem + 'a', stem + 'amos', stem + 'áis', stem + 'an']
        subj_imperfect = [stem + 'iera', stem + 'ieras', stem + 'iera', stem + 'iéramos', stem + 'ierais', stem + 'ieran']
    else:  # -ir verbs
        # -ir verbs
        subj_present = [stem + 'a', stem + 'as', stem + 'a', stem + 'amos', stem + 'áis', stem + 'an']
        subj_imperfect = [stem + 'iera', stem + 'ieras', stem + 'iera', stem + 'iéramos', stem + 'ierais', stem + 'ieran']
    
    # For perfect subjunctive, use auxiliary haya
    subj_perfect = ['haya ' + past_participle for past_participle in present_tense]  # Placeholder
    subj_pluperfect = ['hubiera ' + past_participle for past_participle in present_tense]  # Placeholder
    
    return {
        'Present Subjunctive': subj_present,
        'Imperfect Subjunctive': subj_imperfect,
        'Present Perfect Subjunctive': subj_perfect,
        'Past Perfect Subjunctive': subj_pluperfect
    }

print("Subjunctive conjugation mappings ready!")
print(f"Number of irregular verbs mapped: {len(SUBJUNCTIVE_CONJUGATIONS)}")
