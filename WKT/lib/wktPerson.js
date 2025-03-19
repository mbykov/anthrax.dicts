//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain} from 'orthos'

import { cleanLongShort, termByStem, cleanStr, getStress, guessPrefix, parseCon, parseAug } from '../../dictutils/index.js'
import { prettyName } from "@mbykov/anthrax/utils"

const currentdir = process.cwd()

// ἀπάγω.js
let nouns = []
let irnouns = []
let nfls = []

// копия wktNoun
//

export async function wktPerson(nests, nounPath, only) {
    let fns = fse.readdirSync(nounPath)
    for await (let fname of fns) {
        let test = plain(comb(fname)).toLowerCase()
        if (only && !only.test(test)) continue
        // log('_____FNAME PERSON', test)

        let wfpath = path.resolve(nounPath, fname)
        let entry = fse.readJsonSync(wfpath)

        if (entry.empty || !entry.dialects) {
            parseIrreg(entry)
            continue
        }
        // log('_ENTRY', entry)

        entry.dialects.forEach(dia=> {
            if (!dia.forms || !dia.forms.length) {
                entry.irreg = true
            }
        })

        if (entry.irreg) {
            parseIrreg(entry)
            continue
        }
        // Λυκάων
        if (entry.rdict[0] == entry.rdict[0].toUpperCase()) {
            let upper = entry.rdict[0]
            let lower = upper.toLowerCase()
            let reupper = new RegExp('^' + upper)
            // entry.rdict = entry.rdict.replace(reupper, lower)
            // entry.lowered = true
        }

        let nest = nests.find(nest=> nest.rdict == entry.rdict && nest.dict == entry.dict && nest.pos == 'noun')
        if (nest) parseNoun(entry, nest)
        else parseIrreg(entry)
    }


    let jsons = nfls.map(flex=> JSON.stringify(flex))
    jsons = _.uniq(jsons)
    nfls = jsons.map(flex=> JSON.parse(flex))

    log('_persons', irnouns.length)
    // return {nouns:[], irnouns:[], nfls:[]}
    return {persons: nouns, irpers: irnouns, perfls: nfls}
}

function parseNoun(entry, nest) {
    // log('_parseNoun_entry', entry)
    // log('_nest parseNoun', nest)
    nest.ckeys = []
    // nest.gends = []
    nest.name = true
    nest.trns = entry.trns

    let cdict = _.clone(nest)

    entry.dialects.forEach(dia=> {
        parseDialect(cdict, dia, cdict.stem)
    })

    if (nest.prefix) cdict.prefix = nest.prefix
    else if (!nest.prefix) cdict.aug = nest.aug
    nouns.push(cdict)

    if (!nest.zero) return
    // delete cdict.zero

    nest.ckeys = []
    // nest.gends = []
    let zdict = _.clone(nest)

    zdict.stem = nest.zstem

    entry.dialects.forEach(dia=> {
        parseDialect(zdict, dia)
    })

    if (nest.prefix) zdict.prefix = true
    else if (nest.aug) zdict.aug = true
    nouns.push(zdict)
}

