//

const log = console.log
import _ from 'lodash'
// import Debug from 'debug'
import fse from 'fs-extra'
import path  from 'path'
import {comb, plain} from 'orthos'
import { parseAug, vowels, art2gend, accents, doubledot, cleanStress } from './lib/utils.js'

import { nounDicts } from '../WKT/wkt/wkt-keys/list-noun-dicts.js' // список wkt-nouns и их stypes, для коррекции bailly, где rdict совпадают
import { adjDicts } from '../WKT/wkt/wkt-keys/list-adj-dicts.js'
import { nameKey } from '../WKT/wkt/wkt-keys/key-name.js' // все stypes имен, bailly-stype должны туда попасть
import { nounKey } from '../WKT/wkt/wkt-keys/key-noun.js' // все stypes имен, bailly-stype должны туда попасть

import { typeAdjKey } from '../WKT/wkt/wkt-keys/type-adj-key.js' // типичные генетивы для прилагательных
import { typeVerbKey } from '../WKT/wkt/wkt-keys/type-verb-key.js' // типичные stypes для глаголов

import { pushDocs } from './lib/pouch.js'

import { parseMorphData } from './lib/parseMorphData.js'
import { parseNounData } from './lib/parseNounData.js'
import { letters } from './lib/allLetters.js'

const currentdir = process.cwd()
// const fnpath = path.resolve(currentdir, './pages/bailly-b.txt')
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

let onlyletter = 'a'

let fns = fse.readdirSync(dirPath)
// log('_FNS', fns)

let no_morphs = []
let no_nouns = []
let no_adjs = []
let wkt_nouns = []
let non_wkt_nouns = []
let no_typical_key = []
let no_verb_type = []
let keys_noun = []
let keys_adj = []

let bailly_equals = []
let bailly_phrase = []
let bailly_adverbs = []
let bailly_nouns = []
let bailly_adjs = []
let bailly_verbs = []
let bailly_indecls = []
let bad_nouns = []
let bad_adjs = []

main()

writeFiles()

async function main() {
    let dicts = []
    for (let fn of fns) {
        if (!/\.json/.test(fn)) continue
        let letter = fn.split('-')[1].split('.')[0]
        if (onlyletter && letter != onlyletter) continue
        log('_onlyletter', onlyletter, letter, fn)
        let entrypath = path.resolve(dirPath, fn)
        let entries = fse.readJsonSync(entrypath)
        log('_entries', entries.length)

        let letdicts = []
        for (let entry of entries) {
            let edicts = parseEntry(entry)
            letdicts.push(...edicts)
        }
        dicts.push(...letdicts)
    }
    if (only) log('_dicts', dicts[0])
    log('_dicts', dicts.slice(0,5))
    log('_dicts', dicts.length)

    if (push) {
        for (let dict of dicts) {
            delete dict.trns
            // dict._id = dict.dict
        }
        let rdict = {}
        dicts.forEach(dict => {
            if (!rdict[dict.dict]) rdict[dict.dict] = {_id: dict.dict, docs: []}
            rdict[dict.dict].docs.push(dict)
        })

        // log('_RDICT', rdict)
        let rdicts = _.values(rdict)
        rdicts.forEach(rdict=> rdict.dname = 'bailly') // здесь dname - имя исходного словаря, а не имя DB, DB=RGreek

        // log('_rdicts', rdicts.slice(0,20))
        // log('_rdicts', rdicts.length)
        let dname = 'RGreek'
        await pushDocs(dname, rdicts)
    }
}

function parseEntry(entry) {
    let rdict = cleanStress(entry.head).split(',')[0].replace(/^\d /, '')
    rdict = rdict.replace(/·/g, '')
    if (only && !reonly.test(rdict)) return []
    let dict = comb(rdict)
    let cdict = {raw: entry.head, rdict, dict}
    let formstr = entry.str.slice(0, 25).trim().replace(/^\d /, '').trim()

    let phrase = probePhrase(cdict, formstr)
    if (phrase) return [phrase]

    let indecl = probeIndecl(cdict, formstr)
    if (indecl) return [indecl]

    let advdict = probeAdverb(cdict, formstr)
    if (advdict) return [advdict]

    let equal = probeEqual(cdict, formstr)
    if (equal) return [equal]

    let adj = probeAdjective(cdict, formstr, entry)
    if (adj) return [adj]

    let noun = probeNoun(cdict, formstr)
    if (noun) return [noun]

    let verb = probeVerb(cdict, formstr)
    if (verb) return [verb]



    let bad = [entry.head, '_STR:', formstr].join(' ')
    no_morphs.push(bad)

    return []
}

