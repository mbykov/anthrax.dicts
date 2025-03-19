//

const log = console.log
import _ from 'lodash'

import PouchDB from 'pouchdb'

import path  from 'path'

const chunksize = 1000
const currentdir = process.cwd()

const dpath = path.resolve(currentdir, '../../pouch-anthrax/RGreek')


let keys = ['ἀλήθεια']
    try {
        const db = new PouchDB(dpath);
        let res = await db.allDocs({keys,include_docs: true})
        log('_RECIEVED-0', res)
        let resdocs = res.rows.map(row=> row.doc)
        log('_RECIEVED', resdocs.length)
        log('_DOC', resdocs[0])

        // let info = await db.info();
        // log('_RGreek info:', info)
    } catch (err) {
        console.log(err);
    }
