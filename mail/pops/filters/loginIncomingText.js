/*
# base/frontend/manager/mail/pops/filters/loginIncomingText.js Copyright(c) 2017 cPanel, Inc.
#                                                                              All rights Reserved.
# copyright@cpanel.net                                                            http://cpanel.net
# This code is subject to the cPanel license.                    Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "cjt/util/locale"
    ],
    function(angular, LOCALE) {

        /**
         * Filter to build the text for the suspend/unsuspend login and incoming link for an e-mail account
         * @param  {Object} emailAccount The email account to generate the href for, should have 'email' and 'suspended_login' properties
         * @return {String}              The text to use for the suspend/unsuspend login/incoming link
         *
         * Note: This filter should typically be used along with the loginIncomingTooltip and loginIncomingHref filters.
         *
         * @example
         * <a title="{{ emailAccount | loginIncomingTooltip }}" href="{{ emailAccount | loginIncomingHref }}">{{ emailAccount | loginIncomingText }}</a>
         */


        var module;
        try {
            module = angular.module("cpanel.mail.Pops");
        }
        catch(e) {
            module = angular.module("cpanel.mail.Pops", []);
        }

        module.filter("loginIncomingText", function() {
            return function(emailAccount) {
                return emailAccount.suspended_login ? LOCALE.maketext("Unsuspend") : LOCALE.maketext("Suspend");
            };
        });

    }
);