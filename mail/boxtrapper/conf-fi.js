//~~GENERATED~~
//-------------------------------------------------------------
// Source:    /usr/local/cpanel/base/frontend/manager/mail/boxtrapper/conf.js
// Generated: /usr/local/cpanel/base/frontend/manager/mail/boxtrapper/conf-fi.js
// Module:    /manager/mail/boxtrapper/conf-fi
// Locale:    fi
// This file is generated by the cpanel localization system
// using the bin/_build_translated_js_hash_files.pl script.
//-------------------------------------------------------------
// !!! Do not hand edit this file !!!
//-------------------------------------------------------------
(function() {
    // The raw lexicon.
    var newLex = {"Minimum [asis,Apache] [asis,SpamAssassin] Spam Score required to bypass [asis,BoxTrapper]:":"Pienin [asis,BoxTrapper]in ohittamiseen riittävä [asis,Apache] [asis,SpamAssassin]-roskapostipisteytys:","The minimum spam score must be numeric.":"Roskapostipisteytyksen vähimmäisarvon on oltava numero.","The number of days that you wish to keep logs and messages in the queue.":"Päivät, joiden ajan haluat säilyttää lokit ja jonossa olevat viestit.","The number of days to keep logs must be a positive integer.":"Lokien säilytyspäivien määrän on oltava positiivinen kokonaisluku."};

    if (!this.LEXICON) {
        this.LEXICON = {};
    }

    for(var item in newLex) {
        if(newLex.hasOwnProperty(item)) {
            var value = newLex[item];
            if (typeof(value) === "string" && value !== "") {
                // Only add it if there is a value.
                this.LEXICON[item] = value;
            }
        }
    }
})();
//~~END-GENERATED~~
