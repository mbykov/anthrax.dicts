//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'
import { parseAug, cleanLongShort, cleanStr, arts, parseNounArt, astemTypeByPType, removeVowelBeg, vowels, stripAccent, zksps, termByAStem } from './index.js'

import { wktNounPatterns } from "./lib/wkt_noun_patterns.js"
import { wktAdjPatterns } from "./lib/wkt_adj_patterns.js"
import { wktVerbPatterns } from "./lib/wkt_verb_patterns.js"
import { wktAdverbPatterns } from "./lib/wkt_adv_patterns.js"

// import { preflist } from "@mbykov/anthrax/preflist"
// import { suffixList } from "./lib/suffix_list.js"

const currentdir = process.cwd()

let only = process.argv.slice(2)[0] || ''

let push = ''
// здесь - нормализация и определение astem + type. Для вычисления Nest.
// return [cdict] из-за zstem - nest вычисляется по z
// stype - нужен
// person - dict.toLowerCase()

// затем:
// uniqDicts - rdict+pos
// makeNests
if (only == 'push') {
    only = false
    push = true
}

// ἀπάγω.js
if (only) {
    only = cleanLongShort(only)
    only = plain(comb(only))
    only = new RegExp('^' + only)
    log('_ONLY_WKT', only)
}

// let suffixes = suffixList.map(suffix=> {
// return plain(comb(suffix))
// })
// suffixes = _.uniq(suffixes)

let tmps = []

// WKT
// let nestPath = path.resolve(currentdir, '../Nests')

// подготовительный этап для Nests, так что без indecl, irreg

let nounPath = path.resolve(currentdir, '../../anthrax.data/wkt/nouns')
let adjPath = path.resolve(currentdir, '../../anthrax.data/wkt/adjectives')
let verbPath = path.resolve(currentdir, '../../anthrax.data/wkt/verbs')
let adverbPath = path.resolve(currentdir, '../../anthrax.data/wkt/adverbs')
let personPath = path.resolve(currentdir, '../../anthrax.data/wkt/persons')

// let fullStemListPath = path.resolve(currentdir, './wkt-keys/full_stem_list.js')
// let fullStemList = fse.readJsonSync(fullStemListPath)


makeCdicts()

