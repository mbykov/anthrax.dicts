const log = console.log

export function parseEntryType(str) {
    let type = ''
    if (/οος-ους, οος-ους, οον-ουν/.test(str) ) type = 'οος'
    else if (/έης-ῆς, έεος-έους/.test(str) ) type = 'έης'
    else if (/εός-οῦς, εοῦ-οῦ/.test(str) ) type = 'εός'
    else if (/όεις-οῦς, όεσσα-οῦσσα, όεν-οῦν/.test(str) ) type = 'όεις'
    else if (/οος-ους, όου-ου/.test(str) ) type = 'οος'
    else if (/έος-οῦς, έα-ῆ, έον-οῦν/.test(str) ) type = 'έος'
    else if (/έα-ῆ, έας-ῆς/.test(str) ) type = 'έα'
    else if (/έη-ῆ, έης-ῆς/.test(str) ) type = 'έη'
    else if (/όος-οῦς, όη-ῆ, όον-οῦν/.test(str) ) type = 'όος'
    else if (/εος-οῦς, έα-ᾶ, εον-οῦν/.test(str) ) type = 'εος'
    else if (/οος-ους, οος-ους, οον-ου/.test(str) ) type = 'οος'

    // nouns
    else if (/ης, εος-ους/.test(str) ) type = 'ης'
    else if (/ος, εος-ους/.test(str) ) type = 'ος'
    else if (/ώ, όος-οῦς/.test(str) ) type = 'ώ'

    else if (/ώς, όος-οῦς/.test(str) ) type = 'ώς'
    else if (/ες, εος-ους/.test(str) ) type = 'ες'
    else if (/ης, εος-ους/.test(str) ) type = 'ης'
    else if (/ης, εος-ους/.test(str) ) type = 'ης'
    else if (/ης, εος-ους/.test(str) ) type = 'ης'

    return type
}
