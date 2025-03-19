//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain} from 'orthos'
import { cleanLongShort, termByStem, cleanStr, getStress, guessPrefix, parseCon, parseAug } from '../../dictutils/index.js'
const currentdir = process.cwd()

// ἀπάγω.js
let adjs = []
let iradjs = []
let afls = []

// ἄβρωτος


export async function wktAdj(nests, adjPath, only) {
    let fns = fse.readdirSync(adjPath)
    for await (let fname of fns) {
        let test = plain(comb(fname))
        if (only && !only.test(test)) continue

        let wfpath = path.resolve(adjPath, fname)
        let entry = fse.readJsonSync(wfpath)

        // log('_ENTRY')
        if (entry.empty) continue
        // log('_ENTRY', entry)

        let nest = nests.find(nest=> nest.dict == entry.dict && nest.pos == 'adj')
        // log('_nest', nest)
        if (nest) parseAdjective(entry, nest)
        else parseIrreg(entry)

    }

    let jsons = afls.map(flex=> JSON.stringify(flex))
    jsons = _.uniq(jsons)
    afls = jsons.map(flex=> JSON.parse(flex))

    return {adjs, iradjs, afls}
}

export function parseAdjective(entry, nest) {
    // let cdict = {pos: nest.pos, rdict: nest.rdict, dict: nest.dict, stem: nest.stem, astem: nest.astem}
    // if (nest.compound) cdict.compound = nest.compound
    // if (nest.prefix) cdict.prefix = nest.prefix

    let cdict = nest
    if (nest.prefix) cdict.prefix = nest.prefix
    else if (!nest.prefix) cdict.aug = nest.aug
    cdict.ckeys = []
    delete cdict.stypes
    // cdict.adj = true // adjectives - vars.size - кратно трем

    // examples = ἄκων
    // м.б. случай, когда в BLL один morph и один stype, а в WKT два или больше диалекта
    entry.dialects.forEach((dia, idx)=> {
        let diafls = []

        let rform = dia.forms[0].wf
        let prform = plain(comb(rform))

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

        for (let form of dia.forms) {
            let wf = cleanStr(form.wf)        // ήτε͜ω
            let cwf = comb(wf)
            let term = termByStem(cwf, cdict.stem)

            if (!term) {
                log('_NO TERM FOR FLEX ADJ _rdict:', cdict.rdict, '_stem:', dia.stem, '_form:', form)
                cdict.bad = true
                cdict.noterm = true
                // throw new Error()
            }

            let {stress, stressidx} = getStress(cwf)
            let flex = ''
            if (form.adverb || form.adv) {
                flex = { name: true, term, stress, stressidx} // , syllables, firststem
                flex.adverb = true
                if (form.compar) flex.atype = 'compar'
                else if (form.super) flex.atype = 'super'
                else if (form.atype == 'superlative') flex.atype = 'super'
                else if (form.atype == 'comparative') flex.atype = 'compar'
                else flex.atype = ''
                // log('_______flex_adverb', flex)
            } else {
                if (!form.gend) form.gend = dia.gends[0] // тут нужно вызывать makeAdj, а это хак.
                flex = { name: true, term, number: form.num, case: form.case, gend: form.gend, stress, stressidx} // , syllables, firststem
            }

            if (!stress) {
                flex.bad = true
                cdict.bad = true
                cdict.nostress = true
            }

            if (flex.bad) continue
            diafls.push(flex)
        } // forms

        let advfls = diafls.filter(flex=> flex.adverb) // ἀγαθός, κακός
        let adjfls = diafls.filter(flex=> !flex.adverb)
        // log('_adj fls_________________________________ADJ', adjfls.length)
        // log('_adjfls_________________________________ADJ', adjfls)
        // log('_adv fls____________________________________ADV', advfls)

        let cleanfls = []
        let gendgdoups = _.groupBy(adjfls, 'gend')

        let nom = ''
        let gen = ''
        let stype3 = []
        for (let gend in gendgdoups) {
            if (gend == 'undefined') {
                log('_BAD GEND ADJ', rdict, dia)
                // throw new Error()
            }
            let gendfls = gendgdoups[gend]

            let varkey = gendfls.map(flex=> {
                // return flex.term // путается ударение, θραῦστᾰ - θραύστᾱ
                return [flex.term, flex.stress, flex.stressidx].join('.')
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
            stype3.push(nom)

            let diakey = {stype, gend, keys: [varkey]} //
            if (dia.prefix) diakey.con = parseCon(prform, cdict.stem), diakey.prefix = dia.prefix
            else diakey.aug = parseAug(prform)

            cdict.ckeys.push(diakey)

            for (let flex of gendfls) {
                let cflex = _.clone(flex)
                cflex.key = varkey
                cflex.stype = stype
                cleanfls.push(cflex)
            }
        } // gend

        cdict.stype = stype3.join('-')

        let advkey = advfls.map(flex=> {
            return flex.term
        }).join('-')

        let diadvkey = {adverb: true, keys: [advkey]} // , stype: advkey - в наречиях нет gend ,
        if (dia.prefix) diadvkey.con = parseCon(prform, cdict.stem), diadvkey.prefix = dia.prefix
        else diadvkey.aug = parseAug(prform)

        cdict.ckeys.push(diadvkey)

        for (let flex of advfls) {
            let cflex = _.clone(flex)
            cflex.key = advkey
            cleanfls.push(cflex)
            // log('_adv flex', cflex)
        }

        let jsons = cleanfls.map(flex=> JSON.stringify(flex))
        jsons = _.uniq(jsons)
        cleanfls = jsons.map(flex=> JSON.parse(flex))

        afls.push(...cleanfls)
    }) // dia

    cdict.pos = 'adj'
    cdict.name = true
    // cdict.adj = true
    cdict.trns = entry.trns
    adjs.push(cdict)
}

function parseIrreg(entry) {
    // log('____IRREG', entry.rdict)
    let irregs = []
    let irforms = []
    for (let dia of entry.dialects) {
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

        let indecl = {name: true, irreg: true, rdict: entry.rdict, dict: cwf, fls, trns: entry.trns}
        irregs.push(indecl)
    }
    // log('_IRRRR', irregs.slice(0,4))
    // log('_IRRRR', entry.rdict, irregs.length)
    iradjs.push(...irregs)
}
