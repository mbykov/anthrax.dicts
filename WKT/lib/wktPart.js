//

const log = console.log
import _ from 'lodash'
import Debug from 'debug'

// import { comb, plain } from 'orthos'
import fse from 'fs-extra'
import path  from 'path'
// import { getGlobalPartFlex } from './utils.js'

import { termByStem, getStress, cleanStr, toConst, commonStem, parseAug } from '../../dictutils/index.js'
import { comb, plain, strip } from 'orthos'

const d = Debug('line')

// const currentdir = process.cwd()
// let nestsPath = path.resolve(currentdir, '../dictutils/data/nests.js')
// let nests = fse.readJsonSync(nestsPath)
// log('_________nestsPath', nests.length)


let skip = false
// let zero = {dicts: [], fls: [], irrs: []}
// const nmbers = ['sg', 'sg', 'sg', 'du', 'du', 'du', 'pl', 'pl', 'pl', ]
// const ngends = ['masc', 'fem', 'neut', 'masc', 'fem', 'neut', 'masc', 'fem', 'neut']

let threegends = ['masc', 'fem', 'neut']

let parts = []
let irparts = []
let pfls = []

// export regular/auto parts lists
// autoparts - не имеющие или не требующие verb


export async function makePartLists(nests, partPath, only) {
    let regparts = []
    let autoparts = []
    let fns = fse.readdirSync(partPath)

    for await (let fname of fns) {
        // regparts - причастия на основе глагола, иначе - отдельные формы
        let test = plain(comb(fname)).toLowerCase()
        if (only && !only.test(test)) continue
        // log('_____FNAME PARTICIPLE', test)

        let wfpath = path.resolve(partPath, fname)
        let entry = fse.readJsonSync(wfpath)

        if (entry.empty) continue
        // log('_ENTRY', entry)

        let trn = entry.trns[0]
        let rverb = trn.split('contracted of')[1] || trn.split('contracted form of')[1] || trn.split('participle of')[1] || trn.split('indicative of')[1]

        // verb mistypes
        if (rverb == 'αἰτίζων') rverb = 'αἰτίζω'

        if (!rverb) {
            autoparts.push(entry)
            continue
        }

        rverb = rverb.trim().split('(')[0].trim()
        if (!rverb) {
            autoparts.push(entry)
            continue
        }

        let nest = nests.find(nest=> nest.dict == comb(rverb) && nest.pos == 'verb')

        if (!nest) {
            autoparts.push(entry)
            continue
        }

        if (entry.rdict == 'καταδύς') {
            autoparts.push(entry) // ============ ошибка BUG у меня в makeNests - rdict: 'καταδύω' !!!!!!!!!!!!
            continue
        }

        regparts.push({entry, nest})
    }

    if (!only) {
        // let regpartlist = regparts.map(part=> part.rdict)
        // let autopartlist = autoparts.map(part=> part.rdict)
        // fse.writeFileSync('./wkt-keys/regparts.js', toConst(regpartlist, 'regparts'))
        // fse.writeFileSync('./wkt-keys/autoparts.js', toConst(autopartlist, 'autoparts'))
    }

    return {regparts, autoparts}
}

