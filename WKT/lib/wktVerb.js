//
const log = console.log
import _ from 'lodash'
import fse from 'fs-extra'
import path  from 'path'
import {comb, oxia, plain} from 'orthos'
import { cleanLongShort, termByStem, cleanStr, arts, getStress, vowels, removeVowelBeg, asps, ypo, parseAug, parseCon, guessPrefix } from '../../dictutils/index.js'
import { preflist } from '../../../anthrax/lib/prefix/preflist.js' //
import { makePart, makePartIrreg }  from './wktPart.js'
import substrings from 'common-substrings';

import { prettyVerb } from "@mbykov/anthrax/utils"

const currentdir = process.cwd()

let pfstimes = ['pf', 'ppf', 'fpf']
// ἀπάγω.js
let verbs = []
let irverbs = []
let vfls = []

let wktDataPath = path.resolve(currentdir, '../../anthrax.data/wkt/')

let veryBads = ['έπω']

export async function wktVerb(nests, only) {
    let verbPath = wktDataPath + '/verbs'
    let fns = fse.readdirSync(verbPath)

    // обрабатываю WKT.data
    for await (let fname of fns) {
        let test = plain(comb(fname))
        // log('_ENTRY', only)
        if (only && !only.test(test)) continue
        // if (only && only != test) continue

        let wfpath = path.resolve(verbPath, fname)
        let entry = fse.readJsonSync(wfpath)

        if (entry.empty) continue
        if (veryBads.includes(entry.rdict)) continue
        // log('_ENTRY', entry)

        let nest = nests.find(nest=> nest.dict == entry.dict && nest.pos == 'verb')
        // log('_VERB NEST', nest)
        if (nest) parseVerb(entry, nest)
        else parseIrregEntry(entry)
    }

    let jsons = vfls.map(flex=> JSON.stringify(flex))
    jsons = _.uniq(jsons)
    vfls = jsons.map(flex=> JSON.parse(flex))

    return {verbs, irverbs, vfls}
}

