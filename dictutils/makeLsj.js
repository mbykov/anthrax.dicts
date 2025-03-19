//
const log = console.log

import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'
import { parseAug, cleanLongShort, cleanStress, arts, termByStem, removeVowelBeg, parseGenByArt, stripAccent, vowels, toConst } from './index.js'
const currentdir = process.cwd()
import Debug from 'debug'

import { accents } from './lib/utils.js'
let acs = _.values(accents)

import { wktNounPatterns } from "./lib/wkt_noun_patterns.js"
import { wktAdjPatterns } from "./lib/wkt_adj_patterns.js"
import { wktVerbPatterns } from "./lib/wkt_verb_patterns.js"
import { wktAdverbPatterns } from "./lib/wkt_adv_patterns.js"

import { preVerbPatterns } from "./lib/lsj_pre_verb_patterns.js"
import { preIndeclPatterns } from "./lib/lsj_pre_indecl_patterns.js"
import { preSformsPatterns } from "./lib/lsj_pre_sforms_patterns.js"
import { preNounPatterns } from "./lib/lsj_pre_noun_patterns.js"
import { preAdjPatterns } from "./lib/lsj_pre_adj_patterns.js"
import { preAdvPatterns } from "./lib/lsj_pre_adv_patterns.js"

import { preflist } from "@mbykov/anthrax/preflist"

const prefixes = preflist.map(pref=> {
    pref = pref.replace(/-/g, '')
    return pref
})

let lsjAstemList = []
let lsjPrefixList = [] // здесь создается подсчетом из pfc, а импортируется

let lsjSuffixListNEW = [] // lsjSuffixList первый раз создается подсчетом из pfc, затем импортируется
let lsjSuffixList = fse.readJsonSync('./lib/lsj_suffix_list.js')

const az = Debug('app')
const nn = Debug('noun')
const jj = Debug('adj')
const vv = Debug('verb')
const dd = Debug('adverb')
const cc = Debug('compound')
const zz = Debug('nounZ')

let only = process.argv.slice(2)[0] || ''
let push = ''
if (only == 'push') only = false, push = true

if (only) {
    log('_ONLY_LSJ', only)
    only = only.replace(/-/g, '')
    only = cleanLongShort(only)
    only = plain(comb(only))
    only = new RegExp('^"' + only) // здесь " - потому что scv
}

let dirPath = path.resolve(currentdir, '../Sources/lsj-js.csv')

let typicalAdjGenPath = path.resolve(currentdir, './wkt-keys/typical-adj-gen.js')
let typicalAdjGen = fse.readJsonSync(typicalAdjGenPath)
let typicalNounGenPath = path.resolve(currentdir, './wkt-keys/typical-noun-gen.js')
let typicalNounGen = fse.readJsonSync(typicalNounGenPath)

let unknowns_lsj = []
let fullStemList = []
let fullStemList3 = []

const indecl_types = ['conj.', 'indecl.', 'pron.', 'interj.', 'prefix'] // praep.
const specform_types = ['inf.', 'pf.', 'fut.', 'aor.',  'impf.',  'pass.', 'praes.', 'dual.', 'conjct.',  'стяж.',  'дат.',  'part.',  'aor.1',  'aor.2',  'opt.',  'elisione',  'dat.',  'произнош.', 'acc.', 'к_', 'pl.',  'поэт_.', 'imper.', 'impf.', 'ppf.', 'sing.', 'см.', '2 л.', 'ион. =']

const zksps = ['ψ', 'ξ']
const zEndings = [
    'ξ-κος',
    'ξ-κτος',
    'ξ-γος',
    // ιξ: 'τρῐχος',
    'ξ-χος',
    // ιγξ: 'ιγγος',
    'ψ-βος',
    'ψ-πος',
]


await main(dirPath)


