//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain, strip} from 'orthos'
import { parseAug, cleanLongShort, cleanStress, arts, termByStem, removeVowelBeg, zksps, asps, vowels, guessPrefix } from './index.js'
const currentdir = process.cwd()

// import { preflist } from "@mbykov/anthrax/preflist"
// const prefixes = preflist.map(pref=> {
//     pref = pref.replace(/-/g, '')
//     return pref
// })

let correctSuffixes = fse.readJsonSync('./lib/correct_suffixes.js')
correctSuffixes = correctSuffixes.map(wf=> {
    let cwf = comb(wf)
    let [stem, type] = cwf.split('-')
    return {cwf: cwf.replace('-', ''), stem: plain(stem), type}
})

import { accents } from './lib/utils.js'
let acs = _.values(accents)

/*  nests - общий словарь. Nest создает stem
 */


let only = process.argv.slice(2)[0] || ''
let push

const centerdot = '·'
const redot = /·/g
if (only == 'push') {
    only = false, push = true
}

if (only) {
    log('_ONLY_NESTS', only)
    only = only.replace(/-/, '')
    only = cleanLongShort(only)
    only = plain(comb(only))
    // only = new RegExp('^' + only)
}

let nestLog = {}
let aStemLog = {}
let stemLog = {}

let fullAstemListNew = []
let fullAstemList = fse.readJsonSync('./results/full_astem_list.js')

let fullStemListNew = []
let fullStemList = fse.readJsonSync('./results/full_stem_list.js')

// let dirPath = path.resolve(currentdir, '../Nests')
let udictsPath = path.resolve(currentdir, './results/uniqdicts.js')

let astemFreqPath = path.resolve(currentdir, './results/astemFreqs.js')
let astemFreqs = fse.readJsonSync(astemFreqPath)

// let typeAdjKeyPath = path.resolve(currentdir, './wkt-keys/typical-adj-gen.js')
// let typeAdjKey = fse.readJsonSync(typeAdjKeyPath)

let lsjSuffixList = fse.readJsonSync('./lib/lsj_suffix_list.js')

// ==>> вычисляет общий stem для группы и cstypes на его основе
// type-gen - tgen - на основе typical-gens из WKT
// == workflow:
// == все словари - makeCdictsWKT, makeCdictsBailly
// == makeUniqDicts - вычисляет astem

// вычисляю stem

let udicts = fse.readJsonSync(udictsPath)
makeNests(udicts)

