//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'
import { parseAug, cleanLongShort, cleanStress, arts, parseNounType, checkSuffix, parseAstem, astemTypeByPType, checkIrregs, removeVowelBeg } from './index.js'
import { accents } from './lib/utils.js'


import { wktNounPatterns } from "./lib/wkt_noun_patterns.js"
import { wktAdjPatterns } from "./lib/wkt_adj_patterns.js"
import { wktVerbPatterns } from "./lib/wkt_verb_patterns.js"
import { wktAdverbPatterns } from "./lib/wkt_adv_patterns.js"

import { preAdjPatterns } from "./lib/bll_pre_adj_patterns.js" // в wkt многих нет
import { preVerbPatterns } from "./lib/bll_pre_verb_patterns.js"
import { preNounPatterns } from "./lib/bll_pre_noun_patterns.js"

import { preflist } from "@mbykov/anthrax/preflist"
import { suffixList } from "./lib/suffix_list.js"

const currentdir = process.cwd()

let only = process.argv.slice(2)[0] || ''
if (only) log('_ONLY_bailly:', only)

let readcdicts = false
if (only == 'cdicts') {
    only = false
    readcdicts = true
}

const centerdot = '·'
const redot = /·/g

if (only) {
    only = only.replace(redot, '')
    only = cleanLongShort(only)
    only = plain(comb(only))
    only = new RegExp('^' + only)
}


let fullStemListPath = path.resolve(currentdir, './wkt-keys/full_stem_list.js')
let fullStemList = fse.readJsonSync(fullStemListPath)
let fullStemList3Path = path.resolve(currentdir, './wkt-keys/full_stem_list.js')
let fullStemList3 = fse.readJsonSync(fullStemList3Path)

let a_pref = comb('ἀ')
let aa_pref = comb('ἄ')
// preflist.push(a_pref)
// preflist.push(aa_pref)

let prefixes = preflist.map(pref=> {
    pref = pref.replace(/-/g, '')
    return pref
})

let bailly_stem_list = []

let doubled = []
let doubled_pos = []
let has_no_pos = []
let phrases = []
let exceptions = []
let tmps = []
let indecls = []
let irregs = []

const lsjpath = '../Sources/lsj-js.csv'
const dvrpath = '../Sources/dvoretsky.txt'
const baillyPath = path.resolve(currentdir, '../BLL/Source/pages')
const nestPath = '../Nests'

let onlyletter = '' // 'a'
const astemDict = {}

let dbltype2 = ['έω-ῶ', 'όω-ῶ', 'άω-ῶ', 'ῳόω-ῳῶ', 'οέω-οῶ',
                   'άομαι-ῶμαι', 'έομαι-οῦμαι', 'οάομαι-οῶμαι',
                   'οάω-οῶ', 'όομαι-οῦμαι', 'εάομαι-εῶμαι', 'εόω-εῶ',
                   'οέομαι-οοῦμαι',
                   'έειν-εῖν', 'εείν-εῖν', 'έειν-εῖν'] //


let dbltype3 = ['οος-ους, οος-ους, οον-ουν', 'έης-ῆς, έεος-έους', 'εός-οῦς, εοῦ-οῦ', 'όεις-οῦς, όεσσα-οῦσσα, όεν-οῦν',
                   'οος-ους, όου-ου', 'έος-οῦς, έα-ῆ, έον-οῦν', 'έα-ῆ, έας-ῆς', 'όος-οῦς, όη-ῆ, όον-οῦν', 'έη-ῆ, έης-ῆς', 'εος-οῦς, έα-ᾶ, εον-οῦν', 'οος-ους, οος-ους, οον-ου']

let dbltype4 = ['ος, εος-ους', 'ης, εος-ους', 'ώ, όος-οῦς', 'ώς, όος-οῦς', 'ες, εος-ους', 'ής, έος-οῦς', 'ος, εος-οῦς', 'ές, έος-οῦς', 'ος, πέεος-πέους'] //  'ώ, όος-οῦς'

