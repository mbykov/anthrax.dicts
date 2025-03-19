//
//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain} from 'orthos'
import { cleanLongShort, termByStem, cleanStr, parseAstem, getStress, toConst } from '../dictutils/index.js'
import Debug from 'debug'

import { pushDocs } from './lib/pouch.js'

import { wktNoun  } from './lib/wktNoun.js'
import { wktPart  } from './lib/wktPart.js'
import { wktAdj  } from './lib/wktAdj.js'
import { wktVerb  } from './lib/wktVerb.js'
import { wktPerson  } from './lib/wktPerson.js'
import { wktIndecls  } from './lib/wktIndecls.js'
import { wktIrregs  } from './lib/wktIrregs.js'

const currentdir = process.cwd()
let only = process.argv.slice(2)[0] || ''
log('_ONLY_WKT', only)
let verbose = process.argv.slice(3)[0] || ''

// ἀπάγω.js
const pp = Debug('part')


let push
if (only == 'push') only = false, push = 'push'
// log('_PUSH', push)
// let reonly

if (only) {
    only = cleanLongShort(only)
    only = plain(comb(only))
    only = new RegExp('^' + only)
}

let indecls = []
let wkts = []
let fls = []

// WKT
// в гнездах нет trns!
let nestsPath = path.resolve(currentdir, '../dictutils/results/nests.js')

let wktDataPath = path.resolve(currentdir, '../../anthrax.data/wkt/')

let nounPath = path.resolve(wktDataPath, 'nouns')
let adjPath = path.resolve(wktDataPath, 'adjectives')
let verbPath = path.resolve(wktDataPath, 'verbs')
let partPath = path.resolve(wktDataPath, 'participles')

// let adverbPath = path.resolve(currentdir, '../../anthrax.data/wkt/adverbs') // indecls
let personPath = path.resolve(currentdir, '../../anthrax.data/wkt/persons')


let nests = fse.readJsonSync(nestsPath)
log('_Nests', nests.length)

// let nouns = [], irnouns = [], nfls = []
let {nouns, irnouns, nfls} = await wktNoun(nests, nounPath, only)
// let adjs = [], iradjs = [], afls = []
let {adjs, iradjs, afls} = await wktAdj(nests, adjPath, only)
// let persons = [], irpers = [], perfls = []
let {persons, irpers, perfls} = await wktPerson(nests, personPath, only)
// let wkt_indecls = []
let wkt_indecls = wktIndecls(wktDataPath, only)
indecls.push(...wkt_indecls)
// let wkt_irregs = []
let wkt_irregs = wktIrregs(wktDataPath, only)
indecls.push(...wkt_irregs)

// let verbs = [], irverbs = [], vfls = []
let {verbs, irverbs, vfls} = await wktVerb(nests, only)

// здесь дб те, что не обработаны в verbs, те cdict.pos = part, отдельная часть речи
// но можно то же в irreg verbs
// какой способ выбрать?

let parts = [], irparts = [], pfls = []
// let {parts, irparts, pfls} = await wktPart(nests, partPath, only)

indecls = indecls.concat(irnouns)
indecls = indecls.concat(irverbs)
indecls = indecls.concat(iradjs)
indecls = indecls.concat(irpers)

let vpfls = vfls.filter(flex=> flex.part)
pp('_pfls_10', vpfls[10])
pp('_pfls_10', vpfls.length)

// BUUUUUUUUUUUUUUUUG κατοικίζω

// log('____irnouns', irnouns.length)
// log('____iradjs', iradjs.length)
// log('____irverbs', irverbs.length)
log('____all_indecls', indecls.length)

wkts.push(...nouns)
fls = fls.concat(nfls)

wkts.push(...adjs)
fls = fls.concat(afls)

wkts.push(...verbs)
fls = fls.concat(vfls)

wkts.push(...parts)
fls = fls.concat(pfls)

wkts.push(...persons)
fls = fls.concat(perfls)

// log('____REG_PERSONS', persons.length)

let jsons = fls.map(flex=> JSON.stringify(flex))
jsons = _.uniq(jsons)
fls = jsons.map(flex=> JSON.parse(flex))

let no_term_flex = fls.filter(flex=> !flex.term)
fls = fls.filter(flex=> flex.term)

// log('_______________________________________________________ fls.length', fls.length)
// log('_______________________________________________________ no_term_flex.length', no_term_flex.length)
// log('_______________________________________________________ indecls.length', indecls.length)

