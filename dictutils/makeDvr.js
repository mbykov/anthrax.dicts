//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'
import { parseAug, cleanLongShort, cleanStress, arts, termByStem, removeVowelBeg, parseGenByArt, adj23Type, zksps } from './index.js'
const currentdir = process.cwd()

import { accents } from './lib/utils.js'
let acs = _.values(accents)

import { wktNounPatterns } from "./lib/wkt_noun_patterns.js"
import { wktAdjPatterns } from "./lib/wkt_adj_patterns.js"
import { wktVerbPatterns } from "./lib/wkt_verb_patterns.js"
import { wktAdverbPatterns } from "./lib/wkt_adv_patterns.js"


import { preNounPatterns } from "./lib/dvr_pre_noun_patterns.js"
import { preAdjPatterns } from "./lib/dvr_pre_adj_patterns.js"
import { preVerbPatterns } from "./lib/dvr_pre_verb_patterns.js"
import { preIndeclPatterns } from "./lib/dvr_pre_indecl_patterns.js"
import { preSpecPatterns } from "./lib/dvr_pre_spec_patterns.js"
import { preAdvPatterns } from "./lib/dvr_pre_adv_patterns.js"
import { preBadPatterns } from "./lib/dvr_pre_bad_patterns.js"

import { preflist } from "@mbykov/anthrax/preflist"
const prefixes = preflist.map(pref=> {
    pref = pref.replace(/-/g, '')
    return pref
})


let push
let only = process.argv.slice(2)[0] || ''
if (only == 'push') only = false, push = true

if (only) {
    log('_ONLY_DVR', only)
    only = only.replace(/-/g, '')
    only = cleanLongShort(only)
    only = plain(comb(only))
    only = new RegExp('^' + only)
}


let dirPath = path.resolve(currentdir, '../../anthrax.data/dvr')

let typicalAdjGenPath = path.resolve(currentdir, './wkt-keys/typical-adj-gen.js')
let typicalAdjGen = fse.readJsonSync(typicalAdjGenPath)
let typicalNounGenPath = path.resolve(currentdir, './wkt-keys/typical-noun-gen.js')
let typicalNounGen = fse.readJsonSync(typicalNounGenPath)

let fullStemList = []
let fullStemList3 = []

const indecl_types = ['conj.', 'indecl.', 'pron.', 'interj.', ] // praep.
const specform_types = ['inf.', 'pf.', 'fut.', 'aor.',  'impf.',  'pass.', 'praes.', 'dual.', 'conjct.',  'стяж.',  'дат.',  'part.',  'aor.1',  'aor.2',  'opt.',  'elisione',  'dat.',  'произнош.', 'acc.', 'к_', 'pl.',  'поэт_.', 'imper.', 'impf.', 'ppf.', 'sing.', 'см.', '2 л.', 'ион. =']


const adj3TypeAlpha = {
    'ος': 'ος-α-ον',
    'ός': 'ός-ά-όν',
}

const adj3Type = {
    'ος': 'ος-η-ον',
    'ός': 'ός-ή-όν',
    'ων': 'ων-ουσα-ον',
    // 'ών': [],
    'υς': 'υς-εια-υ',
    'ύς': 'ύς-εῖα-ύ',
    // 'ῦς': [],
    'οῦς': 'οῦς-ῆ-οῦν',
    'έος': 'έος-έα-έον',
    // 'ις': [],
    'εις': 'εις-εσσα-εν',
    // 'ως': [],
    'ην': 'ην-εινα-εν',
    // 'ια': [],
    'ας': 'ας-ασα-αν',
    // 'οι': [],
    'ης': 'ης-ης-ες',
}


await main(dirPath)