// проверить πέος, - ος, πέεος-πέους

// неверно в Bailly
let alsoNouns = ['ἄδεια'] // но не обрабатываю, empty, и слить со сл. entry
let alsoAdverbs = ['ἄγκαθεν']
// EXAMPLE INDECLS - before adverb
let exampleStrs = ['adv. c. le suiv.', 'v.', 'ao. d’', 'par contr.', 'c.', 'vb. d’', 'et', 'formule de souhait,',
                   'qqf. dans les mss.', 'plur. de', 'pf. pass. d’', 'inf. ao. d’', 'ion.', 'contract. poét., surt. épq., p.',
                       'p.', 'att.', 'adj. vb. d’ord. avec nég. :', 'ou rar.', 'ou_', 'crase p.', 'gén._', 'pl. fém. de',
                       'v. le préc.', 'dor. c.', 'pf. d’', 'part. prés. pass. de', 'etc. v.', 'v. le suiv.', 'leç. incorr. p.',
                       '2 sg. impér. prés. et 3 sg. impf. d’', 'vb. du préc.', 'adj. dor. c. le suiv.', 'adv__. c.',
                       '3 sg. ao. 2 d’', '3 sg. impf. d’', 'dans les cps.', 'anc. leçon p.', 'éol. c.', 'seul. pf. 3 sg.', 'adv., v.', 'impér. ao. 1 d’',
                       'acc. sg. ou nom.-acc. pl. neutre d’', 'nom. fém. pl. d’', 'contr. de', 'sup. d’', 'mauv. prononc. de', 'adj. m. c.',
                   '3 pl. pf. pass. épq. d’', 'fém. d’', 'ion. c.', 'réc. c.', 'ion. p.', '3 sg. prés. pass. d’', '3 sg. fut. d’', 'inf. ao. moy. d’',
                   'pl. d’', 'inf. ao. 2 d’', 'pl. neutre d’', 'dev. une voy. p.', 'd’où', 'gén. d’', 'sel. d’autres', 'acc. sg.', 'ion. et épq.',
                   'c. le suiv.', 'inf. ao. 2', 'vb. du suiv.', 'impér. ao.', 'opt. ao. 2', 'contr. p.', '3 sg. ao.', 'impér. ao.', 'ao. 2', 'gén. pl. d',
                   'att. p.', 'poét. et ion.', 'inf. de', 'part. ao.', 'fut. d', 'voc. d', 'poét.', '3 sg. pf.', 'part. ao.', 'fut. act.', 'inf. ao.', 'pf. au sens',
                   'fém. et plur.', '3 pl. prés.', 'seul. voc.', '3 sg.', 'poét. c.', '2 sg.', 'pf. de', 'vb. de', 'inf. ao.', 'épq.', 'part. masc.'
                      ]


let genstr = '<i>gén.</i>'

let suffixes = suffixList.map(suffix=> {
    return plain(comb(suffix))
})
suffixes = _.uniq(suffixes)

let resuffixes = suffixes.map(suffix=> {
    return {
        suffix,
        re: new RegExp(suffix + '$')
    }
})

let astems = {}
// ἀστρονομ

makeCdicts(baillyPath)

