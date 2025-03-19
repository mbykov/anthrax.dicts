import { parseNounData } from './parseNounData.js'
import { typeVerbKey } from '../../WKT/wkt/wkt-keys/type-verb-key.js' // типичные генетивы для VERB
import { nounKey } from '../../WKT/wkt/wkt-keys/key-noun.js' // stypes for the nouns
import { adjKey } from '../../WKT/wkt/wkt-keys/key-adj.js' // stypes for the nouns
import { shortKeys } from '../../WKT/wkt/wkt-keys/key-adj-short.js' // перечесление adj stypes без genitive
import {comb, plain} from 'orthos'

const log = console.log

export function parseMorphData(str) {
    let attrs
    if (/ adv\./.test(str)) attrs = {adverb: true}
    else if (/ adverb /.test(str)) attrs = {adverb: true}
    else if (/ indécl. /.test(str)) attrs = {indecl: true}
    else if (/ exclamation /.test(str)) attrs = {indecl: true}
    else if (/ préfixe /.test(str)) attrs = {indecl: true, prefix: true}

    // interj.

    if (attrs) return attrs

    // == NOUN == IF
    let art = parseArt(str)
    let ends = parseNounData(str)
    if (art || ends) {
        attrs = {name: true, art, ends}
    }

    // log('_NOUN RAW', str, attrs)
    if (attrs) return attrs

    // ADJECTIVES

    if (/adj\./.test(str)) attrs = {name: true, ends: 'adj'}
    else if (/ός, ή, όν/.test(str) ) attrs = {name: true, ends: 'ός, ή, όν'}
    else if (/ος, α, ον/.test(str)) attrs = {name: true, ends: 'ος, α, ον'}
    else if (/ής, ής, ές/.test(str)) attrs = {name: true, ends: 'ής, ής, ές'}
    else if (/ος, ος, ον/.test(str)) attrs = {name: true, ends: 'ος, ος, ον'}
    else if (/ως, ως, ων/.test(str)) attrs = {name: true, ends: 'ως, ως, ων'}
    else if (/εις, εσσα, εν/.test(str)) attrs = {name: true, ends: 'εις, εσσα, εν'}
    else if (/ης, ης, ες/.test(str)) attrs = {name: true, ends: 'ης, ης, ες'}
    else if (/ων, ων, ον/.test(str)) attrs = {name: true, ends: 'ων, ων, ον'}
    else if (/οος-ους, οος-ους, οον-ουν/.test(str)) attrs = {name: true, ends: 'οος-ους, οος-ους, οον-ουν'}
    else if (/ός, ός, όν/.test(str)) attrs = {name: true, ends: 'ός, ός, όν'}
    else if (/ός, ά, όν/.test(str)) attrs = {name: true, ends: 'ός, ά, όν'}
    else if (/εῖος, εία, εῖον/.test(str)) attrs = {name: true, ends: 'εῖος, εία, εῖον'}
    else if (/ος, η, ον/.test(str)) attrs = {name: true, ends: 'ος, η, ον'}
    else if (/υς, υς, υ/.test(str)) attrs = {name: true, ends: 'υς, υς, υ'}
    else if (/οῦς, οῦς, οῦν/.test(str)) attrs = {name: true, ends: 'οῦς, οῦς, οῦν'}
    else if (/ος, α .ion. η., ον/.test(str)) attrs = {name: true, ends: 'ος, α-η, ον'}
    else if (/ύς, εῖα, ύ/.test(str)) attrs = {name: true, ends: 'ύς, εῖα, ύ'}
    else if (/ους, ους, ουν/.test(str)) attrs = {name: true, ends: 'ους, ους, ουν'}
    else if (/ήεις, ήεσσα, ῆεν/.test(str)) attrs = {name: true, ends: 'ήεις, ήεσσα, ῆεν'}
    else if (/όεις, όεσσα, όεν/.test(str)) attrs = {name: true, ends: 'όεις, όεσσα, όεν'}
    else if (/ης, ης, ες/.test(str)) attrs = {name: true, ends: 'ης, ης, ες'}
    else if (/ωρ, ωρ, ορ/.test(str)) attrs = {name: true, ends: 'ωρ, ωρ, ορ'}
    else if (/ις, ις, ι/.test(str)) attrs = {name: true, ends: 'ις, ις, ι'}
    else if (/ος, η \(pour ος\), ον/.test(str)) attrs = {name: true, ends: 'ος, η (pour ος), ον'}
    else if (/είς, εῖσα, έν/.test(str)) attrs = {name: true, ends: 'είς, εῖσα, έν'}
    else if (/ος, η, ο/.test(str)) attrs = {name: true, ends: 'ος, η, ο'}
    else if (/οος, οος, οον/.test(str)) attrs = {name: true, ends: 'οος, οος, οον'}
    else if (/εος-οῦς, έα-ᾶ, εον-οῦν/.test(str)) attrs = {name: true, ends: 'εος-οῦς, έα-ᾶ, εον-οῦν'}
    else if (/υς, εια, υ/.test(str)) attrs = {name: true, ends: 'υς, εια, υ'}
    else if (/ας, ασα, αν/.test(str)) attrs = {name: true, ends: 'ας, ασα, αν'}
    else if (/ος, ος ou α, ον/.test(str)) attrs = {name: true, ends: 'ος, ος ou α, ον'}
    else if (/ον, ος, ον/.test(str)) attrs = {name: true, ends: 'ον, ος, ον'}
    else if (/ής, ή, ές/.test(str)) attrs = {name: true, ends: 'ής, ή, ές'}
    else if (/ών, οῦσα, όν/.test(str)) attrs = {name: true, ends: 'ών, οῦσα, όν'}
    else if (/ας, -ασα, -αν/.test(str)) attrs = {name: true, ends: 'ας, ασα, αν'}
    else if (/όος-οῦς, όη-ῆ, όον-οῦν/.test(str)) attrs = {name: true, ends: 'όος-οῦς, όη-ῆ, όον-οῦν'} // ἁ·πλόος-οῦς
    else if (/ης, ης, neutre/.test(str)) attrs = {name: true, ends: 'ης, ης, ες'}
    else if (/ός, ή, ό/.test(str)) attrs = {name: true, ends: 'ός, ή, ό'} // αὐτός,
    else if (/ός, ός ou ή, όν/.test(str)) attrs = {name: true, ends: 'ός, ός-ή, όν'}
    else if (/ος, α ou ος, ον/.test(str)) attrs = {name: true, ends: 'ος, α, ον'}
    else if (/ος, ος ou η, ον/.test(str)) attrs = {name: true, ends: 'ος, η, ον'}
    else if (/ων, ουσα, ον/.test(str)) attrs = {name: true, ends: 'ων, ουσα, ον'}
    else if (/ός, ή ou ός, όν/.test(str)) attrs = {name: true, ends: 'ός, ή-ός, όν'}
    else if (/ος, ος et α, ον/.test(str)) attrs = {name: true, ends: 'ος, α-ος, ον'}
    else if (/ός, ή ou ός, όν/.test(str)) attrs = {name: true, ends: 'ός, ή-ός, όν'}
    else if (/όος, όος, όον/.test(str)) attrs = {name: true, ends: 'όος, όος, όον'}
    else if (/όος-οῦς, όος-οῦς, όον-οῦν/.test(str)) attrs = {name: true, ends: 'όος-οῦς, όος-οῦς, όον-οῦν'}
    else if (/οι, αι, α/.test(str)) attrs = {name: true, ends: 'οι, αι, α'}
    else if (/ος, η ou ος, ον/.test(str)) attrs = {name: true, ends: 'ος, η-ος, ον'}
    else if (/ος, η ou ος, ον/.test(str)) attrs = {name: true, ends: 'ος, η-ος, ον'}
    else if (/ας, αινα, αν/.test(str)) attrs = {name: true, ends: 'ας, αινα, αν'}
    else if (/ῦς, ᾶ, οῦν/.test(str)) attrs = {name: true, ends: 'ῦς, ᾶ, οῦν'}
    else if (/εος-οῦς, έα-ῆ, εον-οῦν/.test(str)) attrs = {name: true, ends: 'εος-οῦς, έα-ῆ, εον-οῦν'}
    else if (/ός, ά, όν/.test(str)) attrs = {name: true, ends: 'ός, ά, όν'}
    else if (/ός, ή, όν/.test(str)) attrs = {name: true, ends: 'ός, ή, όν'}
    else if (/όεις-οῦς, όεσσα-οῦσσα, όεν-οῦν/.test(str)) attrs = {name: true, ends: 'όεις-οῦς, όεσσα-οῦσσα, όεν-οῦν'}
    else if (/έος-οῦς, έα-ῆ, έον-οῦν/.test(str)) attrs = {name: true, ends: 'έος-οῦς, έα-ῆ, έον-οῦν'}
    else if (/ών, οῦσα, όν/.test(str)) attrs = {name: true, ends: 'ών, οῦσα, όν'}
    else if (/όος-οῦς, όη-ῆ, όον-οῦν/.test(str)) attrs = {name: true, ends: 'όος-οῦς, όη-ῆ, όον-οῦν'}

    else if (/ις, ις, ι/.test(str)) attrs = {name: true, ends: 'ις, ις, ι'}

    if (attrs && attrs.name && attrs.ends) {
        if (/, contract. /.test(str)) attrs.irreg = true
        else if (/, poét. /.test(str)) attrs.irreg = true
        else if (/, v. /.test(str)) attrs.irreg = true
        else if (/, vb. /.test(str)) attrs.irreg = true
        else if (/, v. /.test(str)) attrs.irreg = true
        else if (/, v. /.test(str)) attrs.irreg = true
    }

    // log('_MORPH: ADJ RAW', str, attrs)
    if (attrs) return attrs

    // VERBS
    // log('_V RAW', str)


    // REG VERBS

    let parts = str.split(/,? /)
    let raw = parts[0]
    // log('_V RAW', raw)
    // if (firstwf.split(' ').length > 1) return // phrases, пока пропускаю

    let rdict = raw.replace('ω-ῶ', 'ω')

    let cwf = comb(rdict)

    let type = ''
    for (let ctype in typeVerbKey) {
        let rectype = new RegExp(ctype + '$')
        if (!rectype.test(cwf)) continue
        if (ctype.length >= type.length) type = ctype
    }
    if (!type) {
        // log('_no verb type', rdict, '_STR:', str)
        attrs = {irreg: true, no_verb_type: true}
        return attrs
        // throw new Error()
    }
    ends = typeVerbKey[type].max
    attrs = attrs = {verb: true, type, ends}

    // log('_MORPH VERB', rdict, cwf, type)

    if (attrs) return attrs


    if (/, contract. /.test(str)) attrs = {verb: true, irreg: true}
    else if (/, poét. /.test(str)) attrs = {verb: true, irreg: true}
    else if (/ v. /.test(str)) attrs = {verb: true, irreg: true}
    else if (/, vb. /.test(str)) attrs = {verb: true, irreg: true}
    else if (/ act. /.test(str)) attrs = {verb: true, irreg: true}
    else if (/ pass. /.test(str)) attrs = {verb: true, irreg: true}
    else if (/ impers\. /.test(str)) attrs = {verb: true, irreg: true, ends: 'impers'}
    else if (/ inf\. /.test(str)) attrs = {verb: true, irreg: true, ends: 'inf'}
    else if (/ ao\. /.test(str)) attrs = {verb: true, irreg: true, ends: 'aor'}
    else if (/ prés\. /.test(str)) attrs = {verb: true, irreg: true, ends: 'pres'}
    else if (/ impf\. /.test(str)) attrs = {verb: true, irreg: true, ends: 'pres'}
    else if (/ impér\. /.test(str)) attrs = {verb: true, irreg: true, ends: 'pres'}
    else if (/ mieux que /.test(str)) attrs = {verb: true, irreg: true}
    else if (/, v. /.test(str)) attrs = {verb: true, irreg: true}
    else if (/ ou /.test(str)) attrs = {verb: true, irreg: true} // нехорошо

    if (attrs) return attrs

}