export async function main(dirPath) {
    let dvrfiles = fse.readdirSync(dirPath)
    // log('_dvrfiles', dvrfiles.length)

    let dentries = []
    dvrfiles.forEach(async (fname) => {
        let filePath = path.resolve(dirPath, fname)
        let entries = fse.readJsonSync(filePath, 'utf8')
        entries.forEach(async (entry) => {
            if (entry.rdict[entry.rdict.length -1] == '-') return
            let pdict = plain(entry.dict)
            if (only && !only.test(pdict)) return
            // log('_E', entry)

            // этот фильтр чистить и достраивать
            let testrow = parseTestrow(entry)
            entry.testrow = testrow
            if (!testrow) return

            // let compound = parseCompound(entry)
            // if (compound) entry.compound = compound
            // log('_EC', entry)
            // let prefix = ''
            // if (entry.compound) prefix = parseCompoundPrefix(entry)
            // else prefix = guessPrefix(entry)
            // if (prefix) entry.prefix = prefix
            // log('_EP', entry)

            let pos = selectPrePos(entry)
            dentries.push(entry)

            // if (only) log('_E', entry)
        })
    })

    let indecls = dentries.filter(entry=> entry.indecl)
    let bads = dentries.filter(entry=> entry.bad)
    dentries = dentries.filter(entry=> !entry.indecl && !entry.bad)
    let regulars = dentries.filter(entry=> entry.pos)
    let unknowns = dentries.filter(entry=> !entry.pos)


    // есть одинаковые cdicts - trns нужно слить - indecls - ἄχρι
    // в регулярных нужен пример
    let uniqinds = {} // ἄχρι
    indecls.forEach(cdict => {
        if (!uniqinds[cdict.dict]) uniqinds[cdict.dict] = _.clone(cdict), uniqinds[cdict.dict].trns = []
        uniqinds[cdict.dict].trns.push(...cdict.trns)
    })
    indecls = _.values(uniqinds)

    if (only) log('_REGS', regulars.length)
    if (only) log('_INDECLS', indecls)


    let cdicts = []
    for (let entry of regulars) { // regulars
        let cdict = parseCdict(entry)
        if (!cdict) continue
        parseNoun(cdict)
        parseVerb(cdict)
        // probeAdverb(cdict)
        parseAdjective(cdict)

        if (!cdict.zero && cdict.no_typicalNounGen) { // NB: TODO:
            // log('_DVR no typicalNounGen', cdict.rdict, cdict.pos)
            // indecls.push(cdict) // это не indecl, но пока что
            // continue
        }
        // if (only) log('_CDICT', cdict.rdict, cdict.pos, cdict)

        if (cdict.astem == plain(cdict.dict)) continue

        if (!cdict.type) continue // zero
        if (!cdict.astem) continue
        cdict.astem = plain(cdict.astem)
        delete cdict.ptype
        delete cdict.testrow
        cdicts.push(cdict)
    }

    if (only) {
        log('_cdicts', cdicts)
    }

    // log('_unknowns', unknowns.slice(300, 400).map(entry=> [entry.rdict, entry.testrow].join(': ')))

    log('_dvr_entries', dentries.length)
    // log('_regulars', regulars.length)
    log('_indecls', indecls.length)
    // log('_unknowns', unknowns.length)
    // log('_bads', bads.length)
    log('_cdicts', cdicts.length)

    indecls.push(...unknowns)
    indecls.forEach(dict=> dict.indecl = true)

    if (push) {
        fse.writeFileSync('./results/indecls_dvr.js', JSON.stringify(indecls, null, 8))
        fse.writeFileSync('./results/cdicts_dvr.js', JSON.stringify(cdicts, null, 8))
    }

}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> NB: не сделано ZERO
function parseNoun(cdict) {
    if (cdict.pos != 'noun') return
    if (cdict.zero) {
        cdict.astem = plain(cdict.dict)
        return
    }
    // log('_CDICT NOUN________', cdict)

    // в testrow либо есть gen, либо нет:
    let guessgen = cdict.testrow.split(' ')[0]
    guessgen = guessgen.replace(/^-/, '')
    let pguessgen = plain(comb(guessgen))
    let typestr = ''
    let ptype = ''
    let pgen = ''

    // поиск genetive в тестовой строке
    for (let ntypestr of wktNounPatterns) {
        if (!ntypestr) continue
        let ntype = ntypestr.split(', ')[0]
        let ngen = ntypestr.split(', ')[1]
        if (ngen != pguessgen) continue
        if (!plain(cdict.dict).endsWith(ntype)) continue
        if (ngen.length > pgen.length) pgen = ngen, typestr = ntypestr
    }
    // log('_typestr___', typestr)

    // генетив в testrow есть
    if (typestr) {
        ptype = typestr.split(', ')[0]
        pgen = typestr.split(', ')[1]
    } else {
        // генетива в testrow нет:
        for (let ntypestr of wktNounPatterns) {
            if (!ntypestr) continue
            let ntype = ntypestr.split(', ')[0]
            if (!plain(cdict.dict).endsWith(ntype)) continue
            if (ntype.length > ptype.length) ptype = ntype
        }
    }

    // теперь astem
    let reptype = new RegExp(ptype + '$')
    // astem - has aug
    let astem = cdict.dict.replace(reptype, '')
    if (astem == cdict.dict) astem = plain(cdict.dict).replace(reptype, '')

    let reastem = new RegExp('^' + astem)
    let type = cdict.dict.replace(reastem, '')
    if (type == cdict.dict) type = plain(cdict.dict).replace(reptype, '')

    // log('_TYPE____rdict:', cdict.rdict, 'astem', astem, 'type', type)

    let tgen = ''
    // здесь тоже поиск вероятного генетива, если дефиса в начале нет
    if (cdict.testrow[0] == '-') tgen = cdict.testrow.split(/,? /)[0]

    if (tgen) tgen = tgen.replace(/^-/, '')
    else {

        // if (!typicalNounGen[type]) log('_NO_typicalNounGen[type]', cdict.rdict, 'type', type) // TODO: NB:
        if (!typicalNounGen[type]) {
            cdict.no_typicalNounGen = type
            return
        }

        tgen = typicalNounGen[type].max
    }

    cdict.type = type
    cdict.stype = [type, tgen] // .join('-')


    let gends = parseGenByArt(cdict.testrow)
    if (gends.length) {
        cdict.gends = gends
    } else {
        cdict.gends = ['masc']
    }

    cdict.astem = astem
    // log('_Noun', cdict)
} // parseNoun