function probeVerb(cdict, str) {
    let dict = cdict.dict

    let typemax = ''
    for (let ctype in typeVerbKey) {
        let rectype = new RegExp(ctype + '$')
        if (!rectype.test(dict)) continue
        if (ctype.length >= typemax.length) typemax = ctype
    }
    if (!typemax) return

    // log('_verb type', rdict, '_STR:', str)
    // throw new Error()
    let type = typeVerbKey[typemax].max
    cdict.type = type
    cdict.verb = true
    // log('_MORPH VERB', rdict, cdict.type)

    let vstype = [cdict.rdict, 't:', type ].join(' ')
    bailly_verbs.push(vstype)

    return cdict
}

function probeNoun(cdict, str) {
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

    let nstype = [ntypemax, ngenmax].join('-')
    cdict.type = ntypemax
    cdict.gen = ngenmax
    cdict.stype = nstype
    cdict.name = true
    // log('_STYPE', ntypemax, ngens, dictgen, redictgen, ngenmax)
    // log('_noun', cdict)


    let wkt = nounDicts.find(wkt=> wkt.dict == cdict.dict)
    if (wkt) {
        // log('_wkt', wkt.rdict)
        // let wids = wkt.vars.map(variant=> variant.stype)
        // if (!wids.includes(cdict.stype)) {
        let wstype = wkt.vars[0].stype
        if (wstype != cdict.stype) {
            if (only) {
                log('BAD N WKT', wstype, wkt)
                log('BAD N BAILLY', cdict.stype, cdict)
            }
            let bad_res = {rdict: wkt.rdict, wstype, bailly: cdict.stype}
            bad_nouns.push(bad_res)
            // throw new Error()

            // это не повлияет, при закачке будет найден wkt, и записи нового cdict в RGreek не будет
            // а при создании stem-словаря stype тоже будет взят из RGreek
            cdict.stype = wstype
        }

    }


    bailly_nouns.push(cdict.rdict)
    return cdict
}

