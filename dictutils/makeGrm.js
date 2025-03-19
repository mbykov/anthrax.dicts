const log = console.log

import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'
import { parseAug, cleanLongShort, cleanStress, arts, termByStem, removeVowelBeg, parseGenByArt, stripAccent, vowels, toConst } from './index.js'
const currentdir = process.cwd()
import Debug from 'debug'

let only = process.argv.slice(2)[0] || ''


let srcPath = path.resolve(currentdir, '../Gramm/gramms.json')
let dstPath = path.resolve(currentdir, './data/cdicts_grm.js')

await makeGrm(srcPath)

async function makeGrm(srcPath) {

    let entries = fse.readJsonSync(srcPath)
    log('_G', entries)
    let cdicts = []
    for (let entry of entries) {
        if (entry.indecl) continue
        
        let astem = entry.dict.replace(entry.type, '')
        let cdict = {rdict: entry.rdict, type: entry.type}
    }

}