function parseDiaStems(dia, nest) {
    let wfs = dia.forms.map(form=> form.wf)
    let pwfs = wfs.map(wf=> plain(comb(wf)))
    let prform = pwfs[0]
    let stems = []
    let cpwfs = pwfs
    let stem = ''

    if (nest.prefix) {
        let prefix, reprefix
        if (dia.time == 'aor') {

            let indforms = dia.forms.filter(form=> form.mood == 'ind')
            let not_indforms = dia.forms.filter(form=> form.mood != 'ind')

            if (indforms.length) {
                let indwfs = indforms.map(form=> form.wf)
                let pindwfs = indwfs.map(wf=> plain(comb(wf)))
                let pindwf = pindwfs[0]
                // if (!pindwf) log('_N', nest, indforms)
                prefix = guessPrefix(pindwf, nest.prefix.psize)
                // log('OO P', prefix)

                if (prefix) {
                    reprefix = new RegExp('^' + prefix.pfc)
                    dia.prefix = _.clone(prefix)
                } else {
                    let aug = parseAug(prform)
                    dia.aug = aug
                    reprefix = new RegExp('^' + aug)
                }

                cpwfs = pindwfs.map(cpwf=> {
                    return cpwf.replace(reprefix, '')
                })
                stem = commonStem(nest.rdict, dia, cpwfs)
                stems.push(stem)
                // log('_ooooooooooo stem', dia.time, cpwfs, stem)
            } else if (not_indforms.length) {
                let nindwfs = not_indforms.map(form=> form.wf)
                let npindwfs = nindwfs.map(wf=> plain(comb(wf)))
                let npindwf = npindwfs[0]

                prefix = guessPrefix(npindwf, nest.prefix.psize)
                // log('OO N P', prefix)

                if (prefix) {
                    reprefix = new RegExp('^' + prefix.pfc)
                    dia.prefix = _.clone(prefix)
                } else {
                    let aug = parseAug(prform)
                    reprefix = new RegExp('^' + aug)
                    dia.aug = aug
                }
                cpwfs = npindwfs.map(cpwf=> {
                    return cpwf.replace(reprefix, '')
                })
                stem = commonStem(nest.rdict, dia, cpwfs)
                stems.push(stem)
                // log('_ooooooooooo not_ind stem', dia.time, npindwf, stem)
            }

        } else { // if not aor
            prefix = guessPrefix(prform, nest.prefix.psize)
            // log('___________________________________________________________PR', dia.time, prform, prefix)
            if (!prefix) { // διαιτάω impf - удлиннение aug // ὑποκρύπτω - fut без prefix, возможно, ошибка данных
                let aug = parseAug(prform)
                // log('_D', prform, pwfs)
                reprefix = new RegExp('^' + aug)
                dia.aug = aug
            } else {
                reprefix = new RegExp('^' + prefix.pfc)
                dia.prefix = _.clone(prefix)
            }
            cpwfs = pwfs.map(cpwf=> {
                return cpwf.replace(reprefix, '')
            })
            stem = commonStem(nest.rdict, dia, cpwfs)
            stems.push(stem)
        }
    } else { // if not nest.prefix
        let aug = ''
        if (dia.time == 'aor') {
            let indforms = dia.forms.filter(form=> form.mood == 'ind')
            let indwfs = indforms.map(form=> form.wf)
            let pindwfs = indwfs.map(wf=> plain(comb(wf)))
            let pindwf = pindwfs[0]

            if (!pindwf) {
                // log('_xxxxxxxxxxxxxxxxxxxxxxxxxxxx', indwfs)
                // log('_NNN', nest)
                // stems.push(stem)
                pindwf = ''
            }

            aug = parseAug(pindwf)
            if (aug) {
                cpwfs = pindwfs.map(cpwf=> {
                    return cpwf.replace(aug, '')
                })
            } else {
                cpwfs = pindwfs
            }
            stem = commonStem(nest.rdict, dia, cpwfs)
            stems.push(stem)

            // log('_aor ind', stem, cpwfs)
            let not_indforms = dia.forms.filter(form=> form.mood != 'ind')
            if (not_indforms.length) {
                let nindwfs = not_indforms.map(form=> form.wf)
                let npindwfs = nindwfs.map(wf=> plain(comb(wf)))
                if (!npindwfs.length) log('_NO', not_indforms)
                let npindwf = npindwfs[0]
                aug = parseAug(npindwf)
                if (aug) {
                    cpwfs = npindwfs.map(cpwf=> {
                        return cpwf.replace(aug, '')
                    })
                } else {
                    cpwfs = npindwfs
                }
            }
            stem = commonStem(nest.rdict, dia, cpwfs)
            stems.push(stem)
            // log('_aor not ind', stem, cpwfs)

        } else { // if not aor
            let aug = parseAug(prform)
            // log('_AUG', dia.time, aug)
            if (aug) {
                cpwfs = pwfs.map(cpwf=> {
                    return cpwf = cpwf.replace(aug, '')
                })
            }
            stem = commonStem(nest.rdict, dia, cpwfs)
            stems.push(stem)
            // log('____AS', dia.time, stem)
        }
    }

    let minstem = _.min(stems, 'length')
    // log('_MIN_DIA_Stems', dia.time, stems, '_MIN', minstem)

    dia.stem = minstem
}

