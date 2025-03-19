//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain} from 'orthos'
import { cleanLongShort, termByStem, cleanStr, arts, parseNounArt, parseAstem, getStress } from '../../dictutils/index.js'
const currentdir = process.cwd()

import { prettyName } from "@mbykov/anthrax/utils"

// let only = process.argv.slice(2)[0] || ''
// // log('_ONLY_WKT', only)

// let push
// if (only == 'push') only = false, push = true

// if (only) {
//     only = cleanLongShort(only)
//     only = plain(comb(only))
//     only = new RegExp('^' + only)
// }


let wktDataPath = path.resolve(currentdir, '../../../anthrax.data/wkt/')

// let itypes = ['articles', 'correlatives', 'numerals', 'particles', 'pronouns', 'adverbs', 'conjunctions', 'prepositions', 'determiners', '', ]

let itypes = ['articles', 'pronouns', 'determiners', '', ]

let irregs = []
let irregdocs = []

export function wktIrregs(wktDataPath, only) {
    for (let itype of itypes) {
        if (!itype) continue
        let typePath = path.resolve(wktDataPath, itype)
        let typeList = fse.readdirSync(typePath)
        // log('_IRREG_TYPE', itype, typeList.length)

        for (let iname of typeList) {
            if (/᾽.json/.test(iname)) continue
            if (/\'\./.test(iname)) continue // apocopic forms

            let entryPath = path.resolve(typePath, iname)
            let entry = fse.readJsonSync(entryPath)
            if (!entry.trns.length) log('_no_trns___', itype, entry.rdict)

            let test = plain(comb(entry.rdict))
            if (only && !only.test(test)) continue

            let irforms = []
            for (let dia of entry.data) {
                irforms.push(...dia.forms)
            }
            let irregrps = _.groupBy(irforms, 'wf')
            // log('_irregrps', irregrps)

            for (let cwf in irregrps) {
                let fls = []
                let cwfgrps = irregrps[cwf]
                for (let form of cwfgrps) {
                    let iflex = {number: form.num, case: form.case, gend: form.gend}
                    fls.push(iflex)

                }
                let jsons = fls.map(flex=> JSON.stringify(flex))
                jsons = _.uniq(jsons)
                fls = jsons.map(flex=> JSON.parse(flex))

                let morphs = prettyName(fls)

                let pos = itype.replace(/s$/, '')
                let irreg = {pos, irreg: true, rdict: entry.rdict, dict: cwf, trns: entry.trns, morphs}
                irregdocs.push(irreg)

            }

        }
    }

    // log('_WKT IRREG DOCS', irregdocs.length)
    return irregdocs
}