async function main(dirPath) {
    let text = fse.readFileSync(dirPath, 'utf8')
    let rows = text.split('\n')
    log('_rows', rows.length)

    let phrases = []
    let entries = []

    for (let row of rows) {
        row = cleanLongShort(row)

        let test = row.slice(0,20)
        test = plain(comb(test)).replace(/-/g, '')
        if (only && !only.test(test)) continue

        let rdict = row.split(':')[0]
        rdict = rdict.replace(/"/g, '').replace(/^\*/g, '').replace(/\[/g, '')

        // if (only) log('_________________ROW', row)
        // B_LETTER ; βρέφος
        // if (rdict[0] != 'β') continue

        if (rdict.split(' ').length > 1) {
            phrases.push(row.replace(/"/g, ''))
            continue
        }

        let orig = rdict
        let raw = rdict
        let dict = comb(rdict)
        let entry = {orig, raw, rdict, dict}

        // здесь в LSJ нужно вычислить префикс, чтобы отличить от суффикса в компаунде и создать список суффиксов
        let prefix = ''
        let lsjSuffix = ''
        let compound = parseCompound(entry)
        if (compound) entry.compound = compound

        // log('_compound', compound)
        if (entry.compound) prefix = parseCompoundPrefix(entry)
        else prefix = guessPrefix(entry)
        // log('_parseCompoundPrefix', prefix)
        if (entry.compound && !entry.prefix) lsjSuffix = parseLSJSuffix(entry)
        // log('_lsjSuffix', lsjSuffix)

        if (lsjSuffix) entry.lsjSuffix = lsjSuffix

        if (entry.prefix) {
            lsjPrefixList.push(entry.prefix.pfc)
        }

      if (entry.compound || entry.prefix  || entry.lsjSuffix) {
            entry.rdict = entry.rdict.replace(/-/g, '')
            entry.dict = entry.dict.replace(/-/g, '')
        }

        let trns = row.split(':').slice(1).join(':')
        trns = trns.replace(/"/g, '')
        trns = trns.split(/\d\. /)
        trns = _.compact(trns)

        entry.trns = trns

        let str = row.split(':')[1]
        // if (only) log('_________________STR', row)
        if (!str) continue
        str = str.replace(/"/g, '')

        let testrow = createTestrow(str)
        entry.testrow = testrow

        let pos = parsePrePos(entry)
        // log('____ROW', row, '\n____E', entry)

        entries.push(entry)
    }

    // if (only) log('____ONLY Entries', entries)

    // let indecls = entries.filter(entry=> entry.indecl)
    // let sforms = indecls.filter(entry=> entry.sform)
    // indecls = indecls.filter(entry=> !entry.sform)
    // if (only) log('____INDECLS', indecls)

    // entries = entries.filter(entry=> !entry.indecl)
    // let adverbs = entries.filter(entry=> entry.pos == 'adverb')
    let regulars = entries.filter(entry=> entry.pos)
    let indecls = entries.filter(entry=> !entry.pos && !entry.sform)

    // if (only) log('______Regs', regulars)

    let cdicts = []
    for (let entry of regulars) {
        let cdict = parseCdict(entry)
        if (!cdict) continue
        // if (only) log('_____cdict_before_parse', cdict)

        let dicts = []
        // if (cdict.zero && cdict.pos == 'noun') dicts = parseNounZ(cdict)
        if (cdict.pos == 'noun') dicts = parseNoun(cdict)
        else if (cdict.pos == 'verb') dicts = parseVerb(cdict)
        else if (cdict.pos == 'adj') dicts = parseAdjective(cdict)
        else if (cdict.pos == 'adverb') dicts = parseAdverb(cdict)
        else {
            // log('_should_be_pos', cdict)
            // throw new Error()
        }
        cdicts.push(...dicts)
        // if (only) log('____________________C', cdicts)
    }

    for (let cdict of cdicts) {
        if (cdict.indecl) {
            indecls.push(cdict) // не удалось создать astem / adverbs
            continue
        }
        if (!cdict.astem) {
            log('_NO_ASTEM', cdict)
            throw new Error()
        }
        delete cdict.compound
        delete cdict.lsjSuffix
        delete cdict.typestr
        delete cdict.testrow
        // cdict.astem = plain(comb(cdict.astem))
    }
    cdicts = cdicts.filter(cdict=> !cdict.indecl)

    // ========================================================

    if (only) {
        log('_cdicts', cdicts)
        log('_indecls', indecls)
    }

    let nouns = cdicts.filter(cdict=> cdict.pos == 'noun')
    let adjs = cdicts.filter(cdict=> cdict.pos == 'adj')
    let verbs = cdicts.filter(cdict=> cdict.pos == 'verb')
    let adverbs = indecls.filter(cdict=> cdict.pos == 'adverb') // пока наречия в indecls, правильно это?

    // let nounRdicts = nouns.map(cdict=> [cdict.raw, cdict.astem].join(': '))

    if (push) {
        log('_entries', entries.length)
        log('_cdicts', cdicts.length)
        log('_nouns', nouns.length)
        log('_adjs', adjs.length)
        log('_verbs', verbs.length)
        log('_adverbs', adverbs.length)
        log('_regulars', regulars.length)
        log('_indecls', indecls.length)
        // log('_phrases', phrases.length)

        lsjPrefixList = _.uniq(lsjPrefixList)
        lsjAstemList = _.uniq(lsjAstemList)
        lsjSuffixListNEW = _.uniq(lsjSuffixListNEW) // RAW_SUF - когда импортирую, после создания, закоммментировать

        fse.writeFileSync('./results/cdicts_lsj.js', JSON.stringify(cdicts, null, 8))
        fse.writeFileSync('./results/indecls_lsj.js', JSON.stringify(indecls, null, 8))
        // fse.writeFileSync('./tmp/lsj_unknowns.js', JSON.stringify(unknowns_lsj, null, 8))
        // fse.writeFileSync('./tmp/lsj_phrases.js', JSON.stringify(phrases, null, 8))
        // fse.writeFileSync('./tmp/lsj_nouns.js', JSON.stringify(nouns, null, 8))
        // fse.writeFileSync('./tmp/lsj_nounRdicts.js', JSON.stringify(nounRdicts, null, 8))
        // fse.writeFileSync('./tmp/lsj_adverbs.js', JSON.stringify(adverbs, null, 8))

        // LIB
    //     fse.writeFileSync('./lib/lsj_prefix_list.js', JSON.stringify(lsjPrefixList, null, 8))
    //     fse.writeFileSync('./lib/lsj_suffix_list.js', JSON.stringify(lsjSuffixListNEW, null, 8)) // и тут RAW_SUF
    //     // fse.writeFileSync('./lib/lsj_astem_list.js', toConst(lsjAstemList, 'lsjSuffixList'))
    }
}

function parseLSJSuffix(entry) {
    // создается список суффиксов
    let notSuffixes = ['αύχην']
    let lastcomp = entry.raw.split('-')[entry.raw.split('-').length -1]

    if (notSuffixes.includes(lastcomp)) return

    if (lastcomp.length < 4) lsjSuffixListNEW.push(lastcomp)
    if (lastcomp.length == 4) {
        let first = lastcomp[0]
        first = plain(comb(first))
        if (vowels.includes(first)) lsjSuffixListNEW.push(lastcomp)
    }
    if (lastcomp.length == 5) {
        let first = lastcomp[0]
        let second = lastcomp[1]
        first = plain(comb(first))
        second = plain(comb(second))
        if (vowels.includes(first) && vowels.includes(second)) lsjSuffixListNEW.push(lastcomp)
    }

    let lsjSuffix = ''
    for (let lsjsuf of lsjSuffixList) {
        if (notSuffixes.includes(lsjsuf)) continue
        let resuf = new RegExp('-' + lsjsuf + '$')
        if (!resuf.test(entry.raw)) continue
        if (lsjsuf.length > lsjSuffix.length) lsjSuffix = lsjsuf // , raw = raw.replace(/-/g, '') // , rdict = rdict.replace(/-/g, '')
    }

    // log('_______________________________________________________SUF', lsjSuffix, entry.compound.fc)
    if (lsjSuffix) {
        // entry.lsjSuffix = lsjSuffix
        // entry.astem = plain(entry.compound.fc)
        // NB: это нужно! не убирать!
        delete entry.compound
        delete entry.compounds
    }
    // log('_______________________________________________________ASTEM', lsjSuffix, entry.astem)
    return lsjSuffix
}

function parseCompound(entry) {
    let compounds = entry.raw.split('-')
    if (compounds.length == 1) return

    let rfc = compounds[0]
    let rsc = compounds[1]
    let fc = comb(compounds[0])
    let sc = comb(compounds[1])

    if (compounds.length > 2) { // ἀρχαιο-μελι-σιδωνο-φρυνιχ-ήρατος
        // log('_too_long_comp', entry.raw)
        // throw new Error()
        rsc = compounds[compounds.length -1] // доделать TODO - последний компонент
        sc = comb(rsc)
    }
    let compound = {rfc, rsc, fc, sc}
    entry.compounds = compounds // повторяю вычисление префикса в makeNest для всех словарей
    return compound
}

function parseCompoundPrefix(entry) {
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
    entry.prefix = prefix
    entry.astem = psc
    return prefix
}

function guessPrefix(entry) {
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
        entry.comm = 'no tail - guess prefix'
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
    entry.prefix = prefix
    entry.prefguess = true
    return prefix
}

function parseNounZ_(cdict) {
    if (cdict.pos != 'noun') return []
    log('_CDICT NOUN_Z________', cdict.rdict, zEndings)

    let pdict = plain(cdict.dict)
    let possibleGen = cdict.testrow.split(' ')[0].replace(',', '')
    let pgen = ''
    for (let zend of zEndings) {
        let ztype = zend.split('-')[0]
        let gen = zend.split('-')[1]
        if (!cdict.dict.endsWith(ztype)) continue
        if (!possibleGen.endsWith(gen)) continue
        pgen = gen
    }
    // log('_PGEN________', possibleGen, '_pgen:', pgen)

    // let {aug, tail} = parseAug(pdict)
    // let astem = pdict.slice(0, -1)
    // if (aug) astem = astem.replace(aug, '')

    let datdict = _.clone(cdict) // for other
    // datdict.astems = [tail] // for dative
    datdict.zdative = true
    datdict.astem = pdict

    log('_PGEN________', possibleGen, '_pgen:', pgen)

    let ndict = _.clone(cdict) // for other
    let firstOfgen = pgen[0]
    let astem = pdict.slice(0, -1)
    let genstem = astem + firstOfgen
    // genstem = strip(genstem)
    // ndict.astems = [genstem]
    ndict.astem = genstem
    ndict.zother = true

    // let zdict = _.clone(cdict) // irregular for nominative
    // zdict.astems = [tail] // for dative
    // zdict.irregularXXX = true

    // dative = nominative
    return [datdict, ndict] // , zdict
}

function parseNoun(cdict) {
    let typestr = cdict.typestr
    let type = ''
    let tgen = ''
    let ptype = ''
    // let pgen = ''
    let ntype = ''
    // log('__________________________________________________________________________________noun', cdict.rdict, 'typestr', typestr)
    if (typestr) {
        type = typestr.split(', ')[0]
        tgen = typestr.split(', ')[1]
        type = comb(type)
        ptype = plain(type)
        tgen = comb(tgen)
        // pgen = plain(tgen)
    } else {
        for (let ntypestr of wktNounPatterns) { // plain type str
            if (!ntypestr) continue
            let ntype = ntypestr.split(', ')[0]
            if (!plain(cdict.dict).endsWith(ntype)) continue
            if (ntype.length > ptype.length) ptype = ntype
        }
        // log('_no_typestr new by ptype________', ptype)
    }
    // log('_typestr - ptype________', cdict.rdict, 'typestr', typestr, '_ptype:', ptype)

    // astem - has aug // NOUNS
    let reptype = new RegExp(ptype + '$')
    let astem = plain(cdict.dict).replace(reptype, '')

    if (!type && ptype) {
        // log('_!type && ptype___________________', cdict.dict, astem, reptype)
        let reastem = new RegExp('^' + astem)
        type = cdict.dict.replace(reastem, '')
        if (type == cdict.dict) type = plain(cdict.dict).replace(reastem, '')
        type = stripAccent(type)
    }
    // log('__________________________________________________________________________________parse_noun', cdict.rdict, 'astem', astem, '_type', type)

    if (!type) {
        cdict.comm = 'no noun type'
        cdict.indecl = true
        return [] // [cdict]   // ============================= IRREG !
    }

    cdict.type = type
    // log('_ASTEM_N____________', astem, '_type:', type, typicalNounGen[type])

    if (!astem) {
        cdict.indecl = true
        cdict.comm = 'no_astem'
        return [cdict]
    }
    // log('_STEM N', cdict.rdict, 'ptype', ptype)
    let gends = parseGenByArt(cdict.testrow)
    if (gends.length) {
        cdict.gends = gends
    } else {
        cdict.gends = ['masc']
    }

    // log('________________________________________________TYPE', typestr)
    if (!tgen && !typicalNounGen[type]) {
        // log('_no typicalNounGen[type]', cdict.rdict)
        cdict.comm = 'no typicalNounGen'
        unknowns_lsj.push(cdict)
        return []
    }
    if (!tgen) tgen = typicalNounGen[type].max
    // log('_TGEN typical:', type, 'tgen:', tgen)

    if (!tgen) {
        log('_NO TGEN NOUN', cdict.rdict, 'testrow:', cdict.testrow)
        cdict.comm = 'no tgen'
        cdict.indecl = true
        return [] // [cdict]
    }

    // if (/ gen\. /.test(cdict.testrow)) cdict.exgen = true

    cdict.gen = tgen
    cdict.stype = [type, tgen]
    cdict.astem = astem
    return [cdict]
} // nouns

function parseAdjective(cdict) {
    let typestr = cdict.typestr
    // log('typestr', cdict.typestr, 'testrow', cdict)

    let type, tfem, tneut
    if (typestr) {
        if (typestr.split(', ').length == 2) {
            type = typestr.split(', ')[0]
            tfem = typestr.split(', ')[0]
            tneut = typestr.split(', ')[1]
        } else if (typestr.split(', ').length == 3) {
            type = typestr.split(', ')[0]
            tfem = typestr.split(', ')[1]
            tneut = typestr.split(', ')[2]
        }
        type = comb(type), tfem = comb(tfem), tneut = comb(tneut)
    } else {
        log('_NO_TYPESTR', cdict)
        throw new Error()
        // генетива в testrow нет:

    }

    let ptype = plain(type)
    let reptype = new RegExp(ptype + '$')
    // astem - has aug
    let astem = cdict.dict.replace(reptype, '')
    if (astem == cdict.dict) astem = plain(cdict.dict).replace(reptype, '')

    jj(type, tfem, tneut, '_astem', astem)

    if (/ gen\. /.test(cdict.testrow)) cdict.exgen = true

    cdict.astem = astem
    cdict.type = type
    cdict.stype = [type, tfem, tneut]
    return [cdict]
} // adjective

function parseVerbByWkt(cdict) {
    let pdict = plain(cdict.dict)
    let ptype = ''
    for (let vtype of wktVerbPatterns) {
        if (!vtype) continue
        if (!pdict.endsWith(vtype)) continue
        if (vtype.length > ptype.length) ptype = vtype
    }

    if (!ptype) vv('_NO_PTYPE_VERB_______', cdict.raw)
    if (!ptype) {
        cdict.comm = 'no type verb, sform'
        cdict.indecl = true
    }

    // astem - has lead
    let reptype = new RegExp(ptype + '$')
    // let astem = cdict.dict.replace(reptype, '')
    // if (astem == cdict.dict)
    let astem = pdict.replace(reptype, '')
    cdict.astem = astem
    let reastem = new RegExp('^' + astem)
    let type = cdict.dict.replace(reastem, '')
    if (type == cdict.dict) type = plain(cdict.dict).replace(reastem, '')
    // log('__________________________________AAAA', cdict.rdict, ptype, cdict.astem)
    cdict.type = type
    cdict.typeByWkt = true
}

function parseVerb(cdict) {
    if (cdict.lsjSuffix) {
        let lsjtype = comb(cdict.lsjSuffix)
        lsjtype = stripAccent(lsjtype)
        let reptype = new RegExp(cdict.lsjSuffix + '$')
        cdict.astem = plain(cdict.dict).replace(reptype, '')
        cdict.type = lsjtype
        cdict.typeByLsj = true
    } else if (cdict.typestr) {
        parseVerbByWkt(cdict)
    } else {
        throw new Error('VERB CAN NOT BE')
    }

    if (!cdict.astem) {
        log('_VERB no astem', cdict)
        throw new Error()
    }

    if (cdict.indecl) { // from parseVerbByWkt
        cdict.comm = 'no astem verb'
        cdict.indecl = true
        return [cdict]
    }

    if (!cdict.type) {
        log('_VERB no type', cdict)
        throw new Error()
    }

    cdict.stype = [cdict.type]
    return [cdict]
} // verb

function parseAdverb(cdict) {
    let type = ''
    for (let vtype of wktAdverbPatterns) { // rdict
        if (!vtype) continue
        if (!cdict.rdict.endsWith(vtype)) continue
        if (vtype.length > type.length) type = vtype
    }

    if (!type) {
        cdict.indecl = true
        return [cdict]
    }

    cdict.type = comb(type)
    cdict.indecl = true // это временно. Пока я adverbs не добавляю в гнезда
    return [cdict]
}

function createTestrow(row) {
    let testrow = row.slice(0, 35)
    // log('_____testrow', testrow)
    testrow = testrow.replace(/ ?\[[^\]]*\],? /g, " ").trim()
    testrow = testrow.replace(/":" /, '":"')
    testrow = testrow.replace('(A), ', '').replace('(B), ', '').replace('(C), ', '').replace('(D), ', '')
    testrow = testrow.replace(/^"/, '')
    // log('_____testrow', testrow)
    testrow = testrow.replace(/[A-Z][a-z]+\. [^a-z ]+, /, '')
    // log('_____testrow', testrow)
    // ἄγλωσσος":"Att. ἀγλάο-ττος,
    return testrow
}

function parsePrePos(entry) {
    let readv = new RegExp('Adv\\.')
    if (readv.test(entry.testrow)) entry.pos = 'adverb' // , entry.indecl = true
    if (entry.pos) return entry.pos

    for (let patt of preSformsPatterns) {
        if (!patt) continue
        if (entry.compound) continue
        else if (entry.lsjSuffix) continue
        patt = patt.replace(/\./g, '\\.')
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.testrow)) continue
        // entry.indecl = true
        entry.sform = patt
        // entry.repatt = repatt
    }
    if (entry.pos) return entry.pos

    for (let patt of preIndeclPatterns) {
        if (!patt) continue
        if (entry.compound) continue
        else if (entry.lsjSuffix) continue
        patt = patt.replace(/\./g, '\\.')
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.testrow)) continue
        entry.indecl = true
    }
    if (entry.pos) return entry.pos

    let pattern = ''
    for (let patt of preVerbPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt + '$')
        if (!repatt.test(entry.rdict)) continue
        if (patt.length > pattern.length) pattern = patt
    }
    if (pattern) {
        entry.typestr = pattern
        entry.pos = 'verb'
    }
    if (entry.pos) return entry.pos

    let typestr = ''
    for (let patt of preNounPatterns) {
        if (!patt) continue
        let type = patt.split(':')[0].trim()
        let str = patt.split(':')[1].trim()
        let retype = new RegExp(type + '$')
        let restr = new RegExp('^' + str)
        if (!retype.test(entry.rdict) || !restr.test(entry.testrow)) continue
        // log('____________________ ', type, retype, entry.rdict, retype.test(entry.rdict))
        entry.pos = 'noun'
        entry.typestr = patt.replace(':', ',')
    }

    // на случай если нет typestr:
    let gends = parseGenByArt(entry.testrow)
    if (gends.length) {
        entry.pos = 'noun'
        entry.gends = gends
    }
    // log('_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx POS', entry )
    if (entry.pos) return entry.pos

    for (let patt of preAdjPatterns) {
        if (!patt) continue
        let type = patt.split(':')[0].trim()
        let str = patt.split(':')[1].trim()
        let retype = new RegExp(type + '$')
        let restr = new RegExp('^' + str)

        if (!retype.test(entry.rdict) || !restr.test(entry.testrow)) continue
        entry.pos = 'adj'
        entry.typestr = patt.replace(':', ',')
    }
    // log('_________________________________________________A', entry)
    if (entry.pos) return entry.pos

    // log('_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx POS', entry.pos)

    for (let patt of preAdvPatterns) {
        if (!patt) continue
        let repatt = new RegExp(patt)
        if (!repatt.test(entry.rdict)) continue
        entry.pos = 'adverb'
    }
    if (entry.pos) return entry.pos
}

// определяется cdict.pdict
function parseCdict(entry) {
    let rdict = entry.rdict
    rdict = rdict.replace('(', '').replace(')', '') // это нехорошо, нужен double
    // rdict = cleanLongShort(rdict)
    let dict = comb(rdict )
    let pdict = plain(dict )
    let testrow = entry.testrow
    let pos = entry.pos
    let cdict = {raw: entry.raw, rdict, dict, pos, testrow}
    if (entry.gends) cdict.gends = entry.gends

    if (entry.compounds) cdict.compounds = entry.compounds
    // if (entry.prefix) cdict.prefix = entry.prefix
    if (entry.typestr) cdict.typestr = entry.typestr
    if (entry.lsjSuffix) cdict.lsjSuffix = entry.lsjSuffix

    if (cdict.rdict[0] == cdict.rdict[0].toUpperCase()) cdict.person = true

    let zlast = cdict.rdict[cdict.rdict.length-1]
    if (zksps.includes(zlast)) {
        cdict.zero = true
    }
    cdict.trns = entry.trns

    return cdict
}