function parseVerb(entry, nest) {
    let rdict = entry.rdict
    let dict = comb(rdict)
    let pdict = plain(dict)

    diaTypedForms(entry)
    // log('_TYPED', entry)
    // log('_nest', nest)
    // return

    for (let dia of entry.vars) {
        parseDiaStems(dia, nest)
        // log('__dia_stem', dia.time, dia.stem, dia.prefix)
    }

    let badstems = []
    let regstems = []
    let pfstems = []
    let others = []
    let reneststem = new RegExp('^' + nest.stem)

    for (let dia of entry.vars) {
        let partstems = dia.stem.split(nest.stem)
        // nest.prefix && !dia.prefix - возможно, грубое решение.
        if (nest.prefix && !dia.prefix) badstems.push(dia.stem), dia.bad = true
        // else if (nest.prefix && dia.prefix) regstems.push(dia.stem)
        else if (partstems.length == 2 && reneststem.test(dia.stem)) dia.stem = nest.stem
        else if (/pf/.test(dia.time) && !/impf/.test(dia.time)) pfstems.push(dia.stem), dia.notok = true
        else others.push(dia.stem)
    }
    // regstems.push(nest.stem)

    // let badstem = longestCommonPrefix(badstems)
    let pfstem = longestCommonPrefix(pfstems)
    let ostem = longestCommonPrefix(others)

    // pf correction
    if (pfstem.length > 3) {
        let last = pfstem[pfstem.length-1]
        if (vowels.includes(last)) pfstem = pfstem.slice(0, -1)
    }

    // log('_Nest', nest.stem)
    // log('_BAD', badstems)
    // log('_PF', pfstem, pfstems)
    // log('_OST', ostem, others)

    // return // before FLS

    // badstems не группирую пока, очень разные варианты в pf, ppf, см. διαιτάω
    for (let dia of entry.vars) {
        if (!dia.notok) continue
        if (/pf/.test(dia.time) && !/impf/.test(dia.time)) dia.stem = pfstem
        else if (ostem.length > 1) dia.stem = ostem
    }

    // διαιτάω - в pfs остается только δ. Много разных pfs, с удвоением и без. Надо бы отдельно, но как? Что, каждый time отдельно?
    let diastems = entry.vars.map(dia=> dia.stem)
    // log('_diastems', diastems)

    let cdicts = []
    let fls = []
    let trns = cleanTrns(entry.trns) // === TRNS [0]

    // bad, dia где должен быть prefix, но его нет. это
    let stemmed = entry.vars.filter(dia=> dia.stem && !dia.bad)
    let nonstemmed = entry.vars.filter(dia=> !dia.stem || dia.bad)
    let stemGroup = _.groupBy(stemmed, 'stem')

    for (let stem in stemGroup) {
        let cdict = {verb: true, pos: 'verb', rdict, dict, stem, trns, ckeys: []}
        if (nest.stem == stem) cdict.reg = true
        // if (nest.aug) cdict.aug = nest.aug
        if (nest.prefix) cdict.prefix = true // потому что prefix вычисляется в ckey, здесь тип
        // if (nest.prefix) cdict.prefix = nest.prefix
        if (nest.prefix) cdict.psize = nest.prefix.psize
        cdicts.push(cdict)

        let vars = stemGroup[stem]
        for (let dia of vars) {
            parseDiaFls(dia, cdict)
        }
        for (let dia of vars) {
            let diafls = parseDiaKeys(dia, cdict)
            fls.push(...diafls)
        }
    } // stem-group

    let irregs = []
    for (let dia of nonstemmed) {
        let diairregs = parseIrregDia(entry, dia)
        irregs.push(...diairregs)
    }
    // log('_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf', fls[10])
    // log('_verb_cdicts', cdicts)

    // let {cdicts, irregs, fls} = cdictsFls(entry, nest)
    verbs.push(...cdicts)
    irverbs.push(...irregs)
    vfls.push(...fls)
}

// διαιτάω
// παραδείκνυμι ;
// две группы - regs - nest.stem и min-stem - мин из тех, что не вошли в regs. Самый остаток тоже можно почистить?