function probeAdjective(cdict, str, entry) {
    cdict.raw = cdict.raw.split('(')[0].split('[')[0].trim()
    let b2types = cdict.raw.split(', ') // формальный признак прилагательного, три окончания
    if (b2types.length != 3) return
    b2types = b2types.slice(1) // последние два btype, fem и neut
    // log('_b2types', b2types)

    // αός-αή-αόν - тут не верно, не найдет, его же в bailly нет.
    // ищем 1. длиннейший type, 2. его все types из WKT, выбираем подходящий по строке в Bailly
    let maxwtype = ''
    for (let wkey in typeAdjKey) {
        let wtypes = wkey.split('-')
        let wtype = wtypes[0]
        let re = new RegExp(wtype)
        if (!re.test(cdict.dict)) continue
        if (wtype.length < maxwtype.length) continue
        maxwtype = wtype
        // maxwtypes.push(wtypes)
    }
    let maxwtypes = []
    for (let wkey in typeAdjKey) {
        let wtypes = wkey.split('-')
        let wtype = wtypes[0]
        if (wtype == maxwtype) maxwtypes.push(wtypes)
    }

    // log('_maxwtype', maxwtype, maxwtypes)
    // log('_raw', cdict)

    let fem = comb(b2types[0])
    let neut = comb(b2types[1])
    let refem = new RegExp(fem + '$')
    let reneut = new RegExp(neut + '$')

    let b_stypes = maxwtypes.find(arr=> {
        let ok = true
        let wfem = arr[1]
        let wneut = arr[2]
        if (!refem.test(wfem)) ok = false
        if (!reneut.test(wneut)) ok = false
        return ok
    })
    if (!b_stypes) return
    cdict.stype = b_stypes.join('-')
    cdict.adj = true
    cdict.name = true
    // log('_bailly_cdict', cdict)

    // === variant: type, gen, aug, short, stype

    // gén.
    if (/<i>gén.<\/i>/.test(str)) {
        // log('_GEN_0', cdict.rdict, str, str.split('<i>gén.</i>'))
        let gen = str.split('<i>gén.</i>')[1].split(',')[0].trim()
        cdict.gen = gen
        // log('_GEN', cdict.rdict, str, '_en:', cdict)
    } else {
        // log('_adj', cdict.rdict, cdict.stype)
        let tkey = typeAdjKey[cdict.stype].max
        if (!tkey) {
            log('_no typical stype', cdict.rdict, cdict.stype)
            throw new Error()
        }
        if (tkey) {
            cdict.gen = tkey
            cdict.typical = true
            // log('_typical stype', cdict.rdict, cdict.stype, '_tkey:', tkey)
        }
        cdict.stype = [cdict.stype, cdict.gen].join('-')
    }

    let res = [cdict.rdict, '_s:', cdict.stype].join(' ')
    bailly_adjs.push(res)


    // ====  HERE: неверный wkt.stype
    // == ВОПРОС - все же использовать общий adj.stype, или adj.vars ?
    // check adj
    let wkt = adjDicts.find(wkt=> wkt.dict == cdict.dict)
    if (wkt) {
        // log('_wkt', wkt.rdict)
        // let wids = wkt.vars.map(variant=> variant.stype)
        // if (!wids.includes(cdict.stype)) {
        let wstype = wkt.stype
        if (wstype != cdict.stype) {
            if (only) {
                log('BAD ADJ WKT', wstype, wkt)
                log('BAD ADJ BAILLY', cdict.stype, cdict)
            }
            let bad_res = {rdict: wkt.rdict, wstype, bailly: cdict.stype}
            bad_adjs.push(bad_res)
            // throw new Error()
            // это не повлияет, при закачке будет найден wkt, и записи нового cdict в RGreek не будет
            // а при создании stem-словаря stype тоже будет взят из RGreek
            cdict.stype = wstype
        }

    }
    return cdict
}

function probeEqual(cdict, str) { // c. - comme ; v. - voyez ou ville
    if (!/>v\.</.test(str) && !/[> ]c\.</.test(str)) return
    cdict.equal = true
    cdict.indecl = true
    let eqs = [cdict.rdict, '_eq:', str].join(' ')
    bailly_equals.push(eqs)
    return cdict
}

function probePhrase(cdict, str) {
    if (cdict.rdict.split(' ').length == 1) return
    cdict.phrase = true
    cdict.indecl = true
    bailly_phrase.push(cdict.rdict)
    // log('_phrase', cdict.rdict)
    return cdict
}

function probeAdverb(cdict, str) {
    if (!/adv\./.test(str)) return
    cdict.adverb = true
    cdict.indecl = true
    bailly_adverbs.push(cdict.rdict)
    return cdict
}

// prép. conj.
// exclamation ; préfixe
function probeIndecl(cdict, str) { // ἄλφι ; ἀββᾶ ; Ἀβραάμ
    if (/indécl\./.test(str) || /exclamation/.test(str)) {
        cdict.indecl = true
    } else if (/conj\./.test(str)) {
        cdict.conj = true
    } else if (/-$/.test(cdict.dict)) {
        return
    } else if (/>préfixe/.test(str)) {
        cdict.prefix = true
    } else {
        return
    }
    // if (!/indécl\./.test(str)) return
    // log('_I', cdict.rdict)
    cdict.indecl = true
    // let nstype = [ntypemax, ngenmax].join('-')
    bailly_indecls.push(cdict.rdict)
    return cdict
}

