// let xxxs = fls.filter(flex=> flex.term == '́οις')
// for (let doc of fls) {
//     // log('_f', doc)
// }

let nameKey = {}
let verbKey = {}
let partKey = {}

let regnouns = [
    'χώρα', 'φυγή', 'μοῦσα', 'διάνοια', 'τύχη', 'νίκη', 'ἀδελφή', 'αἰτία', 'θάλαττα', 'δόξα', 'μοῖρα', // 1 fem
    // 'κλάσμα' // μα-ματος
    'δεσπότης', 'νεανίας', 'πολίτης', 'κριτής', 'ἁγνότης',  // 1 masc
    'δοῦλος', 'ἰατρός', 'πόλεμος', 'ποταμός', // 2-o masc
    'ἔκπλους', 'νοῦς',  // 2-o masc contracted
    'παρθένος', 'ἤπειρος', 'νόσος', 'νῆσος', 'ὁδός', // 2-o fem
    'ἄνθρωπος', 'τροφός', // 2-o masc-fem
    'δῶρον', 'ὀστοῦν', 'ἄστρον', 'δεῖπνον', 'δῶρον', 'ἱμάτιον',
    'κανοῦν', 'ὀστοῦν', // 2-neut-contr
    'νεώς', 'λεώς', // attic
    // 'δεσμός', 'σῖτος', 'στάδιον', // 2-masc-neut
    'γύψ', 'φύλαξ ', 'φλέψ', 'σάλπιγξ', // 3 - Labial Stop (π, β, φ) or Velar Stop (κ, γ, χ)
    'πρᾶγμα', 'ἑλπίς', 'ἔρις', 'ἐσθής',  // Dental Stop (τ, δ, θ, except ντ)
    'γίγᾱς', 'γέρων', 'δράκων', 'λέων', 'ὀδούς',  // Stems in ντ
    'ἀγών', 'ποιμήν', 'δαίμων', 'δελφίς', 'ἡγεμών',  // Stems in ν
    'ἅλς', 'ῥήτωρ', 'κρατήρ', 'σωτήρ',  // Stems in a Liquid (λ or ρ)
]
let regadjs = ['δεινός', 'δίκαιος', 'χρυσοῦς', 'ἀργυροῦς', 'ἀκαρής']