function parseDiaFls(dia, cdict) {
    dia.verbfls = []
    dia.inffls = []
    dia.partfls = []
    dia.advfls = []

    let rform = dia.forms[0].wf
    let firsttype = ''

    if (!cdict.rform) cdict.rform = rform
    if (!firsttype) firsttype = termByStem(comb(cdict.rform), dia.stem)

    dia.rform = rform

    let diatype = termByStem(comb(dia.rform), dia.stem)
    let stype = [firsttype, diatype].join('-')
    dia.stype = stype

    let pas_there_is = dia.forms.find(form=> form.voice == 'pas')

    let firstFlex = ''
    for (let form of dia.forms) {
        let cwf = comb(form.wf)
        let term = termByStem(cwf, dia.stem)
        if (!term) {
            log('_NO_TERM FORM', cdict.rdict, dia.time, dia.stem, form)
            throw new Error()
        }
        let {stressidx, stress} = getStress(cwf)

        // mis_types in wiktionary: - если нет пассивных форм, то mid обычно - mp
        if (!pas_there_is && form.voice == 'mid') form.voice == 'mp'

        // if (form.wf == 'νενομίκω') log('_STRESS_ rdict', cdict.rdict, '_wf', cwf, stressidx, stress)
        let flex = {verb: true, stype, time: dia.time, term, stress, stressidx, voice: form.voice, rform: form.wf}

        // dia.time == 'pf' || - перфект нельзя, м.б. удвоение без аугмента
        // if (dia.time == 'impf' || dia.time == 'ppf') flex.hst = true
        // else if (dia.time == 'aor' && form.mood == 'ind') flex.hst = true

        if (form.inf) {
            flex.inf = true
            flex.tense =  [dia.time, form.voice, 'inf'].join('.')
            dia.inffls.push(flex)
            // log('_inf:', form.inf, term)
        }  else if (form.part) {

            let fn = [comb(form.wf), 'json'].join('.')
            // let fn = [form.wf, 'json'].join('.')
            let partDirPath = wktDataPath + '/participles-old' //
            let partpath = [partDirPath, fn].join('/')

            // log('____________________partpath', form.wf, partpath)
            try {
                let entry = fse.readJsonSync(partpath)
                // log('____________________PART FILE', partfile)
                // let pfls = []
                let pfls = makePart(entry, cdict.stem) // здесь все dia имеют один cdict.stem
                // log('____________________partpath_ok', form.wf, partpath, pfls.length)
                for (let pflex of pfls) {
                    // log('____________________PART FLS', flex)
                    pflex.verb = true, flex.time = dia.time, flex.voice = form.voice
                    pflex.tense =  [dia.time, form.voice, 'part'].join('.')
                    pflex.stype = dia.stype
                    pflex.rform = form.wf // === или там, в participles, форму добавить? А они вообще тут нужны, аугменты? нет, не нужны, нужны на время
                }
                // log('_part_flex:', flex)
                // partfls.push(...pfls)
                dia.partfls.push(...pfls)
                // log('__________________pfls', form.wf, pfls)
                // log('__________________partfls', cdict.rdict, cdict.stem, form.wf, dia.partfls.length)
            } catch(err) {
                // log('_err_part_file:', partpath, dia.stype, form.wf)
                // continue
            }
        } else if (form.mood) {
            flex.tense = [dia.time, form.voice, form.mood].join('.')
            flex.number = form.num
            flex.person = form.person
            flex.numper = [flex.number, flex.person].join('.')
            // log('_DIA_STEM_FLEX', cdict.stem, form.wf, flex.term)
            dia.verbfls.push(flex)
        } else {
            log('_VARY_BAD_VERB', dict)
            throw new Error()
        }
    } // forms
    // log('_____________________________DIA rform', stem, dia.rform, dia.time, dia.stime, 'stype', dia.stype)
} // dia of vars

