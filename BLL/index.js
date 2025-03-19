//

const log = console.log
import _ from 'lodash'
// import Debug from 'debug'
import fse from 'fs-extra'
import path  from 'path'
import {comb, plain} from 'orthos'
import { parseAug, vowels, art2gend, accents, doubledot, arts, typicalNounGend } from './lib/utils.js'
import { cleanStr, cleanStress, parseNounArt, parseNounCStype, parseAdjCStype, checkRGreek, pushDocs, parseVerbType, parseStemByType, parseAStemByType, dicts2ids } from '../dictutils/index.js'

import { nounDicts } from '../WKT/wkt/wkt-keys/list-noun-dicts.js' // список wkt-nouns и их stypes, для коррекции bailly, где rdict совпадают
import { adjDicts } from '../WKT/wkt/wkt-keys/list-adj-dicts.js'

import { nounKey } from '../WKT/wkt/wkt-keys/key-noun.js' // все stypes имен, bailly-stype должны туда попасть
import { adjKey } from '../WKT/wkt/wkt-keys/key-adj.js' // все stypes имен, bailly-stype должны туда попасть

import { typeAdjKey } from '../WKT/wkt/wkt-keys/type-adj-key.js' // типичные генетивы для прилагательных
import { typeVerbKey } from '../WKT/wkt/wkt-keys/type-verb-key.js' // типичные stypes для глаголов

import { parseEntryType } from './lib/parseEntryType.js'
import { letters } from './lib/allLetters.js'

const currentdir = process.cwd()
const dirPath = path.resolve(currentdir, './Source/pages')

let num2lat = {
    0: 'I',
    1: 'II',
    2: 'III',
    3: 'IV',
    4: 'V',
    5: 'VI',
}

let push
let only = process.argv.slice(2)[0]
if (only == 'push') only = false, push = true

const centerdot = '·'
const redot = /·/

let reonly
if (only) {
    only = cleanStress(only)
    only = only.replace(/·/g, '')
    // reonly = new RegExp(only)
    reonly = new RegExp('^' + only)
}
log('_ONLY', only, reonly)

let onlyletter = ''

let fns = fse.readdirSync(dirPath)
// log('_FNS', fns)

let bad_bll = []
let wkt_nouns = []
let bll_equals = []
let bll_phrase = []
let bll_adverbs = []
let bll_nouns = []
let bll_adjs = []
let bll_verbs = []
let bll_indecls = []

/*
  если есть wkt - anthrax возьмет wkt.
  вычисляю stype и сравниваю. Чтобы без wkt было разумно
 */

main()

if (!only) writeData()

async function main() {
    let cdicts = []
    for (let fn of fns) {
        if (!/\.json/.test(fn)) continue
        let letter = fn.split('-')[1].split('.')[0]
        if (onlyletter && letter != onlyletter) continue
        // log('_onlyletter', onlyletter, letter, fn)
        let entrypath = path.resolve(dirPath, fn)
        let entries = fse.readJsonSync(entrypath)
        if (onlyletter) log('_entries', onlyletter, entries.length)
        // entries = entries.slice(300,1300)
        fse.writeFileSync('./data/entries.js', JSON.stringify(entries, null, 8))

        // формирую возможный cstypes - массив
        // в parseEntry проверяю на соответствие wktKey
        let dentries = []
        for (let entry of entries) {
            let head = cleanStress(entry.head).replace(/^\d /, '')
            let test = head.replace(/·/g, '')
            if (only && !reonly.test(test)) continue
            entry.head = head
            let processed = doubledEntry(entry)
            dentries.push(...processed)
        }

        // log('_D entries', dentries)

        let letdicts = []
        for (let entry of dentries) {
            let entrydict = parseEntry(entry)
            // log('_entrydict', entrydict)
            // ======================================================= ???? wtf?
            if (!entrydict) continue // какие?
            entrydict.dname = 'bll'
            letdicts.push(entrydict)
        }
        cdicts.push(...letdicts)
    } // fns

    // log('_OOO_1', cdicts)
    let {checked, newdicts} = await checkRGreek(cdicts)
    // log('_checked:', checked)

    let indecls = newdicts.filter(dict=> dict.indecl)
    checked.push(...indecls)

    let regs = newdicts.filter(dict=> !(dict.indecl || dict.irreg))
    let newregs = []

    for (let cdict of regs) {
        if (!cdict.cstype) {
            log('_NO_CSTYPE', cdict)
        }
        // try {
        //     let cparts = cdict.cstype.split('-') // ==
        // } catch(err) {
        //     log('_ERR!!', cdict)
        // }

        let cparts = cdict.cstype.split('-') // ==
        cdict.type = cparts[0]

        let aplain = plain(cdict.dict)
        let {aug, stem} = parseStemByType(aplain, cdict.type)
        let res = parseAStemByType(aplain, cdict.type)
        cdict.aug = res.aug || ''
        cdict.astem = res.astem
        cdict.stem = res.stem
        cdict.new = true

        let compounds = cdict.raw.split(',')[0].split('·')
        if (compounds.length > 1) {
            cdict.compound = {fc:compounds[0], sc:compounds[1]}
        }
        newregs.push(cdict)
        // if (only) log('_new_REG_BBK_Cdict', cdict)
    }

    checked.push(...newregs)

    if (only) log('_only dicts:', checked)
    log('_bailly dicts in all letters', checked.length)

    if (push) {
        let dname = 'RGreek'
        let iddocs = dicts2ids(dname, checked)
        if (only) log('_iddocs:', iddocs)
        await pushDocs(dname, iddocs)
    }
}

