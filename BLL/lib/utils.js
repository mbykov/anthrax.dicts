//
// copy athrax.js/lib/utils

export function parseAug (aplain) {
    let aug = '', tail = aplain
    if (!vowels.includes(aplain[0])) return {aug, tail}
    for (let asp of asps) {
    let parts = aplain.split(asp)
        if (parts.length == 2) aug = parts[0] + asp, tail = parts[1]
    }
    if (tail[0] == ypo) aug += ypo, tail = tail.slice(1)
    return {aug, tail}
}

export const vowels =  ['α', 'ε', 'ι', 'ο', 'ω', 'η', 'υ', 'ͅ'] // ypo last

export const asps = ['\u0313', '\u0314']

export const ypo = '\u0345'

export const  gends = ['masc', 'fem', 'neut']

export const art2gend = {
    'ὁ': ['masc'],
    'τὸ': ['neut'],
    'ἡ': ['fem'],
    'οἱ': ['masc'], // pl
    'τὰ': ['neut'],
    'αἱ': ['fem'],
    'ὁ, ἡ': ['masc', 'fem'],
    'ὁ, ἡ, τὸ': ['masc', 'fem', 'neut'],
    '': ['', ''],
}

export const accents = {
    'oxia': '\u0301',
    'varia_': '\u0060',
    'varia': '\u0300',
    'peris': '\u0342',
    '': '',
    'psili': '\u0313',
    'dasia': '\u0314',
    '': '',
    // 'ypo': '\u0345',
    '': ''
}

export const doubledot = '̈'

// ἀ ἄ Ἀ ἅ ᾆ Ἄ ἁ Ἁ Ἆ
// ['Α', 'α', 'ἀ', 'ἄ', 'Ἀ', 'ἅ', 'ᾆ', 'ἁ', 'Ἄ', 'Ἁ', 'Ἆ']

export function cleanStress(text) {
    text = text.replace(/ϐ/g, 'β')
    text = text.replace(/·/g, '·')
    text = text.replace(/ό/g, 'ό')
    text = text.replace(/ί/g, 'ί')
    text = text.replace(/ά/g, 'ά')
    text = text.replace(/ή/g, 'ή')
    text = text.replace(/ώ/g, 'ώ')
    text = text.replace(/έ/g, 'έ')
    text = text.replace(/ύ/g, 'ύ')
    return text
}

export const arts = {
    'ἡ': {gend: 'fem'},
    'ὁ': {gend:'masc'},
    'τό': {gend:'neut'},
    'τὸ': {gend:'neut'}, // grave accent ???
    'τά': {gend: 'neut', pl: true},
    'αἱ': {gend: 'fem', pl: true},
    'οἱ': {gend: 'masc', pl: true}
}

export function typicalNounGend(cstr) {
    let gend = ''
    if (cstr.endsWith('ος')) gend = 'masc'
    else if (cstr.endsWith('ός')) gend = 'masc'
    else if (cstr.endsWith('ης')) gend = 'masc'
    else if (cstr.endsWith('ής')) gend = 'masc'
    else if (cstr.endsWith('ας')) gend = 'masc'
    else if (cstr.endsWith('ωρ')) gend = 'masc'
    else if (cstr.endsWith('ους')) gend = 'masc'
    else if (cstr.endsWith('ύς')) gend = 'masc'
    else if (cstr.endsWith('υς')) gend = 'masc'
    else if (cstr.endsWith('ήρ')) gend = 'masc'
    else if (cstr.endsWith('ων')) gend = 'masc'
    else if (cstr.endsWith('ών')) gend = 'masc'
    else if (cstr.endsWith('άν')) gend = 'masc'


    else if (cstr.endsWith('α')) gend = 'fem'
    else if (cstr.endsWith('ά')) gend = 'fem'
    else if (cstr.endsWith('η')) gend = 'fem'
    else if (cstr.endsWith('ή')) gend = 'fem'
    else if (cstr.endsWith('ῆ')) gend = 'fem'
    else if (cstr.endsWith('ίς')) gend = 'fem'
    else if (cstr.endsWith('ις')) gend = 'fem'
    else if (cstr.endsWith('ΐς')) gend = 'fem'
    else if (cstr.endsWith('άς')) gend = 'fem'
    else if (cstr.endsWith('ως')) gend = 'fem'



    else if (cstr.endsWith('ον')) gend = 'neut'



    return gend
}