async function makeCdicts(baillyPath) {
    log('_baillyPath', baillyPath)
    let entries = await readBLL(baillyPath)
    // if (only) log('_ONLY entries', entries)
    log('_entries', entries.length)

    let regularEntries = selectRegulars(entries)
    log('_regularEntries', regularEntries.length)
    // log('_regularEntries', regularEntries)

    for (let entry of regularEntries) {
        selectPrePos(entry)
    }

    let unknowns = entries.filter(entry=> !entry.pos)
    let regs = entries.filter(entry=> entry.pos)

    log('_regs', regs.length)
        // log('___________bad', )
    let bads = unknowns.map(entry=> [entry.rdict, entry.testrow].join(': '))
    // log('_unknowns', bads.slice(1000, 1100))
    log('_unknowns', unknowns.length)

    // == итого, я стал переделывать код. Разбил на двечасти - предварительное определение POS и потом
    // == определие stems и morphs

    // == сейчас перейду к LSJ, закончу там NESTS вместо BLL



    return []

    let cdicts = []
    for (let entry of regularEntries) {
        // log('_E', entry)
        let cdict = parseCdict(entry)
        // log('_C', cdict)
        if (!cdict  || !cdict.tail || cdict.rdict.length == 1) {
            // log('__!!!!!!!!!!!!!!!!! _bad_', entry.rdict)
            continue
        }

        // parseVerb(cdict)
        // parseNoun(cdict)
        parseAdjective(cdict)
        // parseAdverb(cdict)

        if (cdict.irreg) continue
        if (!cdict.marphas) continue
        checkSuffix(cdict)

        if (!cdict.stems || !cdict.stems.length || !cdict.marphas || !cdict.marphas.length)  {
            log('_BAD', cdict)
            throw new Error('BAD')
        }
        // log('_C', cdict)
        delete cdict.morphs
        delete cdict.teststr
        cdicts.push(cdict)
    }

    // ===================================== BUG ἀάατος

    if (only) {
        log('_only_cdicts:', cdicts)
    } else {
        fse.writeFileSync('./data/cdicts_bailly.js', JSON.stringify(cdicts, null, 8))
        // let regulars = cdicts.filter(cdict=> !cdict.indecl && !cdict.irreg)
        // в Bailly есть doubles
    }
}

function selectPrePos(entry) {
    let readv = new RegExp('Adv.')
    if (/<i>adv\./.test(entry.testrow)) entry.pos = 'adverb'
    if (entry.pos) return entry.pos

    let typestr = ''
    for (let adjtype of preAdjPatterns) {
        let revt = new RegExp(adjtype + '$')
        // let praw = plain(comb(cdict.raw))
        if (!revt.test(entry.head)) continue
        if (adjtype.length >= typestr.length) typestr = adjtype
    }
    if (typestr) {
        entry.typestr = typestr
        entry.pos = 'adj'
        return entry.pos
    }

    for (let patt of preVerbPatterns) { //
        if (!patt) continue
        let repatt = new RegExp(patt + '$')
        if (!repatt.test(entry.rdict)) continue
        entry.pos = 'verb'
        if (patt.length >= typestr.length) typestr = patt
        // log('___________________________________V', patt, entry.rdict)
    }

    if (typestr) {
        entry.typestr = typestr
        entry.pos = 'verb'
        return entry.pos
    }

    for (let patt of preNounPatterns) {
        if (!patt) continue
        let type = patt.split(':')[0].trim()
        let str = patt.split(':')[1].trim()
        let retype = new RegExp(type + '$')
        let restr = new RegExp('^' + str)
        // log('____________________ ', type, retype, entry.rdict, retype.test(entry.rdict))
        if (!retype.test(entry.rdict) || !restr.test(entry.testrow)) continue
        entry.pos = 'noun'
    }

    // ================ сделать определение ADVERB


    // log('_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx POS', entry.pos)
    if (entry.pos) return entry.pos


    // log('___________bad', [entry.rdict, entry.testrow].join(': '))

    return entry.pos
}