function parseDiaKeys(dia, cdict) {
    let diafls = []
    let stype = dia.stype

    let verbTenseGroups = _.groupBy(dia.verbfls, 'tense')
    for (let tense in verbTenseGroups) {
        let group = verbTenseGroups[tense]
        let grouprform = group[0].rform
        let prform = plain(comb(grouprform))

        // log('_tense', tense, prform)
        // let numper = [flex.number, flex.person].join('.')
        // let verbkey = group.map(flex=> [flex.numper, flex.term].join(':')).join(';')
        // let verbkey = group.map(flex=> flex.term).join('-')
        // log('_verbkey', verbkey)
        let verbkey = group.map(flex=> {
            // return flex.term // путается ударение, θραῦστᾰ - θραύστᾱ
            return [flex.term, flex.stress, flex.stressidx].join('.')
        }).join('-')

        // if (!cdict.ckeys) cdict.ckeys = []
        let diakey = {tense, stype, keys: [verbkey]} //
        if (dia.prefix) diakey.con = parseCon(prform, cdict.stem), diakey.prefix = dia.prefix
        else diakey.aug = parseAug(prform)
        if (dia.bad) diakey.bad = true

        // log('______dia_keys', tense, prform, '_prefix', dia.prefix)
        // log('_______________________________________diakey', tense, prform, '_con:', diakey.con)

        cdict.ckeys.push(diakey) // verb

        for (let flex of group) {
            flex.key = verbkey
            flex.stype = stype
            if (dia.prefix) flex.con = diakey.con
            else flex.aug = diakey.aug
            // log('_F', flex)
        }
    } // verb

    let infTenseGroups = _.groupBy(dia.inffls, 'tense')
    for (let tense in infTenseGroups) {
        let group = infTenseGroups[tense]
        let grouprform = group[0].rform
        let prform = plain(comb(grouprform))

        // let infkey = group.map(flex=> flex.term).join('-')
        // log('_infkey', infkey)
        let infkey = group.map(flex=> {
            // return flex.term // путается ударение, θραῦστᾰ - θραύστᾱ
            return [flex.term, flex.stress, flex.stressidx].join('.')
        }).join('-')


        if (!cdict.ckeys) cdict.ckeys = []
        let diakey = {tense, stype, keys: [infkey]}

        if (dia.prefix) diakey.con = parseCon(prform, cdict.stem), diakey.prefix = dia.prefix
        else diakey.aug = parseAug(prform)
        if (dia.bad) diakey.bad = true

        // log('________INF', diakey)
        cdict.ckeys.push(diakey) // inf

        for (let flex of group) {
            flex.key = infkey
            flex.stype = stype
            if (dia.prefix) flex.con = diakey.con
            else flex.aug = diakey.aug
        }
    } // inf

    let partTenseGroups = _.groupBy(dia.partfls, 'tense')
    for (let tense in partTenseGroups) {
        let tensegroup = partTenseGroups[tense]
        let grouprform = tensegroup[0].rform
        if (!grouprform) log('_tensegroup[0]', tensegroup[0])
        let prform = plain(comb(grouprform))

        // log('__________________PART tensegroup', tense)

        let adjs = tensegroup.filter(flex=> !flex.adverb)
        let advs = tensegroup.filter(flex=> flex.adverb)
        // log('__________________PART X', tensegroup.length, tense, cdict.rdict, cdict.stem, advs_)

        let partGendGroup = _.groupBy(adjs, 'gend')
        // let partkey = []

        for (let gend in partGendGroup) {
            let gendgroup = partGendGroup[gend]
            // let gendkey = gendgroup.map(flex=> {
            //     let numcase = [gend, flex.number, flex.case].join('.')
            //     return [numcase, flex.term].join(':')
            // }) //.join(';')
            // partkey.push(gendkey)

            let gendfls = partGendGroup[gend]
            // copy from noun
            // let varkey = gendfls.map(flex=> {
            //     return flex.term
            // }).join('-')

            let varkey = gendfls.map(flex=> {
                // return flex.term // путается ударение, θραῦστᾰ - θραύστᾱ
                return [flex.term, flex.stress, flex.stressidx].join('.')
            }).join('-')

            if (!cdict.ckeys) cdict.ckeys = []
            let diakey = {tense, stype, gend, keys: [varkey]} //

            if (dia.prefix) diakey.con = parseCon(prform, cdict.stem), diakey.prefix = dia.prefix
            else diakey.aug = parseAug(prform)
            if (dia.bad) diakey.bad = true


            cdict.ckeys.push(diakey) // part
            // log('_x PART', tense)

            for (let flex of gendgroup) {
                flex.key = varkey
                flex.stype = stype
                if (dia.prefix) flex.con = diakey.con
                else flex.aug = diakey.aug
            }

        } // part // gend ; adjfls
        // partkey = partkey.join(';')


        // let advkey = advs.map(flex=> flex.term).join('-')
        let advkey = advs.map(flex=> {
            // return flex.term // путается ударение, θραῦστᾰ - θραύστᾱ
            return [flex.term, flex.stress, flex.stressidx].join('.')
        }).join('-')

        let diakey = {adverb: true, tense, stype, keys: [advkey]} //
        if (dia.prefix) diakey.con = parseCon(prform, cdict.stem)
        else diakey.aug = parseAug(prform)
        if (dia.bad) diakey.bad = true

        cdict.ckeys.push(diakey) // adv

        for (let flex of advs) {
            flex.key = advkey
            flex.stype = stype
            if (dia.prefix) flex.con = diakey.con
            else flex.aug = diakey.aug
        }

    } // tense partfls

    diafls.push(...dia.verbfls)
    diafls.push(...dia.inffls)
    diafls.push(...dia.partfls)
    // log('_VVVV_DIA ', dia.rform, stem, dia.time, dia.stime)

    for (let flex of diafls) {
        delete flex.rform
    }

    let jsons = diafls.map(flex=> JSON.stringify(flex))
    jsons = _.uniq(jsons)
    diafls = jsons.map(flex=> JSON.parse(flex))

    return diafls
}

function longestCommonPrefix(arr){
    arr.sort();
    // Get the first and last strings after sorting
    let first = arr[0];
    if (!first) return ''
    let last = arr[arr.length - 1];
    let minLength = Math.min(first.length, last.length);

    let i = 0;
    // Find the common prefix between the first and
    // last strings
    while (i < minLength && first[i] === last[i]) {
        i++;
    }
    // Return the common prefix
    return first.substring(0, i);
}