async function main_() {
    let dicts = []
    for (let fn of fns) {
        let letter = fn.split('-')[1].split('.')[0]
        if (onlyletter && letter != onlyletter) continue
        // log('_onlyletter', onlyletter, letter)

        let letvars = letters[letter]
        if (!letvars) log('_no letvars', letter)
        if (!letvars) continue
        let fnpath = path.resolve(dirPath, fn)
        let text = fse.readFileSync(fnpath, 'utf8')
        text = text.replace(/-\n/g, '')
        text = cleanStress(text)
        text = cleanSymbols(text)

        let strs = text.split('\n')
        strs = strs.filter(str=> str[0] != '') // ''
        // strs = strs.filter(str=> /[^\w\s]/.test(str)) // '^L'

        // log('_FN', letter, letvars, fnpath)
        let strdicts = parseStrDicts(letvars, strs)
        log('_LETTER strdicts', letter, strdicts.length)

        let letdicts = []
        let dds = []
        for (let strdict of strdicts) {
            let dictdata = {}
            dds.push(dictdata)
            dictdata.str = strdict
            let formstr = strdict.join(' ').slice(0, 50).trim().replace(/^\d /, '').trim() // split(/[A-Z]/)[0].trim().split(' I ')[0]
            dictdata.formstr = formstr
            // log('_xxx formstr:', formstr)
            let short = formstr.split('(')[0].trim().split('[')[0].trim() // до любых скобок
            // log('_short:', short)
            // if (/ conj\. /.test(formstr)) log('_c', formstr)
            let cshort = comb(short)
            dictdata.short = short
            // log('_cshort:', cshort)

            let raw = short.split(',')[0]
            dictdata.raw = raw
            // будет нужен cdicts?
            let cdict = {raw}

            // поиск подходящего name stype. 1. type-max, 2. gen - regexp + max, 3. - если нет, max-freq
            let nounstype = ''
            let ngens = []
            let ntypemax = ''
            let dictgen = ''
            for (let stype in nounKey) {
                let stypes = stype.split('-')
                if (stypes.length != 2) continue
                let ntype = stypes[0]
                let ngen = stypes[1]
                let rentype = new RegExp(ntype + ', ')
                if (rentype.test(cshort) && ntype.length >= ntypemax.length) {
                    ntypemax = ntype
                    ngens.push(ngen)
                    dictgen = cshort.split(rentype)[1].split(' ')[0]
                }
            }

            if (/\)/.test(dictgen)) log('_BAD dictgen', dictgen, '_str', short)

            let ngenmax = ''
            let redictgen = new RegExp(dictgen)
            for (let ngen of ngens) {
                // log('+N', ngen, dictgen, redictgen.test(ngen))
                if (redictgen.test(ngen) && ngen.length >= ngenmax.length) ngenmax = ngen
            }

            let nstype = [ntypemax, ngenmax].join('-')
            cdict.type = ntypemax
            cdict.gen = ngenmax
            cdict.stype = nstype
            // log('_STYPE', ntypemax, ngens, dictgen, redictgen, ngenmax)
            // log('_cdict', cdict)


            // checkDict
            if (cdict.noun) {
                let wkt = nounDicts.find(doc=> doc.rdict == cdict.raw)
                if (wkt) {
                // log('_wkt', wkt)
                    let wids = wkt.vars.map(d=> [d.type, d.gen].join('-'))
                    // let bid = [doc.type, doc.gen].join('-')
                    let bid = cdict.stype
                    if (!wids.includes(bid)) {
                        // if (only) {
                            log('BAD WKT', wids, wkt.rdict)
                            log('BAD BAI', bid, cdict.raw)
                            throw new Error()
                        // }
                        // let bad_noun = {rdict, wids, bid}
                        // bad_nouns.push(bad_noun)
                    }
                } else {
                    log('_no wkt', cdict.raw)
                }
            }

            continue

            for (let key in typeAdjKey) {
                let types = key.split('-')
                if (types.length != 3) continue
                let type = types.join(', ')
                let re = new RegExp(type)
                if (re.test(cshort)) dictdata.type = type, dictdata.adj = true
            }
            if (dictdata.adj) continue

            if (/ adv\. /.test(short)) dictdata.adverb = true
            if (dictdata.adverb) continue

            continue

            let attrs = parseMorphData(formstr)
            // log('_ATTRS:', attrs)

            if (!attrs) {
                // log('_no morph', formstr, '_ATTRS:', attrs)
                // throw new Error('ERR: NO MORPH')
                no_morphs.push(formstr)
                continue
            }


            let cdicts = []
            let cdict_ = parseCdict(short)

            if (attrs.indecl) {
                cdicts = parseIndecl(cdict)
            } else if (attrs.adverb) {
                cdicts = parseAdverb(cdict)
            } else if (attrs.name) {
                if (!attrs.ends) {
                    no_nouns.push(formstr)
                    continue
                }
                let header = parseHeader(short, attrs)
                // log('_HEADER:', header)
                cdicts = parseDicts(header, attrs)
                // log('_CDICTS:', cdicts)
            } else if (attrs.verb) {
                cdicts = parseVerb(cdict, attrs, short)
            } else {
            }
            cdicts = _.compact(cdicts)
            letdicts.push(...cdicts)

        }

        dicts.push(...letdicts)
        // let raws = dicts.map(dict=> dict.raw)
        if (only )log('_letter CDICTS_with_morphs', letter, letdicts)
        log('_letter CDICTS_with_morphs', letter, letdicts.length)


        for (let dictdata of dds) {
            if (dictdata.noun) keys_noun.push(dictdata.type), bailly_nouns.push(dictdata.raw)
            else if (dictdata.adj) keys_adj.push(dictdata.type), bailly_adjs.push(dictdata.raw)
            else if (dictdata.adverb) bailly_adverbs.push(dictdata.short)
            else bad_nouns.push(dictdata.short)
        }
    }

    log('_DICTS:', dicts.length)

    for (let dict of dicts) {
        delete dict.trns
        dict._id = dict.dict
    }

    if (push) {
        let dname = 'RGreek'
        await pushDocs(dname, dicts)
    }
}