function makeCdicts() {
    let cdicts = []
    let fns = fse.readdirSync(nounPath)
    for (let fname of fns) {
        let test = plain(comb(fname))
        if (only && !only.test(test)) continue
        // log('_____________________________________', fname)
        let {entry, cdict} = correctCdict(nounPath, fname)
        cdict.pos = 'noun'
        if (cdict.irreg) continue // TODO:
        let dicts = parseNoun(entry, cdict)
        cdicts.push(...dicts)
    }

    fns = fse.readdirSync(adjPath)
    for (let fname of fns) {
        let test = plain(comb(fname))
        if (only && !only.test(test)) continue
        let {entry, cdict} = correctCdict(adjPath, fname)
        cdict.pos = 'adj'
        if (cdict.irreg) continue
        let dicts = parseAdj(entry, cdict)
        // log('___________________________________adj', dicts)
        cdicts.push(...dicts)
    }

    fns = fse.readdirSync(verbPath)
    for (let fname of fns) {
        let test = plain(comb(fname))
        if (only && !only.test(test)) continue
        let dicts = parseVerb(verbPath, fname)
        cdicts.push(...dicts)
    }

    fns = fse.readdirSync(adverbPath)
    for (let fname of fns) {
        let test = plain(comb(fname))
        if (only && !only.test(test)) continue
        let dicts = parseAdverb(adverbPath, fname)
        cdicts.push(...dicts)
    }

    fns = fse.readdirSync(personPath)
    for (let fname of fns) {
        let test = plain(comb(fname))
        if (only && !only.test(test)) continue
        // log('_____________________________________', fname)
        let {entry, cdict} = correctCdict(personPath, fname)
        cdict.pos = 'noun'
        cdict.person = true
        if (cdict.irreg) continue // TODO:
        let dicts = parseNoun(entry, cdict)
        cdicts.push(...dicts)
    }


    let regulars = cdicts.filter(cdict=> !cdict.irreg && !cdict.indecl)
    let irregulars = cdicts.filter(cdict=> cdict.irreg || cdict.indecl)
    log('_cdicts_regulars', regulars.length)


    for (let cdict of regulars) {
        // if (!cdict.astem && !cdict.zero) log('_NO_ASTEM', cdict)
        if (cdict.astem) cdict.astem = plain(cdict.astem)
        // delete cdict.marphas
        delete cdict.compound
        if (!cdict.prform) {
            log('_no_prform', cdict)
            throw new Error()
        }
        if (!cdict.type) {
            log('_no_type', cdict)
            throw new Error('_NO TYPE')
            cdict.irreg = true
        }
        // cdict.prform
        if (cdict.prform != cdict.astem + plain(cdict.type)) {
            // αἰχμαλόω
            log('_bad_astem', cdict)
            throw new Error()
        }
        if (!cdict.stype) {
            log('_BAD', cdict)
            throw new Error()
        }
    }

    // тесты, убрать или причесать

    if (only) {
        for (let cdict of regulars) {
            log('_wkt_reg_cdict', cdict)
        }
    }

    // log('_wkt_cdicts_regs', regulars.length)

    // let indecls = cdicts.filter(cdict=> cdict.indecl)
    // log('_indecls', indecls.length)
    // let irregs = cdicts.filter(cdict=> cdict.irreg)
    // log('_irregs', irregs.length)

    // create wkt-keys
    let typicalNounGen = {}
    let typicalAdjGen = {}
    for (let cdict of regulars) {
        if (cdict.pos == 'noun') {
            let type = cdict.type
            let tgen = cdict.gen
            if (!typicalNounGen[type]) typicalNounGen[type] = {}
            if (!typicalNounGen[type][tgen]) typicalNounGen[type][tgen] = 0
            typicalNounGen[type][tgen] += 1
        }
        else if (cdict.pos == 'adj') {
            let stype = cdict.stype
            let tgen = cdict.gen
            if (!typicalAdjGen[stype]) typicalAdjGen[stype] = {}
            if (!typicalAdjGen[stype][tgen]) typicalAdjGen[stype][tgen] = 0
            typicalAdjGen[stype][tgen] += 1
        }
    }

    for (let stype in typicalAdjGen) {
        let list = typicalAdjGen[stype]
        let max = 0
        for (let gen in list) {
            if (list[gen] > max) list.max = gen, max = list[gen]
        }
    }

    for (let type in typicalNounGen) {
        let list = typicalNounGen[type]
        let max = 0
        for (let gen in list) {
            if (list[gen] > max) list.max = gen, max = list[gen]
        }
    }

    if (!only) {
        fse.writeFileSync('./wkt-keys/typical-adj-gen.js', JSON.stringify(typicalAdjGen, null, 8))
        fse.writeFileSync('./wkt-keys/typical-noun-gen.js', JSON.stringify(typicalNounGen, null, 8))

        fse.writeFileSync('./results/cdicts_wkt.js', JSON.stringify(regulars, null, 8))
    }
}

function correctCdict(wktpath, fname) {
    let cdict = cdictByName(fname)
    wktpath = path.resolve(wktpath, fname)
    let entry = fse.readJsonSync(wktpath)
    // log('_entry_wkt', wktpath, entry, cdict)
    if (entry.empty) {
        cdict.com = '_empty_noun'
        cdict.irreg = true
        // нужны только стемы
        return {entry, cdict}
    }

    let rdict = entry.rdict
    let stripped = strip(comb(rdict)) // TODO: WTF?
    if (stripped.length < 2) {
        cdict.irreg = true
        return {entry, cdict}
    }

    if (rdict.split(' ').length > 1) {
        cdict.com = 'phrase'
        cdict.irreg = true
        return {entry, cdict}
    }

    if (!entry.dialects) {
        log('_empty_dialects', entry) // <<=== ?? куда деть?
        cdict.com = '_empty_dialects'
        cdict.irreg = true
        return {entry, cdict}
    } else {
        for (let dia of entry.dialects) {
            // log('_D', dia.forms.length)
            if (!dia.forms) cdict.irreg = true
        }
        if (cdict.irreg) return {entry, cdict}
    }

    // σέβας - не прочиталось
    let badnouns = [ 'οὖς', 'οἶς', 'σέβας']
    if (badnouns.includes(entry.rdict)) cdict.irreg = true

    return {entry, cdict}
}

