//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain} from 'orthos'
import { cleanLongShort, termByAStem, termByStem, cleanStr, arts, parseNounArt, parseAstem, getStress, zksps } from '../../dictutils/index.js'

import { prettyFLS, prettyName } from "@mbykov/anthrax/prettyFLS"

const currentdir = process.cwd()

// ἀπάγω.js
let nouns = []
let irnouns = []
let nfls = []

export async function wktNoun(nests, nounPath, only) {
    let fns = fse.readdirSync(nounPath)
    for await (let fname of fns) {
        let test = plain(comb(fname)).toLowerCase()
        if (only && !only.test(test)) continue
        // log('_____FNAME NOUN', test)

        let wfpath = path.resolve(nounPath, fname)
        let entry = fse.readJsonSync(wfpath)

        if (entry.empty) continue
        // log('_ENTRY', entry)

        // ===== это должно быть в nest
        let zlast = entry.rdict[entry.rdict.length -1]
        if (zksps.includes(zlast)) entry.zero = true

        // Λυκάων
        if (entry.rdict[0] == entry.rdict[0].toUpperCase()) {
            let upper = entry.rdict[0]
            let lower = upper.toLowerCase()
            let reupper = new RegExp('^' + upper)
            entry.rdict = entry.rdict.replace(reupper, lower)
            // entry.lowered = true
        }

        let nest = nests.find(nest=> nest.rdict == entry.rdict && nest.dict == entry.dict && nest.pos == 'noun')
        // log('_nest_noun', nest)
        if (nest && nest.zero) parseNounZ(entry, nest)
        else if (nest) parseNoun(entry, nest)
        else parseIrreg(entry)

    }

    // log('_nouns', nouns)
    let jsons = nfls.map(flex=> JSON.stringify(flex))
    jsons = _.uniq(jsons)
    nfls = jsons.map(flex=> JSON.parse(flex))

    // return {nouns:[], irnouns:[], nfls:[]}
    return {nouns, irnouns, nfls}
}

function parseNoun(entry, nest) {
    // log('_parseNoun_entry', entry)
    // log('_nest', nest)

    // let cdict = {pos: nest.pos, rdict: nest.rdict, dict: nest.dict, stem: nest.stem, astem: nest.astem}
    // if (nest.compound) cdict.compound = nest.compound
    // if (nest.prefix) cdict.prefix = nest.prefix
    // if (nest.aug) cdict.aug = nest.aug

    let cdict = nest
    cdict.var = {}
    cdict.gends = []
    entry.dialects.forEach(dia=> {
        if (!dia.forms) {
            // log('_XXXXXXXXXXXXXXXX_NO_DIA.FORMS', entry)
            let irreg = {name: true, indecl: true, rdict: entry.rdict, dict: entry.dict} // == , trns: entry.trns
            irreg.pos = 'noun'
            irreg.trns = entry.trns
            irnouns.push(irreg)
            dia.forms = []
        }

        parseDialect(cdict, dia, nest.stem)
    }) // dia

    if (!_.keys(cdict.var).length) {
        log('_ERR no cdict.var', cdict.rdict)
        cdict.irreg = true
        // throw new Error()
    }

    delete cdict.stypes

    cdict.pos = 'noun'
    cdict.name = true
    cdict.trns = entry.trns
    nouns.push(cdict)
}

function parseDialect(cdict, dia, stem, zstype) {
    let diafls = []

    for (let form of dia.forms) {
        let wf = form.wf
        wf = cleanLongShort(wf)
        let cwf = comb(wf)
        let term = termByStem(cwf, stem)

        if (term == plain(cwf)) continue
        let {stress, stressidx} = getStress(cwf)
        // log('_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx SSS', stress, stressidx)
        let flex = { name: true, term, number: form.num, case: form.case, gend: form.gend, stress, stressidx} // , syllables, firststem
        cdict.gends.push(flex.gend)
        diafls.push(flex)
    } // forms

    let cleanflex = []
    let gendgdoups = _.groupBy(diafls, 'gend')
    for (let gend in gendgdoups) {
        let gendfls = gendgdoups[gend]

        let gen = ''
        let nom = ''
        let varkey = gendfls.map(flex=> {
            return flex.term
        }).join('-')

        for (let cflex of gendfls) {
            if (cflex.number != dia.numbers[0]) continue
            if (cflex.case != 'gen') continue
            if (!gen) gen = cflex.term // берем только первый, потому что м.б. редкие варианты, ος-ος-ον-οο, нужен ος-ος-ον-ου ; он же будет masc
        }

        for (let cflex of gendfls) {
            if (cflex.number != dia.numbers[0]) continue
            if (cflex.case != 'nom') continue
            nom = cflex.term
        }

        let stype = [nom, gen].join('-')
        if (zstype) stype = zstype

        // VERB let diakey = {tense, stype, gend, keys: [varkey], aug}
        // cdict.ckeys.push(diakey)
        // ADJ let diakey = {stype, gend, keys: [varkey], aug}
        // cdict.ckeys.push(diakey)

        if (!cdict.var[stype]) cdict.var[stype] = {}
        if (!cdict.var[stype][gend]) cdict.var[stype][gend] = []
        cdict.var[stype][gend].push(varkey)
        cdict.var[stype][gend] = _.uniq(cdict.var[stype][gend])

        // новый, просто массив без gend
        // if (!cdict.var[stype]) cdict.var[stype] = []
        // cdict.var[stype].push(varkey)
        // cdict.var[stype] = _.uniq(cdict.var[stype])

        for (let cflex of gendfls) {
            let flex = _.clone(cflex)
            flex.key = varkey
            flex.stype = stype
            cleanflex.push(flex)
        }
    } // gend

    cdict.gends = _.uniq(cdict.gends)
    // ударение уже на первом слоге, в вокативе ему некуда отпрыгнуть // ἔτης, ошибка в τεχνίτης wf: τέχνιτα
    // let xxx = cleanflex.find(f=> f.term =='α' && f.case == 'voc' && f.stressidx == 3 && f.stress == 'oxia' && f.key == 'ης-α-αι-ου-αιν-ῶν-ῃ-αιν-αις-ην-α-ας-α-α-αι')
    // if (xxx) log('_XXXXXXXXXX', cdict.rdict)

    nfls.push(...cleanflex)
}

