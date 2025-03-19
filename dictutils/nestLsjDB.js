//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'
import { parseAug, cleanLongShort, cleanStress, arts, termByStem, removeVowelBeg, parseGenByArt, adj23Type, pushDocs } from './index.js'
const currentdir = process.cwd()

import PouchDB from 'pouchdb'

let only = process.argv.slice(2)[0] || ''
let push

if (only == 'push') only = false, push = true

if (only) {
    log('_ONLY_LSJ', only)
    only = only.replace(/-/g, '')
    only = plain(comb(only))
}

let reonly = new RegExp('^' + only)

/*
  читает cdict LSJ и nests и создает DB с переводами
  после добавления makeLsj в nest все stemmed формы д.б. в nests
  а в indecl пойдут только формы, честно не имеющие stem, stype и проч. Пока
  как-то indecls
 */

let nestPath = './results/nests.js'
let lsjPath = './results/cdicts_lsj.js'

nestLsj()

// ========================= стоп тут нет trns

async function nestLsj() {
    let lsjs = fse.readJsonSync(lsjPath)
    let indecls = []
    let nests = fse.readJsonSync(nestPath)
    log('_lsjs', lsjs.length)
    log('_nests', nests.length)

    let docs = []
    let regs = []
    let no_nests = [] // to file

    for (let lsj of lsjs) {
        if (only && only != plain(comb(lsj.rdict))) continue

        let nest = nests.find(nest=> nest.dict == lsj.dict && nest.pos == lsj.pos)
        // log('___________________________NEST', nest)

        if (!lsj.pos) log('_no_pos_lsj', lsj.rdict)

        if (nest) {
            lsj.stype = nest.stype
            lsj.stem = nest.stem
            if (nest.aug) lsj.aug = nest.aug
            else if (nest.prefix) lsj.prefix = nest.prefix
        } else {
            // lsj.stype = lsj.stype.join('-')
            indecls.push(lsj)
            let rstr = [lsj.rdict, lsj.testrow].join(' - ')
            no_nests.push(rstr)
        }

        docs.push(lsj)
    }

    for (let doc of docs) {
        // delete doc.astem
        // delete doc.marpha
        // delete doc.marphas
        // delete doc.testrow
    }

    if (only) log('_docs', docs)
    log('_docs', docs.length)

    if (!only) {
        let iddocs = createIdDocs(docs)
        log('_iddocs', iddocs.length)

        // let xxx = iddocs.find(gdict=> gdict._id == comb('χόρτος')) // βάλλω ; λύκη
        // log('_XXX xxx', xxx)

        let dname = 'lsj'
        await pushDocs(dname, iddocs)

        let idinddocs = createIdIndDocs(indecls)
        log('_idinddocs', idinddocs.length)

        let idname = 'ilsj'
        await pushDocs(idname, idinddocs)

        fse.writeFileSync('tmp/lsj_no_nests.js', JSON.stringify(no_nests, null, 8))
    }
}

function createIdDocs(docs) {
    let gdict = {}
    docs.forEach(cdict => {
        if (!gdict[cdict.dict]) gdict[cdict.dict] = {_id: cdict.dict, docs: []}
        gdict[cdict.dict].docs.push(cdict)
    })

    let iddocs = _.values(gdict)
    return iddocs
}

function createIdIndDocs(indecls) {
    let gdict = {}
    indecls.forEach(cdict => {
        if (!gdict[cdict.dict]) gdict[cdict.dict] = {_id: cdict.dict, docs: []}
        gdict[cdict.dict].docs.push(cdict)
    })

    let iddocs = _.values(gdict)
    return iddocs
}