function findNameGenForm(entry) {
    let pgenform
    for (let dia of entry.dialects) {
        if (pgenform) continue
        if (!dia.forms) log('_D', entry)
        let genform = dia.forms.find(form=> form.case == 'gen')
        if (!genform) genform = dia.forms.find(form=> form.case == 'dat') // γρηΰς
        if (!genform) continue
        let genwf = genform.wf
        genwf = comb(genwf)
        genwf = cleanLongShort(genwf)
        // pgenform = plain(genwf)
        pgenform = genwf
    }
    return pgenform
}

// examples κῆρυξ, βάρακος, αἰγόλεθρος, irreg - οὖς
function parseNoun(entry, cdict) {
    // log('_NOUN', cdict)
    let typestr = ''
    let pdict = plain(cdict.dict)
    if (!cdict.prform) cdict.prform = pdict // тут нет dia?

    let genform = findNameGenForm(entry)
    // log('_genform_noun', genform)
    if (!genform) {
        // log('_bad_no_genform_noun', cdict.rdict)
        cdict.irreg = true
        return [cdict]
    }

    let pgenform = plain(genform)

    if (!pgenform) {
        cdict.irreg = true
        return [cdict]
    }

    for (let type of wktNounPatterns) { // parse_Noun
        if (!type) continue
        let types = type.split(', ')
        let nom = types[0]
        let renom = new RegExp(nom + '$')
        let gen = types[1].replace('-', '')
        let regen = new RegExp(gen + '$')
        // log('_NOM', nom, gen)
        if (!renom.test(pdict)) continue
        // log('_GEN', nom, gen)
        if (!regen.test(pgenform)) continue
        // log('_gen', nom, gen)
        if (type.length >= typestr.length) typestr = type
    }
    // log('_typestr noun___:', typestr)

    if (!typestr) {
        // log('_no_typestr noun_:', cdict.rdict)
        // throw new Error()
        cdict.irreg = true
        return [cdict]
    }

    let typeparts = typestr.split(', ')
    let ptype = typeparts[0]
    let pgen = typeparts[1]

    let reptype = new RegExp(ptype + '$')
    let astem = pdict.replace(reptype, '')
    let type = termByAStem(cdict.dict, astem)
    let gen = termByAStem(genform, astem)

    if (!gen) {
        cdict.irreg = true
        // log('_bad_noun_genform', cdict.rdict, genform, '_gen', gen)
        return [cdict]
    }
    let stype = [type, gen] // .join('-')

    if (only) log('_ASTEM', cdict.dict, plain(cdict.dict), 'astem:', astem, type, '_gen', gen)

    cdict.astem = astem
    cdict.type = type
    cdict.gen = gen
    cdict.stype = stype

    let zdict
    if (cdict.zero) {
        for (let dia of entry.dialects) {
            let genform = dia.forms.find(form=> form.case == 'gen')
            let genwf = genform.wf
            genwf = comb(genwf)
            genwf = cleanLongShort(genwf)
            let zgen = plain(genwf)
            cdict.zform = genwf
            cdict.zstem = zgen.replace(/ος$/, '')

        }
    }

    if (plain(astem + type) != plain(cdict.dict)) {
        log('_NOT_CORRECT_NOUN', cdict)
    }

    return [cdict]
} // noun