function parseHeader(str, attrs) {
    let raw = str.split(',')[0]
    let ends = attrs.ends // ος, α, ον или ος, ου
    let endsarr = ends.split(',').map(end=> end.trim())
    let typestr = endsarr[0]
    let retype = new RegExp(typestr + '$')
    let astem = raw.split(retype)[0].replace('·', '')
    let types = typestr.split('-')
    let header = {raw, astem, types, ends}
    if (attrs.art) header.art = attrs.art
    return header
}

function parseCdict(str) {
    let raw = str.split(',')[0]
    let rdict = raw
    let dict = comb(rdict)
    return {raw, rdict, dict}
}

function parseDicts(header, attrs) {
    // let ends = attrs.ends // ος, α, ον или ος, ου
    let cdicts = []
    let idx = 0
    for (let type of header.types) {
        let rdict = [header.astem, type].join('')
        let doc = {name: true, raw: header.raw, rdict, dict: comb(rdict)}
        let gen, stype
        let variant = {type}
        if (attrs.art) {
            gen = header.ends.split(', ')[1]
            stype = header.ends.split(', ').join('-')
        } else {
            let gendstypes = []
            let headerends = header.ends.split(', ')
            for (let headend of headerends) {
                let headends = headend.split('-')
                // log('_==', idx, headends)
                let gend = headends[idx] || hadendsheadends[0]
                gendstypes.push(gend)
            }
            stype = gendstypes.join('-')
        }
        // COMB
        variant = {type: comb(type), stype: comb(stype)}
        if (gen) variant.gen = comb(gen)

        doc.vars = [variant]
        doc = docStem(doc, header.astem)
        cdicts.push(doc)
        // log('_DOC', doc)
        idx++
    }


    return cdicts
}


// тут astem - не plain
function parseRdoc(str, type) {
    let retype = new RegExp(type + '$')
    let raw = str.split(',')[0]
    // log('_A_STR raw', raw)
    let astem = raw.split(retype)[0].replace('·', '')
    // astem = plain(comb(astem))
    // if (only) log('_Rdoc_STR', str, '_type:', type, '_astem:', astem)
    let rdoc = {name: true, raw, astem, vars: []}
    return rdoc
}