function probeVerb(cdict) {
    let typestr = ''
    let pdict = plain(cdict.dict)
    for (let type of wktVerbPatterns) {
        if (!type) continue
        let retype = new RegExp(type + '$')
        if (!retype.test(pdict) ) continue
        if (type.length > typestr.length) typestr = type
    }

    if (typestr) {
        cdict.ptype = typestr
        cdict.pos = 'verb'
    }
    return cdict.pos
}

// добавил μαι в паттерны. Верно-ли?
function parseVerb(cdict) {
    if (cdict.pos != 'verb') return
    probeVerb(cdict)
    let reptype = new RegExp(cdict.ptype + '$')
    // astem - has aug
    let astem = cdict.dict.replace(reptype, '')
    if (astem == cdict.dict) astem = plain(cdict.dict).replace(reptype, '')
    // log('________________V astem', astem)

    let reastem = new RegExp('^' + astem)
    let type = cdict.dict.replace(reastem, '')
    if (type == cdict.dict) type = plain(cdict.dict).replace(reptype, '')

    cdict.type = type
    cdict.astem = astem
    cdict.stype = [cdict.type]
}

function parseCdict(entry) {
    let rdict = entry.rdict
    rdict = rdict.replace('(', '').replace(')', '') // это нехорошо, нужен double
    rdict = rdict.replace('{*}', '')
    let dict = comb(rdict )
    let testrow = entry.testrow
    let pos = entry.pos
    let cdict = {rdict, dict, pos, testrow}
    if (entry.compounds) cdict.compounds = entry.compounds
    cdict.trns = entry.trns

    let zlast = rdict[rdict.length -1]
    if (zksps.includes(zlast)) cdict.zero = true

    return cdict
}

