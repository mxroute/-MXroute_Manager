//~~GENERATED~~
//-------------------------------------------------------------
// Source:    /usr/local/cpanel/base/frontend/manager/mail/boxtrapper/conf.js
// Generated: /usr/local/cpanel/base/frontend/manager/mail/boxtrapper/conf-es.js
// Module:    /manager/mail/boxtrapper/conf-es
// Locale:    es
// This file is generated by the cpanel localization system
// using the bin/_build_translated_js_hash_files.pl script.
//-------------------------------------------------------------
// !!! Do not hand edit this file !!!
//-------------------------------------------------------------
(function() {
    // The raw lexicon.
    var newLex = {"Minimum [asis,Apache] [asis,SpamAssassin] Spam Score required to bypass [asis,BoxTrapper]:":"Se requiere una puntuación mínima de [asis,Apache] [asis,SpamAssassin] Spam para omitir [asis,BoxTrapper]:","The minimum spam score must be numeric.":"La puntuación de spam mínima debe ser numérica.","The number of days that you wish to keep logs and messages in the queue.":"La cantidad de días que desea mantener los registros y mensajes en la cola.","The number of days to keep logs must be a positive integer.":"La cantidad de días que se mantendrán los registros debe ser un número entero positivo."};

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