function parseNoun(cdict) {
    if (cdict.stems) return

    let rawparts = cdict.raw.split(', ')
    if (rawparts.length != 2) return

    let typestr = ''
    if (rawparts.length == 2) {
        let pnom = plain(comb(rawparts[0]))
        let pgen = plain(comb(rawparts[1]))
        typestr = parseNounType(pnom, pgen)
    }

    // log('_typestr', typestr)
    if (!typestr) return
    cdict.typestr = typestr

    let noungends = parseNounGends(cdict.teststr)
    // log('_noungends', noungends)
    cdict.gends = noungends || ['masc']
    cdict.pos = 'noun'

    let pdict = plain(cdict.dict)

    let typeparts = typestr.split(', ')
    let ptype = typeparts[0]
    let pgen = typeparts[1]
    let pgentype = pgen

    let genparts = typeparts[1].split('-')

    let zerostem = ''
    if (genparts.length > 1) {
        zerostem = genparts[0]
        pgentype = genparts[1]
    }

    let cwf = cdict.dict
    let reptype = new RegExp(ptype + '$')
    let astem = plain(cwf).replace(reptype, '')

    let reastem = new RegExp('^' + astem)
    let type = cwf.replace(reastem, '')
    if (type == cwf) type = plain(cwf).replace(reastem, '')


    let stem = astem
    let {aug, tail} = parseAug(pdict)
    if (aug) {
        cdict.aug = aug
        stem = astem.replace(aug, '')
    }

    if (cdict.compound) {
        stem = plain(cdict.compound.sc).replace(reptype, '')
    }

    let tgen = cdict.raw.split(', ')[1]
    tgen = comb(tgen)

    if (zerostem) {
        // log('_zerostem__', zerostem, 'cwf', cwf, '_ptype:', ptype,  '_pgen:', pgen)
        // astem = astem // + zerostem - не заботает в dat
        cdict.zero = true
        cdict.cstype = [type, tgen].join('-')
    }

    let marpha = {stem, mainwf: cwf, type, tgen} // noun

    // cdict.astem = astem
    cdict.marpha = marpha
    cdict.marphas = [marpha]
    cdict.stems = [stem]
}

function parseVerb(cdict) {
    if (cdict.stems) return
    let typestr = ''
    // === а если это verb, но aor, то есть по типу не определишь ????
    for (let verbtype of wktVerbPatterns) {
        if (!verbtype) continue
        let revt = new RegExp(verbtype + '$')
        let pdict = plain(cdict.dict)
        if (!revt.test(pdict)) continue
        if (verbtype.length >= typestr.length) typestr = verbtype
    }

    // log('_verb typestr', typestr)
    if (!typestr) return

    // log('_verb CD', cdict)

    let time = 'pres'
    cdict.pos = 'verb'
    let preType = {cwf: cdict.dict, ptype: typestr, tail: cdict.tail}
    let {stem, type, irreg} = astemTypeByPType(preType) // verb
    // log('________________________________________', time, stem, type, irreg)

    if (irreg) {
        cdict.irreg = true
        return cdict
    }
    // log('_verb typestr', typestr)

    // cdict.marphas = []
    // cdict.stems = []
    let marpha = {time, mainwf: cdict.dict, type} // verb

    cdict.marpha = marpha
    cdict.marphas = [marpha]
    cdict.stems = [stem]

    return cdict
}

function parseAdjective(cdict) {
    if (cdict.stems) return

    let rawparts = cdict.raw.split(', ')
    if (rawparts.length != 3) return

    let typestr = ''

    // здесь adjtype BLL - rdict, не pdict
    for (let adjtype of bllAdjPatterns) {
        let revt = new RegExp(adjtype + '$')
        // let praw = plain(comb(cdict.raw))
        if (!revt.test(cdict.raw)) continue
        if (adjtype.length >= typestr.length) typestr = adjtype
    }

    // log('_____________typestr_adj_', typestr)

    if (!typestr) log('_no_type_adj', cdict.head)
    if (!typestr) return

    return

    cdict.typestr = typestr
    cdict.pos = 'adj'
    let atype = typestr.split(', ')[0]
    let retype = new RegExp(atype + '$')
    // let tfem = typestr.split(', ')[1]
    // let tneut = typestr.split(', ')[2]
    let ptype = plain(atype)

    let mainwf = cdict.dict
    if (cdict.compound) {
        mainwf = cdict.compound.sc
        let pmainwf = plain(mainwf)
        let tail = pmainwf
        if (tail.length > 1 && fullStemList3.includes(tail.slice(0,3))) {
            cdict.tail = tail
        }
    }

    let preType = {cwf: mainwf, ptype, tail: cdict.tail}
    let {stem, type, irreg} = astemTypeByPType(preType) // adj-noun

    if (!stem) {
        // φιλ·εύϊος
        cdict.irreg = true
        return cdict
    }

    let tfem = cdict.raw.split(', ')[1]
    tfem = comb(tfem)
    let tneut = cdict.raw.split(', ')[2]
    tneut = comb(tneut)

    let marpha = {mainwf, type, tfem, tneut} // adjective
    if (cdict.tgen) marpha.tgen = cdict.tgen

    cdict.marpha = marpha
    cdict.marphas = [marpha]
    cdict.stems = [stem]
    // log('_________________________________________', cdict)
    return cdict
}

