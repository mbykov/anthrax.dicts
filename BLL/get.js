const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'

const chunksize = 1000
const currentdir = process.cwd()

import PouchDB from 'pouchdb'
const dbpath = path.resolve(currentdir, '../../pouch-anthrax')
const dname = 'RGreek'

import {comb, plain} from 'orthos'
import { cleanStress } from './lib/utils.js'

let rdict = process.argv.slice(2)[0]
log('_ONLY', rdict)

let push = process.argv.slice(3)[0]
log('_PUSH', push)

if (rdict) getDoc(dname, rdict)
else log('_!!!!!!!!!!! node get.js XXXXX, i.e. ἄ·βλαστος')

export async function getDoc(dname, rdict) {
    const dpath = path.resolve(dbpath, dname)
    log('_getting_from RGreek ', dpath)

    // fse.emptyDirSync(dpath)
    const db = new PouchDB(dpath);

    if (rdict == 'info') {
        let info = await db.info();
        log('_RGreek info:', info)
        return
    }

    rdict = cleanStress(rdict)
    rdict = rdict.replace(/·/g, '')
    let dict = comb(rdict)

    try {
        let startkey = dict
        let endkey = dict + '$'
        log('_startkey ====', {startkey, endkey})
        let allres = await db.allDocs({startkey, endkey, include_docs: true})
        log('_alldocs ====================', allres)
        let alldocs = allres.rows.map(row=> row.doc)
        alldocs = _.compact(alldocs)
        log('_alldocs', dname, alldocs.length)
    } catch(err) {
        log('_ID DICT', dict, err.status)
    }

    try {
        // log('_ID DICT', dict)
        let get = await db.get(dict, {include_docs: true})
        log('_GET', get)
    } catch(err) {
        log('_ID DICT', dict, err.status)
    }


}

    // let doc = {
    //     raw: 'ἅπαξ',
    //     rdict: 'ἅπαξ',
    //     dict: 'ἅπαξ',
    //     adverb: true,
    //     indecl: true
    // }

    // if (push) {
    //     let newdoc = {_id: doc.dict, docs: [doc]}
    //     let newdocs = [newdoc]
    //     let pushres = await db.bulkDocs(newdocs)
    //     log('_PUSH RES', pushres)
    //     // return
    // }
