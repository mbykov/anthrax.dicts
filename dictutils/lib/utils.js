import _  from 'lodash'
import path  from 'path'
import fse from 'fs-extra'

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