// main true part wo verb
export async function wktPart(nests, partPath, only) {
    let {regparts, autoparts} = await makePartLists(nests, partPath, only)
    let truerdicts = autoparts.map(entry=> entry.rdict)
    log('_Regparts parts', regparts.length)
    log('_truerdicts parts', autoparts.length)
    log('_truerdicts', truerdicts)


    // тут клон adj - но там через nest
    // но, если регулярные причастия получат информаци о префиксе из nest, то как быть здесь?
    // здесь, то есть в true-причастиях, пока без префиксов

    for (let entry of autoparts) { // autoparts
        if (only) log('_Entry', entry)

        let cdict = {pos: 'part', rdict: entry.rdict, dict: entry.dict, ckeys: []}

        // let nest = nests.find(nest=> nest.dict == entry.dict && nest.pos == 'adj')
        // ==============================================<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        // здесь обработать целиком, то есть cdict, cdict.ckeys fls и все дела
        // то есть их нужно в nest, а как? - создать список, больше никак
        // отдельно - irregulars
        for (let dia of entry.dialects) {
            let diafls = []
            let wfs = dia.forms.map(form=> form.wf)
            let pwfs = wfs.map(wf=> plain(comb(wf)))
            // dia.prform = pwfs[0]
            dia.stem = commonStem(pwfs)
            if (!dia.stem) {
                dia.irreg = true
                continue
            }
            // log('_DIA', entry.rdict, dia.stem)
            // log('_DIA', pwfs)

            let rform = dia.forms[0].wf
            let prform = plain(comb(rform))
            let aug = parseAug(prform)

            // скопировано из adj
            for (let form of dia.forms) {
                let wf = cleanStr(form.wf)        // ήτε͜ω
                let cwf = comb(wf)
                let term = termByStem(cwf, cdict.stem)

                if (!term) {
                    log('_NO TERM FOR FLEX PART _rdict:', cdict.rdict, '_stem:', dia.stem, '_form:', form)
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
                    // log('_______adverb', flex)
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
            // log('_adjfls_________________________________ADJ', adjfls[10])

            let cleanfls = []
            let gendgdoups = _.groupBy(adjfls, 'gend')
            // let stypes = []
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
                    // stypes.push(cflex.term)
                }

                let stype = [nom, gen].join('-')
                stype3.push(nom)

                let diakey = {stype, gend, keys: [varkey], aug}
                cdict.ckeys.push(diakey)

                for (let flex of gendfls) {
                    let cflex = _.clone(flex)
                    cflex.key = varkey
                    cflex.stype = stype
                    cleanfls.push(cflex)
                }
            } // gend

            cdict.stype3 = stype3.join('-')

            // log('_adv fls___ADV TRUE', cdict.rdict, advfls)
            let advkey = advfls.map(flex=> {
                return flex.term
            }).join('-')

            // что тут stype? пока что advkey
            let diadvkey = {adverb: true, stype: advkey, keys: [advkey], aug}
            cdict.ckeys.push(diadvkey)

            // truepart
            for (let flex of advfls) {
                let cflex = _.clone(flex)
                cflex.adverb = true // TODO: убрать
                cflex.stype = advkey
                cflex.key = advkey
                cleanfls.push(cflex)
                // log('_adv flex', cflex)
            }

            let jsons = cleanfls.map(flex=> JSON.stringify(flex))
            jsons = _.uniq(jsons)
            cleanfls = jsons.map(flex=> JSON.parse(flex))

            pfls.push(...cleanfls)
        } // dia truepart

        cdict.pos = 'part'
        cdict.name = true
        // cdict.adj = true
        cdict.trns = entry.trns
        parts.push(cdict)
    }

    let jsons = pfls.map(flex=> JSON.stringify(flex))
    jsons = _.uniq(jsons)
    pfls = jsons.map(flex=> JSON.parse(flex))


    if (only) log('_part_cdict', parts)
    // if (only) log('_part_cdict', parts[0].ckeys)
    return {parts, irparts, pfls}
} //autoparts


// by verbs
export function makePart(entry, stem) {
    // function parsePart(entry, nest) {
    // let stem = nest.stem
    let pfls = []

    for (let dia of entry.dialects) {
        // log('_part_entry.dia.dialect', entry.rdict, stem, dia.dialect)
        let pdict = plain(entry.dict)
        let parts = pdict.split(stem)
        if (parts.length == 1) parts = pdict.split(stem)
        let type = parts[parts.length-1]
        dia.type = type
        dia.stem = stem
        let rform = dia.forms[0].wf

        let restem = new RegExp(stem)
        if (!restem.test(pdict)) {
            log('_n_stem', nest.rdict, stem, entry.rdict, nest.prefix)
        }

        // log('_XXXXXXXXXXXX', rform, stem)
        dia.type = termByStem(comb(rform), stem)
        let diafls = parseDictFlsDia(entry, stem, dia)
        pfls.push(...diafls)
    }

    let jsons = pfls.map(flex => JSON.stringify(flex))
    jsons = _.uniq(jsons)
    pfls = jsons.map(json => JSON.parse(json))

    return pfls
}


