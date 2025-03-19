
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import PouchDB from 'pouchdb'
import {comb, oxia, plain, strip} from 'orthos'

import { suffixList } from "./lib/suffix_list.js"
import { wktNounPatterns } from "./lib/wkt_noun_patterns.js"
import { wktAdjPatterns } from "./lib/wkt_adj_patterns.js"

import { preflist } from "@mbykov/anthrax/preflist"
const prefixes = preflist.map(pref=> {
    pref = pref.replace(/-/g, '')
    return pref
})

const chunksize = 1000
const currentdir = process.cwd()

const dbpath = path.resolve(currentdir, '../../pouch-anthrax')

export const vowels =  ['α', 'ε', 'ι', 'ο', 'ω', 'η', 'υ', 'ϝ', 'ͅ'] // ypo last

export const asps = ['\u0313', '\u0314']

export const ypo = '\u0345'

export const accents = {
    'oxia': '\u0301',
    'varia_': '\u0060',
    'varia': '\u0300',
    'peris': '\u0342',
    '': '',
    'psili': '\u0313',
    'dasia': '\u0314',
    '': '',
    // 'ypo': '\u0345',
    '': ''
}

export const acs = _.values(accents)

export const doubledot = '̈'

export const arts = {
    'ἡ': {gend: 'fem'},
    'ὁ': {gend:'masc'},
    'τό': {gend:'neut'},
    'τὸ': {gend:'neut'}, // grave accent ???
    'τὁ': {gend:'neut'}, // aspiration - mistype
    'τά': {gend: 'neut', pl: true},
    'αἱ': {gend: 'fem', pl: true},
    'οἱ': {gend: 'masc', pl: true}
}

export function parseGenByArt(teststr) {
    // rstr - non combined
    let gends = []
    for (let art in arts) {
        if (teststr.split(art).length > 1) gends.push(arts[art].gend)
    }
    return gends
}

export const AllStresses = { // no varia after orthos.oxia()
    'oxia': '\u0301',
    'peris': '\u0342',
    'varia': '\u0300',
    'varia_': '\u0060',
}

export const aspirations = {
  'psili': '\u0313',
  'dasia': '\u0314'
}

export const zksps = ['ψ', 'ξ']

// export const adjTypeReg = ['ος', 'ής', 'ης', 'ός', 'ων', 'υς', 'ις', 'ως', 'ην', 'ια', 'ῦς', 'ας', 'ών', 'ωρ', 'οι']

export const adj23Type = {
    'ος': ['ος-α-ον', 'ος-η-ον', 'ος-ος-ον'],
    'ός': ['ός-ή-όν', 'ός-ά-όν"', 'ός-ός-όν'],
    'ης': ['ης-ης-ες'],
    'ής': ['ής-ής-ές'],
    'ων': ['ν-ων-ον', 'ων-ουσα-ον'],
    // 'ών': [],
    'υς': ['υς-εια-υ'],
    'ύς': ['ύς-εῖα-ύ'],
    // 'ῦς': [],
    'ους': ['ους-ους-ουν'],
    'οῦς': ['οῦς-ῆ-οῦν'],
    'έος': ['έος-έα-έον'],
    // 'ις': [],
    'εις': ['εις-εσσα-εν'],
    // 'ως': [],
    'εως': ['εως-εως-εων'],
    'ην_': [],
    'ην': ['ην-εινα-εν'],
    // 'ια': [],
    'ας': ['ας-αινα-αν', 'ας-ασα-αν', 'ας-ας-αν'],
    'ωρ': ['ωρ-ωρ-ορ'],
    // 'οι': [],
}



let psuffixes = suffixList.map(suffix=> {
    return plain(comb(suffix))
})
psuffixes = _.uniq(psuffixes)


export function cleanStress(text) {
    text = text.replace(/ϐ/g, 'β')
    text = text.replace(/·/g, '·')
    text = text.replace(/ό/g, 'ό')
    text = text.replace(/ί/g, 'ί')
    text = text.replace(/ά/g, 'ά')
    text = text.replace(/ή/g, 'ή')
    text = text.replace(/ώ/g, 'ώ')
    text = text.replace(/έ/g, 'έ')
    text = text.replace(/ύ/g, 'ύ')
    text = text.trim().replace(/\.$/, '')
    return text
}

export function cleanStr(str) {
    str = str.replace(/\.$/, '')
    return str
}

let badVeryBad = '\u035c' // COMBINING DOUBLE BREVE BELOW
let badVeryBad0306 = '\u0306' // Combining Breve[1]