if (true) { // only - катит
    for (let name of nouns) {
        if (!regnouns.includes(name.rdict)) continue
        if (!nameKey[name.stype]) nameKey[name.stype] = []
        for (let ckey of name.ckeys) {
            let exst = nameKey[name.stype].find(nkey=> nkey.stype == ckey.stype && nkey.gend == ckey.gend)
            if (exst) {
                exst.keys.push(...ckey.keys)
                exst.keys = _.uniq(exst.keys)
            }
            else nameKey[name.stype].push(ckey)
            nameKey[name.stype].keys = _.uniq(nameKey[name.stype].keys)
        }
    }

    for (let name of adjs) {
        if (!regadjs.includes(name.rdict)) continue
        // name.stype = name.stype3
        if (!nameKey[name.stype]) nameKey[name.stype] = []
        for (let ckey of name.ckeys) {
            let exst = nameKey[name.stype].find(nkey=> nkey.stype == ckey.stype && nkey.gend == ckey.gend)
            // log('_EXST', exst, ckey.keys)
            if (exst) {
                exst.keys.push(...ckey.keys)
                exst.keys = _.uniq(exst.keys)
            }
            else nameKey[name.stype].push(ckey)
        }
    }

    // TODO gend убрать
    for (let stype in nameKey) {
        continue
        for (let gend in nameKey[stype]) {
            nameKey[stype][gend] = _.uniq(nameKey[stype][gend])
        }
    }
    // log('_KEYS', nameKey)

    for (let verb of verbs) {
        continue
        if (!verb.reg) continue
        for (let variant of verb.vars) {
            if (!verbKey[variant.stype]) verbKey[variant.stype] = {}
            if (!verbKey[variant.stype][variant.tense]) verbKey[variant.stype][variant.tense] = []
            // verbKey[variant.stype][variant.tense].push(variant.keys)
            // verbKey[variant.stype][variant.tense] = _.uniq(verbKey[variant.stype][variant.tense])
        }
    }

    let regverbs = ['βουλεύω', 'λύω', 'νικάω', 'κοσμέω', 'δηλόω', 'αἰδέομαι', 'αἰνέω', 'ἀρκέω', 'γελάω', 'καλέω', 'σπάω', 'τελέω', 'τρέω', 'καίω', 'κλαίω', 'πλέω', 'δράω', 'κελεύω', 'κλείω', 'κολούω', 'κρούω', 'παλαίω', 'παύομαι', 'χράω', 'χράομαι', 'ἐλπίζω', 'χρίω']

    for (let verb of verbs) {
        continue
        if (!verb.reg) continue
        // if (!regverbs.includes(verb.rdict)) continue
        verbKey = _.mergeWith(verbKey, verb.var, customizer);

        for (let stype in verbKey) {
            for (let tense in verbKey[stype]) {
                verbKey[stype][tense] = _.uniq(verbKey[stype][tense])
            }
        }
    }

    function customizer(objValue, srcValue) {
        if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }

    for (let pflex of []) { // pfls
        if (!partKey[pflex.stype3]) partKey[pflex.stype3] = {}
        if (!partKey[pflex.stype3][pflex.stype]) partKey[pflex.stype3][pflex.stype] = []
        partKey[pflex.stype3][pflex.stype].push(pflex.key)
        partKey[pflex.stype3][pflex.stype] = _.uniq(partKey[pflex.stype3][pflex.stype])
    }

    log('_partKey:', partKey)
    // log('_VVVVVVVVVVVVVVVVVVV', verbs[0].var)

    let irverbdicts = irverbs.map(cdict=> cdict.rdict)
    irverbdicts = _.uniq(irverbdicts)

    if (!only) {
        fse.writeFileSync('./wkt-keys/key-name.js', toConst(nameKey, 'nameKey'))
        fse.writeFileSync('./wkt-keys/key-verb.js', toConst(verbKey, 'verbKey'))

        // let wkt_indecls_rdicts = indecls.map(cdict=> cdict.rdict)
        // wkt_indecls_rdicts = _.uniq(wkt_indecls_rdicts)
        // fse.writeFileSync('./data/wkt_indecls_rdicts', JSON.stringify(wkt_indecls_rdicts, null, 8))
    }

}


if (only) {
    for (let wkt of wkts) {
        log('_WKT rdict:', wkt.rdict, '_stem', wkt.stem, 'reg', wkt.reg)
    }
    // log('_WKTS', [wkts])
    log('_WKTS_stems', wkts.map(cdict=> cdict.stem))

    if (verbose) {
        log('_WKTS', [wkts])
        for (let wkt of wkts) {
            continue
            // wkt.ckeys = wkt.ckeys[0]
            // let xkeys = wkt.ckeys.filter(ckey=> ckey.tense == 'pres.act.inf')
            // log('_WKT X', wkt.rdict, wkt.stem, xkeys)
            // delete wkt.var
            wkt.trns = wkt.trns[0]
            wkt.ckeys = wkt.ckeys.length
            // wkt.ckeys_stypes = wkt.ckeys.map(ckey=> ckey.stype)
            // wkt.ckeys = 'ckeys'
            log('_WKT', wkt)

            // log('_WKT_POS', wkt.pos)
        }
        // log('_FLS_10', fls[10])
    }
    log('_only_wkts', wkts.length)
    log('_only_indecls', indecls.length)

    // log('_FLS', fls[0], fls.length)
    log('_only_FLS', fls.length)

    let adv_fls = fls.filter(flex=> flex.adverb)
    log('_ADV_FLS', adv_fls.length)

} else if (push) {
    log('_push-wkts docs', wkts.length)
    log('_push-nests docs', nests.length)
    // здесь nest, потому что в nest д.б. или ckeys, или stype

    for (let nest of nests) {
        if (nest.pos == 'noun') nest.name = true
        else if (nest.pos == 'adj') nest.name = true
        else if (nest.pos == 'adverb') nest.adverb = true
        else if (nest.pos == 'verb') nest.verb = true
        else {
            log('_BUG NEST WO POS', nest)
            throw new Error()
        }
    }

    // let zzzzz = nests.find(cdict=> cdict.rdict == 'ἀντιβάλλω') // ἄρα ; ἀβίοτος
    // log ('_ZZZZ_nest', zzzzz)

    log('_creating wkt...')
    let wktdocs = createIdWkt(wkts)
    await pushDocs('wkt', wktdocs)
    log('_WKT id-DOCS', wktdocs.length)

    log('_creating iwkt...')
    let inddocs = createIdIndecl(indecls)
    await pushDocs('iwkt', inddocs)
    log('_iwkts id-DOCS', inddocs.length)

    // здесь удаляется trns
    log('_creating nest...')
    let {docs, fldocs} = createIdNest(wkts, nests, fls)
    log('_push-nest-iddocs', docs.length)
    log('_push-all-fls', fldocs.length)

    // в nest - только regulars
    await pushDocs('nest', docs)
    await pushDocs('fls', fldocs)

}