function doubledEntry(entry) {
    let head = entry.head.replace('-, ', ', ').replace(', -', ', ')
    let parts = head.split(', ')
    let rdict = parts[0]
    let genfem = parts[1]
    let neut = parts[2]
    if (!genfem) return [entry]
    if (rdict.split('-').length == 1 && genfem.split('-').length == 1) return [entry]
    let dentries = []
    let rdictparts = rdict.split('-')
    if (rdictparts.length > 1) { // двойной rdict
        let type1 = parseEntryType(head)
        let type2 = rdictparts[1]
        let astem = rdictparts[0]
        let retype = new RegExp(type1 + '$')
        astem = astem.replace(retype, '')
        let rdict1 = astem + type1
        let rdict2 = astem + type2
        let rdicts = [rdict1, rdict2]
        let types = [type1, type2]
        let genfems, neuts
        if (genfem) genfems = genfem.split('-')
        if (neut) neuts = neut.split('-')
        // log('_RS', head, astem, rdicts)
        rdicts.forEach((rdict, idx)=> {
            let head = rdict
            if (genfem) head = [head, genfems[idx]].join(', ')
            if (neut) head = [head, neuts[idx]].join(', ')
            // log('_===', idx, head)
            let dentry = _.clone(entry)
            dentry.head = head
            dentries.push(dentry)
        })
    } else if (genfem.split('-').length > 1) { // двойной генетив
        let type = parseEntryType(head)
        // log('_GEN', type, rdict)
        let retype = new RegExp(type + '$')
        let astem = rdict.replace(retype, '')
        for (let gen of genfem.split('-')) {
            let head = [rdict, gen].join(', ')
            let dentry = _.clone(entry)
            dentry.head = head
            // log('_===', head)
            dentries.push(dentry)

        }
    }
    return dentries
}

function parseEntry(entry) {
    let rdict = entry.head.split(',')[0]
    rdict = rdict.replace(/·/g, '')
    if (only && !reonly.test(rdict)) return

    let dict = comb(rdict)
    let trns = parseTrns(entry.str)
    // log('_HERE TRNS', trns)
    let raw = entry.head.replace(/\*/g, '')
    let cdict = {raw, rdict, dict} // , trns
    let formstr = entry.str.slice(0, 50).trim().trim()
    // log('_HERE xxxxxxxxxxx', entry)

    let entrydict = probePhrase(cdict, formstr)
    if (entrydict) return entrydict

    entrydict = probeIndecl(cdict, formstr)
    if (entrydict) return entrydict

    entrydict = probeAdverb(cdict, formstr)
    if (entrydict) return entrydict

    entrydict = probeEqual(cdict, formstr)
    if (entrydict) return entrydict

    entrydict = probeAdjective(cdict, formstr)
    if (entrydict) return entrydict

    entrydict = probeNounByArt(cdict, formstr)
    if (entrydict) return entrydict

    // entrydict = probeNounCStype(cdict, formstr)
    // if (entrydict) return entrydict

    entrydict = probeVerb(cdict, formstr)
    if (entrydict) return entrydict

    let bad = [entry.head, '_STR:', formstr].join(' ')
    bad_bll.push(bad)

    return
}