function docStem(doc, astem) {
    let aplain = plain(comb(astem))
    let {aug, tail} = parseAug(aplain)
    doc.stem = aplain
    if (aug) {
        let reaug = new RegExp('^' + aug)
        doc.stem = aplain.replace(reaug, '')
        doc.vars[0].aug = aug
    }
    return doc
}

// ἀγκαλίς
// "ἀγκαλίς, ίδος (ἡ) [κᾰ] 1 bras recourbé : ἐν ἀγκαλί",
// firststr = ἀγκάλη, ης (ἡ) [κᾰ] objet recourbé : 1 bras recourbé, au

function parseStrDicts(letvars, strs) {
    let dicts = []
    let dictstrs = []
    let prevend = ''
    let startstr = ''
    let idx = 0

    log('_=== only', only, reonly)
    for (let str of strs) {
        idx++
        // if (idx < 200) continue
        // if (idx > 250) continue
        let teststr = str.slice(0,25) // split(/[A-Z]/)[0].trim().split(' I ')[0]
        teststr = teststr.replace(/·/g, '')
        teststr = teststr.replace(/^\d /, '').trim()
        if (letvars.includes(teststr[0])) {
            startstr = teststr, prevend = strs[idx-2].slice(-1)
        }

        if (startstr) {
            if (prevend === '.') {
                let firststr = dictstrs[0].replace(redot, '').trim().replace(/^\d /, '').trim()
                firststr = cleanStress(firststr)

                if (only && reonly.test(firststr)) dicts.push(dictstrs)
                else if (!only) dicts.push(dictstrs)

                dictstrs = [str]
            }
        } else {
            dictstrs.push(str)
        }

        startstr = ''
    }

    // if (only) log('_STRINGS DICTS', only, dicts)
    return dicts
}

/*
  ά - oxia
 */



// везде oxia меняется на tonos, что кажется нелогичным, но так в WKT, DVR и LSJ - то есть замена верная
function cleanStress_in_utils(text) {
    text = text.replace(/ϐ/g, 'β')
    text = text.replace(/·/g, '·')
    text = text.replace(/ό/g, 'ό')
    text = text.replace(/ί/g, 'ί')
    text = text.replace(/ά/g, 'ά')
    text = text.replace(/ή/g, 'ή')
    text = text.replace(/ώ/g, 'ώ')
    text = text.replace(/έ/g, 'έ')
    text = text.replace(/ύ/g, 'ύ')
    return text
}


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

function parseNounForm(str) {
    return [{noun: true, irreg: true, str}]
}

function parseVerb(cdict, attrs, formstr) {
    // log('_VERB', cdict, attrs)
    cdict.verb = true
    cdict.vars = [{type: attrs.type, stype: attrs.ends}]
    return [cdict]
}

function parseVerbForm(str, type) {
    return [{verb: true, irreg: true, type, str}]
}

function parsePart(str) {
    return [{part: true, str}]
}

function parseAdverb_(cdict, attrs, str) {
    cdict.adverb = true
    cdict.indecl = true
    return [cdict]
}

function parseIndecl(cdict, attrs, str) {
    cdict.indecl = true
    return [cdict]
}

function parseIndeclForm(str) {
    return [{indecl: true, str}]
}

function parsePerson(str) {
    return [{person: true, indecl: true, str}]
}

function parsePrefix(str) {
    return [{prefix: true, indecl: true, str}]
}

function parseErr(str, type) {
    log('_ERR', str)
    log('_ERR-type', type)
    throw new Error()
}

// =================

