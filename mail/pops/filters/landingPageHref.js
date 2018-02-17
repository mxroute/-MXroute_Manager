/*
# base/frontend/manager/mail/pops/filters/landingPageHref.js Copyright(c) 2017 cPanel, Inc.
#                                                                            All rights Reserved.
# copyright@cpanel.net                                                          http://cpanel.net
# This code is subject to the cPanel license.                  Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "cjt/util/query"
    ],
    function(angular, QUERY) {

        /**
         * A filter to generate the href for an email accounts landing page
         * @param  {String} email The email account to generate the link for
         * @param  {String} func  The function on the Email UAPI module to call
         * @return {String}       Returns the href for the landing page
         *
         * @example
         * <a href="{{ emailAccount.email | landingPageHref:'suspend_login' }}">Suspend Login</a>
         */

        var module;
        try {
            module = angular.module("cpanel.mail.Pops");
        }
        catch(e) {
            module = angular.module("cpanel.mail.Pops", []);
        }

        module.filter("landingPageHref", function() {
            return function(email, func) {
                var landingQuery = QUERY.make_query_string({
                    app_key: "email_accounts", // eslint-disable-line camelcase
                    uapi_module: "Email", // eslint-disable-line camelcase
                    uapi_func: func, // eslint-disable-line camelcase
                    uapi_data: JSON.stringify( { email: email } ) // eslint-disable-line camelcase
                });

                return "../../landing.html?" + landingQuery;
            };
        });
    }
);