// export function getStress(form) {
//     let idx, stressidx, stress
//     for (let strs in AllStresses) {
//         idx = form.lastIndexOf(AllStresses[strs])
//         if (idx < 0) continue
//         stressidx = form.length - idx
//         stress = strs
//     }
//     return {stressidx, stress}
// }

export function getStress(form) {
    let idx, stressidx, stress
    for (let strs in AllStresses) {
        idx = form.indexOf(AllStresses[strs])
        if (idx < 0) continue
        // log('_get_stress', form , strs, idx)
        stressidx = form.length - idx
        stress = strs
    }
    return {stressidx, stress}
}

export function cleanLongShort(row) {
    // https://www.compart.com/en/unicode/block/U+0300
    let clean = row.trim()
    clean = clean.replace(/ᾰ/gi, 'α').replace(/ᾱ/gi, 'α').replace(/ῑ/gi, 'ι').replace(/ῐ/gi, 'ι').replace(/ῠ/gi, 'υ').replace(/ῡ/gi, 'υ').replace(/ ͜/gi, '').replace(badVeryBad, '').replace(/\u0306/g, '').replace(/\u0304/g, '').replace(/\u0313\u0304/g, '\u0313')
    return clean
}

export function toConst(obj, name) {
    return ['export const ', name, ' = ', JSON.stringify(obj, null, 8)].join('')
}

export function parseNounType(pnom, pgen) {
    let typestr = ''
    for (let type of wktNounPatterns) {
        if (!type) continue
        let types = type.split(', ')
        let nom = types[0]
        let renom = new RegExp(nom + '$')
        if (!types[1]) log('_no_nom', types)
        let gen = types[1].replace('-', '')
        let regen = new RegExp(gen + '$')

        if (!renom.test(pnom) || !regen.test(pgen)) continue
        if (type.length >= typestr.length) typestr = type
    }
    // log('_typestr________', typestr)
    return typestr
}

export function termByAStem(cwf, astem) {
    let reastem = new RegExp('^' + astem)
    let term = cwf.replace(reastem, '')
    if (term == cwf) term = plain(cwf).replace(reastem, '')
    // log('___________________________________________________', term)
    if (term == plain(cwf)) return ''

    let first = term[0]
    if (acs.includes(first)) term = term.slice(1)

    return term
}

export function termByStem(cwf, stem) {
    let parts = cwf.split(stem)
    // log('__________parts_0', cwf, stem, parts)
    if (parts.length == 1) parts = plain(cwf).split(stem)
    else if (parts.length == 2 && !parts[1]) { // σίνων - σίνωσιν - находит сразу второй
        parts = plain(cwf).split(stem)
        // log('_SINON', parts = plain(cwf).split(stem))
        parts = ['', parts[1] + stem]
    } else { // αἶνος -  αἴνοιν - ν дважды ; οἰνών - трижды
        // log('__________parts_3', parts)
        // let tails = parts.slice(1)
        let term = parts.slice(1).join(stem)
        // log('__________tails, term', tails, term)
        parts = [parts[0], term]
        // log('__________parts_4', parts, term)
    }
    // log('__________parts_2', cwf, parts)
    // else if (parts.length == 1) parts = plain(cwf).split(stem)
    let term = parts[parts.length -1]
    // log('__________term', term)

    let first = term[0]
    if (acs.includes(first)) term = term.slice(1)

    return term
}

export function astemTypeByPType(preType) {
    let cwf = preType.cwf
    // let pcwf = strip(cwf) // тут strip из-за ῥοδισμός - ῥοδϊσμός
    let pcwf = plain(cwf)
    let reptype = new RegExp(preType.ptype + '$')

    let astem = preType.astem
    let reastem = new RegExp('^' + astem)
    let type = cwf.replace(reastem, '')
    if (type == cwf) type = pcwf.replace(reastem, '')
    type = stripAccent(type)

    // stem равен aug:
    let irreg = false
    let last = astem[astem.length -1]
    if (acs.includes(last)) irreg = true

    // type, irreg, tgen, tfem, tneut - порядок имеет значение
    let resType = {type, irreg}

    if (preType.genwf) {
        let tgen = preType.genwf.replace(reastem, '')
        if (tgen == preType.genwf) tgen = plain(preType.genwf).replace(reastem, '')
        tgen = stripAccent(tgen)
        resType.tgen = tgen
    }

    if (preType.femwf) {
        let tfem = preType.femwf.replace(reastem, '')
        if (tfem == preType.femwf) tfem = plain(preType.femwf).replace(reastem, '')
        tfem = stripAccent(tfem)
        resType.tfem = tfem
    }

    if (preType.neutwf) {
        let tneut = preType.neutwf.replace(reastem, '')
        if (tneut == preType.neutwf) tneut = plain(preType.neutwf).replace(reastem, '')
        tneut = stripAccent(tneut)
        resType.tneut = tneut
    }

    return resType
}