function selectPrePos(entry) {
    for (let patt of preVerbPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt + '$')
        if (!repatt.test(entry.rdict)) continue
        entry.pos = 'verb'
    }

    if (entry.pos) return entry.pos

    for (let patt of preNounPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.testrow)) continue
        entry.pos = 'noun'
    }
    if (entry.pos) return entry.pos
    // log('_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx POS', entry.pos)

    for (let patt of preAdjPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.testrow)) continue
        entry.pos = 'adj'
    }
    if (entry.pos) return entry.pos

    for (let patt of preIndeclPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.testrow)) continue
        // entry.pos = 'verb'
        entry.indecl = true
    }
    if (entry.pos) return entry.pos

    for (let patt of preAdvPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.rdict)) continue
        entry.pos = 'adverb'
    }
    if (entry.pos) return entry.pos

    for (let patt of preSpecPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.testrow)) continue
        entry.indecl = true
    }
    if (entry.pos) return entry.pos

    for (let patt of preBadPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.testrow)) continue
        entry.bad = true
    }

    let readv = new RegExp('adv.')
    if (readv.test(entry.testrow)) entry.pos = 'adverb'
    return entry.pos
}

// первая строка м.б. compound
// первая или вторая - morph
function parseTestrow(entry) {
    let compounds = ''
    entry.trns = _.compact(entry.trns)
    let testrow = entry.trns[0]
    if (!testrow) return
    testrow = testrow.trim()

    if (testrow == '2' || testrow == '3') return testrow
    //
    if (testrow.split('-').length > 1 && testrow.replace(/-/g, '') == entry.rdict) compounds = testrow // ξύμπλοος / σύμ-πλοος
    // if (testrow.split('-').length > 1) compounds = testrow // == так нельзя,
    if (compounds) {
        entry.compounds = compounds.split('-')
        if (!entry.trns[1]) entry.bad = true
        else testrow = entry.trns[1].trim()
    }

    // βαθύνοος // βαθύ-ξυλος
    // какое-то странное разбиение, но не компаунд
    if (testrow.split(' ').length == 1 && testrow.split('-').length == 2) {
        if (entry.trns[1]) testrow = entry.trns[1].trim()
        else testrow = ''
    }

    if (!testrow) return
    return testrow
}

// ========================================= OLD

function p_(cdict) {

    // 'ος',
    // 'ός',
    // 'ής',
    // 'ης',
    // 'ων',
    // 'ών',
    // 'υς',
    // 'ῦς',
    // 'ις',
    // 'ως',
    // 'ην',
    // 'ια',
    // 'ας',
    // 'ωρ',
    // 'οι'

}

function probeAdverb(cdict) {
    if (cdict.pos) return
    if (/adv\./.test(cdict.testrow)) {
        cdict.pos = 'adverb'
    }

    return cdict.pos
}

function parseAdjective(cdict) {
    if (cdict.pos != 'adj') return
    let typestr = ''

    if (!/2/.test(cdict.testrow) && !/3/.test(cdict.testrow)) return
    // log('_ADJECT')
    let type23 = /2/.test(cdict.testrow) ? 2 : 3
    cdict.pos = 'adj'

    let type = ''
    for (let atype in adj23Type) {
        let reatype = new RegExp(atype + '$')
        if (!reatype.test(cdict.dict)) continue
        if (atype.length > type.length) type = atype
    }

    // if (!type) log('_DVR_ADJ-23_no_type', cdict.rdict)
    if (!type) return

    cdict.type = type
    cdict.pos = 'adj'

    let retype = new RegExp(type + '$')
    cdict.astem = cdict.dict.replace(retype, '')

    // EIR ε, ι, ρ
    if (type23 == 2) {
        let neut = type.slice(0,-1) + 'ν'
        cdict.stype = [type, type, neut]
    } else {
        let alpha = false
        let last = cdict.astem[cdict.astem.l1ngth -1]
        if ('ε,ι,ρ'.split(',').includes(last)) alpha = true
        if (alpha) {
            let stype = adj3TypeAlpha[type]
            if (!stype) log('_no_stype_Alpha', cdict)
            cdict.stype = adj3TypeAlpha[type].split('-')
        } else {
            let stype = adj3Type[type]
            if (!stype) log('_no_stype', cdict)
            cdict.stype = adj3Type[type].split('-')
        }
    }
}


