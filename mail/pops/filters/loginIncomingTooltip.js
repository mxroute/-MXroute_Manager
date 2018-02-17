/*
# base/frontend/manager/mail/pops/filters/loginIncomingTooltip.js Copyright(c) 2017 cPanel, Inc.
#                                                                                 All rights Reserved.
# copyright@cpanel.net                                                               http://cpanel.net
# This code is subject to the cPanel license.                       Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "cjt/util/locale"
    ],
    function(angular, LOCALE) {

        /**
         * Filter to build the title for the suspend/unsuspend login and incoming link for an e-mail account
         * @param  {Object} emailAccount The email account to generate the href for, should have 'email' and 'suspended_login' properties
         * @return {String}              The title to use for the suspend/unsuspend login/incoming link
         *
         * Note: This filter should typically be used along with the loginIncomingText and loginIncomingHref filters.
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

        module.filter("loginIncomingTooltip", function() {
            return function(emailAccount) {
                if( emailAccount.suspended_login ) {
                    return LOCALE.maketext("Allow “[_1]” to log in and to receive mail.", emailAccount.email);
                }
                else {
                    return LOCALE.maketext("Suspend “[_1]”’s logins and incoming mail.", emailAccount.email);
                }
            };
        });

    }
);