function parseDialect(cdict, dia) {
    let diafls = []

    let diarform = dia.forms[0].wf
    let prform = plain(comb(diarform))

    if (prform[0] == 'ϝ') return [] // οἶκος, digamma, дигамма, orthos - bug, не определяет orhos.plain

    let prefix
    if (cdict.prefix) {
        prefix = guessPrefix(prform, cdict.prefix.psize)
    }

    if (prefix) {
        // reprefix = new RegExp('^' + prefix.pfc)
        dia.prefix = _.clone(prefix)
    } else {
        let aug = parseAug(prform)
        dia.aug = aug
        // reprefix = new RegExp('^' + aug)
    }

    // let {stressidx, stress} = getStress(cdict.dict)
    // let rstress = stress
    // cdict.rstress = rstress // различить γλῶττα / φάττα - разные ударения
    // cdict.rstressidx = stressidx

    for (let form of dia.forms) {
        let wf = form.wf
        wf = cleanLongShort(wf)
        let cwf = comb(wf)
        let term = termByStem(cwf, cdict.stem)
        // log('_yyyyyyyyyyyyyy', wf, cdict.stem, term)

        if (term == plain(cwf)) continue
        let {stress, stressidx} = getStress(cwf)
        let flex = { name: true, term, number: form.num, case: form.case, gend: form.gend, stress, stressidx} // , syllables, rstress
        // log('_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx flex', flex.number, flex.case, flex.term)
        // cdict.gends.push(flex.gend)
        diafls.push(flex)
    } // forms

    // cdict.gends = _.uniq(cdict.gends)

    let cleanflex = []
    let gendgdoups = _.groupBy(diafls, 'gend')
    for (let gend in gendgdoups) {
        let gendfls = gendgdoups[gend]

        let gen = ''
        // let nom = ''
        let varkey = gendfls.map(flex=> {
            // return flex.term // путается ударение, θραῦστᾰ - θραύστᾱ
            return [flex.term, flex.stress, flex.stressidx].join('.')
        }).join('-')

        for (let cflex of gendfls) {
            if (cflex.number != dia.numbers[0]) continue
            if (cflex.case != 'gen') continue
            if (!gen) gen = cflex.term // берем только первый, потому что м.б. редкие варианты, ος-ος-ον-οο, нужен ος-ος-ον-ου ; он же будет masc
        }

        // for (let cflex of gendfls) {
        //     if (cflex.number != dia.numbers[0]) continue
        //     if (cflex.case != 'nom') continue
        //     nom = cflex.term
        // }

        let stype = [cdict.type, gen].join('-') // в zero нет nom, беру nest.type всегда

        let diakey = {stype, gend, keys: [varkey]} //, key: varkey
        // log('_noun diakey', diakey)
        if (dia.prefix) diakey.con = parseCon(prform, cdict.stem), diakey.prefix = dia.prefix
        else diakey.aug = parseAug(prform)

        cdict.ckeys.push(diakey)
        // log('_DK', diakey)

        for (let cflex of gendfls) {
            let flex = _.clone(cflex)
            flex.key = varkey
            flex.stype = stype
            cleanflex.push(flex)
        }
    } // gend

    // cdict.gends = _.uniq(cdict.gends)
    // ударение уже на первом слоге, в вокативе ему некуда отпрыгнуть // ἔτης, ошибка в τεχνίτης wf: τέχνιτα
    // let xxx = cleanflex.find(f=> f.term =='α' && f.case == 'voc' && f.stressidx == 3 && f.stress == 'oxia' && f.key == 'ης-α-αι-ου-αιν-ῶν-ῃ-αιν-αις-ην-α-ας-α-α-αι')
    // if (xxx) log('_XXXXXXXXXX', cdict.rdict)

    nfls.push(...cleanflex)
}

function makeIndCdict(entry) {
    let indecl = {name: true, indecl: true, rdict: entry.rdict, dict: comb(entry.dict)} // == , trns: entry.trns
    indecl.pos = 'noun'
    indecl.trns = entry.trns
    return indecl
}

function parseIrreg(entry) {
    let irregs = []

    if (!entry.dialects) {
        let indecl = makeIndCdict(entry)
        irregs.push(indecl)
        return
    }

    if (!entry.dialects[0].forms) {
        let indecl = makeIndCdict(entry)
        irregs.push(indecl)
        return
    }

    let irforms = []
    for (let dia of entry.dialects) {
        irforms.push(...dia.forms)
    }

    let irregrps = _.groupBy(irforms, 'wf')
    // log('_irregrps', irregrps)
    for (let wf in irregrps) {
        let fls = []
        let cwfgrps = irregrps[wf]
        for (let form of cwfgrps) {
            let iflex = {name: true, irreg: true, number: form.num, case: form.case, gend: form.gend}
            fls.push(iflex)
        }
        let jsons = fls.map(flex=> JSON.stringify(flex))
        jsons = _.uniq(jsons)
        fls = jsons.map(flex=> JSON.parse(flex))

        let cwf = comb(wf)
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