function diaTypedForms(entry) {
    entry.vars = []
    for (let vtime of entry.vtimes) {
        let time = vtime.info.time
        let descr = vtime.info.dialect || ''

        let excludes = ['εἰσί', 'ὦ', 'ᾖς', 'ᾖ', 'ἦτον', 'ὦμεν', 'ἦτε', 'ὦσι', 'ὦσιν', 'εἴην', 'εἴης', 'εἴη', 'εἴητον', 'εἶτον', 'εἰήτην', 'εἴτην', 'εἴημεν', 'εἶμεν', 'εἴητε', 'εἶτε', 'εἴησαν', 'εἶεν']
        vtime.forms = vtime.forms.filter(form => {
            if (excludes.includes(form.wf)) return
            return true
        })
        // log('_VF', vtime.forms.map(form=> form))
        // continue

        if (time == 'aor') {
            let aorforms = vtime.forms.filter(form=> form.voice != 'pas')
            let aors = {time: 'aor', stime: 'aors-am', descr, forms: aorforms}
            if (aorforms.length)  entry.vars.push(aors)

            let aorpasforms = vtime.forms.filter(form=> form.voice == 'pas')
            let aorpas = {time: 'aor', stime: 'aors-p', descr, forms: aorpasforms}
            if (aorpasforms.length)  entry.vars.push(aorpas)
        }
        else if (time == 'fut') {
            let futforms = vtime.forms.filter(form=> form.voice != 'pas')
            let futs = {time: 'fut', stime: 'futs-am', descr, forms: futforms}
            if (futforms.length)  entry.vars.push(futs)

            let futpasforms = vtime.forms.filter(form=> form.voice == 'pas')
            let futpas = {time: 'fut', stime: 'futs-p', descr, forms: futpasforms}
            if (futpasforms.length)  entry.vars.push(futpas)
        }
        else if (pfstimes.includes(time)) {
            let descr = vtime.info.descr || ''
            let actname = time + 's-a'
            let notactname = [time, 's-mp'].join('')

            let pfs = vtime.forms
            let actforms = pfs.filter(form=> form.voice == 'act')
            let notactforms = pfs.filter(form=> form.voice != 'act')

            notactforms = notactforms.filter(form=> form.mood == 'ind' || form.mood == 'imp' || form.inf || form.part) // причастия

            let acts = {time: time, stime: actname, descr, forms: actforms}
            let notacts = {time: time, stime: notactname, descr, forms: notactforms}

            if (actforms.length)  entry.vars.push(acts)
            if (notactforms.length)  entry.vars.push(notacts)
        }
        else if (time == 'pres') {
            let presforms = vtime.forms
            let pres = {time: 'pres', stime: 'pres', descr, forms: presforms}
            if (presforms.length)  entry.vars.push(pres)
        }
        else if (time == 'impf') {
            let impforms = vtime.forms
            let impfs = {time: 'impf', stime: 'impfs', descr, forms: impforms}
            if (impforms.length)  entry.vars.push(impfs)
        } else {
            log('_THIS IS NO TIME', descr)
            throw new Error()
        }
    }
    delete entry.vtimes
    // log('_VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVvv', entry.vars)

}

// .mw-parser-output .object-usage-tag{font-style:italic}.mw-parser-output .deprecated{color:olivedrab}
function cleanTrns(array) {
    let trns = []
    for (let str of array) {
        str = str.replace('.mw-parser-output', '').replace('.object-usage-tag{font-style:italic}.mw-parser-output', '').replace('.deprecated{color:olivedrab}', '')
        trns.push(str)
    }
    return trns
}

function commonStem(rdict, dia, pwfs) {
    pwfs = _.uniq(pwfs)
    if (!pwfs.length) return
    let syms = pwfs[0].split('')
    let stems = []
    let stop = false
    syms.forEach((sym, idx)=> {
        if (stop) return
        let tmps = pwfs.map(pwf=> pwf[idx])
        if (_.uniq(tmps).length == 1) stems.push(sym)
        else stop = true
    })
    let stem = stems.join('')
    stem = checkDiaStem(dia.time, stem, pwfs)
    if (!stem) {
        dia.comm = 'dia no stem'
        dia.irreg = true
        log('_no_stem:', rdict, dia.time, pwfs[0])
        // throw new Error()
    }
    return stem
}