// αἴξ

function createIdNest(wkts, nests, fls) {
    let gdict = {}

    for (let dict of wkts) { // wkts
        let stemdict = _.clone(dict)
        if (dict.rdict == 'φθίσις') log('___________________XXXXX id-nest.wkt ', stemdict)

        if (!stemdict.ckeys) {
            log('_no_nest_wkt_cdict.ckeys', stemdict)
            throw new Error()
        }

        delete stemdict.trns
        if (!gdict[stemdict.stem]) gdict[stemdict.stem] = {_id: stemdict.stem, docs: []}
        gdict[stemdict.stem].docs.push(stemdict)
    }

    // не входит в wkt-nest, не имеет ckeys
    for (let dict of nests) { // nests
        let wktdict = wkts.find(wkt=> wkt.dict == dict.dict && wkt.rdict == dict.rdict && wkt.pos == dict.pos)
        if (wktdict) continue
        // if (dict.zero) continue // WTF ?

        if (dict.pos == 'adverb') continue // потому что пока adverbs попадают в indecls, а не wkts
        if (dict.rdict == 'φθίσις') log('___________________XXXXX id-nest ', dict)

        if (!dict.stype && !dict.ckeys) {
            log('_no_nest_stype', dict)
            throw new Error()
        }

        delete dict.trns
        // if (dict.rdict == 'ποιέω') log('___________________XXXXX NEST ', dict)
        if (!gdict[dict.stem]) gdict[dict.stem] = {_id: dict.stem, docs: []}
        gdict[dict.stem].docs.push(dict)
    }

    let docs = _.values(gdict)
    // log('____ID_DOCS', docs)

    let gflex = {}

    for (let flex of fls) {
        if (!gflex[flex.term]) gflex[flex.term] = {_id: flex.term, docs: []}
        gflex[flex.term].docs.push(flex)
    }

    let fldocs = _.values(gflex)
    fldocs = fldocs.map(flex=> JSON.stringify(flex))
    fldocs = _.uniq(fldocs)
    fldocs = fldocs.map(flex=> JSON.parse(flex))

    return {docs, fldocs}
}

function createIdWkt(wkts) {
    let gdict = {}

    wkts.forEach(cdict => {
        // if (dict.zero) return // zero или в nest, или в irreg ??? но переводы-то нужно забрать
        // dict.dict = comb(dict.dict)
        if (cdict.pos == 'verb' && !cdict.reg) return // так-ли? Или нужно просто первое значение? non-reg - д.б. в стемах только. Всегда?
        cdict.dname = 'wkt'
        // if (!gdict[dict.stem]) gdict[dict.stem] = {_id: dict.stem, docs: []}
        // gdict[dict.stem].docs.push(dict)
        if (!gdict[cdict.dict]) gdict[cdict.dict] = {_id: cdict.dict, docs: []}
        gdict[cdict.dict].docs.push(cdict)
    })

    let docs = _.values(gdict)

    // let xxxx = docs.find(wkt=> wkt._id == comb('ποιέω')) // ἀγάπη
    // log('____WKT_XXX', xxxx)

    return docs
}

// общая база indecls
function createIdIndecl(indecls) {
    let gdict = {}

    indecls.forEach(cdict => {
        cdict.dname = 'iwkt'
        // cdict.dict = comb(cdict.dict)
        if (!gdict[cdict.dict]) gdict[cdict.dict] = {_id: cdict.dict, docs: []}
        // if (cdict.rdict == 'οὖν') log('__________________________OUN___', cdict)
        gdict[cdict.dict].docs.push(cdict)
    })

    let docs = _.values(gdict)
    // log('____WKT_INDECL id-docs', docs.length)
    return docs
}
