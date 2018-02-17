/*
# base/frontend/manager/mail/pops/filters/loginSuspendedTooltip.js Copyright(c) 2017 cPanel, Inc.
#                                                                                  All rights Reserved.
# copyright@cpanel.net                                                                http://cpanel.net
# This code is subject to the cPanel license.                        Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "cjt/util/locale"
    ],
    function(angular, LOCALE) {

        /**
         * Filter to generate the title for the login suspended icon in the email table
         * @param {Object} emailAccount The email account to generate the title for, should have 'email' and 'suspended_login' properties
         *
         * @example
         * <span class="fa-stack fa-lg" title="{{ emailAccount | loginSuspendedTooltip }}">
         *     <i class="fa fa-upload fa-stack-1x"></i>
         *     <i class="fa fa-ban fa-stack-2x text-danger" ng-if="emailAccount.suspended_login"></i>
         * </span>
         */

        var module;
        try {
            module = angular.module("cpanel.mail.Pops");
        }
        catch(e) {
            module = angular.module("cpanel.mail.Pops", []);
        }

        module.filter("loginSuspendedTooltip", function () {
            return function (emailAccount) {
                if (emailAccount.suspended_login) {
                    return LOCALE.maketext("“[_1]” is suspended from sending and reading mail.", emailAccount.email);
                }
                else {
                    return LOCALE.maketext("“[_1]” can send and receive mail.", emailAccount.email);
                }
            };
        });

    }
);