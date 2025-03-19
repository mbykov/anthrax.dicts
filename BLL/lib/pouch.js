//
const log = console.log
import PouchDB from 'pouchdb'
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'

const chunksize = 1000
const currentdir = process.cwd()

const dbpath = path.resolve(currentdir, '../../pouch-anthrax')

/*
  беру новый чанк, смотрю keys:_ids, забираю.
  если есть, ок, нет - сохраняю с новыми _ids
  плохо, что нужно сначала повторить wkt?
 */

// BUG BUG: ἀγαθοκλῆςῆς ; ἀγαθαρχίςίς



export async function pushDocs(dname, baillydocs) {
    log('_pushing to', dbpath)
    log('_push_dname:', dname, baillydocs.length)
    const dpath = path.resolve(dbpath, dname)
    log('_DB_RGreek ', dpath)

    // fse.emptyDirSync(dpath)
    const db = new PouchDB(dpath);
    let info = await db.info();
    log('_RGreek info до закачки:', info)


    let rdict = {}
    baillydocs.forEach(dict => {
        if (!rdict[dict.dict]) rdict[dict.dict] = {_id: dict.dict, docs: []}
        dict.dname = 'bailly'
        // delete dict.trns
        rdict[dict.dict].docs.push(dict)
    })

    // log('_RDICT', rdict)
    let iddicts = _.values(rdict)


    for await (let chunk of _.chunk(iddicts, chunksize)) {
        let keys = chunk.map(doc=> doc._id)
        // log('_keys', keys.slice(0,10))
        // log('_keys', keys.length)
        // log('_baillydocs', baillydocs.slice(0,1))

        let newdocs = []
        try {
            // let oldres = await db.allDocs({keys, include_docs: true})
            let oldres = await db.allDocs({keys, include_docs: true})
            let olddocs = oldres.rows.map(row=> row.doc)
            // log('_RECIEVED', dname, olddocs.length)
            olddocs = _.compact(olddocs)
            // log('_OLD DOCS', olddocs.slice(0,2))
            // log('_OLD DOCS', olddocs.length)
            // log('_OLD DOC.docs', olddocs[1].docs)

            for (let bdoc of chunk) {
                let old = olddocs.find(olddoc=> olddoc._id == bdoc._id)
                if (!old) newdocs.push(bdoc)
            }

            // log('_newdocs:', newdocs.slice(0,2))
            let pushres = await db.bulkDocs(newdocs)
            // log('_pushres:', pushres.length)
            // log('_pushres:', pushres.slice(0,2))


        } catch (err) {
            console.log(err);
        }

        // let pushres = await db.bulkDocs(chunk)

        // let res = await db.allDocs({include_docs: true})
        // log('_RECIEVED-0', res)
        // let docs = res.rows.map(row=> row.doc)
        // log('_RECIEVED', dname, docs.length)
    }
    info = await db.info();
    log('_RGreek info до закачки:', info)
}