function parseNoun_(cdict, art, str) {
    // log('_parseNoun art:', art, '_str', str, '_cdict:', cdict)
    if (art == 'adj') return [] // TODO: после parseAdjectives

    let nouns = []
    let raw = str.split('(')[0].trim()
    // { type: 'αξ', stype: 'ακος', keys: [Object] }
    let parts = raw.split(', ')
    let rdict = parts[0].split('-')[0]
    rdict = rdict.replace(/·/g, '')
    let dict = comb(rdict)
    let last = dict.slice(-1)
    let last2 = dict.slice(-2)
    let type, stype
    let indecl = false
    let person = false
    let phrase = false

    let attrs = parseNounData(str)
    // if (only) log('_attrs', attrs)

    if (!attrs) {
        log('_NO NOUN _art:', art, '_str:', str)
        no_nouns.push(str)
        throw new Error()
    }

    if (attrs == 'X') {
        no_nouns.push(str)
        return []
    }


    // ἀδελφιδεός-οῦς
    if (attrs) {
        // attrs = comb(attrs)
        let gends = art2gend[art]
        let [types, stypes] = attrs.split(', ')
        // log('_types', types, stypes)
        if (!stypes) log('_no stypes:', str)

        let type = types.split('-')[0]
        let retype = new RegExp(type + '$')
        let astem = rdict.replace(retype, '')
        // log('_astem', rdict, retype, astem)
        let aplain = plain(comb(astem))

        types = types.split('-')
        stypes = stypes.split('-')
        if (only) log('_only aplain', rdict, '_ATTRS', attrs, '_aplain:', aplain, '_types:', types, '_stypes:', stypes)

        let ctypes = types // corrected types
        let cstypes = stypes

        // vowel correction:
        let last = aplain.slice(-1)
        if (aplain.length > 1 && vowels.includes(last)) {
            aplain = aplain.slice(0, -1)
            types = types.map(type=> [last, type].join(''))
            stypes = stypes.map(type=> [last, type].join(''))
        }

        // log('_types', last, types, stypes)

        if (rdict.endsWith('της')) {
            astem = rdict.replace('της', '')
            let vow = astem.slice(-1)
            // log('_==============', rdict, astem, 'VOW', vow, 'T', types)
            let pvow = plain(comb(vow))
            if (vowels.includes(pvow)) {
                astem = astem.slice(0, -1) //  ναύτης - nautes
                aplain = plain(comb(astem))
                types = types.map(type=> [vow, 'τ', type].join(''))
                stypes = stypes.map(type=> [vow, 'τ', type].join(''))
                // log('_TYPES', astem)
            }
        }


        // check nameKey stype
        let checkok = checkNounTypes(rdict, types, stypes)
        if (!checkok) {
            types = ctypes
            stypes = cstypes
            checkok = checkNounTypes(rdict, types, stypes, true)
            if (!checkok) {
                log('_no checkok:', rdict, types, stypes)
                throw new Error('_no check ok')
            }
        }

        let stem = aplain
        let {aug, tail} = parseAug(aplain)
        // log('_aug, tail', rdict, aplain, aug)

        if (only) log('_only APLAIN', rdict, aplain, aug, '_stem:', stem, '_types', types, '_stypes', stypes)

        stypes.forEach((gen, idx)=> {
            let type = types[idx] || types[0]

            stem = aplain

            if (aug) {
                let reaug = new RegExp('^' + aug)
                stem = aplain.replace(reaug, '')
            }

            let dict = comb(rdict)
            type = comb(type)
            gen = comb(gen)

            // let doc = {name: true, rdict, dict, raw, stem, type, gen, stype}
            let doc = _.clone(rdoc)
            if (aug) doc.aug = aug
            nouns.push(doc)


            // ========================== вынести из цикла? И проверять один хотя бы из двух? ἀγαθίς - где верно, WKT или здесь?
            let wkt = nounDicts.find(doc=> doc.dict == dict)
            if (wkt) {
                // log('_wkt', wkt)
                let wids = wkt.vars.map(d=> [d.type, d.gen].join('-'))
                let bid = [doc.type, doc.gen].join('-')
                if (!wids.includes(bid)) {
                    if (only) {
                        log('BAD WKT', wids, wkt)
                        log('BAD BAI', bid, doc)
                    }
                    let bad_noun = {rdict, wids, bid}
                    bad_nouns.push(bad_noun)
                    // throw new Error()
                }
            }

        })
        // log('_ATTRS _art:', art, gends, '_attrs:', attrs,  '_str:', rdict, astem, type, 2, types, stypes)
        // throw new Error()
    }

    // if (only) log('_nouns', nouns)

    // let cdict = {name: true, rdict, dict, art, dialects: [attrs]}
    // if (indecl) cdict = {name: true, indecl: true, rdict, dict, art} // Ἀβραάμ, wkt -irreg и есть fls
    // else if (person) cdict = {name: true, indecl: true, person: true, rdict, dict, art} // Ἀβραάμ, wkt -irreg и есть fls
    // else if (phrase) cdict = {phrase: true, indecl: true, rdict, dict, str}
    // log('_NOUN', cdict)

    return nouns
}