function checkDiaStem(time, stem, pwfs) {
    if (pwfs.includes(stem)) {
        if (time == 'aor') {
            stem = stem.replace(/θη$/, '')
        }
    }
    if (pwfs.includes(stem)) {
        let last = stem[stem.length-1]
        if (vowels.includes(last)) stem = stem.slice(0, -1)
    }
    // log('_xxxxxxxxxxxx', time, stem)
    return stem
}

function parseIrregDia(entry, dia) {
    let irregs = []
    dia.forms.forEach(form=> {
        form.time = dia.time
        form.cwf = comb(form.wf)
    })
    let irforms = dia.forms
    let irregrps = _.groupBy(irforms, 'cwf')
    for (let cwf in irregrps) {
        let fls = []
        let cwfgrps = irregrps[cwf]
        for (let form of cwfgrps) {
            // morph = [flex.tense, flex.numper].join(', ').trim()
            let iflex
            if (form.inf) {
                let tense = [form.time, form.voice, 'inf'].join('.')
                iflex = {verb: true, irreg: true, inf: true, tense}
            } else if (form.part) {
                // log('_PART', form)
                // TODO: непонятно, это добавится там, а если добавится здесь, то будет дубль? Или добавить, а дубль потом в юниках убрать? На всякий?
            } else if (form.mood) {
                let tense = [form.time, form.voice, form.mood].join('.')
                let numper = [form.num, form.person].join('.')
                iflex = {verb: true, irreg: true, tense, numper}
            }
            if (iflex) fls.push(iflex)
        }
        let jsons = fls.map(flex=> JSON.stringify(flex))
        jsons = _.uniq(jsons)
        fls = jsons.map(flex=> JSON.parse(flex))

        // MORPHS
        let morphs = prettyVerb(fls)
        let irreg = {verb: true, irreg: true, rdict: entry.rdict, dict: cwf, morphs}
        irreg.trns = entry.trns
        irregs.push(irreg)
    }
    // log('_irreg_verb', entry.rdict, irregs.length)
    // irverbs.push(...irregs)
    return irregs
}

function parseIrregEntry(entry) {
    let irregs = []
    let irforms = []
    if (!entry.vtimes || !entry.vtimes.length) {
        let indecl = {pos: 'verb', verb: true, indecl: true, rdict: entry.rdict, dict: comb(entry.rdict), trns: entry.trns}
        irverbs.push(indecl)
        return
    }

    for (let dia of entry.vtimes) {
        // log('_________________________________________________________TIME', dia.info.time)
        dia.forms.forEach(form=> {
            form.time = dia.info.time
            form.wf = comb(form.wf)
        })
        irforms.push(...dia.forms)
    }
    // log('_________________________________________________________IV', irforms.length)
    // form ->> { wf: 'ἴσασι', mood: 'ind', voice: 'act', num: 'pl', person: 3 },

    let irregrps = _.groupBy(irforms, 'wf')
    // log('_irregrps', irregrps)
    for (let cwf in irregrps) {
        cwf = comb(cwf)
        let fls = []
        let cwfgrps = irregrps[cwf]
        for (let form of cwfgrps) {
            // morph = [flex.tense, flex.numper].join(', ').trim()
            let iflex
            if (form.inf) {
                let tense = [form.time, form.voice, 'inf'].join('.')
                iflex = {verb: true, irreg: true, inf: true, tense}
            } else if (form.part) {
                // log('_PART', form)
                // TODO: непонятно, это добавится там, а если добавится здесь, то будет дубль? Или добавить, а дубль потом в юниках убрать? На всякий?
            } else if (form.mood) {
                let tense = [form.time, form.voice, form.mood].join('.')
                let numper = [form.num, form.person].join('.')
                iflex = {verb: true, irreg: true, tense, numper}
            }
            if (iflex) fls.push(iflex)
        }
        let jsons = fls.map(flex=> JSON.stringify(flex))
        jsons = _.uniq(jsons)
        fls = jsons.map(flex=> JSON.parse(flex))

        // MORPHS
        let morphs = prettyVerb(fls)
        let irreg = {pos: 'verb', verb: true, irreg: true, rdict: entry.rdict, dict: cwf, morphs}
        irreg.trns = entry.trns
        irregs.push(irreg)
    }
    // log('_irreg_verb', entry.rdict, irregs.length)
    irverbs.push(...irregs)
}