function probeNounByArt(cdict, str) {
    let art = ''
    for (let keyart in arts) {
        let reart = new RegExp(' (' + keyart + ') ')
        if (reart.test(str)) art = keyart
    }
    if (!art) return
    cdict.name = true
    cdict.noun = true
    // cdict.pseudovars = {}
    cdict.art = art

    let gend = arts[art].gend
    let gendpl = arts[art].pl

    cdict.gend = gend
    if (gendpl) cdict.pl = true

    // let res = [cdict.rdict, art].join(': ')
    // bll_nouns.push(res)

    let cstype = parseNounCStype(cdict.raw)
    if (!cstype) {
        cdict.irreg = true
        // log('_NO ART noun', cdict)
        return cdict
    }
    cdict.cstype = cstype

    return cdict
}

function probeNounCStype(cdict) {
    let chead = comb(cdict.raw)
    // поиск подходящего name stype. 1. type-max, 2. gen - regexp + max, 3. - если нет, max-freq
    let ngens = []
    let ntypemax = ''
    let dictgen = ''
    for (let stype in nounKey) {
        let stypes = stype.split('-')
        if (stypes.length != 2) continue
        let ntype = stypes[0]
        let ngen = stypes[1]
        let rentype = new RegExp(ntype + ', ')
        if (rentype.test(chead) && ntype.length >= ntypemax.length) {
            ntypemax = ntype
            ngens.push(ngen)
            dictgen = chead.split(rentype)[1].split(' ')[0]
        }
    }

    if (!ntypemax) return

    let ngenmax = ''
    let redictgen = new RegExp(dictgen)
    for (let ngen of ngens) {
        // log('+N', ngen, dictgen, redictgen.test(ngen))
        if (redictgen.test(ngen) && ngen.length >= ngenmax.length) ngenmax = ngen
    }

    if (!ngenmax) return

    let cstype = [ntypemax, ngenmax].join('-')
    cdict.type = ntypemax
    cdict.gen = ngenmax
    cdict.cstype = cstype
    cdict.name = true
    cdict.noun = true

    let wkt = nounDicts.find(wkt=> wkt.dict == cdict.dict)
    if (wkt) {
        // log('_wkt', wkt.rdict)
        if (wkt.cstype != cdict.cstype) {
            if (only) {
                log('BAD N WKT', wkt.cstype, wkt)
                log('BAD N BAILLY', cdict.cstype, cdict)
            }

            // cstype не повлияет, при закачке в RGreek будет найден wkt, и записи нового cdict в RGreek не будет
            // а при создании stem-словаря cstype тоже будет взят из RGreek
            cdict.cstype = wkt.cstype
        }
        cdict.byWKT = true
        cdict.stem = wkt.stem
        if (wkt.aug) cdict.aug = wkt.aug
    }

    if (!cdict.gend) {
        cdict.gend = typicalNounGend(cdict.dict)
        cdict.gendByGuess = true
        // if (!cdict.gend) log('_GEND', cdict.rdict)
        if (!cdict.gend) cdict.gend = 'not_a_noun_may_be'
    }

    if (!cdict.stem) {
        let aplain = plain(cdict.dict)
        let {aug, tail} = parseAug(aplain)
        let stem = aplain
        if (aug) {
            let reaug = new RegExp('^' + aug)
            stem = aplain.replace(reaug, '')
        }
        let ptype = plain(cdict.type)
        let retype = new RegExp(ptype + '$')
        stem = stem.replace(retype, '')
        cdict.stem = stem
        // log('_STEM', cdict.rdict, stem)
    }

    let res = [cdict.dict, cdict.art].join(': ')
    bll_nouns.push(res)
    return cdict
}