function checkNounTypes(rdict, types, stypes, second) {
    if (types[0] == 'x') return true
    let checkok = true
    // for (let type of types) {
    stypes.forEach((gen, idx)=> {
        let type = types[idx] || types[0]
        let checktype = [type, gen].join('-')
        checktype = comb(checktype)
        checktype = cleanSymbols(checktype)
        if (!nameKey[checktype]) {
            checkok = false
            if (second) log('_NO_KEY_NAME:', rdict, '_checktype', checktype, '_TYPE', comb(type), '_GEN:', comb(gen))
        }
        // log('_checktype:', rdict, checktype)
    })
    // }
    return checkok
}



export function cleanSymbols(str) {
    let errDDOX = [accents.oxia, doubledot ].join('')
    let corrDDOX = [doubledot, accents.oxia].join('')
    return str.replace(errDDOX, corrDDOX)
}

/*
_ADJ {
  rdict: 'ἀλγίων',
  dict: 'ἀλγίων',
  raw: 'ἀλγίων',
  vars: [
    { type: 'ων', gen: 'ονος', gend: 'masc' },
    { type: 'ων', gen: 'ονος', gend: 'fem' },
    { type: 'ον', gen: 'ονος', gend: 'neut' }
  ],
  stem: 'λγι',
  aug: 'ἀ',
  name: 'true',
  stype: 'ων, ων, ον'
}
*/

function writeFiles() {
    if (only) return
    keys_noun = _.uniq(keys_noun)
    keys_adj = _.uniq(keys_adj)

    fse.writeFileSync('./data/no_morphs.js', JSON.stringify(no_morphs, null, 8))
    fse.writeFileSync('./data/no_nouns.js', JSON.stringify(no_nouns, null, 8))
    fse.writeFileSync('./data/wkt_nouns.js', JSON.stringify(wkt_nouns, null, 8))
    fse.writeFileSync('./data/no_wkt_nouns.js', JSON.stringify(non_wkt_nouns, null, 8))
    fse.writeFileSync('./data/no_typical_key.js', JSON.stringify(no_typical_key, null, 8))
    fse.writeFileSync('./data/no_verb_type.js', JSON.stringify(no_verb_type, null, 8))

    fse.writeFileSync('./data/bad_nouns.js', JSON.stringify(bad_nouns, null, 8))
    fse.writeFileSync('./data/bad_adjs.js', JSON.stringify(bad_adjs, null, 8))
    fse.writeFileSync('./data/keys_noun.js', JSON.stringify(keys_noun, null, 8))
    fse.writeFileSync('./data/keys_adj.js', JSON.stringify(keys_adj, null, 8))

    fse.writeFileSync('./data/bailly_nouns.js', JSON.stringify(bailly_nouns, null, 8))
    fse.writeFileSync('./data/bailly_adjs.js', JSON.stringify(bailly_adjs, null, 8))
    fse.writeFileSync('./data/bailly_adverbs.js', JSON.stringify(bailly_adverbs, null, 8))
    fse.writeFileSync('./data/bailly_phrase.js', JSON.stringify(bailly_phrase, null, 8))
    fse.writeFileSync('./data/bailly_indecls.js', JSON.stringify(bailly_indecls, null, 8))
    fse.writeFileSync('./data/bailly_verbs.js', JSON.stringify(bailly_verbs, null, 8))
    fse.writeFileSync('./data/bailly_equals.js', JSON.stringify(bailly_equals, null, 8))
}