export function makeNests(udicts) {
    let nests = []
    let wo_stem = []

    for (let cdict of udicts) {
        // if (only && !only.test(plain(cdict.dict))) continue
        if (only && only != plain(cdict.dict)) continue
        if (!cdict.type || !cdict.astem) {
            log('_no_cdict.type', cdict)
            throw new Error()
        }

        if (!cdict.prform) cdict.prform = plain(cdict.dict) // lsj, остальные плоские словари
        // let prdict = plain(cdict.dict)
        let prdict = plain(cdict.prform) // почему prform ? - несколько dias, в них разные prform, но только в wkt // nest образован от aor. Пример?
        // log('_Cdict U', cdict)
        let prefix = guessPrefix(cdict.rdict) // здесь можно rdict, потому что начало слова, prform влияет на суффикс

        // NEST PREFIX - ἐπιδίομαι - тут префикс ἐπιδίο - и не проходит. А нужно найти префикс ἐπι. То есть найти оба, и выюрать лучший
        // log('______________________prdict, prefix', prdict, prefix)

        if (prefix && (prdict == prefix.pref + plain(cdict.type) || prdict == prefix.pfc + plain(cdict.type) || prdict == prefix.pfc)) prefix = null // все слово - только префикс

        let woShortPref = false
        if (prefix) { // short wf + may be prefix
            // log('______________________prefix', prdict, prefix)
            let repref = new RegExp('^' + prefix.pfc)
            let pre_stem = prdict.replace(repref, '')
            if (pre_stem.length < 2) prefix = null // ἄπιος - pseudo-prefix ; ἀμφίας
            let prefstem = cdict.astem.replace(repref, '')
            let reptype = new RegExp(plain(cdict.type) + '$')
            prefstem = prefstem.replace(reptype, '')
            if (fullAstemList.includes(prefstem)) woShortPref = true
            // woShortPref = true
            // log('_____woShortPref', prefstem, woShortPref, cdict.type)
        }

        if (prefix && woShortPref) {
            cdict.prefix = prefix
        } else {
            let pdict = plain(cdict.dict)
            cdict.aug = parseAug(pdict)
        }
        // log('_Cdict PREFIX', cdict)

        let woLeadStem = removeLead(cdict)
        cdict.stem = woLeadStem
        // log('_Cdict LEAD removed', cdict)

        // log('_____________PREF stem', cdict.rdict, cdict.pos, '_stem', woLeadStem)
        let {sufstem, csuf} = removeSuffix(cdict)
        // log('___sufstem_csuf', sufstem, csuf, cdict.type, cdict.type == csuf)

        if (cdict.prefix && sufstem.length < 2) sufstem = null
        // ddd
        let corr = correctSuffixes.find(cs=> cs.cwf == cdict.dict)

        let retype = new RegExp(cdict.type + '$')
        let reptype = new RegExp(plain(cdict.type) + '$')

        if (corr) {
            // log('_CORR_____________', corr)
            cdict.type = corr.type
            cdict.stem = corr.stem

        } else if (sufstem) {
            // log('____MAX', {sufstem, csuf})
            let diff = csuf.replace(retype, '')
            // log('________________DIFF', cdict.dict, 'csuf', csuf, cdict.type, cdict.type != csuf, '_diff', diff)
            cdict.type = csuf
            cdict.suf = csuf

            if (diff) {
                cdict.diff = diff
                cdict.stype = cdict.stype.map(type=> diff + type)
            }

            let newrepsuf = new RegExp(plain(csuf) + '$')
            cdict.stem = woLeadStem.replace(newrepsuf, '')

        } else {
            // log('___ELSE MAX', woLeadStem, cdict.type)
            cdict.stem = woLeadStem.replace(reptype, '')
            cdict.stem = plain(cdict.stem)
            cdict.astem = plain(cdict.dict.replace(retype, ''))
        }

        cdict.stype = cdict.stype.join('-')
        // log('___xxxXXXXX', cdict)

        // ================== TEST
        let lead = ''
        if (cdict.prefix) lead = cdict.prefix.pfc
        else lead = cdict.aug
        // cdict.bad_ = [test, cdict.stem, plain(cdict.type)]

        // let prdict = plain(cdict.prform)
        let teststr = [lead, cdict.stem, plain(cdict.type)].join('')
        if (prdict != teststr) {
            cdict.bad = [lead, cdict.stem, plain(cdict.type)]
            cdict.prdict = prdict
            cdict.teststr = teststr
            cdict.irreg = true

            if (only) log('_VERY_BAD', cdict)
            else log('_VERY_BAD', cdict.rdict)
        }
        // ================== TEST


        // zero: Здесь корректирую stem / zstem ; γλαῦξ -  stem: γλαυκ, zstem: γλαυ, type: ξ
        // zero во всех словарях можно убить? что с uniq-stem?
        let zlast = cdict.rdict[cdict.rdict.length -1]
        if (zksps.includes(zlast)) cdict.zero = true

        if (!cdict.suf && !cdict.prefix) fullAstemListNew.push(cdict.astem)
        if (!cdict.suf && !cdict.prefix) fullStemListNew.push(cdict.stem)

        // delete cdict.astem
        delete cdict.compound
        delete cdict.prform

        // corrections
        // if (cdict.stem.length > 3 && cdict.stem.endsWith('λλ')) cdict.stem = cdict.stem.slice(0, -1), cdict.type = 'λ' + cdict.type // LL

        if (!cdict.stem) {
            wo_stem.push(cdict)
            // log('_no_stem', cdict.rdict, cdict.pos)
            // throw new Error()
            continue
        }

        if (cdict.stem) nests.push(cdict)

        if (!nestLog[cdict.stem]) nestLog[cdict.stem] = []
        nestLog[cdict.stem].push(cdict.rdict)

        if (!aStemLog[cdict.astem]) aStemLog[cdict.astem] = []
        aStemLog[cdict.astem].push(cdict.rdict)

        if (!stemLog[cdict.stem]) stemLog[cdict.stem] = []
        stemLog[cdict.stem].push(cdict.rdict)
    }

    if (only) {
        log('_nests only:', nests)
    } else {
        log('_nests', nests.length)
        log('_wo_stem', wo_stem.length)

        fse.writeFileSync('./results/nests.js', JSON.stringify(nests, null, 8))
        fse.writeFileSync('./results/nestLog.js', JSON.stringify(nestLog, null, 8))
        fse.writeFileSync('./results/aStemLog.js', JSON.stringify(aStemLog, null, 8))
        fse.writeFileSync('./results/stemLog.js', JSON.stringify(stemLog, null, 8))

        fullAstemListNew = _.uniq(fullAstemListNew)
        fse.writeFileSync('./results/full_astem_list.js', JSON.stringify(fullAstemListNew, null, 8))

        fullStemListNew = _.uniq(fullStemListNew)
        fse.writeFileSync('./results/full_stem_list.js', JSON.stringify(fullStemListNew, null, 8))
    }
}

