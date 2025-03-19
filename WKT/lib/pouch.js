//
const log = console.log
import PouchDB from 'pouchdb'
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'

const chunksize = 1000
const currentdir = process.cwd()

const dbpath = path.resolve(currentdir, '../../pouch-anthrax')

export async function pushDocs(dname, docs) {
    // log('_pushing to', dbpath)
    // log('_push_dname:', dname, docs.length)
    const dpath = path.resolve(dbpath, dname)
    // log('_POUCH_DB_WKT ', dpath)

    fse.emptyDirSync(dpath)
    const db = new PouchDB(dpath);
    for await (let chunk of _.chunk(docs, chunksize)) {
        /* log('_chunksize:', chunk.length) */
        let pushres = await db.bulkDocs(chunk)
        // log('_res:', pushres.length)

        // let res = await db.allDocs({include_docs: true})
        /* log('_RECIEVED-0', res) */
        // let docs = res.rows.map(row=> row.doc)
        // log('_RECIEVED', dname, docs.length)
    }
}
