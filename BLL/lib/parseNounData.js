export function parseNounData(str) {
    let ends = ''

    if (/Α, α Α, α/.test(str)) ends = 'X'
    else if (/Β, β, β Β, β, β/.test(str)) ends = 'X'
    else if (/Φ, φ Φ, φ/.test(str)) ends = 'X'
    else if (/Υ, υ Υ, υ/.test(str)) ends = 'X'
    else if (/Ν, ν Ν, ν/.test(str)) ends = 'X'
    else if (/Τ, τ Τ, τ/.test(str)) ends = 'X'

    if (ends == 'X') return

    // o - greek !
    str = str.replace(/o/g, 'ο')
    str = str.replace(/ gén. /, ' ')

    // if (/, seul. /.test(str)) ends = 'X'
    // else if (/, acc. /.test(str)) ends = 'X'
    // // else if (/, /.test(str)) ends = 'X'
    // else if (/, épq. /.test(str)) ends = 'X'
    // else if (/, vοc. /.test(str)) ends = 'X'
    // else if (/ att. /.test(str)) ends = 'X'
    // else if (/, iοn. /.test(str)) ends = 'X'
    // else if (/\. iοn. /.test(str)) ends = 'X'
    // else if (/, v. /.test(str)) ends = 'X'
    // else if (/ dοr. /.test(str)) ends = 'X'
    // else if (/ sel. /.test(str)) ends = 'X'
    // else if (/ géοgr. /.test(str)) ends = 'X'
    // else if (/ dat. /.test(str)) ends = 'X'
    // else if (/ pοét. /.test(str)) ends = 'X'
    // else if (/ cοntract. /.test(str)) ends = 'X'

    // if (ends == 'X') return

    // if (/ος, η, ον/.test(str)) ends = 'X' // adj
    // else if (/ός, ός, όν/.test(str)) ends = 'X' // adj
    // else if (/ος, ος, ον/.test(str)) ends = 'X' // adj

    // IA
    if (/αία, ας/.test(str)) ends = 'αία, αίας'
    else if (/υιά, ᾶς/.test(str)) ends = 'υιά, υιᾶς'
    else if (/εία, ας/.test(str)) ends = 'εία, είας'
    else if (/ἀήθεια, ας/.test(str)) ends = 'X'
    else if (/ἀπάθεια, ας/.test(str)) ends = 'εια, είαις'
    else if (/ἐντέλεια, ας/.test(str)) ends = 'εία, είας'
    else if (/ἐπιείκεια, ας/.test(str)) ends = 'εια, είαις'
    else if (/ἐπιθυμίαμα, ατος/.test(str)) ends = 'ία, ίας'
    else if (/Ἐπιφάνεια, ων/.test(str)) ends = 'εια, είας'

    else if (/ίεια, ας/.test(str)) ends = 'ίεια, ιείας'
    else if (/αῖα, ας/.test(str)) ends = 'αῖα, αίας'
    else if (/αια, ας/.test(str)) ends = 'ία, ίας'
    else if (/εια, ας/.test(str)) ends = 'εια, είας'
    else if (/οια, ας/.test(str)) ends = 'οια, οίας'
    else if (/οια, ας/.test(str)) ends = 'οια, οίας'
    else if (/ία, ας/.test(str)) ends = 'ία, ίας'
    else if (/ια, ας/.test(str)) ends = 'ια, ίας'
    else if (/ιά, ᾶς/.test(str)) ends = 'ιά, ιᾶς'
    else if (/ια, ων/.test(str)) ends = 'ια, ίων'
    else if (/ύα, ας/.test(str)) ends = 'ύα, ύας'
    else if (/υα, ων/.test(str)) ends = 'υα, ύων'
    else if (/υῖα, ας/.test(str)) ends = 'υῖα, υίας'
    else if (/ῴα, ας/.test(str)) ends = 'ῴα, ῴας'
    else if (/ία, ας/.test(str)) ends = 'ία, ίας' // X
    else if (/ία, ίας/.test(str)) ends = 'ία, ίας'


    // A
    else if (/όα, ας/.test(str)) ends = 'όα, όας'
    else if (/ατα, ων/.test(str)) ends = 'ατα, άτων'
    else if (/άα, άας/.test(str)) ends = 'άα, άας'
    else if (/εα, ων/.test(str)) ends = 'εα, έων'
    else if (/έα, ας/.test(str)) ends = 'έα, έας'
    else if (/α, ατος/.test(str)) ends = 'α, ατος'
    else if (/α, ων/.test(str)) ends = 'α, ων'
    else if (/α, ας/.test(str)) ends = 'α, ας'
    else if (/α, ης/.test(str)) ends = 'α, ης'
    else if (/ά, ᾶς/.test(str)) ends = 'ά, ᾶς'
    else if (/ᾶ, ᾶς/.test(str)) ends = 'ᾶ, ᾶς'
    else if (/μα, ματος/.test(str)) ends = 'α, ατος'
    else if (/ά, ῶν/.test(str)) ends = 'ά, ῶν'
    else if (/α, ατoς/.test(str)) ends = 'α, ατoς'
    else if (/γαλα, -γάλακτος/.test(str)) ends = 'α, ακτος'
    else if (/α, ᾶς/.test(str)) ends = 'X'
    else if (/άα, άας/.test(str)) ends = 'α, ας'
    else if (/α, γάλακτος/.test(str)) ends = 'α, ακτος'
    else if (/ωα, ώων/.test(str)) ends = 'α, ων'
    else if (/α, ακτος/.test(str)) ends = 'α, ακτος'
    else if (/ᾶ, ῶν/.test(str)) ends = 'X'
    else if (/εα, -έης/.test(str)) ends = 'α, ης'
    else if (/έα, έας/.test(str)) ends = 'α, ας'
    else if (/ά, ᾶς/.test(str)) ends = 'ά, ᾶς'

    // AN
    else if (/άν, ᾶνος/.test(str)) ends = 'άν, ᾶνος'
    else if (/αν, ανος/.test(str)) ends = 'αν, ανος'
    // excl
    else if (/άν, Ἰᾶνος/.test(str)) ends = 'άν, ᾶνος'
    else if (/Πάν, Πανός/.test(str)) ends = 'X'
    else if (/παν, πανος/.test(str)) ends = 'αν, ανος'

    // AS
    else if (/ιάς, άδος/.test(str)) ends = 'ιάς, ιάδος'
    else if (/ιάς, άντος/.test(str)) ends = 'ιάς, ιάντος'
    else if (/υάς, άδος/.test(str)) ends = 'υάς, υάδος'
    else if (/εας, ατος/.test(str)) ends = 'εας, έατος'
    else if (/ύας, ου/.test(str)) ends = 'ύας, ύου'
    else if (/ας, ατος/.test(str)) ends = 'ας, ατος'
    else if (/άς, άντος/.test(str)) ends = 'άς, άντος'
    else if (/άς, οῦ/.test(str)) ends = 'X'
    else if (/ας, -ου/.test(str)) ends = 'ας, ου'
    else if (/άς, άγος/.test(str)) ends = 'X'
    else if (/ᾶς, οῦ οu ᾶ/.test(str)) ends = 'ᾶς, ᾶ'
    else if (/ᾶς, οῦ/.test(str)) ends = 'X'
    else if (/ας, εος-ους/.test(str)) ends = 'ας, εος-ους'
    else if (/άς, ᾶ/.test(str)) ends = 'X'
    else if (/όας, όου/.test(str)) ends = 'ας, ου'
    else if (/ας, εω/.test(str)) ends = 'X'
    else if (/ας, αος/.test(str)) ends = 'ας, αος'
    // AS
    else if (/ίας, ου/.test(str)) ends = 'ίας, ίου'
    else if (/άς, άδος/.test(str)) ends = 'άς, άδος'
    else if (/ας, ου/.test(str)) ends = 'ας, ου'
    else if (/ας, αντος/.test(str)) ends = 'ας, αντος'
    else if (/ας, α/.test(str)) ends = 'ας, α'
    else if (/ᾶς, ᾶντος/.test(str)) ends = 'ᾶς, ᾶντος'
    else if (/ᾶς, ᾶ/.test(str)) ends = 'ᾶς, ᾶ'

    // excl
    else if (/Παλμᾶς/.test(str)) ends = 'X'
    else if (/ας, κρεως/.test(str)) ends = 'ας, ως'
    else if (/έας, έου/.test(str)) ends = 'ας, ου'
    else if (/άς, ου/.test(str)) ends = 'X'
    else if (/Πάνσας,/.test(str)) ends = 'X'

    // OI
    else if (/αῖοι, ων/.test(str)) ends = 'αῖοι, αίων'
    else if (/άοι, ων/.test(str)) ends = 'άοι, άων'
    else if (/ιοι, ων/.test(str)) ends = 'ιοι, ίων'
    else if (/οι, ων/.test(str)) ends = 'οι, ων'
    else if (/οί, ῶν/.test(str)) ends = 'οί, ῶν'
    else if (/ῶοι, ώων/.test(str)) ends = 'οι, ων'
    else if (/οοι, όων/.test(str)) ends = 'οι, ων'
    else if (/Μιτραῖοι/.test(str)) ends = 'X'

    // AI
    else if (/αι, ῶν/.test(str)) ends = 'αι, ῶν'
    else if (/αί, ῶν/.test(str)) ends = 'αί, ῶν'
    else if (/ίαι, ίων/.test(str)) ends = 'X'
    else if (/αι, άων/.test(str)) ends = 'αι, άων'
    else if (/εαι, εῶν/.test(str)) ends = 'αι, ῶν'

    // AOS UOS
    else if (/άος, εος-ους/.test(str)) ends = 'άος, άεος'
    else if (/εῦος, εος-ους/.test(str)) ends = 'εῦος, εύους'

    // IOS
    else if (/Ἅλιος, ου/.test(str)) ends = 'ιος, ίοιο'

    else if (/ιος, ου/.test(str)) ends = 'ιος, ίου'
    else if (/ιος, pοét. -ίοιο/.test(str)) ends = 'ιος, ίοιο'
    else if (/ίος, ου/.test(str)) ends = 'ίος, ίου'
    else if (/ιός, οῦ/.test(str)) ends = 'ιός, ιοῦ'

    // OS
    else if (/ἄλσος, εος-ους/.test(str)) ends = 'ος, ους'
    else if (/Ἄγκος, ου/.test(str)) ends = 'ος, ους-εος-ευς'
    else if (/ἅδος οu ἄδος, εος-ους/.test(str)) ends = 'ος, εος'
    else if (/ἄφενος, ου/.test(str)) ends = 'ος, ους'
    else if (/ἄχθος, εος-ους/.test(str)) ends = 'ἄχθος, εος'
    else if (/ἅψος, εος-ους/.test(str)) ends = 'ος, εος'
    else if (/βρέφος, εος-ους/.test(str)) ends = 'ος, ους'
    else if (/δάκος, εος-ους/.test(str)) ends = 'ος, εος'
    else if (/δίψακος, ου/.test(str)) ends = 'ος, οις'
    else if (/δράκος, εος-ους/.test(str)) ends = 'ος, εος-ευς'
    else if (/ἔδαφος, εος-ους/.test(str)) ends = 'ος, ους'
    else if (/Ἔλεγχος, ου/.test(str)) ends = 'ος, ους-εος-ευς'
    else if (/ἕλκος, εος-ους/.test(str)) ends = 'ος, ους'

    else if (/εος, ου/.test(str)) ends = 'εος, έου'

    else if (/ος, ου/.test(str)) ends = 'ος, ου'
    else if (/ός, οῦ/.test(str)) ends = 'ός, οῦ'
    else if (/ος, εος-ους/.test(str)) ends = 'ος, εος-ους'

    else if (/ἅδος οu ἄδος, εος-ους/.test(str)) ends = 'ος, εος'
    else if (/ος, de/.test(str)) ends = 'X'

    else if (/ος, ἔπεος-ους/.test(str)) ends = 'ος, εος-ους'
    else if (/αος, αου/.test(str)) ends = 'ος, ου'
    else if (/ος, εος-οῦς/.test(str)) ends = 'ος, εος'
    else if (/φάος, φάεος-φάους/.test(str)) ends = 'ος, εος-ους'
    else if (/ος, εος/.test(str)) ends = 'ος, εος'
    else if (/ος, ἵννος οu ἰννός/.test(str)) ends = 'X'
    else if (/ος, ω/.test(str)) ends = 'ος, ω'
    else if (/εός, εοῦ/.test(str)) ends = 'εός, εοῦ'
    else if (/ῳός, ῳοῦ/.test(str)) ends = 'ῳός, ῳοῦ'
    else if (/πέος, πέεος-πέους/.test(str)) ends = 'ος, εος-ους'
    else if (/ῥόος-ῥοῦς, ῥόου-ῥοῦ/.test(str)) ends = 'όος-οῦς, όου-οῦ'
    else if (/ος, ον/.test(str)) ends = 'ος, ον'
    else if (/θύος, θύεος-ους/.test(str)) ends = 'ος, εος-ους'
    else if (/χάος, χάεος-χάους/.test(str)) ends = 'ος, εος-ους'


    else if (/ουν, ου/.test(str)) ends = 'ους, ου'
    // ON
    else if (/ἀγγούριον et ἄγγουρον, ου/.test(str)) ends = 'ιον, ίου'
    else if (/ἄλευρον, ου/.test(str)) ends = 'ον, οις'
    else if (/δωράκινον, ου/.test(str)) ends = 'ον, οις'
    else if (/ἕδνον, ου/.test(str)) ends = '' // ERR WKT

    else if (/ῷον, ου/.test(str)) ends = 'ῷον, ῴου'
    else if (/οῖον, ου/.test(str)) ends = 'οῖον, οίου'
    else if (/ῆον, ου/.test(str)) ends = 'ῆον, ήου'
    else if (/ήϊον, ου/.test(str)) ends = 'ήϊον, ηΐου'
    else if (/υῖον, ου/.test(str)) ends = 'υῖον, υίου'
    else if (/ειον, ου/.test(str)) ends = 'ειον, είου'
    else if (/ίον, ου/.test(str)) ends = 'ίον, ίου'
    else if (/υον, ου/.test(str)) ends = 'υον, ύου'
    else if (/ύον, ου/.test(str)) ends = 'ύον, ύου'
    else if (/εον, ου/.test(str)) ends = 'εον, έου'

    else if (/ὄον, ὄου/.test(str)) ends = 'X'
    else if (/αιον, ου/.test(str)) ends = 'αιον, αίου'
    else if (/εῖον, ου/.test(str)) ends = 'εῖον, είου'
    else if (/ιον, ου/.test(str)) ends = 'ιον, ίου'
    else if (/ον, ου/.test(str)) ends = 'ον, ου'
    else if (/όν, οῦ/.test(str)) ends = 'όν, οῦ'
    else if (/ὄν, ὄντος/.test(str)) ends = 'X'
    else if (/ον, οντος/.test(str)) ends = 'ον, οντος'

    // ES
    else if (/γες, ων/.test(str)) ends = 'γες, γων'
    else if (/ῆνες, ων/.test(str)) ends = 'ῆνες, ήνων'
    else if (/έοντες, ων/.test(str)) ends = 'έοντες, εόντων'
    else if (/ωνες, ώνων/.test(str)) ends = 'ες, ων'
    else if (/ες, εος-ους/.test(str)) ends = 'ες, ους' // X
    else if (/ές, έος-οῦς/.test(str)) ends = 'ές, οῦς'
    else if (/αές, αέος/.test(str)) ends = 'X'
    else if (/ες, ους/.test(str)) ends = 'ες, ους'
    else if (/ες, ῶν/.test(str)) ends = 'X'
    else if (/ῶες, ώων/.test(str)) ends = 'ῶες, ώων'
    else if (/ες, ων/.test(str)) ends = 'ες, ων'

    // H
    else if (/υή, ῆς/.test(str)) ends = 'υή, υῆς'
    else if (/οή, ῆς/.test(str)) ends = 'οή, οῆς'
    else if (/ύη, ης/.test(str)) ends = 'ύη, ύης'
    else if (/ίη, ης/.test(str)) ends = 'ίη, ίης'
    else if (/όη, ης/.test(str)) ends = 'όη, όης'
    else if (/η, ης/.test(str)) ends = 'η, ης'
    else if (/ή, ῆς/.test(str)) ends = 'ή, ῆς'
    else if (/ῆ, ῆς/.test(str)) ends = 'ῆ, ῆς'
    else if (/ή, -ῆς/.test(str)) ends = 'ή, ῆς'
    else if (/ή, ῆς/.test(str)) ends = 'ή, ῆς'
    else if (/η, ων/.test(str)) ends = 'X'
    else if (/ή, γυναικός/.test(str)) ends = 'ή, αικός'
    else if (/ή, ῆ/.test(str)) ends = 'X'
    else if (/η, ῶν/.test(str)) ends = 'X'
    else if (/εα-η, έων-ῶν/.test(str)) ends = 'εα-η, έων'

    // THS
    else if (/ότης, ητος/.test(str)) ends = 'ότης, ότητος'
    else if (/ίτης, ου/.test(str)) ends = 'ίτης, ίτου'
    else if (/άτης, ου/.test(str)) ends = 'άτης, άτου'
    else if (/ύτης, ητος/.test(str)) ends = 'ύτης, ύτητος'
    else if (/ότης, ου/.test(str)) ends = 'ότης, ότου'
    else if (/ήτης, ου/.test(str)) ends = 'ήτης, ήτου'
    else if (/έτης, ου/.test(str)) ends = 'έτης, έτου' // ήτου
    else if (/ώτης, ου/.test(str)) ends = 'ώτης, ώτου-ώτεω-ώτω'
    else if (/ύτης, ου/.test(str)) ends = 'ύτης, ύτου'

    // HS
    else if (/όης, ητος/.test(str)) ends = 'όης, όητος'

    else if (/ής, οῦ/.test(str)) ends = 'ής, οῦ'
    else if (/ής, ῆτος/.test(str)) ends = 'ής, ῆτος'
    else if (/ής, ητός/.test(str)) ends = 'ής, ητός'
    else if (/ης, ου/.test(str)) ends = 'ης, ου'
    else if (/ής, οῦ/.test(str)) ends = 'ής, οῦ'
    else if (/ης, ητος/.test(str)) ends = 'ης, ητος'
    else if (/ῆς, έους/.test(str)) ends = 'ῆς, έους'
    else if (/ης, épq. ῆος/.test(str)) ends = 'X'
    else if (/ης, εος-ους/.test(str)) ends = 'ης, ους' // Ἀγασθένης
    else if (/ης-ῆς, έεος-έους/.test(str)) ends = 'ης-ῆς, ους-έους'
    else if (/ης, αο/.test(str)) ends = 'ης, αο'
    else if (/ής, έος/.test(str)) ends = 'ής, οῦ' // X Αἰακής
    else if (/ης, εω/.test(str)) ends = 'ης, εω'
    else if (/ης, εος/.test(str)) ends = 'X'
    else if (/ῆς, οῦ/.test(str)) ends = 'ῆς, οῦ'
    else if (/δης, épq. -δαο/.test(str)) ends = 'ης, αο'
    else if (/ης, εντος/.test(str)) ends = 'X'
    else if (/ης, épq. αο/.test(str)) ends = 'ης, αο'
    else if (/ῆς, έων/.test(str)) ends = 'X'
    else if (/ης, épq. εω/.test(str)) ends = 'ης, εω'
    else if (/ής, ῆτος/.test(str)) ends = 'ής, ῆτος'
    else if (/ης, εω/.test(str)) ends = 'ης, εω'
    else if (/ης, -αο/.test(str)) ends = 'ης, αο'
    else if (/ης, εος-ους/.test(str)) ends = 'ης, ους'
    else if (/ής, έους-οῦς/.test(str)) ends = 'X'
    else if (/ῆς, ῆτος/.test(str)) ends = 'X'
    else if (/όρης, όρεω/.test(str)) ends = 'ης, εω'
    else if (/έης, έους/.test(str)) ends = 'ης, ους'
    else if (/ῆς, ῆος/.test(str)) ends = 'X'
    else if (/ῄς, ῇδος/.test(str)) ends = 'X'
    else if (/ης, ηθος/.test(str)) ends = 'X'
    else if (/ης, ηνος/.test(str)) ends = 'X'
    else if (/ης, -άδαο/.test(str)) ends = 'ης, αο'

    // excl
    else if (/ακάνθης/.test(str)) ends = 'ης, ου' // X
    else if (/κλῆς, κλέους/.test(str)) ends = 'ῆς, έους'
    else if (/θής, θητός/.test(str)) ends = 'ής, ητός'

    // HN
    else if (/ην, ενος/.test(str)) ends = 'ην, ηνος' // X
    else if (/ήν, ῆνος/.test(str)) ends = 'ήν, ῆνος'
    else if (/ήν, ένος/.test(str)) ends = 'ήν, ένος'
    else if (/ην, ηνος/.test(str)) ends = 'ην, ηνος'
    else if (/ην, ενος/.test(str)) ends = 'X'
    else if (/μην, μενος/.test(str)) ends = 'X'
    else if (/μήν, μένος/.test(str)) ends = 'ήν, ένος'
    else if (/ήν, φρενός/.test(str)) ends = 'ήν, ενός'
    else if (/ην, χενος/.test(str)) ends = 'X'
    else if (/ῆν, ῆνος/.test(str)) ends = 'X'
    // excl
    else if (/ην, χενος/.test(str)) ends = 'X'
    else if (/ήν, ἰρένος/.test(str)) ends = 'ήν, ένος'
    else if (/ην, -αύχενος/.test(str)) ends = 'ην, ηνος' // X
    else if (/ην, -χενος/.test(str)) ends = 'ην, ηνος' // X
    else if (/Μήν, Μῆνος/.test(str)) ends = 'ήν, ῆνος'
    else if (/ψήν, ψηνός/.test(str)) ends = 'ήν, ηνός'
    else if (/σπλήν, σπληνός/.test(str)) ends = 'ήν, ηνός'
    else if (/σφήν, σφηνός/.test(str)) ends = 'ήν, ηνός'
    else if (/χήν, χηνός/.test(str)) ends = 'ήν, ηνός'

    // HR
    else if (/ήρ, ῆρος/.test(str)) ends = 'ήρ, ῆρος'
    else if (/ήρ, ρός/.test(str)) ends = 'ήρ, ρός'
    // excl
    else if (/ήρ, γαστρός/.test(str)) ends = 'ήρ, ρός'

    // ER
    else if (/ερ, ερος/.test(str)) ends = 'X'


    // I
    else if (/ι, ιτος/.test(str)) ends = 'ι, ιτος'
    else if (/ι, εως/.test(str)) ends = 'ι, εως'
    else if (/ι, ιος οu εως/.test(str)) ends = 'ι, εως'
    else if (/ι, εος/.test(str)) ends = 'ι, εως' // X
    else if (/ι, κίκεως/.test(str)) ends = 'ι, εως'
    // excl
    else if (/σάμ·πι/.test(str)) ends = 'X'

    // IS
    else if (/ἄκρις, ιος/.test(str)) ends = 'ίς, εως'

    else if (/ίς, ίδος/.test(str)) ends = 'ίς, ίδος'
    else if (/ίς, ίδος/.test(str)) ends = 'ίς, ίδος'
    else if (/ίς, ῖδος/.test(str)) ends = 'ίς, ῖδος' // ίδος
    else if (/ις, ίτιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ις, ιδος/.test(str)) ends = 'ις, ιδος'
    else if (/αις, αιτος/.test(str)) ends = 'ις, ιτος'
    else if (/ις, εως/.test(str)) ends = 'ις, εως'
    else if (/ΐς, ΐδος/.test(str)) ends = 'ΐς, ΐδος' // wtf?
    else if (/ις, ιος/.test(str)) ends = 'ις, ιος'
    else if (/αις, αιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ις, ιθος/.test(str)) ends = 'ις, ιθος'
    else if (/παις, -παιδος/.test(str)) ends = 'αις, αιδος'
    else if (/ίς, ῖνος/.test(str)) ends = 'ίς, ῖνος'
    else if (/εις, ειδος/.test(str)) ends = 'ις, ιδος'
    else if (/ις, ιτος/.test(str)) ends = 'ις, ιτος'
    else if (/ις, ις, -ιδος/.test(str)) ends = 'ις, ιδος'
    else if (/παις, -παιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ΐς, ίδος/.test(str)) ends = 'X'
    else if (/ίς, δαιτός/.test(str)) ends = 'ίς, ιτός'
    else if (/ις, ιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ις, αιδος/.test(str)) ends = 'ις, ιδος'
    else if (/παις, παιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ίς, ιτίδος/.test(str)) ends = 'X'
    else if (/δαις, -δαιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ις, -εως/.test(str)) ends = 'ις, εως'
    else if (/ις, ινος/.test(str)) ends = 'X'
    else if (/φωΐς-φῴς, φωΐδος-φῳδός/.test(str)) ends = 'ΐς-ῴς, ΐδος'
    else if (/ϊς, ιδος/.test(str)) ends = 'X'
    else if (/είς, εῖδος/.test(str)) ends = 'ίς, ῖδος'
    else if (/ηΐς-ῄς, ηΐδος-ῇδος/.test(str)) ends = 'ΐς-ῄς, ΐδος'
    // excl
    else if (/ις, ἴριδος/.test(str)) ends = 'ις, ιδος'
    else if (/ἴς, ἰνός/.test(str)) ends = 'X'
    else if (/ις, έτιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ᾶτις, άτιδος/.test(str)) ends = 'ις, ιδος'
    else if (/ῗτις, ΐτιδος/.test(str)) ends = 'ις, ιδος'
    else if (/είς, κλειδός/.test(str)) ends = 'X'
    else if (/κτείς, κτενός/.test(str)) ends = 'ίς, νός'
    else if (/ῦϊς, εύϊος/.test(str)) ends = 'X'
    else if (/όεις, όεντος/.test(str)) ends = 'X'
    else if (/ϊς, ϊδος/.test(str)) ends = 'X'
    else if (/αιΐς, αιΐδος/.test(str)) ends = 'ΐς, ΐδος'
    else if (/ίς, εως/.test(str)) ends = 'X'
    else if (/ῥίς, ῥινός/.test(str)) ends = 'ίς, ινός'
    else if (/Σάρδεις, εων, εσι, εις/.test(str)) ends = 'X'
    else if (/ήεις, ήεντος/.test(str)) ends = 'X'
    else if (/ις, -ιος/.test(str)) ends = 'ις, ιος'
    else if (/ιρις, ίριδος/.test(str)) ends = 'ις, ιδος'
    else if (/ῖς, ῖδος/.test(str)) ends = 'X'
    else if (/ῶτις, ώτιδος/.test(str)) ends = 'ις, ιδος'
    else if (/θίς, θινός/.test(str)) ends = 'ίς, ινός'


    // IN
    else if (/ίν, ῖνος/.test(str)) ends = 'ίν, ῖνος'
    else if (/ίν, ῖνος/.test(str)) ends = 'ίν, ῖνος'
    else if (/ιν, ινος/.test(str)) ends = 'ιν, ινος'
    else if (/ριν, -ρινος/.test(str)) ends = 'X'


    // EOS EUS
    else if (/ιεύς, έως/.test(str)) ends = 'ιεύς, ιέως'
    else if (/όδους, -όδοντος/.test(str)) ends = 'ους, οντος'
    else if (/εῖς, έων/.test(str)) ends = 'X' // Αἰγικορεῖς
    else if (/εύς, έως/.test(str)) ends = 'εύς, έως'
    else if (/εύς, -έως/.test(str)) ends = 'εύς, έως'
    else if (/έα-ῆ, έας-ῆς/.test(str)) ends = 'έα-ῆ, έας-ῆς'
    else if (/εως, εω/.test(str)) ends = 'εως, εω'
    else if (/έη-ῆ, έης-ῆς/.test(str)) ends = 'έη-ῆ, έης-ῆς'
    else if (/εός-οῦς, εοῦ-οῦ/.test(str)) ends = 'εός-οῦς, εοῦ-οῦ'
    else if (/εύς, Ἀρέως/.test(str)) ends = 'εύς, έως'
    else if (/έες, έων/.test(str)) ends = 'έες, έων'
    else if (/ῆες, ήων/.test(str)) ends = 'X'
    else if (/εα, έων/.test(str)) ends = 'εα, έων'
    else if (/έος, δέους/.test(str)) ends = 'έος, έους'
    else if (/εος, ἐλέεος-έους/.test(str)) ends = 'X'
    else if (/εες, έων/.test(str)) ends = 'ες, ων'
    else if (/μεν, μινος/.test(str)) ends = 'X'

    else if (/εύς, ῆος, ῆϊ, ῆ/.test(str)) ends = 'εύς, ῆος'
    else if (/εύς, ῆος/.test(str)) ends = 'εύς, ῆος'
    else if (/εον-οῦν, έου-οῦ/.test(str)) ends = 'εον-οῦν, έου-οῦ'
    else if (/αεύς, αέως/.test(str)) ends = 'αεύς, αέως'

    // OUS - OOS

    else if (/όος, όου/.test(str)) ends = 'όος, όου'
    else if (/οος, όου/.test(str)) ends = 'οος, όου'
    else if (/ους, όδοντος/.test(str)) ends = 'ους, οντος'
    else if (/ους, -ώδοντος/.test(str)) ends = 'ους, οντος'
    else if (/οῦς, οῦ/.test(str)) ends = 'οῦς, οῦ'
    else if (/ους, οντος/.test(str)) ends = 'ους, οντος'
    else if (/ους, οδος/.test(str)) ends = 'ους, οδος'
    else if (/πους, -ποδος/.test(str)) ends = 'ους, οδος'
    else if (/οος-ους, όου-ου/.test(str)) ends = 'οος-ους, όου-ου'
    else if (/πους, -ποδος/.test(str)) ends = 'ους, οδος'
    else if (/οῦν, οῦ/.test(str)) ends = 'οῦν, οῦ'
    else if (/ους, Βένερις/.test(str)) ends = 'X'
    else if (/πους, ποδος/.test(str)) ends = 'ους, οδος'
    else if (/οον-ουν, όου-ου/.test(str)) ends = 'οον-ουν, όου'
    else if (/όος-οῦς, όου-οῦ/.test(str)) ends = 'όος-οῦς, όου-οῦ'
    else if (/οον, όου/.test(str)) ends = 'οον, όου'
    else if (/ους, ου/.test(str)) ends = 'ους, ου'
    else if (/οος-ους, όου/.test(str)) ends = 'οος-ους, όου'
    // excl
    else if (/πους, ἱππόποδος/.test(str)) ends = 'ους, οδος'
    else if (/ους, -χροος/.test(str)) ends = 'X'
    else if (/όος-οῦς, κνόου-οῦ/.test(str)) ends = 'όος-οῦς, όου-οῦ'
    else if (/νόος-νοῦς, νόου-νοῦ/.test(str)) ends = 'όος-οῦς, όου-οῦ'


    else if (/ιεῖς, ιέων/.test(str)) ends = 'X'
    else if (/ινς, ινθος/.test(str)) ends = 'X'

    // U
    else if (/υ, υος/.test(str)) ends = 'υ, υος'
    else if (/υ, γόνατος/.test(str)) ends = 'υ, ατος'

    // US
    else if (/ύς, ύος/.test(str)) ends = 'ύς, ύος'
    else if (/ύς, έως/.test(str)) ends = 'ύς, έος' // wtf? έως
    else if (/υς, υος/.test(str)) ends = 'υς, υος'
    else if (/υς, εως/.test(str)) ends = 'υς, εως'
    else if (/ῦς, βοός/.test(str)) ends = 'ῦς, ός'
    else if (/ύς, ῦδος/.test(str)) ends = 'X'
    else if (/υς, -υος/.test(str)) ends = 'υς, υος'
    else if (/ῦς, υός/.test(str)) ends = 'ῦς, υός'
    else if (/ῦς, γραός/.test(str)) ends = 'X'
    else if (/υς, υδος/.test(str)) ends = 'υς, υδος'
    else if (/υς, υνος/.test(str)) ends = 'υς, υνος'
    else if (/υς, υθος/.test(str)) ends = 'υς, υθος'
    else if (/ύς, ύδος/.test(str)) ends = 'ύς, ύδος'
    else if (/ύς, έος/.test(str)) ends = 'ύς, έος'
    else if (/ύς, ῦος/.test(str)) ends = 'X'
    // excl
    else if (/ύς, ὀδόντος/.test(str)) ends = 'X'
    else if (/υς, -πήχεως/.test(str)) ends = 'υς, εως'
    else if (/ναυς, -ναος/.test(str)) ends = 'X'
    else if (/αυς, αος/.test(str)) ends = 'X'
    else if (/Μῦς, Μυός/.test(str)) ends = 'ῦς, υός'
    else if (/σοῦς, σοῦ/.test(str)) ends = 'οῦς, οῦ'
    else if (/σῦς, συός/.test(str)) ends = 'ῦς, υός'


    // UN
    else if (/υν, υνος/.test(str)) ends = 'υν, υνος'

    // KS PS
    else if (/δράξ, δρακός/.test(str)) ends = 'άξ, ακός'
    else if (/ἔποψ, ἔποπος/.test(str)) ends = 'οψ, οπος'

    else if (/οξ, οκος/.test(str)) ends = 'οξ, οκος'
    else if (/ώψ, ῶπος/.test(str)) ends = 'ώψ, ῶπος'
    else if (/ίαξ, ακος/.test(str)) ends = 'ίαξ, ίακος'
    else if (/αίαξ, ακος/.test(str)) ends = 'αίαξ, αίακος'
    else if (/ύοψ, οπος/.test(str)) ends = 'ύοψ, ύοπος'
    else if (/αξ, ακος/.test(str)) ends = 'αξ, ακος'
    else if (/αξ, ακτος/.test(str)) ends = 'αξ, ακτος' // или убрать А
    else if (/αψ, απος/.test(str)) ends = 'αψ, απος'
    else if (/άξ, βλακός/.test(str)) ends = 'άξ, ακός'
    else if (/άναξ, άνακτος/.test(str)) ends = 'ξ, κτος'
    else if (/άξ, ακός/.test(str)) ends = 'άξ, ακός'
    else if (/άξ, άκος/.test(str)) ends = 'X'
    else if (/ᾷξ, ᾳκός/.test(str)) ends = 'ᾷξ, ᾳκός'

    else if (/ιξ, ιχος/.test(str)) ends = 'ιξ, ιχος'
    else if (/ιξ, ικος/.test(str)) ends = 'ιξ, ικος'
    else if (/ιγξ, ιγγος/.test(str)) ends = 'ξ, γος'
    else if (/ίξ, Φικός/.test(str)) ends = 'ίξ, ικός'
    else if (/ίξ, ικός/.test(str)) ends = 'ίξ, ικός'
    else if (/ιξ, ἰθύτριχος/.test(str)) ends = 'X'
    else if (/ξ, ἰκός/.test(str)) ends = 'ξ, κός'
    else if (/αιξ, αικος/.test(str)) ends = 'ξ, κος'
    else if (/ΐξ, ΐκος/.test(str)) ends = 'X'
    else if (/ϋξ, ϋκος/.test(str)) ends = 'ξ, κος'
    else if (/ιξ, ῖκος/.test(str)) ends = 'ξ, κος'
    else if (/ήξ, ηγός/.test(str)) ends = 'ξ, γός'

    else if (/υξ, υγος/.test(str)) ends = 'υξ, υγος'
    else if (/υξ, υχος/.test(str)) ends = 'υξ, υχος'
    else if (/υγξ, υγγος/.test(str)) ends = 'ξ, γος'
    else if (/υξ, υκος/.test(str)) ends = 'υξ, υκος'
    else if (/νύξ, νυκτός/.test(str)) ends = 'ύξ, υκτός'
    else if (/Νύξ, Νυκτός/.test(str)) ends = 'ύξ, υκτός'


    else if (/ηξ, ηγος/.test(str)) ends = 'ξ, γος'
    else if (/ήξ, ῆγος/.test(str)) ends = 'ήξ, ηκός' // X, wtf
    else if (/ηξ, ηκος/.test(str)) ends = 'ηξ, ηκος'
    else if (/ηξ, εκος/.test(str)) ends = 'ηξ, εκος'
    else if (/βήξ, βηχός/.test(str)) ends = 'ήξ, ηχός'
    else if (/εψ, επος/.test(str)) ends = 'εψ, επος'
    else if (/αγξ, αγγος/.test(str)) ends = 'ξ, γος'
    else if (/ωξ, ωγος/.test(str)) ends = 'ξ, γος'
    else if (/ίξ, ιγός/.test(str)) ends = 'ίξ, ιγός'

    else if (/ιψ, ιπος/.test(str)) ends = 'ιψ, ιπος'
    else if (/ιψ, ιβος/.test(str)) ends = 'ιψ, ιβος'
    else if (/ώξ, ῶγος/.test(str)) ends = 'ξ, γος'
    else if (/ιξ, ιγος/.test(str)) ends = 'ιξ, ιγος'
    else if (/ίψ, ιπός/.test(str)) ends = 'ίψ, ιπός'
    else if (/ιξ, ιγγος/.test(str)) ends = 'ιξ, ιγγος'
    else if (/υψ, υβος/.test(str)) ends = 'υψ, υβος'

    else if (/πήξ, πῆγος/.test(str)) ends = 'ξ, γος'
    else if (/ῆξ, ῆγος/.test(str)) ends = 'ξ, γος'
    else if (/ήξ, ηκός/.test(str)) ends = 'ήξ, ηκός'
    else if (/τρύξ, τρυγός/.test(str)) ends = 'ύξ, υγός'
    else if (/τρώξ, τρωγός/.test(str)) ends = 'ώξ, ωγός'

    else if (/ύψ, υπός/.test(str)) ends = 'ύψ, υπός'
    else if (/υψ, υπος/.test(str)) ends = 'X'
    else if (/ϊξ, ϊκος/.test(str)) ends = 'X'
    else if (/πηξ, πεκος/.test(str)) ends = 'ηξ, εκος'

    else if (/έξ, κρεκός/.test(str)) ends = 'έξ, εκός'
    else if (/ηψ, ηπος/.test(str)) ends = 'ηψ, ηπος'
    else if (/κώψ, κωπός/.test(str)) ends = 'ώψ, ωπός'
    else if (/εξ, εγος/.test(str)) ends = 'ξ, γος'
    else if (/εψ, εβος/.test(str)) ends = 'X'
    else if (/ϋγξ, ϋγγος/.test(str)) ends = 'ξ, γος'
    else if (/άγξ, αγγός/.test(str)) ends = 'ξ, γός'
    else if (/ίγξ, ιγγός/.test(str)) ends = 'ξ, γός'
    else if (/στύξ, στυγός/.test(str)) ends = 'ύξ, υγός'
    else if (/Στύξ, Στυγός/.test(str)) ends = 'ύξ, υγός'

    else if (/οψ, οπος/.test(str)) ends = 'οψ, οπος'
    else if (/οξ, οκος/.test(str)) ends = 'X' // ἄλοξ
    else if (/σαρξ, -σαρκος/.test(str)) ends = 'ξ, κος'
    else if (/εψ, -εβος/.test(str)) ends = 'X'
    else if (/θριξ, τριχος/.test(str)) ends = 'X'
    else if (/υξ, -ζυγος/.test(str)) ends = 'ξ, γος'
    else if (/οψ, Δόλοπος/.test(str)) ends = 'οψ, οπος'
    else if (/ξ, δορκός/.test(str)) ends = 'ξ, κός'
    else if (/άξ, δρακός/.test(str)) ends = 'ξ, κός'
    else if (/ώψ, ωπός/.test(str)) ends = 'ώψ, ωπός'
    else if (/οξ, ογος/.test(str)) ends = 'ξ, γος'
    else if (/οψ, ἔποπος/.test(str)) ends = 'ψ, πος'
    else if (/φάψ, φαβός/.test(str)) ends = 'X'
    // excl
    else if (/ξ, -φάρυγγος/.test(str)) ends = 'ξ, γος'
    else if (/ύψ, γυπός/.test(str)) ends = 'ύψ, υπός'
    else if (/ξ, ἴυγγος/.test(str)) ends = 'ξ, γος'
    else if (/ἴψ, ἰπός/.test(str)) ends = 'X'
    else if (/ιξ, ὄτριχος/.test(str)) ends = 'X'
    else if (/ηγξ, ηγγος/.test(str)) ends = 'ξ, γος'
    else if (/ξ, ζορκός/.test(str)) ends = 'ξ, κός'
    else if (/ιξ, καλλίτριχος/.test(str)) ends = 'ξ, χος'
    else if (/πλήξ, -πλῆγος/.test(str)) ends = 'ξ, γος'
    else if (/πήξ, -πῆγος/.test(str)) ends = 'ξ, γος'
    else if (/ιψ, ιφος/.test(str)) ends = 'X'
    else if (/ῶνυξ, ώνυχος/.test(str)) ends = 'υξ, υχος'
    else if (/κήξ, κηκός/.test(str)) ends = 'ήξ, ηκός'
    else if (/ίψ, κνιπός/.test(str)) ends = 'ίψ, ιπός'
    else if (/ώψ, κνωπός/.test(str)) ends = 'ώψ, ωπός'
    else if (/ϊξ, κόϊκος/.test(str)) ends = 'X'
    else if (/γξ, ϊγγος/.test(str)) ends = 'ξ, γος'
    else if (/ωψ, οπος/.test(str)) ends = 'ωψ, οπος'
    else if (/ωψ, -οπος/.test(str)) ends = 'ωψ, οπος'
    else if (/πρόξ, προκός/.test(str)) ends = 'όξ, οκός'
    else if (/πρώξ, πρωκός/.test(str)) ends = 'ώξ, ωκός'
    else if (/ύγξ, υγγός/.test(str)) ends = 'ξ, γός'
    else if (/πτώξ, πτωκός/.test(str)) ends = 'ώξ, ωκός'
    else if (/άξ, ᾶγος/.test(str)) ends = 'ξ, γος'
    else if (/ψίξ, ψιχός/.test(str)) ends = 'ίξ, ιχός'
    else if (/ῥίψ, ῥιπός/.test(str)) ends = 'ίψ, ιπός'
    else if (/ῥώξ, ῥωγός/.test(str)) ends = 'ώξ, ωγός'
    else if (/σάρξ, σαρκός/.test(str)) ends = 'ξ, κός'
    else if (/θρίψ, θριπός/.test(str)) ends = 'ίψ, ιπός'
    else if (/ΐς, ῗδος/.test(str)) ends = 'X'


    // W

    else if (/ώ, οῦς/.test(str)) ends = 'ώ, οῦς'
    else if (/ώ, όος-οῦς/.test(str)) ends = 'ώ, οῦς'
    else if (/ώ, ους/.test(str)) ends = 'ώ, οῦς' // X
    else if (/χρεώ, χρεόος-χρεοῦς/.test(str)) ends = 'ώ, οῦς'
    // excl
    else if (/Ἰώ, Ἰοῦς/.test(str)) ends = 'X'
    else if (/Ὦψ, Ὦπος/.test(str)) ends = 'X'

    // EWS
    else if (/έως, ω/.test(str)) ends = 'έως, έω'

    // WS

    else if (/ώς, ῶτος/.test(str)) ends = 'ώς, ῶτος'
    else if (/ως, ωος/.test(str)) ends = 'ως, ωος'
    else if (/ώς, ῶτος/.test(str)) ends = 'ώς, ῶτος'
    else if (/ώς, ῶτος/.test(str)) ends = 'ώς, ῶτος'
    else if (/ώψ, ῶπος/.test(str)) ends = 'ώψ, ῶπος'
    else if (/ωψ, ωπος/.test(str)) ends = 'ωψ, ωπος'
    else if (/ώς, ώ/.test(str)) ends = 'ώς, ώ'
    else if (/ώς, όος-οῦς/.test(str)) ends = 'ώς, οῦς'
    else if (/ῶς, ῶτος/.test(str)) ends = 'ῶς, ωτός' // X
    else if (/ώς, ότος/.test(str)) ends = 'ώς, ότος'
    else if (/ως, -ω/.test(str)) ends = 'ως, ω'
    else if (/ωρ, ορος/.test(str)) ends = 'ωρ, ορος'
    else if (/ώς, ωός/.test(str)) ends = 'ώς, ωός'
    else if (/ως, ωτος/.test(str)) ends = 'ως, ωτος'
    else if (/ως, -ωτος/.test(str)) ends = 'ως, ωτος'
    else if (/φῶς, φωτός/.test(str)) ends = 'ῶς, ωτός'
    else if (/φῴς, φῳδός/.test(str)) ends = 'X'
    else if (/ως, ω/.test(str)) ends = 'ως, ω'

    else if (/ωφ, ωφος/.test(str)) ends = 'X'
    else if (/ώς, ῶος/.test(str)) ends = 'X'
    else if (/ώς, ῶ/.test(str)) ends = 'X'
    else if (/εώς, εώ/.test(str)) ends = 'εώς, εώ'
    else if (/ώς, ωτός/.test(str)) ends = 'ώς, ωτός'
    else if (/φως, φωτος/.test(str)) ends = 'ως, ωτος'
    else if (/ως, οος/.test(str)) ends = 'X'
    else if (/θώς, θωός/.test(str)) ends = 'ώς, ωός'
    else if (/χρώς, χρωτός/.test(str)) ends = 'ώς, ωτός'

    // WN

    else if (/ών, ῶνος/.test(str)) ends = 'ών, ῶνος'
    else if (/ἄμβων, ωνος/.test(str)) ends = 'ων, ωνος'

    else if (/υών, όνος/.test(str)) ends = 'υών, υόνος'
    else if (/άων, ωνος/.test(str)) ends = 'άων, άωνος'
    else if (/όων, όωντος/.test(str)) ends = 'X'
    else if (/όων-ῶν, όωντος-ῶντος/.test(str)) ends = 'X'
    else if (/άων, άονος/.test(str)) ends = 'άων, άονος'
    else if (/άων, ονος/.test(str)) ends = 'άων, άονος'
    else if (/έων, οντος/.test(str)) ends = 'έων, έοντος'
    else if (/είων, οντος/.test(str)) ends = 'είων, είοντος'
    else if (/ίων, ονος/.test(str)) ends = 'ίων, ίονος'
    else if (/ίων, ωνος/.test(str)) ends = 'ίων, ίονος'
    else if (/ήων, ήονος/.test(str)) ends = 'ων, ονος'
    // else if (/ων, ωνος/.test(str)) ends = 'ων, ονος'
    else if (/ων, ονος/.test(str)) ends = 'ων, ονος'
    else if (/ών, ἀόνος/.test(str)) ends = 'ών, όνος'
    else if (/ων, ωνος/.test(str)) ends = 'ων, ωνος'
    else if (/ων, ω/.test(str)) ends = 'X'
    else if (/ών, όντος/.test(str)) ends = 'ών, όντος'
    else if (/ῶν, ῶνος/.test(str)) ends = 'X'
    else if (/άων, άωνος/.test(str)) ends = 'ων, ωνος'
    else if (/ών, ωνός/.test(str)) ends = 'ών, ωνός'
    else if (/ώων, ώονος/.test(str)) ends = 'ων, ονος'
    else if (/όδων, -όδοντος/.test(str)) ends = 'ων, οντος'
    else if (/χθών, χθονός/.test(str)) ends = 'ών, ονός'
    else if (/ών, ονός/.test(str)) ends = 'ών, ονός'
    else if (/ών, ῶνος/.test(str)) ends = 'ών, ῶνος'
    else if (/ων, οντος/.test(str)) ends = 'ων, οντος'
    else if (/ῶν, ῶντος/.test(str)) ends = 'ῶν, ῶντος'
    else if (/ών, όνος/.test(str)) ends = 'ών, όνος'

    // WR
    else if (/ἄχωρ, ωρος/.test(str)) ends = 'ωρ, ορος'
    else if (/ωρ, ὕδατος/.test(str)) ends = 'ωρ, ατος'
    else if (/άωρ, άορος/.test(str)) ends = 'ωρ, ορος'
    // R

    else if (/ήρ, έρος/.test(str)) ends = 'ήρ, έρος'
    else if (/ήρ, ῆρος/.test(str)) ends = 'ήρ, ῆρος'
    else if (/ειρ, ειρος/.test(str)) ends = 'X' // ἀδικόχειρ
    else if (/χειρ, -χειρος/.test(str)) ends = 'X'
    else if (/χειρ, ἄχειρος/.test(str)) ends = 'X'
    else if (/ηρ, ηρος/.test(str)) ends = 'ηρ, ηρος'
    else if (/ηρ, ερος/.test(str)) ends = 'ηρ, ερος'
    else if (/τηρ, τρος/.test(str)) ends = 'X'
    else if (/χειρ, -χειρος/.test(str)) ends = 'X'
    else if (/φάρ, φαρός/.test(str)) ends = 'άρ, αρός'
    else if (/φήρ, φηρός/.test(str)) ends = 'ήρ, ηρός'
    else if (/είρ, ειρός/.test(str)) ends = 'είρ, ειρός'
    else if (/έθειρ, -έθειρος/.test(str)) ends = 'X'

    // AR
    else if (/έαρ, ατος/.test(str)) ends = 'έαρ, έατος'
    else if (/εαρ, ατος/.test(str)) ends = 'εαρ, έατος'
    else if (/ιαρ, ατος/.test(str)) ends = 'ιαρ, ίατος'
    else if (/αρ, ατος/.test(str)) ends = 'αρ, ατος'
    else if (/αρ, αρτος/.test(str)) ends = 'αρ, αρτος'
    else if (/αρ, αρος/.test(str)) ends = 'αρ, αρος'
    else if (/κύαρ, κύατος/.test(str)) ends = 'αρ, ατος'

    else if (/Κήρ, Κηρός/.test(str)) ends = 'ήρ, ηρός'

    else if (/ώρ, ῶρος/.test(str)) ends = 'ώρ, ῶρος'
    else if (/ωρ, ορος/.test(str)) ends = 'ωρ, ορος'
    else if (/ωρ, ωρος/.test(str)) ends = 'ωρ, ωρος'
    else if (/φώρ, φωρός/.test(str)) ends = 'ώρ, ωρός'
    // excl
    else if (/αρ, ἤματος/.test(str)) ends = 'αρ, ατος'
    else if (/αρ, ἥπατος/.test(str)) ends = 'αρ, ατος'
    else if (/Ἦρ, Ἠρός/.test(str)) ends = 'X'
    else if (/Ἡρώ, Ἡροῦς/.test(str)) ends = 'X'
    else if (/σήρ, σηρός/.test(str)) ends = 'ήρ, ηρός'
    else if (/Σήρ, Σηρός/.test(str)) ends = 'ήρ, ηρός'
    // excl
    else if (/ὄαρ, ὄαρος/.test(str)) ends = 'X'
    else if (/Κάρ, Καρός/.test(str)) ends = 'άρ, αρός'
    else if (/υρ, υρος/.test(str)) ends = 'υρ, υρος'
    else if (/πῦρ, πυρός/.test(str)) ends = 'ῦρ, υρός'
    else if (/ψάρ, ψαρός/.test(str)) ends = 'άρ, αρός'
    else if (/ῥάξ, ῥαγός/.test(str)) ends = 'άξ, αγός'


    // U
    else if (/υ, εος/.test(str)) ends = 'υ, εος'
    else if (/υ, ἄστεως/.test(str)) ends = 'υ, εως'
    else if (/υ, εως/.test(str)) ends = 'υ, εως'

    else if (/υς, εος/.test(str)) ends = 'υς, εος'
    else if (/υς, υρος/.test(str)) ends = 'υς, υρος'


    else if (/ήεις, ήεσσα/.test(str)) ends = 'X' // adj

    else if (/ἀήρ, ἀέρος/.test(str)) ends = 'X'
    else if (/ιξ, ἄτριχος/.test(str)) ends = 'X'
    else if (/θριξ, -τριχος/.test(str)) ends = 'ιξ, ιχος'
    else if (/εύς, épq. ῆος/.test(str)) ends = 'X'
    else if (/ης, épq. -αο/.test(str)) ends = 'X'
    else if (/πάτηρ, seul. voc. -πατερ/.test(str)) ends = 'X'
    else if (/αἴξ, αἰγός/.test(str)) ends = 'X'
    else if (/ἄϊξ, ἄϊκος/.test(str)) ends = 'X'
    else if (/ἀΐτας, -εω/.test(str)) ends = 'X'
    else if (/Ἀκεσαμενός, épq. /.test(str)) ends = 'X'
    else if (/χειρ, χειρος/.test(str)) ends = 'X' // ἀκρόχειρ
    else if (/Ἀλκέτις, acc. -ιν/.test(str)) ends = 'X'
    else if (/ῷα, ῴων/.test(str)) ends = 'X'
    else if (/οῦς, οῦντος/.test(str)) ends = 'X'
    else if (/ας, -α, -ᾳ, -αν/.test(str)) ends = 'X' // adj
    else if (/αῖ, ῶν/.test(str)) ends = 'X'
    else if (/θριξ, -τριχος/.test(str)) ends = 'X'
    else if (/κύων, -κυνος/.test(str)) ends = 'X'
    else if (/θρίξ, τριχός/.test(str)) ends = 'X'
    else if (/ίας, iοn. -ίης/.test(str)) ends = 'X'
    else if (/Ἄραρ, ος/.test(str)) ends = 'X'
    else if (/Ἀρβάκας,/.test(str)) ends = 'X'
    else if (/Ἀργᾶς, ου/.test(str)) ends = 'X'
    else if (/ϊς, ϊος/.test(str)) ends = 'X'
    else if (/ῆς, εους/.test(str)) ends = 'X'
    else if (/εις, εντος/.test(str)) ends = 'εις, εντος'
    else if (/ῆς, έος/.test(str)) ends = 'X'
    else if (/ω, ως/.test(str)) ends = 'X'
    else if (/εξ, ικος/.test(str)) ends = 'X'
    else if (/ηδύ, -ηδέος/.test(str)) ends = 'X'

    else if (/ώξ, ῶγος/.test(str)) ends = 'ξ, γος'

    else if (/αξ, ἄνακτος/.test(str)) ends = 'αξ, ακτος'

    else if (/άξ, άγος/.test(str)) ends = 'ξ, γος'
    else if (/αψ, αβος/.test(str)) ends = 'αψ, αβος'
    else if (/αξ, αγος/.test(str)) ends = 'αξ, αγος' // λάταξ
    else if (/αξ, -άνακτος/.test(str)) ends = 'ξ, κτος'

    else if (/ουρ, ουρος/.test(str)) ends = 'ουρ, ουρος'

    else if (/Βαάλ, Baal/.test(str)) ends = 'X'

    else if (/xx/.test(str)) ends = ''
    else if (/xx/.test(str)) ends = ''
    else if (/xx/.test(str)) ends = ''


    // EXCEPTIONS
    if (/ἀγρεῖφνα, ης/.test(str)) ends = 'α, ας'
    else if (/ἄργματα, ων/.test(str)) ends = 'α, ατος'
    else if (/βρέγμα, ατος/.test(str)) ends = 'α, ης'
    else if (/δόνημα, ατος/.test(str)) ends = 'όνημα, ολνήματος' // ошибка WKT ?
    else if (/δόξασμα, ατος/.test(str)) ends = 'α, ης'
    else if (/δώρημα, ατος/.test(str)) ends = 'ημα, ήατος'
    else if (/ἕδρασμα, ατος/.test(str)) ends = 'α, ας'
    else if (/ἑστίαμα, ατος/.test(str)) ends = 'ία, ίας'

    else if (/ἔτνος, εος-οῦς/.test(str)) ends = 'ος, ους'
    else if (/φάος, φάεος-φάους/.test(str)) ends = 'άος, άεος'
    else if (/Φάρος, ου/.test(str)) ends = 'ος, ους'
    else if (/φθίνασμα, ατος/.test(str)) ends = 'α, ης'
    else if (/φώσσων οu φώσων, ωνος/.test(str)) ends = 'ων, ωνος'
    else if (/Γάνος, ου/.test(str)) ends = 'ος, εος'
    else if (/Γάνος, εος-ους/.test(str)) ends = 'ος, εος'
    else if (/γέλγις, ιδος/.test(str)) ends = 'ις, ιθος'
    else if (/γόος, ου/.test(str)) ends = 'όος, όου' // letter O is bad
    else if (/γρυμέα, mieux que γρυμαῖα, ας/.test(str)) ends = 'έα, έας'
    else if (/καιάδας, α/.test(str)) ends = 'ας, ου'
    else if (/κάνεον-οῦν, έου-οῦ/.test(str)) ends = 'εον, έου'
    else if (/κάνναβις, εως/.test(str)) ends = 'ις, ισι-ισιν'
    else if (/κέλωρ, ωρος/.test(str)) ends = 'ωρ, ορος'
    else if (/κονίαμα, ατος/.test(str)) ends = 'α, ατος'
    else if (/κρύος, εος-ους/.test(str)) ends = 'ύος, ύους-ύου'
    else if (/κύαρ, κύατος/.test(str)) ends = 'ύαρ, ύατος'
    else if (/κύβηλις, ιδος/.test(str)) ends = 'ις, εως'
    else if (/κύμινδις, ιος/.test(str)) ends = 'ις, ιδος'
    else if (/Κῦρος, ου/.test(str)) ends = 'ος, εος'
    else if (/λακέτας, ου/.test(str)) ends = 'ας, α'

    else if (/Μάρις, ιος/.test(str)) ends = 'ις, εως'
    else if (/μετεμψύχωσις, εως/.test(str)) ends = 'ις, εσι-εσιν'
    else if (/μῆνις, ιος, pοstér. ιδος/.test(str)) ends = 'ις, ιδος'
    else if (/Μῆνις, ιος/.test(str)) ends = 'ις, ιδος'
    else if (/Μήστωρ, ορος/.test(str)) ends = 'ωρ, ωρος'
    else if (/ὄλυρα, ας/.test(str)) ends = 'α, ης'
    else if (/ὄργυια, ας .u ὀργυιά/.test(str)) ends = 'υια, υίας'
    else if (/πάλμυς, υος/.test(str)) ends = 'υς, υδος'
    else if (/Πάλμυς, υος/.test(str)) ends = 'υς, υδος'
    else if (/πανάκεια, ας/.test(str)) ends = 'εια, είαις'
    else if (/Πανάκεια, ας/.test(str)) ends = 'εια, είαις'
    else if (/πέζις, ιος/.test(str)) ends = 'ις, εως'
    else if (/πέος, πέεος-πέους/.test(str)) ends = 'έος, έους'
    else if (/πλάδος, εος-ους/.test(str)) ends = 'ος, ου'
    else if (/Πρᾶξις, ιος/.test(str)) ends = 'ις, εως'
    else if (/Πρύτανις, ιδος/.test(str)) ends = 'ις, εως'
    else if (/ψίλον, ου/.test(str)) ends = 'ον, οιο'
    else if (/ῥεῖθρον, ου/.test(str)) ends = 'ον, οις'
    else if (/ῥίζις, εως/.test(str)) ends = 'ις, ιος'
    else if (/σάββατον, ου/.test(str)) ends = 'ατον, ασι-ασιν-άτοις'
    else if (/σίκυος, ου, .u σικυός, οῦ/.test(str)) ends = 'υος, ύου'
    else if (/σπάδων, οντος/.test(str)) ends = 'ων, ωνος'
    else if (/Στάτωρ, ωρος/.test(str)) ends = 'ωρ, ορος'
    else if (/στέλεχος, ου/.test(str)) ends = 'ος, ους'
    else if (/στόνυξ, υχος/.test(str)) ends = 'υξ, υκος'
    else if (/σύμβασις, εως/.test(str)) ends = 'ις, εσι-εσιν'
    else if (/Σύρτις, ιδος/.test(str)) ends = 'ις, εως'
    else if (/σῶρυ, εως/.test(str)) ends = 'υ, υος'
    else if (/Τέρψις, ιδος/.test(str)) ends = 'ις, εως'
    else if (/Τίγρις, ιδος, ιδι, ιδα/.test(str)) ends = 'ις, εως'
    else if (/Τίτυρος, ου/.test(str)) ends = 'ος, οιο'
    else if (/τρόμος, ου/.test(str)) ends = 'ος, οις'

    else if (/ὕφεαρ, ατος/.test(str)) ends = 'εαρ, έαρος'
    else if (/χάος, χάεος-χάους/.test(str)) ends = 'άος, άους'

    else if (/Ἀρτέμων, ωνος/.test(str)) ends = 'ων, ονος'
    else if (/Γαῖα, ης, ῃ, αν/.test(str)) ends = 'αῖα, αίας-αίης'
    else if (/^θέωσις, εως/.test(str)) ends = 'ις, εσι-εσιν'
    else if (/θρῖον, ου/.test(str)) ends = 'ῖον, ίου'
    else if (/θύμος, εος-ους/.test(str)) ends = 'ος, ου'
    else if (/θύος, θύεος-ους/.test(str)) ends = 'ύος, ύεος'
    else if (/θρύλιγμα, ατος/.test(str)) ends = 'ιγμα, ίματος'
    else if (/Ζεῦξις, ιδος,/.test(str)) ends = 'ις, εως'
    else if (/ζόφος, εος-ους/.test(str)) ends = 'ος, ου'
    else if (/ἀλωή, sel. d’autres ἀλῳή/.test(str)) ends = 'ωή, ωῆς'

    // HERE:
    else if (/ἁμαρτία, ας/.test(str)) ends = 'ία, ίαις'
    else if (/ἀκακία, ας/.test(str)) ends = 'ία, ίαις'

    else if (/Ἀσκαλωνίτης, ου/.test(str)) ends = 'ίτης, ίταις'
    else if (/ἀσπιδιώτης, ου/.test(str)) ends = 'ώτης, ώτω'
    else if (/ἄχθος, εος-ους/.test(str)) ends = 'ος, εος'
    else if (/ἄνθος, ου/.test(str)) ends = 'X' // второй после ἄνθος, εος-ους, который ок
    else if (/Ἀργεῖος, ου/.test(str)) ends = 'X'
    else if (/ἀρνός, οῦ/.test(str)) ends = 'ός, οῖς'
    else if (/_XX/.test(str)) ends = '_'


    // console.log('_MORPH N D', str)

    if (ends == 'X') return
    else if (ends) return ends
}
