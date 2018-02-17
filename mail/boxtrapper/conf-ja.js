//~~GENERATED~~
//-------------------------------------------------------------
// Source:    /usr/local/cpanel/base/frontend/manager/mail/boxtrapper/conf.js
// Generated: /usr/local/cpanel/base/frontend/manager/mail/boxtrapper/conf-ja.js
// Module:    /manager/mail/boxtrapper/conf-ja
// Locale:    ja
// This file is generated by the cpanel localization system
// using the bin/_build_translated_js_hash_files.pl script.
//-------------------------------------------------------------
// !!! Do not hand edit this file !!!
//-------------------------------------------------------------
(function() {
    // The raw lexicon.
    var newLex = {"Minimum [asis,Apache] [asis,SpamAssassin] Spam Score required to bypass [asis,BoxTrapper]:":"[asis,BoxTrapper] をバイパスするために必要な最小 [asis,Apache] [asis,SpamAssassin] 迷惑メール スコア:","The minimum spam score must be numeric.":"最小迷惑メール スコアは、数値である必要があります。","The number of days that you wish to keep logs and messages in the queue.":"ログおよびメッセージをキューに保持する日数。","The number of days to keep logs must be a positive integer.":"ログを保管する日数は、正の整数である必要があります。"};

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