// только для Байи
export function parseAstem(cdict) {
    // astem для всех диалектов д.б. одинаков
    cdict.astems = []
    for (let marpha of cdict.marphas) {
        let type = marpha.type
        type = plain(comb(type))
        let retype = new RegExp(type + '$')
        let pdict = plain(marpha.mainwf)
        let astem = pdict.replace(retype, '')
        if (astem == pdict) {
            log('_marphas', cdict)
            log('_ASTEM ERROR', cdict.rdict, 'astem', astem, marpha, 'pdict', pdict, astem == pdict, 'type', type)
            throw new Error()
        }

        let last = astem[astem.length -1]
        // if (acs.includes(last)) log('___________________________________________________HHHHH', astem, cdict)
        if (acs.includes(last)) {
            cdict.irreg = true
            cdict.com = 'astem has accent'
            return
        }

        marpha.astem = astem
        cdict.astems.push(astem)
    }

    cdict.astems = _.uniq(cdict.astems)

    let jsons = cdict.marphas.map(entry=> JSON.stringify(entry))
    jsons = _.uniq(jsons)
    cdict.marphas = jsons.map(entry=> JSON.parse(entry))
}

export function stripAccent(str) {
    let first = str[0]
    if (acs.includes(first)) str = str.slice(1)
    return str
}

// ============================ суффиксы с акцентами, типы простые

function vowStemCorrection(astem) {
    if (astem.length <= 3) return astem // ?????????? так-ли?
    let endVows = []
    // let endVows = ['ο', 'ι', 'ε']
    let last = astem[astem.length-1]
    if (endVows.includes(last)) astem = astem.slice(0, -1)
    return astem
}


export function checkIrregs(cdict, irregulars) {
    let irregDict = ''
    for (let irr of irregulars) {
        if (irr.wf == cdict.rdict) {
            irregDict = irr
        }
    }

    if (irregDict) {
        cdict.indecl = true
        cdict.irreg = true
        cdict.relstem = irregDict.astem
        // log('_IRR_N', cdict)
    }
    // log('_IRR_N', cdict)
    return cdict
}


export function parseNounArt(str) {
    let art = false
    for (let rart in arts) {
        let reitype = new RegExp(' ' + rart + '')
        if (reitype.test(str)) art = rart
    }
    if (!art) return 'masc'

    let gend = arts[art].gend
    return gend
}

export async function pushDocs(dname, iddocs) {
    const dpath = path.resolve(dbpath, dname)
    fse.emptyDirSync(dpath)
    const db = new PouchDB(dpath);
    let info = await db.info();
    log('_DB info before:', dname, info.doc_count)
    log('_PUSHING DB_PATH...', dpath, iddocs.length)

    for await (let chunk of _.chunk(iddocs, chunksize)) {
        let keys = chunk.map(doc=> doc._id)
        // log('_keys', keys.length)
        try {
            let pushres = await db.bulkDocs(chunk)
            // log('_pushres:', pushres.length)
        } catch (err) {
            console.log(err);
        }
    }

    info = await db.info();
    log('_DB info:', dname, info)
}

export function parseStemByType(aplain, type) {
    let {aug, tail} = parseAug(aplain)
    let stem = aplain
    if (aug) {
        let reaug = new RegExp('^' + aug)
        stem = aplain.replace(reaug, '')
    }
    let ptype = plain(type)
    let retype = new RegExp(ptype + '$')
    stem = stem.replace(retype, '')
    return {aug, stem}
}

export function parseAug(aplain) {
    let aug = '', tail = aplain
    if (!vowels.includes(aplain[0])) return aug
    // log('_X_0', aplain, aplain[0])
    for (let asp of asps) {
        let parts = aplain.split(asp)
        // if (parts.length > 1) log('_X_PP', asp, parts)
        if (parts.length > 1) aug = parts[0] + asp, tail = parts.slice(1).join('')
    }
    if (tail[0] == ypo) aug += ypo, tail = tail.slice(1)
    // log('_AUG-XXX', aplain, '_aug:', aug, aug.length)
    return aug
}

function parsePrefCon(pref, prform, stem) {
    let repref = new RegExp('^' + pref)
    let tmpstem = prform.replace(repref, '')
    let arr = tmpstem.split(stem)
    let prefcon = arr[0]
    // log('_TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', prform, stem, pref, prefcon)
    return prefcon
}

