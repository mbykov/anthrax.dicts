//
const log = console.log

import fetch from 'node-fetch'
import { comb, oxia, plain, strip } from 'orthos'
import fse from 'fs-extra'
import _  from 'lodash'
import path  from 'path'

// import { cleanStr, cleanStress, parseNounArt, parseNounCStype, parseAdjCStype, checkRGreek, pushDocs, parseVerbType, parseStemByType, parseAStemByType, emptyDB, dicts2ids } from '../dictutils/index.js'

import { cleanLongShort, termByStem, cleanStr, cleanStress, parseNounArt, parseNounGends, parseAstem, checkSuffix, getStress, parseNounType } from '../dictutils/index.js'
// import { pushDocs } from './lib/pouch.js'

// import { nounKey } from '../WKT/wkt/wkt-keys/key-noun.js' // все stypes имен
// import { adjKey } from '../WKT/wkt/wkt-keys/key-adj.js'

const currentdir = process.cwd()

let only = process.argv.slice(2)[0] || ''
log('_ONLY_bbh', only)
let push = false
let reonly
if (only == 'push') push = true, only = false
else if (only) {
    only = cleanStress(only)
    reonly = new RegExp('^' + only)
}

let nestsPath = path.resolve(currentdir, '../dictutils/data/nests.js')
// let nestIrregPath = path.resolve(currentdir, '../dictutils/data/irregs_wkt.js')
// let nestIndeclPath = path.resolve(currentdir, '../dictutils/data/indecls_wkt.js')
let bbhDataPath = path.resolve(currentdir, '../../anthrax.data/bbh/')

let nests = fse.readJsonSync(nestsPath)
log('_Nests', nests.length)


let unknowns = []

let fns = fse.readdirSync(bbhDataPath)
log('_FNS', fns.length)

async function main() {
    let cdicts = [], cdict
    for (let fn of fns) {
        let entry = await readRawFile(fn)
        if (only && !reonly.test(entry.raw)) continue
        if (only) log('_only_ENTRY', fn, entry)
        let cdict = await parseEntry(entry)
        if (!cdict) continue

        delete cdict.entry
        cdicts.push(cdict)
    }

    if (only) log('_total cdicts:', cdicts)
    log('_total cdicts:', cdicts.length)
    // cdicts = cdicts.slice(0, 500)

    fse.writeFileSync('./data/cdicts.js', JSON.stringify(cdicts, null, 8))
    return cdicts


    let {checked, newdicts} = await checkRGreek(cdicts)

    let indecls = newdicts.filter(dict=> dict.indecl)
    let newregs = []
    let regs = newdicts.filter(dict=> !dict.indecl)

    for (let cdict of regs) {
        // log('_========================= CDICT before', cdict)
        // это временно, в regs уже должны быть cstype
        if (!cdict.cstype && !cdict.person) {
            log('_NO_CSTYPE', cdict)
            throw new Error()
            continue
        }

        if (!cdict.cstype) log('_NO_CSTYPE', cdict)

        let cparts = cdict.cstype.split('-') // ==
        cdict.type = cparts[0]
        // =============================== TODO::: зачем тут gen ??? тем более в глаголах
        // cdict.gen = cparts[cparts.length-1]


        let aplain = plain(cdict.dict)
        let {aug, stem} = parseStemByType(aplain, cdict.type)
        cdict.stem = stem

        let res = parseAStemByType(aplain, cdict.type)
        cdict.aug = res.aug
        cdict.astem = res.astem
        cdict.stem = res.stem
        cdict.new = true
        newregs.push(cdict)
    }

    log('_newdicts', newdicts.length)
    log('_checked bbh', checked.length)
    log('_unknowns bbh:', unknowns.length)
    // if (checked.length == 1) log('_checked', checked)

    newregs.push(...indecls)
    checked.push(...newregs)

    // if (only) log('_total', checked)
    log('_total', checked.length)

    if (!only) writeData()

    // log('_ONLY_bbh DOC', checked)

    if (!push) return

    log('_all checked push', checked.length)
    let dname = 'bbh'
    emptyDB(dname)
    let iddocs = dicts2ids(dname, checked)
    if (only) log('_iddocs:', iddocs)
    await pushDocs(dname, iddocs)

}

main()