// ἄβρωτος
function parseAdj(entry, cdict) {
    let typestr = ''
    let pdict = plain(cdict.dict)

    // нужен только первый astem, для выбора nest
    let dia = entry.dialects[0]
    let gend_forms = dia.forms.filter(form=> form.case == 'nom' && form.num == 'sg') // а если SG нет?
    let gend_wfs = gend_forms.map(form=> cleanLongShort(comb(form.wf)))
    let genform = dia.forms.find(form=> form.case == 'gen' && form.num == 'sg')

    if (!genform || !genform.wf) {
        cdict.irreg = true
        cdict.com = 'no_gen_adj'
        return [cdict]
    }

    let genwf = cleanLongShort(comb(genform.wf))
    // log('_gend_wfs', gend_wfs, genform.wf)

    if (gend_wfs.length == 1) {
        let ndicts = parseNoun(entry, cdict)
        return ndicts
    }

    if (!cdict.prform) cdict.prform = plain(gend_wfs[0]) // тут нет dia?
    // log('____________________________adj cdict.prform', cdict.prform)

    if (gend_wfs.length == 2) {
        let masc = gend_wfs[0]
        gend_wfs.unshift(masc)
    }

    if (gend_wfs.length == 3) {

        let pgend_wfs = gend_wfs.map(wf=> plain(comb(wf)))
        for (let type of wktAdjPatterns) {
            if (!type) continue
            let types = type.split(', ')
            let masc = types[0]
            let remasc = new RegExp(masc + '$')
            let fem = types[1]
            let refem = new RegExp(fem + '$')
            let neut = types[2]
            let reneut = new RegExp(neut + '$')

            if (!remasc.test(pgend_wfs[0]) || !refem.test(pgend_wfs[1]) || !reneut.test(pgend_wfs[2]) ) continue
            if (type.length >= typestr.length) {
                typestr = type
            }
        }
        // log('_typestr_ADJ____________', typestr)

        if (!typestr) {  // μάκαρ - αρ-αρος ???
            // log('_bad_adj:', cdict.rdict, '_gends:', gend_wfs.join(', ')) // , pnom, pgen
            cdict.irreg = true
            return [cdict]
        }

        let typeparts = typestr.split(', ')
        let ptype = typeparts[0] // ptype - type и masc
        let fptype = typeparts[1]
        let nptype = typeparts[2]

        let mainwf = gend_wfs[0]
        let femwf = gend_wfs[1]
        let neutwf = gend_wfs[2]

        let reptype = new RegExp(ptype + '$')
        let astem = plain(mainwf).replace(reptype, '')

        let mtype = termByAStem(mainwf, astem)
        let ftype = termByAStem(femwf, astem)
        let ntype = termByAStem(neutwf, astem)
        let gentype = termByAStem(genwf, astem)
        // log('_ASTEM', cdict.dict, plain(cdict.dict), 'astem:', astem, type)

        cdict.astem = astem
        cdict.type = mtype
        cdict.stype = [mtype, ftype, ntype]
        cdict.gen = gentype

        return [cdict]
    }

    return []
} // adjective

//   >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ἀκέων и в cdict_wkt, и в indecls_wkt -- $ gr ἀκέω data <<<<<<<<<<<<<<<<<<<<<<<<<< !!!!!!!!!!!!!

function parseCompound(compound) {
    if (compound) {
        compound = _.uniq(compound.map(str=> cleanLongShort(str)))
        compound = _.uniq(compound.map(str=> plain(comb(str))))
        // TODO: сделать аккуратнее
        if (compound.length > 1) {
            compound = {pfc: compound[0], psc: compound[1]}
        } else {
            compound = null
        }
    }
    return compound
}

