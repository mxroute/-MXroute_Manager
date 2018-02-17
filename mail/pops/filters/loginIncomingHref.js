/*
# base/frontend/manager/mail/pops/filters/loginIncomingHref.js Copyright(c) 2017 cPanel, Inc.
#                                                                              All rights Reserved.
# copyright@cpanel.net                                                            http://cpanel.net
# This code is subject to the cPanel license.                    Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "cjt/util/query"
    ],
    function(angular, QUERY) {

        /**
         * Filter to build the href for the suspend/unsuspend login and incoming link for an e-mail account
         * @param  {Object} emailAccount The email account to generate the href for, should have 'email' and 'suspended_login' properties
         * @return {String}              The href to use for the suspend/unsuspend login/incoming link
         *
         * Note: This filter should typically be used along with the loginIncomingTooltip and loginIncomingText filters.
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

        module.filter("loginIncomingHref", function() {
            return function(emailAccount) {

                var action = emailAccount.suspended_login ? "unsuspend" : "suspend";

                var queryString = QUERY.make_query_string({
                    app_key: "email_accounts", // eslint-disable-line camelcase

                    uapi_module: "Batch", // eslint-disable-line camelcase
                    uapi_func: "strict", // eslint-disable-line camelcase

                    uapi_data: JSON.stringify({ // eslint-disable-line camelcase
                        "command": JSON.stringify([ "Email", action + "_incoming", { email: emailAccount.email } ]),
                        "command-0": JSON.stringify([ "Email", action + "_login", { email: emailAccount.email } ])
                    })
                });

                return "../../landing.html?" + queryString;
            };
        });

    }
);