function selectRegular(testrow) {
    let regtype = 'regular'
    if (/ PREFIX /.test(testrow)) regtype = 'indecl'

    for (let type of indecl_types) {
        let reitype = new RegExp(type)
        if (reitype.test(testrow)) regtype = 'indecl'
    }

    if (/ praep\. /.test(testrow)) regtype = 'indecl'

    if (/\(fut\.|\(aor\.|\(impf.|\(pf.|\(ppf./.test(testrow)) {
        return 'regular' // это формы неправильных глаголов, а не specforms
    }

    for (let type of specform_types) {
        let reitype = new RegExp(type)
        if (reitype.test(testrow)) regtype = 'spec'
    }

    // if (/aor\./.test(testrow)) regtype = 'spec'
    if (/ = /.test(testrow)) regtype = 'spec'


    // if (!regtype) regtype = 'regular'
    return regtype
}

function createIdDocs(matches, irregs) {
    let gdict = {}
    matches.forEach(dict => {
        if (!gdict[dict.stem]) gdict[dict.stem] = {_id: dict.stem, docs: []}
        gdict[dict.stem].docs.push(dict)
    })

    irregs.forEach(cdict => {
        if (!gdict[cdict.dict]) gdict[cdict.dict] = {_id: cdict.dict, docs: []}
        gdict[cdict.dict].docs.push(cdict)
    })

    let iddocs = _.values(gdict)
    return iddocs
}


// ===== лишнее

function parseCompound_(entry) {
    let compounds = entry.compounds
    if (!compounds) return

    let rfc = compounds[0]
    let rsc = compounds[1]
    let fc = comb(compounds[0])
    let sc = comb(compounds[1])

    if (compounds.length > 2) { // ἀρχαιο-μελι-σιδωνο-φρυνιχ-ήρατος
        log('_too_long_comp', entry.raw)
        // throw new Error()
        rsc = compounds[compounds.length -1] // доделать TODO - последний компонент
        sc = comb(rsc)
    }
    let compound = {rfc, rsc, fc, sc}
    delete entry.compounds
    return compound
}

function parseCompoundPrefix_(entry) {
    let pref = ''
    let pfc = plain(entry.compound.fc)
    let psc = plain(entry.compound.sc)
    for (let prefix of prefixes) {
        let repref = new RegExp('^' + prefix)
        if (!repref.test(pfc)) continue
        if (pfc.length - prefix.length > 1) continue // префикс лишь чуть длиннее FC
        if (prefix.length > pref.length) pref = prefix
    }
    if (!pref) return
    let repref = new RegExp('^' + pref)
    let prefcon = pfc.replace(repref, '')
    if (!psc) return
    // if (cdict.lsjSuffix && cdict.lsjSuffix == psc) return
    let prefix = {pref, con: prefcon, pfc}
    // entry.prefix = prefix
    entry.astem = psc
    return prefix
}

function guessPrefix_(entry) {
    let compounds = entry.raw.split('-')
    if (compounds.length > 1) return // надо бы сравнивать с вычислением префикса реального по дефису

    // log('_===========================================guess prefix', entry)

    let pdict = plain(entry.dict)
    let pref = ''
    for (let prefix of prefixes) {
        let repref = new RegExp('^' + prefix)
        if (!repref.test(pdict)) continue
        // if (pdict.length - prefix.length > 1) здесь нельзя, тут stem + type
        if (prefix.length > pref.length) pref = prefix
    }

    if (!pref) return

    // log('_===========================================guess prefix', pref)

    let repref = new RegExp('^' + pref)
    let psc = pdict.replace(repref, '')

    if (!psc) {
        entry.com = 'no tail - guess prefix'
        entry.indecl = true
        return
    }

    let pfc = pref
    let short = removeVowelBeg(psc)
    let reshort = new RegExp(short + '$')
    let con = psc.replace(reshort, '')
    if (con) pfc = pref + con
    entry.astem = short

    let prefix = {pref, pfc, guess: true}
    if (con) prefix.con = con
    // entry.prefix = prefix
    entry.prefguess = true
    return prefix
}
