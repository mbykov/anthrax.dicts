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

if (rdict) pushDoc(dname, rdict)
else log('_!!!!!!!!!!! node get.js XXXXX, i.e. ἄ·βλαστος')

export async function pushDoc(dname, rdict) {
    const dpath = path.resolve(dbpath, dname)
    log('_getting_from RGreek ', dpath)

    // fse.emptyDirSync(dpath)
    const db = new PouchDB(dpath);

    if (rdict == 'info') {
        let info = await db.info();
        log('_RGreek info:', info)
        return
    }

    // rdict = cleanStress(rdict)
    // rdict = rdict.replace(/·/g, '')
    // let dict = comb(rdict)

 
    let doc = {
        raw: 'ἅπαξ',
        rdict: 'ἅπαξ',
        dict: 'ἅπαξ',
        adverb: true,
        indecl: true
    }

    try {
        let newdoc = {_id: doc.dict, docs: [doc]}
        let newdocs = [newdoc]
        let pushres = await db.bulkDocs(newdocs)
        log('_PUSH RES', pushres)
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


    if (push) {
        // return
    }