function probeAdjective(cdict, str) {
    cdict.raw = cdict.raw.split('(')[0].split('[')[0].trim()
    let b2types = cdict.raw.split(', ') // формальный признак прилагательного, три окончания
    if (b2types.length < 3) return
    b2types = b2types.slice(1) // последние два btype, fem и neut
    // log('_b2types', b2types)
    b2types = b2types.map(type=> comb(type))

    // возможные type для данного rdict:
    let wtypes = []
    for (let wkey in adjKey) {
        let arr = wkey.split('-')
        let wtype = arr[0]
        let re = new RegExp(wtype + '$')
        if (!re.test(cdict.dict)) continue
        wtypes.push(wtype)
    }
    wtypes = _.compact(_.uniq(wtypes))
    wtypes = _.sortBy(wtypes, 'length').reverse()
    // log('_wtypes', wtypes)

    let wcstype = '' // длиннейший подходящий cstype по данныи adjKey
    for (let wtype of wtypes) {
        let readj = new RegExp(wtype + '-.*' + b2types[0] + '-.*' + b2types[1] + '-.*')
        for (let wktkey in adjKey) {
            let type = wktkey.split('-')[0]
            if (wtype != type) continue
            if (!wcstype && readj.test(wktkey)) wcstype = wktkey
        }
    }
    // log('_wcstype', wcstype)
    if (!wcstype) return

    let wparts = wcstype.split('-')
    cdict.name = true
    cdict.adj = true
    cdict.cstype = wcstype
    cdict.type = wparts[0]
    cdict.gen = wparts[wparts.length-1]
    // log('_bll_cdict', cdict)

    // === variant: type, gen, aug, short, stype

    // gén.
    if (false) {
        if (/<i>gén.<\/i>/.test(str)) {
            // log('_GEN_0', cdict.rdict, str, str.split('<i>gén.</i>'))
            let gen = str.split('<i>gén.</i>')[1].split(',')[0].trim()
            cdict.gen = gen
            // log('_GEN', cdict.rdict, str, '_en:', cdict)
        } else {
            // log('_adj', cdict.rdict, cdict.cstype)
            let tkey = typeAdjKey[cdict.cstype].max
            if (!tkey) {
                log('_no typical stype', cdict.rdict, cdict.cstype)
                throw new Error()
            }
            if (tkey) {
                cdict.gen = tkey
                cdict.typicalgen = true
                // log('_typical stype', cdict.rdict, cdict.cstype, '_tkey:', tkey)
            }
        }
        // cdict.cstype = [cdict.cstype, cdict.gen].join('-')
    }

    // check adj
    let wkt = adjDicts.find(wkt=> wkt.dict == cdict.dict)
    if (wkt) {
        // log('_wkt', wkt.rdict)
        if (wkt.cstype != cdict.cstype) {
            if (only) {
                log('BAD ADJ WKT', wkt.cstype, wkt)
                log('BAD ADJ BAILLY', cdict.cstype, cdict)
            }
            // при закачке будет найден wkt, и записи нового cdict в RGreek не будет
            // а при создании stem-словаря stype тоже будет взят из RGreek
            // НО!!! а если несколько вариантов в WKT - какой выбрать?
        }
        cdict.cstype = wkt.cstype
        cdict.byWKT = true
        cdict.stem = wkt.stem
        if (wkt.aug) cdict.aug = wkt.aug
    }
    // cdict.pos = 'adj'
    // TODO: stem ; aug
    if (!cdict.stem) {
        let aplain = plain(cdict.dict)
        let {aug, tail} = parseAug(aplain)
        let stem = aplain
        if (aug) {
            let reaug = new RegExp('^' + aug)
            stem = aplain.replace(reaug, '')
        }
        // if (!cdict.type) {
        //     log('_======================', cdict)
        // }
        let ptype = plain(cdict.type)
        let retype = new RegExp(ptype + '$')
        stem = stem.replace(retype, '')
        cdict.stem = stem
        // log('_STEM', cdict.rdict, stem)
    }

    let res = [cdict.dict, cdict.cstype].join(': ')
    bll_adjs.push(res)
    return cdict
}

function probeEqual(cdict, str) { // c. - comme ; v. - voyez ou ville
    if (!/>v\.</.test(str) && !/[> ]c\.</.test(str)) return
    cdict.equal = true
    cdict.indecl = true
    let eqs = [cdict.rdict, '_eq:', str].join(' ')
    bll_equals.push(eqs)
    return cdict
}

function probePhrase(cdict, str) {
    if (cdict.rdict.split(' ').length == 1) return
    cdict.phrase = true
    cdict.indecl = true
    bll_phrase.push(cdict.rdict)
    // log('_phrase', cdict.rdict)
    return cdict
}

function probeAdverb(cdict, str) {
    if (!/adv\./.test(str)) return
    cdict.adverb = true
    cdict.indecl = true
    bll_adverbs.push(cdict.rdict)
    return cdict
}

function probeVerb(cdict) {
    let cstype = parseVerbType(cdict.dict)
    if (!cstype) return
    cdict.cstype = cstype
    cdict.verb = true
    cdict.type = cstype.split('-')[0]
    // if (only) log('_verb', cdict)
    bll_verbs.push(cdict.raw)
    return cdict

    let dict = cdict.dict

    let typemax = ''
    for (let ctype in typeVerbKey) {
        let rectype = new RegExp(ctype + '$')
        if (!rectype.test(dict)) continue
        if (ctype.length >= typemax.length) typemax = ctype
    }
    if (!typemax) return

    // log('_verb type', rdict, '_CDICT:', cdict)
    // throw new Error()
    let type = typeVerbKey[typemax].max
    cdict.type = type
    cdict.verb = true
    // log('_MORPH VERB', rdict, cdict.type)

    let descr = [cdict.rdict, 't:', type ].join(' ')
    bll_verbs.push(descr)
    return cdict
}

