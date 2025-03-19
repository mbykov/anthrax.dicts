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
    log('_ONLY_DVR', only)
    only = only.replace(/-/g, '')
    only = plain(comb(only))
}

let reonly = new RegExp('^' + only)

/*
  читает cdict DVR и nests и создает DB с переводами
  после добавления makeDvr в nest все stemmed формы д.б. в nests
  а в indecl пойдут только формы, честно не имеющие stem, stype и проч.
 */

// let dirPath = path.resolve(currentdir, '../../anthrax.data/dvr')
let dvrPath = './results/cdicts_dvr.js'
let idvrPath = './results/indecls_dvr.js'
let nestPath = './results/nests.js'
// log('_dvrPath', dvrPath)

nestDvr()

async function nestDvr() {
    let dvrs = fse.readJsonSync(dvrPath)
    let idvrs = fse.readJsonSync(idvrPath)
    let nests = fse.readJsonSync(nestPath)
    log('_before_dvrs', dvrs.length)
    log('_nests', nests.length)
    // log('___________________________BEFORE', dvrs[100])
    // let wwwww = idvrs.find(cdict=> cdict.dict == comb('ἵνα')) // βάλλω ; ἄρα
    // log('_WWWW', wwwww)

    let docs = []
    let regs = []
    let indecls = []

    for (let dvr of dvrs) {
        if (only && only != plain(comb(dvr.rdict))) continue

        let nest = nests.find(nest=> nest.dict == dvr.dict && nest.pos == dvr.pos)

        // log('___________________________NEST', nest, dvr)

        if (!dvr.pos) log('_no_pos_dvr', dvr.rdict)

        if (nest) {
            dvr.stype = nest.stype
            dvr.stem = nest.stem
            if (nest.aug) dvr.aug = nest.aug
            else if (nest.prefix) dvr.prefix = nest.prefix
        } else {
            // log('_??????????????? no nest', dvr.rdict)
            indecls.push(dvr) // это поправить - ἀΐστωρ все на ἀΐ
            continue
            // delete dvr.marpha
            // delete dvr.marphas
            // dvr.stype = dvr.stype.join('')
            // indecls.push(dvr)
            // let rstr = [dvr.rdict, dvr.testrow].join(' - ')
        }

        delete dvr.astem
        delete dvr.marpha
        delete dvr.marphas
        delete dvr.testrow
        docs.push(dvr)
    }

    for (let idvr of idvrs) {
        if (only && only != plain(comb(idvr.rdict))) continue

        if (!idvr.pos) log('_no_pos_indecl_dvr', idvr.rdict)

        delete idvr.testrow
        indecls.push(idvr)
    }

    if (only) log('_docs', docs)
    log('_docs', docs.length)

    if (true) {
        let iddocs = createIdDocs(docs)
        log('_iddocs', iddocs.length)

        // let xxx = iddocs.find(gdict=> gdict._id == comb('ἵνα')) // βάλλω ; ἄρα
        // log('_ARA xxx', xxx)

        let dname = 'dvr'
        await pushDocs(dname, iddocs)

        log('_indecls', indecls.length)
        let idinddocs = createIdIndDocs(indecls)
        log('_idinddocs', idinddocs.length)

        // let yyyy = indecls.find(cdict=> cdict.rdict == 'ἵνα')
        // log('_YYYY', yyyy)

        // let zzz = idinddocs.find(gdict=> gdict._id == comb('ἵνα'))
        // log('_ZZZZ', zzz)

        let idname = 'idvr'
        await pushDocs(idname, idinddocs)
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