function parseVerb(wktpath, fname) {
    // let verbs = []
    let cdict = cdictByName(fname)
    wktpath = path.resolve(wktpath, fname)
    let entry = fse.readJsonSync(wktpath)
    // log('_entry_wkt', wktpath, entry)
    if (entry.empty) return [] // ???
    if (!entry.vtimes || !entry.vtimes.length) return [] // log('_empty_entry', entry) // <<=== ?? куда деть?

    cdict.pos = 'verb'
    let rdict = entry.rdict
    let pdict = plain(entry.dict)
    let stripdict = strip(pdict)

    if (/ειμι$/.test(stripdict) || /ιημι/.test(stripdict)) { // eimi
        // log('_______________________________________________', cdict.rdict)
        cdict.irreg = true
        cdict.com = 'eimi type'
        return []
    }

    if (entry.compound) cdict.compound = _.uniq(entry.compound)
    if (entry.compounds) cdict.compound = _.uniq(entry.compounds)
    let compound = parseCompound(entry.compound)
    if (compound) cdict.compound = compound

    let times = []
    for (let dia of entry.vtimes) {
        let time = dia.info.time
        times.push(dia.info.time)
    }
    times = _.uniq(times)
    let maintime = times.includes('pres') ? 'pres' : times[0]

    // правильные - astem д.б. один во всех dias.
    // здесь только главная словарная форма, как во всех остальных словарях
    // поэтому astem нужно вычислять по словарной форме. Morphs не имеют значения, потому что суффиксы не вычисляются в глаголах. Там д.б. свои
    // === пока с попыткой вычислить класс глагола ничего не получается. действует механизм гнезд

    // = ['βουλεύω', 'λύω']
    // nest нормально обрезает βουλεύω по гнезду, но λύω приходится обрезать здесь
    let astem = ''
    // log('________________________________________VERB', entry.rdict)
    // TODO: можно проще, только нужный, первый vtimes
    for (let dia of entry.vtimes) {
        let time = dia.info.time

        if (time != maintime) continue
        let typestr = ''
        // log('________________________________________TIME', dia.info.time)

        let form = dia.forms[0]
        let mainwf = form.wf
        mainwf = comb(mainwf)
        mainwf = cleanLongShort(mainwf)
        let pmainwf = plain(mainwf) // просто первая форма

        if (!cdict.prform) cdict.prform = pmainwf

        // log('________________________________________V pmainwf', pmainwf)
        for (let type of wktVerbPatterns) {
            if (!type) continue
            let retype = new RegExp(type + '$')
            if (!retype.test(pmainwf) ) continue
            if (type.length > typestr.length) typestr = type
        }

        // log('________________________________________V typeSTR', typestr, 'pmainwf', pmainwf)

        if (!typestr) {
            // это dia, отбросить только dia ======>>>>>   создать отдельно DIA-IRREGS - ἔρχομαι
            cdict.irreg = true
            cdict.com = 'no verb type'
            // cdict.type = null
            continue
        }

        let ptype = typestr
        let reptype = new RegExp(ptype + '$')

        // log('________________________________________V ASTEM', pmainwf, typestr, cdict.astem, cdict.type)

        let astem = plain(mainwf).replace(reptype, '')
        // log('________________________________________V AST', pmainwf, astem, 'ptype', ptype)
        if (astem.length == 1) { // luo, λύω - слишком короткие стемы убрать
            let shortptype = ptype.slice(1)
            if (shortptype) { // но не настолько, как у ζῶ
                ptype = ptype.slice(1)
                reptype = new RegExp(ptype + '$')
                astem = plain(mainwf).replace(reptype, '')
                // log('________________________________________V AST_2', pmainwf, astem, 'ptype', ptype)
            }
        }

        if (!astem) {
            cdict.irreg = true
            cdict.com = 'no verb astem'
            continue
        }

        if (!cdict.astem) cdict.astem = astem // первый astem
        let reastem = new RegExp('^' + astem)
        if (!cdict.type) {
            cdict.type = mainwf.replace(reastem, '')
            if (cdict.type == mainwf) cdict.type = plain(mainwf).replace(reastem, '')
            cdict.stype = [cdict.type] // только добавить diff
            // log('________________________________________V AST', plain(mainwf), astem, 'type:', cdict.type)
        }
    } // dia = vtime

    return [cdict]
} // verb


function parseAdverb(wktpath, fname) {
    let cdict = cdictByName(fname)
    let typestr = ''
    for (let type of wktAdverbPatterns) {
        let revt = new RegExp(type + '$')
        if (!revt.test(cdict.rdict)) continue
        if (type.length >= typestr.length) typestr = type
    }
    if (typestr) {
        let ptype = plain(comb(typestr))

        let mainwf = cdict.dict
        if (!cdict.prform) cdict.prform = plain(mainwf) // тут нет dia?

        let reptype = new RegExp(ptype + '$')
        let astem = plain(mainwf).replace(reptype, '')

        cdict.astem = astem
        cdict.type = typestr
        cdict.stype = [cdict.type]

    } else {
        cdict.irreg = true
        // log('_ERR', cdict)
        // throw new Error()
    }

    cdict.pos = 'adverb'
    return [cdict]
}

function cdictByName(fname) {
    let rdict = fname.replace('.json', '')
    let dict = comb(rdict)
    dict = cleanLongShort(dict)
    let pdict = plain(dict)

    let cdict = {rdict, dict} // , vars: []

    let {aug, tail} = parseAug(pdict)

    if (aug) {
        cdict.aug = aug
    }

    let zlast = rdict[rdict.length -1]
    if (zksps.includes(zlast)) cdict.zero = true

    // log('_______________________parse CDICT', cdict)
    // cdict.pdict = pdict
    return cdict
}

function parseIrregular_(cdict, irregulars) {
    let irregDict = ''
    for (let irr of irregulars) {
        if (!irr.wf) continue
        if (irr.wf != cdict.rdict) continue
        irregDict = irr
    }
    if (!irregDict) return

    cdict.irreg = true
    cdict.relstem = irregDict.astem
    // log('_IRR_A', cdict)
    return cdict
}
