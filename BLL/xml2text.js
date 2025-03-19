// pdftotext -f 471 -l 521 -enc UTF-8 -raw Source/bailly-2020-hugo-chavez-2023-02-28.pdf Source/pages/bailly-b.txt

// pdftohtml -f 81 -l 471 -xml -s -stdout bailly-2020-hugo-chavez-2023-02-28.pdf > pages/bailly-a.xml
// $ cd Source
// pdftohtml -f 471 -l 521 -xml -s -stdout Source/bailly-2020-hugo-chavez-2023-02-28.pdf > Source/pages/bailly-b.xml

const log = console.log
import _ from 'lodash'
// import Debug from 'debug'
import fse from 'fs-extra'
import path  from 'path'
import {comb, plain} from 'orthos'

import { parseAug, vowels, art2gend, accents, doubledot, cleanStress } from './lib/utils.js'
import { letters } from './lib/allLetters.js'

let only = process.argv.slice(2)[0]
let reonly
if (only) {
    only = cleanStress(only)
    only = only.replace(/·/g, '')
    reonly = new RegExp(only)
    // reonly = new RegExp('^' + only)
}
log('_ONLY', only, reonly)


const currentdir = process.cwd()
const dirPath = path.resolve(currentdir, './Source/pages')

log('_XML')
let onlyletter = ''
let fns = fse.readdirSync(dirPath)

function parseXml() {
    for (let fn of fns) {
        let letter = fn.split('-')[1].split('.')[0]
        if (onlyletter && letter != onlyletter) continue
        if (/\.json$/.test(fn)) continue
        // log('_fn', letter, fn)
        let fnpath = path.resolve(dirPath, fn)
        let rdicts = parseFile(fnpath, letter)
        let dicts = []
        for (let rdict of rdicts) {
            let dict = parseDict(rdict)
            dicts.push(dict)
        }
        log('_dicts:', letter, fn, dicts.length)

        if (only) continue
        let jsonpath = fnpath.replace(/xml$/, 'json')
        fse.writeFileSync(jsonpath, JSON.stringify(dicts, null, 8))

    }

}

function parseDict(strs, only) {
    let dict = {head: '', str: ''}
    let rows = []
    let idx = 0
    for (let str of strs) {
        let clean = cleanFont(str)
        if (!idx) dict.head = clean.replace(/,$/, '').trim()
        else rows.push(clean)
        idx++
    }
    dict.str = rows.join(' ')
    // =============================== TODO: нужно слить с предыдущей entry
    // if (!rows[0]) log('_ERR', strs)
    let formstr = ''
    if (dict.str) {
        dict.formstr = dict.str.slice(0, 50).trim().replace(/^\d /, '').trim()
    } else {
        dict.empty = true
    }

    if (/^GEN:/.test(dict.formstr)) {
        let genstr = dict.formstr.split('GEN:')[1].trim().slice(0, 15).trim()
        dict.pseudogen = genstr
        dict.head = dict.head.trim() + ', ' + genstr
        dict.formstr = dict.formstr.replace('GEN:', '').trim()
        dict.str = dict.str.replace('GEN:', '').trim()
    }
    return dict
}

function parseFile(fnpath, letter) {
    let text = fse.readFileSync(fnpath, 'utf8')
    text = text.replace(/-\n/g, '')
    text = cleanStress(text)
    // text = cleanSymbols(text)
    let strs = text.split('\n')
    let dicts = []
    let dictstrs = []
    let letvars = letters[letter]
    letvars.push('1')
    letvars.push('2')
    // log('_LV', letvars)

    // == GEN ==
    let skip = false
    let idx = 0, idxold = 0
    for (let str of strs) {
        // if (skip) str = str.replace('font="1"', 'font="X"')
        // if (skip) log('_SKIP', str)
        let firstsym, second
        let cleanstr = str.split('font="1">')[1] || ''
        if (cleanstr) firstsym = cleanstr[0]
        if (cleanstr) second = cleanstr[1]
        // if (letvars.includes(teststr[0]))
        // if (/font="1"/.test(str) && idx != idxold+1) { // два подряд font=1
        let tmp = str.replace(/^\d /, '').trim()
        // if (/font="1"/.test(str) && letvars.includes(firstsym)) log('_!!!', second, second == ',',  str)
        if (/font="1"/.test(str) && letvars.includes(firstsym) && second != ',') {
            dictstrs = []
            if (only && reonly.test(tmp)) dicts.push(dictstrs)
            else if (!only) dicts.push(dictstrs)
            idxold = idx
            // if (only && reonly.test(tmp)) log('_TMP', tmp)
            // if (dicts.length) log('_str', dictstrs)
        }
        if (/font="1"/.test(str) && idx == idxold+1) {
            str = 'GEN:' + str
            // log('_=======================', str)
        }

        // if (/><i>gén.<\/i><\/text>/.test(str)) skip = true // gen единственный в строке
        // else skip = false
        dictstrs.push(str)
        idx++
    }
    if (only) log('_===================', only, dicts)
    return dicts
}

function cleanFont(str) {
    let clean = str.replace(/<text top[^>]*>/, '')
    clean = clean.replace('</text>', '')
    return clean
}

parseXml()