function parseNounZ(entry, nest) {
    // log('_parseNoun_Z_entry', entry)
    // log('_nest Z', nest)

    let stem = nest.stem
    let cdict = {pos: 'noun', rdict: nest.rdict, dict: nest.dict, stem }
    if (nest.aug) cdict.aug = nest.aug

    let zstype = [nest.ztype, nest.zgen].join('-')

    cdict.var = {}
    cdict.gends = []
    entry.dialects.forEach(dia=> {
        if (!dia.forms) {
            // log('_XXXXXXXXXXXXXXXX_NO_DIA.FORMS_Z_', entry)
            let irreg = {name: true, indecl: true, rdict: entry.rdict, dict: entry.dict} // == , trns: entry.trns
            irreg.pos = 'noun'
            irreg.trns = entry.trns
            irnouns.push(irreg)
            dia.forms = []
        }

        // parseDialect(cdict, dia, nest.stem, zstype)
    }) // dia

    if (!_.keys(cdict.var).length) return

    cdict.trns = entry.trns
    cdict.name = true
    cdict.zero = true
    nouns.push(cdict)
    // log('__________________Z noun C ', cdict, nfls.length)

    let zending = plain(nest.zgen).replace(/ος$/, '')
    let reztype = new RegExp(nest.ztype + '$')
    let zstem = stem.replace(reztype, '')
    zstem = [zstem, zending].join('')
    let zdict = {pos: 'noun', rdict: nest.rdict, dict: nest.dict, stem: zstem}
    if (nest.aug) zdict.aug = nest.aug
    zdict.var = {}
    zdict.gends = []

    entry.dialects.forEach(dia=> {
        parseDialect(zdict, dia, zstem, zstype)
    }) // dia

    cdict.pos = 'noun'
    zdict.name = true
    zdict.trns = entry.trns
    zdict.zero = true
    nouns.push(zdict)

    parseIrregZ(entry, nest)
    // log('__________________Z noun Z ', zdict, nfls.length)
}

function parseIrreg(entry) {
    // log('____IRREG', entry.rdict)
    let irregs = []
    let irforms = []
    for (let dia of entry.dialects) {
        if (!dia.forms) {
            // log('_XXXXXX_NO_DIA.FORMS', entry)
            let irreg = {name: true, indecl: true, rdict: entry.rdict, dict: entry.dict} // == , trns: entry.trns
            irreg.pos = 'noun'
            irreg.trns = entry.trns
            irregs.push(irreg)
            dia.forms = []
        }
        irforms.push(...dia.forms)
    }
    let irregrps = _.groupBy(irforms, 'wf')
    // log('_irregrps', irregrps)
    for (let cwf in irregrps) {
        let fls = []
        let cwfgrps = irregrps[cwf]
        for (let form of cwfgrps) {
            let iflex = {name: true, irreg: true, number: form.num, case: form.case, gend: form.gend}
            fls.push(iflex)
        }
        let jsons = fls.map(flex=> JSON.stringify(flex))
        jsons = _.uniq(jsons)
        fls = jsons.map(flex=> JSON.parse(flex))

        let morphs = prettyName(fls)
        let irreg = {name: true, irreg: true, rdict: entry.rdict, dict: cwf, morphs} // == , trns: entry.trns
        // if (nest.aug) irreg.aug = dialect.aug
        irreg.pos = 'noun'
        irreg.trns = entry.trns
        irregs.push(irreg)
    }
    // log('_IRRRR', irregs.slice(0,4))
    // log('_IRRRR', entry.rdict, irregs.length)
    irnouns.push(...irregs)
}

function parseIrregZ(entry, nest) {
    // log('____IRREG_____________________', entry)
    let irregs = []
    let irforms = []
    for (let dia of entry.dialects) {
        irforms.push(...dia.forms)
    }
    let irregrps = _.groupBy(irforms, 'wf')

    let zending = plain(nest.zgen).replace(/ος$/, '')
    let zstem = [nest.stem.slice(0, -1), , zending].join('')


    for (let cwf in irregrps) {
        if (cwf != entry.dict) continue
        let fls = []
        let cwfgrps = irregrps[cwf]
        for (let form of cwfgrps) {
            let iflex = {name: true, number: form.num, case: form.case, gend: form.gend}
            fls.push(iflex)
        }
        let jsons = fls.map(flex=> JSON.stringify(flex))
        jsons = _.uniq(jsons)
        fls = jsons.map(flex=> JSON.parse(flex))

        let morphs = prettyName(fls)
        let irreg = {name: true, indecl: true, rdict: entry.rdict, dict: cwf, stem: zstem, morphs} // == , trns: entry.trns
        // if (nest.aug) irreg.aug = dialect.aug
        irreg.trns = entry.trns
        irreg.zero = true
        irregs.push(irreg)
    }
    // log('_IRRRR', irregs.slice(0,4))
    // log('_IRRRR', entry.rdict, irregs.length)
    irnouns.push(...irregs)
}
