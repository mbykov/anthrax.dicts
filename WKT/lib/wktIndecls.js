//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain} from 'orthos'
import { cleanLongShort, termByStem, cleanStr, arts, parseNounArt, parseAstem, getStress } from '../../dictutils/index.js'
const currentdir = process.cwd()

let wktDataPath = path.resolve(currentdir, '../../../anthrax.data/wkt/')


// let itypes = ['articles', 'correlatives', 'numerals', 'particles', 'pronouns', 'adverbs', 'conjunctions', 'prepositions', '', '', ]

// TODO: adverbs дб irreg?
let itypes = ['numerals', 'particles', 'conjunctions', 'prepositions', 'adverbs', '', ]

export function wktIndecls(wktDataPath, only) {
    // let itypes = fse.readdirSync(wktDataPath)
    // log('_INDECL TYPES', itypes)
    let indecls = []
    for (let itype of itypes) {
        if (!itype) continue
        let typePath = path.resolve(wktDataPath, itype)
        let typeList = fse.readdirSync(typePath)
        // log('_INDECL_TYPE', itype, typeList.length)

        for (let iname of typeList) {
            if (/᾽.json/.test(iname)) continue

            let test = plain(comb(iname)).toLowerCase()
            if (only && !only.test(test)) continue

            if (/\'\./.test(iname)) continue // apocopic forms
            let entryPath = path.resolve(typePath, iname)
            let entry = fse.readJsonSync(entryPath)
            if (!entry.trns.length) log('_no_trns___', itype, entry.rdict)

            let pos = itype.replace(/s$/, '')
            let cdict = {pos, indecl: true, rdict: entry.rdict, dict: entry.dict, trns: entry.trns}
            // if (entry.rdict == 'αὐτάρ') log('==================================', itype, cdict)

            // if (cdict.rdict == 'Οὔλυμπόνδε') log('__________________________YYYYYYYYYYYYYYYYY', cdict)

            indecls.push(cdict)
        }
    }
    // log('_INDECLS', indecls)
    return indecls
}
