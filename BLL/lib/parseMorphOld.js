function parseMorph_(str) {
    let morph
    let cdicts = []
    let parts = str.split(/, /)
    let firstwf = parts[0]
    if (firstwf.split(' ').length > 1) return // phrases, пока пропускаю

    let attrs = parseMorphData(str)
    if (!attrs) {
        no_morphs.push(str)
        return []
    }
    if (attrs.indecl) cdicts = parseIndecl(attrs, str)

    return cdicts


    if (morph) return morph

    if (/ part\. /.test(str)) morph = parsePart(str)


    if (morph) return morph

    if (firstwf[firstwf.length-1] == 'ω') morph = parseVerb(str, 'ω')
    else if (firstwf[firstwf.length-1] == 'ῶ') morph = parseVerb(str, 'ῶ')
    else if (firstwf[firstwf.length-1] == 'ε') morph = parseVerb(str, 'ε')
    else if (firstwf.slice(-4) == 'ομαι') morph = parseVerb(str, 'ομαι')
    else if (firstwf.slice(-4) == 'ῶμαι') morph = parseVerb(str, 'ῶμαι')
    else if (firstwf.slice(-5) == 'οῦμαι') morph = parseVerb(str, 'οῦμαι')
    else if (firstwf.slice(-4) == 'αμαι') morph = parseVerb(str, 'αμαι')
    else if (firstwf.slice(-3) == 'υμι') morph = parseVerb(str, 'υμι')
    else if (firstwf.slice(-3) == 'ημι') morph = parseVerb(str, 'ημι')
    else if (firstwf.slice(-4) == 'υμαι') morph = parseVerb(str, 'υμαι')
    else if (firstwf.slice(-3) == 'ωμι') morph = parseVerb(str, 'ωμι')
    else if (firstwf.slice(-4) == 'ιμαι') morph = parseVerb(str, 'ιμαι')
    else if (firstwf.slice(-3) == 'ιμι') morph = parseVerb(str, 'ιμι')
    else if (firstwf.slice(-4) == 'ημαι') morph = parseVerb(str, 'ημαι')


    else if (/ impers\. /.test(str)) morph = parseVerbForm(str, 'impers')
    else if (/ inf\. /.test(str)) morph = parseVerbForm(str, 'inf')
    else if (/ ao\. /.test(str)) morph = parseVerbForm(str, 'aor')
    else if (/ prés\. /.test(str)) morph = parseVerbForm(str, 'pres')
    else if (/ impf\. /.test(str)) morph = parseVerbForm(str, 'pres')
    else if (/ impér\. /.test(str)) morph = parseVerbForm(str, 'pres')


    else if (/ pl\. ind\. /.test(str)) morph = parseVerbForm(str, 'x')
    else if (/ sg. fut. /.test(str)) morph = parseVerbForm(str, 'x')

    else if (/, acc. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, dor. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, pf. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, épq. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, ion. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, att. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, fém. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, pl. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, élis. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, transcript. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, correct. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, anc. att. /.test(str)) morph = parseIndecl(str, 'x')

    else if (/, acc. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, acc. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, acc. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, acc. /.test(str)) morph = parseIndecl(str, 'x')
    else if (/, acc. /.test(str)) morph = parseIndecl(str, 'x')


    if (morph) return morph

        if (!morph) {
        // log('_NO MORPH', str)
        // throw new Error()
        no_morphs.push(str)
    }

    if (/ préfixe /.test(str)) morph  = parsePrefix(str)

    if (/ v\. /.test(str)) morph = 'Z'
    else if (/ vb\. /.test(str)) morph = 'Z'
    else if (/ f\. /.test(str)) morph = 'Z'
    else if (/\[ᾰ\]/.test(str)) morph = 'Z'
    else if (/\[τᾱ\]/.test(str)) morph = 'Z'
    else if (/\[ᾰῑῐ\]/.test(str)) morph = 'Z'
    else if (/βουλάς, Il. 10/.test(str)) morph = 'Z'
    else if (/ c\. /.test(str)) morph = 'Z'
    else if (/βακκάριον μύρον/.test(str)) morph = 'Z'
    else if (/Βακχέ·ϐακχον ᾆσαι/.test(str)) morph = 'Z'
    else if (/^βοάω\)\./.test(str)) morph = 'Z'
    else if (/^βρέμω\)\./.test(str)) morph = 'Z'
    else if (/^βάσις, Soph\./.test(str)) morph = 'Z'
    else if (/ἀγα·κτιμένη πόλις/.test(str)) morph = 'Z'
    else if (/ἀγαλματίας, ου/.test(str)) morph = 'Z'
    else if (/ἀγκεράτεσσι, p. ἀνὰ κεράτεσσι/.test(str)) morph = 'Z'
    else if (/ἀκαμαντο·χάρμας/.test(str)) morph = 'Z'
    else if (/ἀλογίου δίκη/.test(str)) morph = 'Z'
    else if (/ἀμῇ ou ἀμῆ, att. ἁμῆ/.test(str)) morph = 'Z'
    else if (/genre inc\./.test(str)) morph = 'Z'

    else if (/z/.test(str)) morph = 'Z'
    else if (/z/.test(str)) morph = 'Z'


    if (/hébreu/.test(str)) morph = parseIndecl(str)
    else if (/onomatopée/.test(str)) morph = parseIndecl(str)
    else if (/ interj\. /.test(str)) morph = parseIndecl(str)
    else if (/, interj. /.test(str)) morph = parseIndecl(str)

    else if (/, conj. /.test(str)) morph = parseIndecl(str)
    else if (/ particule /.test(str)) morph = parseIndecl(str)
    else if (/ interj\. /.test(str)) morph = parseIndecl(str)
    else if (/ indécl\. /.test(str)) morph = parseIndecl(str)
    else if (/ prép\. /.test(str)) morph = parseIndecl(str)
    else if (/, postér. /.test(str)) morph = parseIndecl(str)


    else if (/dans les loc\./.test(str)) morph = parseIndecl(str)
    else if (/ dev. une voy\./.test(str)) morph = parseIndecl(str)
    else if (/ἀνέρος ἀνήρ/.test(str)) morph = parseIndecl(str)


    // forms
    if (/pf\. pass\./.test(str)) morph = parseIndeclForm(str)
    else if (/pf\. act\./.test(str)) morph = parseIndeclForm(str)
    else if (/3 sg\./.test(str)) morph = parseIndeclForm(str)
    else if (/ seul\./.test(str)) morph = parseIndeclForm(str)
    else if (/ inf\. ao./.test(str)) morph = parseIndeclForm(str)
    else if (/ fém\. du /.test(str)) morph = parseIndeclForm(str)
    else if (/ plur\. de /.test(str)) morph = parseIndeclForm(str)
    else if (/ dans la loc\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ par renforcement du suiv\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ fém\. de /.test(str)) morph = parseIndeclForm(str)
    else if (/ var\. p\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ var\. de /.test(str)) morph = parseIndeclForm(str)
    else if (/ par contr\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ crase p\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ἀδεᾶ, acc. sg. /.test(str)) morph = parseIndeclForm(str)
    else if (/ἄ·δηρις, ις, ι, ιος/.test(str)) morph = parseIndeclForm(str)
    else if (/ἀδιανοήτως, sans réflexion/.test(str)) morph = parseIndeclForm(str)
    else if (/ἀειφυγίᾳ, Plut. Sol/.test(str)) morph = parseIndeclForm(str)
    else if (/ἄεσα \[ᾰε mais ᾱε à l’arsis\] ao. épq./.test(str)) morph = parseIndeclForm(str)
    else if (/ἀήρ, ἀέρος/.test(str)) morph = parseIndeclForm(str)
    else if (/ἄ·θεμις, ις, ι, ιτος/.test(str)) morph = parseIndeclForm(str)
    else if (/ἀ·θρόος, att. ἁ·θρόος, όα, όον/.test(str)) morph = parseIndeclForm(str)
    else if (/ἄ·ϊδρις, ις, ι, ιος/.test(str)) morph = parseIndeclForm(str)
    else if (/αἴθ’, élis. p. αἴθε/.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ἄ·ϊρος Ἶρος/.test(str)) morph = parseIndeclForm(str)
    else if (/ sup\. d/.test(str)) morph = parseIndeclForm(str)
    else if (/ cp\. d/.test(str)) morph = parseIndeclForm(str)
    else if (/ mauv. prononc. /.test(str)) morph = parseIndeclForm(str)
    else if (/αἰ. Lycurg. 155. /.test(str)) morph = parseIndeclForm(str, 'err')
    else if (/ἀκάτα, Eschl. /.test(str)) morph = parseIndeclForm(str)
    else if (/ἁμαρτίας, NT\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ ion\. p\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ pl\. d/.test(str)) morph = parseIndeclForm(str)
    else if (/ neutre d/.test(str)) morph = parseIndeclForm(str)
    else if (/ att\. p\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ἀλληλοφαγέειν-εῖν /.test(str)) morph = parseIndeclForm(str)
    else if (/ gén\. pl\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ pour /.test(str)) morph = parseIndeclForm(str)
    else if (/ p\. /.test(str)) morph = parseIndeclForm(str)
    else if (/ἀοιδή, /.test(str)) morph = parseIndeclForm(str)

    else if (/ἀμούσως, /.test(str)) morph = parseIndeclForm(str)

    else if (/, nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)
    else if (/ nom. fém. /.test(str)) morph = parseIndeclForm(str)


    if (/Bèthphagè/.test(str)) morph = parsePerson(str)
    if (str[0] != str[0].toLowerCase()) morph = parsePerson(str)

    else if (/ pf\. /.test(str)) morph = parseVerb(str)

    if (!morph) {
        // log('_NO MORPH', str)
        // throw new Error()
        no_morphs.push(str)
    }
    if (morph == 'Z') morph = []
    // TODO: проверить полноту
    return []
}