// prép. conj.
// exclamation ; préfixe
function probeIndecl(cdict, str) { // ἄλφι ; ἀββᾶ ; Ἀβραάμ
    if (!cdict) log('_!!!!', cdict, str)
    // log('_INDECL', cdict.rdict)
    if (/indécl\./.test(str) || /exclamation/.test(str)) {
        cdict.indecl = true
    } else if (/conj\./.test(str)) {
        cdict.conj = true
    } else if (/interj\./.test(str)) {
        cdict.interj = true
    } else if (/onomatopée/.test(str)) {
        cdict.onoma = true
    } else if (/-$/.test(cdict.dict)) {
        return
    } else if (/>préfixe/.test(str)) {
        cdict.prefix = true
    } else {
        return
    }
    // if (!/indécl\./.test(str)) return
    // log('_INDECL', cdict.rdict)
    cdict.indecl = true
    // let nstype = [ntypemax, ngenmax].join('-')
    bll_indecls.push(cdict.rdict)
    return cdict
}

function parseTrns(str) {
    let trns = str.split(/<b>I+<\/b>/)
    if (trns.length > 1) {
        trns = trns.map((trn, idx)=> {
            let roman ='I'.repeat(idx+1) + ' ' + trn.trim()
            roman = roman.replace('IIIII', 'V').replace('IIII', 'IV')
            return roman
        })
    }
    let cleans = []
    for (let str of trns) {
        let strns = str.split(/<b>\d<\/b>/)
        if (strns.length > 1) {
            strns = strns.map((trn, idx)=> {
                return idx+1 + '. ' + trn.trim()
            })
        }
        cleans.push(...strns)
    }
    // log('_CLEANS', cleans)
    cleans = cleans.map(str=> {
        str = str.split(/ [A-Z][^\. ]*\./)[0]
        str = str.replace(/<i>/g, '').replace(/<\/i>/g, '').replace(/,$/g, '')
        return str
    })

    return cleans
}

function writeData() {
    fse.writeFileSync('./data/bad_bll.js', JSON.stringify(bad_bll, null, 8))
    fse.writeFileSync('./data/wkt_nouns.js', JSON.stringify(wkt_nouns, null, 8))

    fse.writeFileSync('./data/nouns.js', JSON.stringify(bll_nouns, null, 8))
    fse.writeFileSync('./data/adjs.js', JSON.stringify(bll_adjs, null, 8))
    fse.writeFileSync('./data/adverbs.js', JSON.stringify(bll_adverbs, null, 8))
    fse.writeFileSync('./data/phrase.js', JSON.stringify(bll_phrase, null, 8))
    fse.writeFileSync('./data/indecls.js', JSON.stringify(bll_indecls, null, 8))
    fse.writeFileSync('./data/verbs.js', JSON.stringify(bll_verbs, null, 8))
    fse.writeFileSync('./data/equals.js', JSON.stringify(bll_equals, null, 8))
}


// ========================= OLD

function get_TRNS_MAY_BE_(fnpath) {
    let text = fse.readFileSync(fnpath, 'utf8')
    let strs = text.split('\n')
    log('_F', strs.length)
    // log('_F', strs[13])
    // strs = strs.slice(0, 200)
    return []


    // == дальше обработать латинские цифры
    // создать аббревиаторы и обрезать
    // разобрать морфологию
    // залить в базу - полные формы для обработки словарей
    // и, как обычно, создать словарь стемов

    for (let cdict of cdicts) {

        cdict.trns = []
        let idlat = 0
        for (let numstr of cdict.rtrns) {
            let numparts = numstr.split(/ \|\| \d+ /)
            // log('_numstr', numstr, idlat, numparts.length)
            numparts = numparts.map(str=> str.split(/[A-Z]/)[0].trim())
            if (numparts.length > 1) {
                numparts = numparts.map((str, idx)=> {
                    let formed = idx+1 + ') ' + str
                    if (!idx) formed = num2lat[idlat] + '. ' + formed
                    return formed
                })
                cdict.trns.push(...numparts)
            } else {
                let latstr = numparts[0]
                latstr = num2lat[idlat] + '.XX ' + latstr
                cdict.trns.push(latstr)
            }
            idlat++
        }
        delete cdict.rtrns
        // log('_cdict', cdict.formstr)
    }
    log('_cdicts', cdicts.length)
}


export function cleanSymbols(str) {
    let errDDOX = [accents.oxia, doubledot ].join('')
    let corrDDOX = [doubledot, accents.oxia].join('')
    return str.replace(errDDOX, corrDDOX)
}