// dict.stem уже без lead, но с suffix / term
// main problem:
// а нужно не max, а популярный из возможных - θέωσις - θέ, чтобы θέωσις ; θεός ; θέα
//
// примеры: βάσις ; κατάβασις ; φθίσις ; φθίω ; μαντεῖος ; μαντεῖον ;  ἄγασμα

function removeSuffix(cdict) {
    // log('________________________________SUF', cdict)
    let sufs = []
    // === если короткий astem без суффикса уже есть в списке, и суффикс настоящий, не равен типу:
    for (let rsuf of lsjSuffixList) {
        if (!rsuf) continue
        if (/σσ/.test(rsuf)) continue // άσσω - напр. χαράσσω - много корней, к которым нет flex причастий типа ασσόμενος
        let csuf = comb(rsuf)
        // if (cdict.type == csuf) continue // нельзя, отбрасывается разумный короткий дефолтный суффикс, ἀκαρής
        if (csuf.length < cdict.type.length) continue
        let psuf = plain(rsuf)
        let resuf = new RegExp(csuf + '$')
        if (!resuf.test(cdict.dict)) continue

        let repsuf = new RegExp(psuf + '$') // παρουσία ; suf ουσία не должен пройти
        let sufstem = cdict.stem.replace(repsuf, '')
        if (!sufstem || cdict.stem == sufstem) continue

        // проверять - не проверять, и так неплохо
        if (!fullStemList.includes(sufstem)) continue

        sufs.push({sufstem, csuf})
        // log('________________________________sufstem, csuf', sufstem, csuf)
    }

    // сейчас type в суффиксах есть. length=1 будет отброшен:
    // log('_sufs_0', sufs)
    sufs = _.sortBy(sufs, [function(o) { return o.sufstem.length }])
    // sufs = sufs.slice(-3)
    // отбросить самые короткие
    if (sufs.length > 1) {
        sufs = sufs.filter(item=> item.sufstem.length > 1)
    }
    // if (sufs.length > 1) {
        // sufs = sufs.filter(item=> item.sufstem.length > 2) // φθίσις не проходит
    // }
    // отбросить гласные на конце, если стем длиннее двух, иначе может остаться одна согласная, неоправдано
    if (sufs.length > 1) {
        let ssufs = sufs.filter(item=> {
            if (item.sufstem.length < 3) return true
            let last = item.sufstem[item.sufstem.length -1]
            if (vowels.includes(last)) return
            return true
        })
        if (ssufs.length) sufs = ssufs
    }

    // выбираю все же длиннейший стем, консервативно - но это все равно, что суффиксы не проверять, почти
    // выбираю кратчайший, но если стем длиннее трех
    // == TODO: == исключения можно прописать, их не много
    let beststem = _.maxBy(sufs, function(o) {
        if (o.sufstem.length < 3) return 0
        // return o.sufstem.length
        return plain(o.csuf).length
    })
    // log('_sufs', sufs)
    // log('_beststem', beststem)


    if (!beststem) beststem = {sufstem: '', csuf: ''}
    if (beststem && beststem.csuf == cdict.type) beststem = {sufstem: '', csuf: ''}

    return beststem
}

// но, это предварительное определение префикса, или подсказка
// точным образом префикс в глаголах определяется по изменению соединительных гласных после префикса в исторических врменах
// тогда я не уверен в том, что здесь нужно вычислять stem

// тут, черт побери, не так просто. Может быть перенос ударения при diff φρόνημα - ημα-ηματος, а д.б. ημα-ήματος, с ударением. Ешкин кот.
// совсем не просто, Ζεβεδαῖος - gen - ζεβεδαίου, а diff сохраняет облеченное ударение
// короче, нужно здесь оставить только stem

// astemFreqs - astems, суффиксы, префиксы не отброшены

function removeLead(cdict) {
    // let prdict = plain(cdict.prform)
    let stem = cdict.astem

    if (cdict.aug) {
        let reaug = new RegExp('^' + cdict.aug)
        stem = cdict.astem.replace(reaug, '')
    } else if (cdict.prefix) {
        let repref = new RegExp('^' + cdict.prefix.pfc)
        stem = cdict.astem.replace(repref, '')
    }
    // log('_prdict, stem wo lead', prdict, stem)
    return stem
}