function parseAdverb(cdict) {
    if (cdict.stems) return
    if (!/<i>adv\./.test(cdict.teststr)) return

    cdict.pos = 'adverb'
    let typestr = ''
    for (let type of wktAdverbPatterns) {
        let revt = new RegExp(type + '$')
        if (!revt.test(cdict.rdict)) continue
        if (type.length >= typestr.length) typestr = type
    }

    if (!typestr) {
        cdict.indecl = true
        return
    }
    if (typestr) {
        cdict.typestr = typestr
        let atype = comb(typestr)
        let ptype = plain(atype)
        let retype = new RegExp(ptype + '$')

        let mainwf = cdict.dict
        let preType = {cwf: mainwf, ptype, tail: cdict.tail}
        let {stem, type, irreg} = astemTypeByPType(preType) // adverb

        let marpha = {mainwf: cdict.dict, type}
        cdict.stems = [stem]
        cdict.marphas = [marpha]

    }
    return cdict
    // ddd
}

// =================================


function selectRegulars(entries) {
    let phrases = []
    let exceptions = []
    let regs = []
    for (let entry of entries) {
        let trn = entry.str.split('<outline>')[0]
        let teststr = trn.slice(0,50)
        if ((/^\[/).test(trn)) {
            teststr = trn.split(/^\[/)[1].split(']')[1].slice(0,50)
        }

        if (entry.rdict.split(' ').length > 1) {
            phrases.push(entry.rdict)
            continue
        }


        for (let ex of exampleStrs) {
            let reex = new RegExp(['<i>', ex, '</i>'].join(''))
            if (!reex.test(teststr)) continue
            let descr = [entry.rdict, teststr].join(': ')
            exceptions.push(descr)
            continue
        }

        let itype = baillyProbeIndecl(teststr)
        if (itype) {
            let descr = ['indecl', entry.rdict, teststr].join(': ')
            indecls.push(descr)
            continue
        }

        // entry.teststr = teststr
        entry.testrow = teststr.replace(/\(/g, '').trim().replace(/\)/g, '').trim().replace(/ +/g, ' ')
        delete entry.str
        regs.push(entry)
    }
    fse.writeFileSync('./data/phrases.js', JSON.stringify(phrases, null, 8))
    fse.writeFileSync('./data/exceptions.js', JSON.stringify(exceptions, null, 8))
    fse.writeFileSync('./data/indecls.js', JSON.stringify(indecls, null, 8))
    return regs
}



async function readBLL(baillyPath) {
    let entries = []
    let fns = fse.readdirSync(baillyPath)
    for await (let fn of fns) {
        if (/\.json~/.test(fn)) continue
        if (!/\.json/.test(fn)) continue
        let letter = fn.split('-')[1].split('.')[0]
        if (onlyletter && letter != onlyletter) continue
        // log('_onlyletter', letter, fn)
        let entrypath = path.resolve(baillyPath, fn)
        let letentries = fse.readJsonSync(entrypath)
        if (onlyletter) log('_entries', onlyletter, letentries.length)
        // log('_letentries', letentries.length)
        // διθυραμβο·γενής, έος-οῦς

        let centries = cleanEntries(letentries)
        // log('_centries', centries.length)

        let dentries = []
        for (let entry of centries) {
            delete entry.formstr
            let head = cleanStress(entry.head).replace(/^\d /, '')
            let test = head.replace(/·/g, '')
            test = plain(comb(test))

            entry.head = head
            // log('_head____________', head)
            // entry.headold = head
            let doubled = doubledEntry(entry)
            dentries.push(...doubled)
        }
        entries.push(...dentries)
    } // fns

    // log('_????____________', entries.length)
    return entries
}

function cleanEntries(entries) {
    let centries = []
    for (let entry of entries) {
        let test = entry.head.replace(/·/g, '')
        test = plain(comb(test))
        if (only && !only.test(test)) continue
        // log('_test____________', only, test)

        let teststr = entry.str.slice(0, 35)
        let regenetive = new RegExp('^' + genstr)
        if (regenetive.test(teststr)) {
            // log('_genstr____________', entry)
            let tgenstr = entry.str.split(genstr)[1]
            let tgen = tgenstr.split(', ')[0].trim()
            tgen = tgen.replace(/^-/, '')
            entry.tgen = tgen
            centries.push(entry)
            continue
        }

        // log('_test____________', entry)
        let ok = true
        for (let ex of exampleStrs) {
            let reex = new RegExp(['<i>', ex, '</i>'].join(''))
            // if (reex.test(teststr)) log('____TEST EXAMPLE', ex)
            if (reex.test(teststr)) ok = false
            // тут можно сохранить examples // todo:
        }
        if (!ok) continue
        if (entry.head == 'Ἀργώ, όος-οῦς, όϊ-οῖ, ώ') entry.head = 'Ἀργώ, όος-οῦς'
        // log('_test____________', entry)
        centries.push(entry)
    }
    return centries
}

function doubledEntry(entry) {
    let head = entry.head.replace('-, ', '') // Ἀργυ-, ριππηνός, ή, όν ??????
    head = head.replace('-, ', ', ').replace(', -', ', ')
    head = head.split('(')[0].trim()
    let parts = head.split(', ')
    let rdict = parts[0]

    if (rdict.endsWith('ω-ῶ')) rdict = rdict.replace(/ω-ῶ$/, 'ω') // == W-W+ - пока совсем убрал

    let genfem = parts[1]
    let neut = parts[2]
    let rdictparts = rdict.split('-')

    if (rdictparts.length == 1) {
        entry.morphs = []
        entry.rdict = rdict

        let raw = entry.head.split(/[\(\[a-z:<]/)[0].trim().replace(/,$/, '').trim()
        raw = raw.replace(/·$/, '')
        let morph = comb(raw)
        morph = morph.split('(')[0]
        morph = morph.replace(redot, '')


        if (!genfem) {
            entry.morphs.push(morph)
            return [entry] // verbs?
        }

        let gens = genfem.split('-')
        if (gens.length == 1) { // regs
            entry.morphs.push(morph)
            return [entry]
        }

        for (let type of dbltype4) { // αἶσχος, εος-ους
            let retype = new RegExp(type + '$')
            if (!retype.test(head)) continue
            for (let gen of gens) {
                let morph = [rdict, gen].join(', ')
                morph = comb(morph)
                morph = morph.replace(redot, '')
                entry.morphs.push(morph)

                // let clone = _.clone(entry)
                // clone.head = [rdict, gen].join(', ')
                // dentries.push(clone)
            }

        }
        return [entry]
        // return dentries
    }

    let dentries = []
    // let typed = false
    for (let onlytype of dbltype2) {
        let retype = new RegExp(onlytype + '$')
        if (!retype.test(rdict)) continue
        // log('_onlytype', onlytype, rdict)
        // typed = true
        let types = onlytype.split('-')
        let astem = rdict.replace(retype, '')
        for (let type of types) {
            // if (type == 'ῶ') continue // w+
            let clone = _.clone(entry)
            // clone.astem = astem
            clone.rdict = astem + type
            clone.type = comb(type)
            clone.morphs = [comb(clone.rdict)] // αἰσχρουργέω + w+ // тут только type?
            dentries.push(clone)
        }
    }

    if (dentries.length) return dentries

    for (let typestr of dbltype3) {
        let retype = new RegExp(typestr + '$')
        if (!retype.test(head)) continue
        let typeparts = typestr.split(', ')
        let ends = typeparts[0]
        let astem = rdict.replace(ends, '')
        let types = ends.split('-')
        let gfs = typeparts[1].split('-')
        let neuts = typeparts[2]
        if (neuts) neuts = neuts.split('-')
        let idx = 0
        for (let type of types) {
            let clone = _.clone(entry)
            clone.morphs = []
            clone.astem = astem
            clone.gfs = gfs
            clone.idx = idx
            clone.rdict = astem + type
            clone.type = type
            // rdict, так что centerdot убран
            clone.head = [clone.rdict, gfs[idx]].join(', ')

            if (neuts) clone.head = [clone.head, neuts[idx]].join(', ')
            clone.morphs.push(clone.head)
            dentries.push(clone)
            idx++
        }
    }


    if (dentries.length) return dentries
    else doubled.push(head)

    return dentries
}

function parseNounGends(str) {
    let art = ''
    let pl = ''
    let gends = []

    if (/\( ὁ /.test(str)) gends.push('masc')
    if (/\( ἡ /.test(str)) gends.push('fem')
    if (/, ἡ /.test(str)) gends.push('fem')
    if (/\( τὸ /.test(str)) gends.push('neut')
    if (/, τὸ /.test(str)) gends.push('neut')
    if (/, τό /.test(str)) gends.push('neut')
    if (/\( τό /.test(str)) gends.push('neut')

    if (/\( οἱ /.test(str)) gends.push('masc'), pl = true
    if (/, οἱ /.test(str)) gends.push('masc'), pl = true
    if (/\( αἱ /.test(str)) gends.push('fem'), pl = true
    if (/, αἱ /.test(str)) gends.push('fem'), pl = true
    if (/\( τά /.test(str)) gends.push('neut'), pl = true
    if (/, τά/ .test(str)) gends.push('neut'), pl = true

    // todo: добавить plurals
    if (!gends.length) {
        return
        // log('_bad_gends', str)
        // throw new Error()
    }
    // log('_bad_gends', str, gends)

    return gends
}

function baillyProbeIndecl(str) { // ἄλφι ; ἀββᾶ ; Ἀβραάμ
    let pos = ''
    // log('_INDECL', str)
    if (/i>indécl\./.test(str)) {
        pos = 'indecl'
    } else if (/exclamation/.test(str)) {
        pos = 'exclamation'
    } else if (/i>conj\./.test(str)) {
        pos = 'conj'
    } else if (/interj\./.test(str)) {
        pos = 'interj'
    } else if (/onomatopée/.test(str)) {
        pos = 'onomatope'
    // } else if (/-$/.test(cdict.dict)) {
        // return
    } else if (/>préfixe/.test(str)) {
        pos = 'prefix'
    } else {
        return
    }
    return pos
}

function baillyProbeAdverb_(str) {
    if (!/<i>adv\./.test(str)) return
    return 'adverb'
}

function parseCdict(entry) {
    let raw = entry.head.split(/[\(\[a-z:<]/)[0].trim().replace(/,$/, '').trim()
    raw = raw.replace(/·$/, '')
    let rdict = entry.rdict
    rdict = rdict.replace(/^\*/, '')

    // log('_RAW', entry)

    rdict = rdict.replace(/·$/, '')
    rdict = rdict.split('(')[0] // Ἀθήνησι(ν) // todo: это нужно в doubled, пока так
    rdict = rdict.replace('-, ', '') // Ἀργυ-, ριππηνός, ή, όν ??????

    // == WPS == ·ώψ, ωψ, οψ,
    let wpsbads = ['·ώψ', '·ωψ', '·οψ']
    for (let wps of wpsbads) {
        let rewps = new RegExp(wps)
        if (rewps.test(rdict)) rdict = rdict.replace(centerdot, '')
    }

    let compounds = rdict.split(centerdot)
    compounds = compounds.map(cmp=> comb(cmp))

    rdict = rdict.replace(redot, '')

    if (!entry.morphs.length) {
        log('_NO MORPH', entry)
        throw new Error()
    }

    let dict = comb(rdict)
    let pdict = plain(dict)
    // let cdict = {head: entry.headold, raw, rdict, dict, morphs: entry.morphs} // head,
    let cdict = {raw, rdict, dict, teststr: entry.teststr, morphs: entry.morphs} // head, head: entry.headold,

    cdict.head = entry.head

    if (entry.tgen) cdict.tgen = entry.tgen

    // ============================= PREF BUGS:
    // ἀφ·ηλιώτης ; ἀφ·ιππο·τοξότης ; ἄφ·οδος, ; ἀφ·ύπαρχος ; ἀμφί·αλος ; ἀμφ·ήρης
    if (compounds.length > 1) {
        let fc = compounds[0]
        let sc = compounds[1]

        let prefix = ''
        let pfc = plain(fc)

        for (let pref of prefixes) {
            let repref = new RegExp('^' + pref)
            if (!repref.test(pfc)) continue
            if (pref.length >= prefix.length) prefix = pref
        }

        cdict.compound = {fc, sc}
        let tail = removeVowelBeg(sc)
        tail = strip(tail)

        if (prefix) {
            cdict.pref = prefix
            cdict.compound.pref = prefix
            if (compounds[2]) cdict.compound.thd = compounds[2]
            // log('___________________________cdict.compound:', cdict.compound)
        } else {
            let {aug, tail} = parseAug(pdict)
            if (aug) cdict.aug = aug
        }
        cdict.tail = tail
    } else { // may-be-compound:
        let {aug, tail} = parseAug(pdict)
        if (aug) cdict.aug = aug

        let prefix = ''
        for (let pref of prefixes) {
            let repref = new RegExp('^' + pref)
            if (!repref.test(pdict)) continue
            if (pref.length >= prefix.length) prefix = pref
        }

        // let stem = strip(dict)
        let prefstem = pdict
        // log('_______________________pdict', pdict, prefix)
        if (prefix) {
            let repref = new RegExp('^' + prefix)
            prefstem = prefstem.replace(repref, '')
            let tail = removeVowelBeg(prefstem)
            if (tail.length > 1 && fullStemList3.includes(tail.slice(0,3))) {
                cdict.prefix = prefix
                let retail = new RegExp(tail + '$')
                let con = prefstem.replace(retail, '')

                let csc = dict.replace(repref, '')
                if (csc == dict) csc = pdict.replace(repref, '')
                let sc = csc

                let pfc = prefix
                if (con) {
                    let recon = new RegExp('^' + con)
                    sc = csc.replace(recon, '')
                    if (csc == dict) sc = csc.replace(recon, '')
                    pfc = [prefix, con].join('')
                }
                cdict.compound = {pfc, con, sc, pref: prefix}
                // if (con) cdict.con = con
                cdict.tail = tail
            } else {
                cdict.tail = strip(pdict)
            }
        } else if (aug) {
            cdict.aug = aug
            cdict.tail = tail
        } else {
            cdict.tail = strip(pdict)
        }
    }

    if (cdict.rdict[0] == cdict.rdict[0].toUpperCase()) cdict.person = true

    // log('_CD', cdict)
    // cdict.trn = entry.str.split('<outline>')[0]
    return cdict
}