async function parseEntry(entry) {
    if (!entry) return
    entry.raw = entry.raw.replace('ης, τητος', 'ης, ητος')
    let cdict = parseCdict(entry)
    // if (only) log('_CDict before', cdict)

    // == EXCEPTIONS
    // ἀκμήν - adverb
    // ὑπάρχοντα

    if (entry.raw == 'ἀκμήν') {
        cdict.adverb = true
        cdict.indecl = true
        return cdict
    }



    if (/^Adverb/.test(entry.pos)) { // && !(entry.raw.split(', ').length > 1)
        cdict.adverb = true
        cdict.indecl = true
        return cdict
    }

    if (/Particle/.test(entry.pos)) {
        cdict.indecl = true
        cdict.itype = 'particle'
        return cdict
    }

    if (/Conjunction/.test(entry.pos)) {
        cdict.indecl = true
        cdict.itype = 'conj'
        return cdict
    }

    if (/Conditional/.test(entry.pos)) {
        cdict.indecl = true
        cdict.itype = 'conditional'
        return cdict
    }

    if (/Preposition/.test(entry.pos)) {
        cdict.indecl = true
        cdict.itype = 'prep'
    }
    if (cdict.indecl) return cdict

    let first = cdict.rdict[0]
    if (/^Proper Noun/.test(entry.pos) || first != first.toLowerCase()) {
        cdict.person = true
        let gend = parseNounArt(entry.raw)
        if (gend) {
            cdict.gend = gend
            cdict.name = true
            cdict.noun = true
            // let cstype = parseNounCStype(cdict.entry.raw) || 'unknown'
            let cstype = 'cstype' // parseNounCStype(cdict.entry.raw)
            // cdict.cstype = cstype
            return cdict
        } else {
            cdict.indecl = true
            return cdict
        }
    }

    if (/Indecl/.test(entry.pos)) {
        cdict.indecl = true
        return cdict
    }

    let pseudoAdjs = ['θεμέλιος']
    if (pseudoAdjs.includes(cdict.rdict)) {
        cdict = parseAdjective(cdict)
        if (cdict.cstype) return cdict
    }

    let irregNouns = ['θρίξ']
    if (irregNouns.includes(cdict.rdict)) {
        cdict.irreg = true
        // cdict.cstype  = 'unknown'
        return cdict
    }

    if (/^Noun/.test(entry.pos)) {
        let nest = nests.find(nest=> nest.dict == cdict.dict && nest.pos == 'noun')

        log('____N', nest)
        // log('____E', entry)
        // log('____C', cdict)
        if (nest) {
            nest.trns = cdict.trns
            return nest
        }

        // plain typestr
        let rawparts = entry.raw.split(', ')

        if (!rawparts[1]) {
            // log('_NO_TYPESTR noun', cdict)
            cdict.indecl
            return cdict
        }


        let pnom = plain(comb(rawparts[0]))
        let pgen = plain(comb(rawparts[1]))
        let typestr = parseNounType(pnom, pgen)

        // log('_____________________________________________________________TSTR', typestr)
        let ptype = typestr.split(', ')[0]

        // astem
        let cwf = cdict.dict
        let reptype = new RegExp(ptype + '$')
        let astem = plain(cwf).replace(reptype, '')
        cdict.astem = astem

        // comb typestr
        let reastem = new RegExp('^' + astem)
        let craw = comb(entry.raw)
        let ctypestr = craw.replace(reastem, '')
        if (craw == ctypestr) ctypestr = plain(craw).replace(reastem, '')

        // cstype
        let tparts = ctypestr.split(', ')
        let type = tparts[0]
        let tgen = tparts[1]
        let cstype = [type, tgen].join('-')
        cdict.cstype = cstype

        let gend = parseNounArt(entry.raw)
        cdict.gends = [gend]
        cdict.name = true

        // log('_NOUN', cdict)
        return cdict
    }

    // if (!cdict.entry.raw) log('_N', cdict)
    if (/Adjective/.test(entry.pos)) {
        cdict = parseAdjective(cdict)
        if (cdict.cstype) {
            return cdict
        }
    }

    let impersonals = ['δεῖ', 'μέλει', 'χρή']
    if (/Verb/.test(entry.pos)) {
        // let cdict = parseCdict(entry)
        cdict.verb = true
        // let stype = parseVerbType(cdict.dict)
        let stype = 'stype'
        cdict.cstype = stype
        if (!stype) {
            if (impersonals.includes(cdict.rdict)) {
                cdict.impersonal = true
                // cdict.cstype = 'impersonal'
            } else {
                // cdict.impersonal = true
                // cdict.cstype = 'strange'
            }
        }

        return cdict
    }

    unknowns.push(entry.raw)
    return
}

function parseCdict(entry) {
    let rdict = entry.raw.split(', ')[0]
    let dict = oxia(comb(rdict))
    let trns = cleanStr(entry.trn).split('; ')
    let cdict = {rdict, dict, entry, strong: entry.strong, trns}
    return cdict
}

function parseAdjective(cdict) {
    cdict.name = true
    cdict.adj = true
    // let cstype = parseAdjCStype(cdict)
    let cstype = 'cstype'

    // if (!cstype) log('_NO ADJ CSTYPE', cdict)
    if (!cstype) return cdict

    // cdict.cstype = cstype
    let wparts = cstype.split('-')
    cdict.type = wparts[0]
    cdict.gen = wparts[wparts.length-1]
    return cdict
}

function parseNoun(cdict) {
    cdict.name = true
    cdict.noun = true
    // let cstype = parseNounCStype(cdict.entry.raw)
    // cdict.cstype = 'cstype'
    return cdict
}

function parsePerson(cdict) {
    cdict.person = true
    cdict.indecl = true
    return cdict
}

function parseAdverb(cdict) {
    cdict.adverb = true
    cdict.indecl = true
    return cdict
}

function parseIndecl(cdict) {
    cdict.indecl = true
    return cdict
}

function parsePrep(cdict) {
    cdict.indecl = true
    cdict.itype = 'prep'
    return cdict
}

async function readRawFile(fn) {
    if (!/\.json$/.test(fn)) fn = fn + '.json'
    let fpath = path.resolve(bbhDataPath, fn)
    let entry
    try {
        entry = fse.readJsonSync(fpath)
        entry.raw = cleanStress(entry.raw)
    } catch(err) {
        log('_no source file', fn, 'at', fpath)
    }
    return entry
}

function writeData() {
    log('_writting data...')
    fse.writeFileSync('./data/unknowns.js', JSON.stringify(unknowns, null, 8))
}