function parseDictFlsDia(par, stem, dia) {
    let diafls = []
    // log('_THIS STEM', par.rdict, stem)
    for (let form of dia.forms) {
        if (par.rdict == 'συναγαγών') form.wf = form.wf.replace('γογ', 'γαγ') // == ошибка в wiktionary

        let wf = cleanStr(form.wf)        // ήτε͜ω
        let cwf = comb(wf)
        let term = termByStem(cwf, stem)

        if (form.wf == 'διῃτημένος') {
            log('_XXX')
            throw new Error()
        }

        // if (term == 'ίζουσι') {
        //     log('_THIS TERM', par.rdict, form)
        //     throw new Error()
        // }
        // // if (par.rdict == 'συναγαγών') log('_THIS TERM BAD ONTA', par.rdict, form.wf, term) //

        if (!term) {
            log('_NO TERM PARTICIPLE FOR FLEX', par.rdict, stem, form) // πολύς -> πουλύν
            par.bad = true
            par.noterm = true
            throw new Error()
        }

        let {stress, stressidx} = getStress(cwf)
        if (!stress) {
            log('_NO_STRESS', par.rdict, form)
            // throw new Error()
            continue
        }

        let numcase = [form.num, form.case].join('.')
        let flex = {}
        let atype = ''
        if (form.adverb && form.compar) atype = 'compar'
        if (form.adverb && form.super) atype = 'super'

        if (form.adverb) flex = { part: true, adverb: true, type: dia.type, term, stress, stressidx, atype}
        else flex = { part: true, term, number: form.num, case: form.case, gend: form.gend, stress, stressidx} // , numcase, type: dia.type

        // if (flex.adverb) log('_ADV FLEX', flex)
         diafls.push(flex)
    } // forms

    // let wfs = dia.forms.map(form=> form.wf)
    // log('_PART_wfs_xxxx', par.rdict, wfs)

    let advs = diafls.filter(flex=> flex.adverb) // ἀγαθός, κακός
    let adjfls = diafls.filter(flex=> !flex.adverb)

    // let cleanfls = []
    let gendgdoups = _.groupBy(adjfls, 'gend')
    // let stypes = []
    let nom = ''
    let gen = ''
    let stype3key = []

    for (let gend in gendgdoups) {
        // log('___________________GEND', gend)
        if (gend == 'undefined') {
            log('_BAD GEND ADJ', rdict, dia)
            // throw new Error()
        }
        let gendfls = gendgdoups[gend]
        let gendkey = gendfls.map(flex=> {
            // let numcase = [flex.number, flex.case].join('.')
            // return [numcase, flex.term].join(':')
            return flex.term
        }).join('-') // ';'
        // let verbkey = group.map(flex=> [flex.numper, flex.term].join(':')).join(';')

        for (let cflex of gendfls) {
            if (cflex.number != dia.numbers[0]) continue
            if (cflex.case != 'gen') continue
            if (!gen) gen = cflex.term // берем только первый, потому что м.б. редкие варианты, ος-ος-ον-οο, нужен ος-ος-ον-ου ; он же будет masc
        }

        for (let cflex of gendfls) {
            if (cflex.number != dia.numbers[0]) continue
            if (cflex.case != 'nom') continue
            nom = cflex.term
            stype3key.push(cflex.term)
            // stypes.push(cflex.term)
        }

        let stype = [nom, gen].join('-')
        // log('_____________________________________________________F', gend, nom, gen, stype, gendfls.length)
        for (let flex of gendfls) {
            // let cflex = _.clone(flex)
            flex.key = gendkey
            // cflex.gen = gen /// <<<<<<<<<<<<<<<<<<<<<<<
            flex.stype = stype
            // cleanfls.push(flex)
        }
    } // gend

    stype3key = stype3key.join('-')
    // log('_ADVS', par.rdict, advs)

    let advkey = advs.map(flex=> {
        return flex.term
    }).join('-')

    for (let flex of advs) {
        flex.adverb = true // TODO: убрать
        flex.key = advkey
        flex.stype = advkey // 'adverb' // stype3key
        flex.stype3 = stype3key
    }

    for (let flex of diafls) {
        flex.stype3 = stype3key
    }

    // log('___________________F_advkey', advkey)
    let flsterms = diafls.map(flex=> flex.term)
    // log('_PART_flsterms', par.rdict, flsterms)

    return diafls
}

export function makePartIrreg(file) {
    let pirrs = []
    for (let dia of file.dialects) {
        // log('_P FORM', dia.forms[0])
        let irregrps = _.groupBy(dia.forms, 'wf')
        for (let term in irregrps) {
            let termgrps = irregrps[term]
            let termfls = []
            for (let form of termgrps) {
                let pflex = {verb: true, part: true, number: form.num, case: form.case, gend: form.gend}
                termfls.push(pflex)
            }
            let jsons = termfls.map(flex=> JSON.stringify(flex))
            jsons = _.uniq(jsons)
            termfls = jsons.map(flex=> JSON.parse(flex))
            let irreg = {verb: true, part: true, irreg: true, rdict: file.rdict, dict: term, fls: termfls, trns: file.trns}
            pirrs.push(irreg)
        }
    }
    return pirrs
}