export function parseCon(prform, stem) {
    let pref = parsePrefix(prform)
    let con = parsePrefCon(pref, prform, stem)
    // log('_parseCon: pref, prform, cdict.stem, con', pref, prform, cdict.stem, con)
    return con
}

export function parseLead_(cdict, prform) {
    let lead
    if (cdict.prefix) {
        let pref = parsePrefix(prform)
        lead = parsePrefCon(pref, prform, cdict.stem)
        // log('_________________________________________prform', cdict.prefix)
    } else {
        lead = parseAug(prform)
    }
    return lead
}

function parsePrefix(pwf) {
    let prefstr = '', re
    for (let pref of prefixes) {
        re = new RegExp('^' + pref.replace(/-/g, ''))
        if (!re.test(pwf)) continue
        if (prefstr.length < pref.length) prefstr = pref
    }
    return prefstr
}

// количество частей prefix в Nest (nsize) и wf должно совпадать
export function guessPrefix(rdict, nsize) {
    let pdict = plain(comb(rdict))
    let pref = ''
    let pstr = ''
    let psize = 1
    for (let prefstr of preflist) {
        let cpref = prefstr.replace(/-/g, '')
        let repref = new RegExp('^' + cpref)
        if (!repref.test(pdict)) continue
        let testpsize = prefstr.split('-').length
        if (nsize && testpsize != nsize) continue
        // log('_========================================== NS', nsize)

        if (cpref.length > pref.length) {
            pref = cpref
            psize = prefstr.split('-').length
            pstr = prefstr
        }
    }

    if (!pref) return

    // log('_===========================================guess prefix', prefixes)
    let repref = new RegExp('^' + pref)
    let psc = pdict.replace(repref, '')

    if (!psc) {
        return
    }

    // log('_===========================================guess prefix', pref, psc)

    let pfc = pref
    let short = removeVowelBeg(psc)
    let reshort = new RegExp(short + '$')
    let con = psc.replace(reshort, '')

    // ὑπερῷος - con - ῳο, stem
    // это не коннектор, потому что гласная долгая? Гипотеза: долгие гласные в коннекторе могут быть в производных, но не словарных формах
    // но δίωξις, хочется стем ωξ ?
    // но παρών ?
    // так нельзя, рушится parseAug
    let longs = ['ω']
    let confirst = con[0]
    // if (con && longs.includes(confirst)) con = null

    if (con) pfc = pref + con

    // log('_============= pfc', pfc, con)

    let prefix = {pref, pfc, psize, pstr} // , guess: true
    if (con) prefix.con = con
    return prefix
}



export function prettyFLS_to_anthrax(pos, fls) {
    let morphs = ''
    if (pos == 'name') morphs = prettyName(fls)
    else if (pos == 'verb') morphs = prettyVerb(fls)
    return morphs
}

function prettyName(fls) {
    let morphs = fls.map(flex=> {
        return  [flex.gend, flex.number, flex.case].join('.')
    })
    return _.uniq(morphs).sort()
}

function prettyVerb(fls) {
    let morphs = fls.map(flex=> {
        // log('_prettyVerb Flex', flex)
        // let tense
        let str
        // if (flex.part) str =[ [flex.tense, flex.numper].join('.'),  [flex.gend, 'sg.nom'].join('.') ].join(', ')
        if (flex.part) str = [flex.tense,  [flex.gend, flex.number, flex.case].join('.') ].join(', ')
        else if (flex.inf) str = flex.tense
        else str = [flex.tense, flex.numper].join(', ').trim()
        return str
    })
    return _.uniq(morphs).sort()
}

export function removeVowelBeg(wf) {
    let beg = wf[0]
    while (beg) {
        if (vowels.includes(beg) || acs.includes(beg)) {
            wf = wf.slice(1)
            beg = wf[0]
        } else {
            beg = false
        }
    }
    return wf
}

export function commonStem(pwfs) {
    pwfs = _.uniq(pwfs)
    if (!pwfs.length) return
    let syms = pwfs[0].split('')
    let stems = []
    let stop = false
    syms.forEach((sym, idx)=> {
        if (stop) return
        let tmps = pwfs.map(pwf=> pwf[idx])
        if (_.uniq(tmps).length == 1) stems.push(sym)
        else stop = true
    })

    let stem = stems.join('')

    if (stem.length > 2) { // последняя гласная в длинном стеме
        let last = stem[stem.length -1]
        if (vowels.includes(last)) stem = stem.slice(0, -1)
    }

    return stem
}