function parseArt(str) {
    let art = ''
    if (/\(ὁ\)/.test(str)) art = 'ὁ'
    else if (/\(τὸ\)/.test(str)) art = 'τὸ'
    else if (/\(ἡ\)/.test(str)) art = 'ἡ'
    else if (/\(οἱ\)/.test(str)) art = 'οἱ'
    else if (/\(τὰ\)/.test(str)) art = 'τὰ'
    else if (/\(αἱ\)/.test(str)) art = 'αἱ'
    else if (/\(ὁ, ἡ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ὁ ou ἡ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ὁ, poét\. ἡ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ὁ, ἡ, τὸ\)/.test(str)) art = 'ὁ, ἡ, τὸ'
    else if (/\(ὁ et ἡ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ἡ ou ὁ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ἡ, qqf. ὁ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ἡ, rar. ὁ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ὁ ; dans les Trag. ἡ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ἡ, et non ὁ\)/.test(str)) art = 'ἡ'
    else if (/\(ἡ, rar. ὁ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ὁ, rar. ἡ\)/.test(str)) art = 'ὁ, ἡ'
    else if (/\(ὁ, qqf. ἡ\)/.test(str)) art = 'ὁ, ἡ'

    // miendss:
    else if (/\(τὸ\)/.test(str)) art = 'τὸ'

    // if (attrs && attrs.art) {
    //     if (/ fém. d\’/.test(str)) attrs = {name: true, irreg: true, art: ''}
    //     else if (/ dat\. /.test(str)) attrs = {name: true, irreg: true, art: ''}
    //     else if (/ gén.-dat. /.test(str)) attrs = {name: true, irreg: true, art: ''}
    //     else if (/ neutre /.test(str)) attrs = {name: true, irreg: true, art: ''}
    //     else if (/ # /.test(str)) attrs = {name: true, irreg: true, art: ''}
    // }

    return art
}

