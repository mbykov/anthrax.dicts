//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'

const currentdir = process.cwd()

// ========= объединяет все словари в один, со всеми атрибутами
// == workflow:
// == все словари - makeWKT, makeBailly, - в каждой записи astem

// let dirPath = path.resolve(currentdir, '../Nests')
let wktPath = path.resolve(currentdir, './results/cdicts_wkt.js')
let lsjPath = path.resolve(currentdir, './results/cdicts_lsj.js')
let dvrPath = path.resolve(currentdir, './results/cdicts_dvr.js')
// let bllPath = path.resolve(currentdir, './data/cdicts_bailly.js')
let grmPath = path.resolve(currentdir, '../Gramm/cdicts_grm.json')

// bll - ἀλέκτωρ - два слова, различие в gend
// ========== итого: в каждом pos - единственный rdict, ===== иначе слишком сложно


makeUniqDicts()

// уникальные dict + pos, то есть в в каждой части речи dict учитывается один раз
// можно определить, что стем для этого dict образует несколько частей речи. То есть можно выбрать лучший стем - потом

export function makeUniqDicts() {
    // let blls = fse.readJsonSync(bllPath)
    let wkts = fse.readJsonSync(wktPath)
    let lsjs = fse.readJsonSync(lsjPath)
    let dvrs = fse.readJsonSync(dvrPath)
    let grms = fse.readJsonSync(grmPath)
    grms = grms.filter(cdict=> cdict.type)
    let cgrms = []

    for (let cdict of grms) {
        if (!cdict.type) continue
        let retype = new RegExp(cdict.type + '$')
        cdict.astem = plain(cdict.dict.replace(retype, ''))
        // if (cdict.rdict == 'ἀδιαβίβαστος') log('_===================================================== ADIAB', cdict)
        cgrms.push(cdict)
    }

    // log('_blls', blls.length)
    log('_wkts', wkts.length)
    log('_lsjs', lsjs.length)
    log('_dvrs', dvrs.length)
    log('_grms', grms.length)

    // uniqs - только для вычисления частот
    let udicts = []
    let uniqDictKey = {}

    for (let cdict of wkts) {
        let ukey = [cdict.rdict, cdict.pos].join('-')
        if (uniqDictKey[ukey]) continue
        uniqDictKey[ukey] = true
        // cdict.byWkt = true // определяю в wkt.js
        cdict.dname = 'wkt'
        udicts.push(cdict)
    }

    for (let cdict of lsjs) {
        // это не вполне верно из-за ἀλέκτωρ. Там два разных стема, и второй будет отброшен
        if (!cdict.rdict || !cdict.pos) log('_no_pos_lsj', cdict.rdict)
        let ukey = [cdict.rdict, cdict.pos].join('-')
        if (uniqDictKey[ukey]) continue
        uniqDictKey[ukey] = true
        cdict.dname = 'lsj'
        udicts.push(cdict)
    }

    for (let cdict of cgrms) {
        if (!cdict.rdict || !cdict.pos) log('_no_pos_grm', cdict.rdict)
        let ukey = [cdict.rdict, cdict.pos].join('-')
        if (uniqDictKey[ukey]) continue
        uniqDictKey[ukey] = true
        cdict.dname = 'grm'
        udicts.push(cdict)
    }

    for (let cdict of dvrs) {
        let ukey = [cdict.rdict, cdict.pos].join('-')
        if (uniqDictKey[ukey]) continue
        uniqDictKey[ukey] = true
        cdict.dname = 'dvr'
        udicts.push(cdict)
    }

    // частота astems - из разных dict
    let astemFreqs = {}

    for (let cdict of udicts) {
        delete cdict.trns
        if (!astemFreqs[cdict.astem]) astemFreqs[cdict.astem] = 0
        astemFreqs[cdict.astem] += 1
    }
    // 'ἀγαθηϊ': 1, -------------------------------- 0308 на конце, что это?
    // log('_stemFreqs', stemFreqs)

    fse.writeFileSync('./results/uniqdicts.js', JSON.stringify(udicts, null, 8))
    fse.writeFileSync('./results/astemFreqs.js', JSON.stringify(astemFreqs, null, 8))

    log('\n_results/udicts.js', udicts.length)
}
