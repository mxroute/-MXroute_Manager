/*
# base/frontend/manager/mail/pops/filters/incomingSuspendedTooltip.js Copyright(c) 2017 cPanel, Inc.
#                                                                                     All rights Reserved.
# copyright@cpanel.net                                                                   http://cpanel.net
# This code is subject to the cPanel license.                           Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "cjt/util/locale"
    ],
    function(angular, LOCALE) {

        /**
         * Filter to generate the title for the incoming suspended icon in the email table
         * @param {Object} emailAccount The email account to generate the title for, should have 'email' and 'suspended_incoming' properties
         *
         * @example
         * <span class="fa-stack fa-lg" title="{{ emailAccount | incomingSuspendedTooltip }}">
         *     <i class="fa fa-upload fa-stack-1x"></i>
         *     <i class="fa fa-ban fa-stack-2x text-danger" ng-if="emailAccount.suspended_incoming"></i>
         * </span>
         */

        var module;
        try {
            module = angular.module("cpanel.mail.Pops");
        }
        catch(e) {
            module = angular.module("cpanel.mail.Pops", []);
        }

        module.filter("incomingSuspendedTooltip", function () {
            return function (emailAccount) {
                if (emailAccount.suspended_incoming) {
                    return LOCALE.maketext("“[_1]” is suspended from receiving mail.", emailAccount.email);
                }
                else {
                    return LOCALE.maketext("“[_1]” can receive mail.", emailAccount.email);
                }
            };
        });

    }

);