// зесь не получилось, потому что замена на запятую через один дефис: ους-οος-ους-οος-ουν-οον -> οος-ους, οος-ους, οον-ουν
function parseAdj_HASH(cstr) {
    // log('_=====', cstr)
    let ends = ''
    for (let nkey of shortKeys) {
        nkey = nkey.replace(/-/g, ', ')
        let rekey = new RegExp(nkey)
        if (!rekey.test(cstr)) continue
        if (nkey.length >= ends.length) ends = nkey
    }
    // log('_ADJ ENDS', ends)
    let attrs = {ends}
    if (ends) attrs.name = true
    return attrs
}

function parseNoun_HASH(cstr, art) {
    let ends = ''
    for (let nkey in nounKey) {
        nkey = nkey.replace('-', ', ')
        let rekey = new RegExp(nkey)
        if (!rekey.test(cstr)) continue
        if (nkey.length >= ends.length) ends = nkey
    }
    let attrs = {art, ends}
    if (art || ends) {
        attrs.name = true
        return attrs
    }
}

export function parseMorphData_HASH(str) {
    // log('_================', str)
    let attrs
    if (/ adv\./.test(str)) attrs = {adverb: true}
    else if (/ adverb /.test(str)) attrs = {adverb: true}
    else if (/ indécl. /.test(str)) attrs = {indecl: true}
    else if (/ exclamation /.test(str)) attrs = {indecl: true}
    else if (/ préfixe /.test(str)) attrs = {indecl: true, prefix: true}

    let art = parseArt(str)
    let cstr = comb(str)
    // log('_ART', art)
    attrs = parseNoun(cstr, art)
    if (attrs) return attrs
    attrs = parseAdj(cstr)
    if (attrs) return attrs

    return attrs
}
