/*
# base/frontend/manager/mail/pops/test/filters/loginIncomingHref.js Copyright(c) 2017 cPanel, Inc.
#                                                                                   All rights Reserved.
# copyright@cpanel.net                                                                 http://cpanel.net
# This code is subject to the cPanel license.                         Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/loginIncomingHref"
    ],
    function() {

        "use strict";

        describe("loginIncomingHref filter", function() {

            var loginIncomingHrefFilter;

            var email = "emailaccount@somedomain.com";
            var encodedEmail = "emailaccount%40somedomain.com";

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    loginIncomingHrefFilter = _$filter_("loginIncomingHref");
                });
            });

            it("properly generates the HREFs for the a suspended account", function() {

                var emailAccount = { email: email, suspended_login: true }; // eslint-disable-line camelcase
                var filtered = loginIncomingHrefFilter(emailAccount);

                var expected =
                    "../../landing.html?app_key=email_accounts&uapi_module=Batch&uapi_func=strict" +
                    "&uapi_data=%7B%22command%22%3A%22%5B%5C%22Email%5C%22%2C%5C%22unsuspend_incoming%5C%22%2C%7B%5C%22" +
                    "email%5C%22%3A%5C%22" + encodedEmail + "%5C%22%7D%5D%22%2C%22command-0%22%3A%22%5B%5C%22" +
                    "Email%5C%22%2C%5C%22unsuspend_login%5C%22%2C%7B%5C%22email%5C%22%3A%5C%22" +
                    encodedEmail + "%5C%22%7D%5D%22%7D";

                expect(filtered).toBe(expected);
            });

            it("properly generates the HREFs for the an unsuspended account", function() {

                var emailAccount = { email: email, suspended_login: false }; // eslint-disable-line camelcase
                var filtered = loginIncomingHrefFilter(emailAccount);

                var expected =
                    "../../landing.html?app_key=email_accounts&uapi_module=Batch&uapi_func=strict" +
                    "&uapi_data=%7B%22command%22%3A%22%5B%5C%22Email%5C%22%2C%5C%22suspend_incoming%5C%22%2C%7B%5C%22" +
                    "email%5C%22%3A%5C%22" + encodedEmail + "%5C%22%7D%5D%22%2C%22command-0%22%3A%22%5B%5C%22" +
                    "Email%5C%22%2C%5C%22suspend_login%5C%22%2C%7B%5C%22email%5C%22%3A%5C%22" +
                    encodedEmail + "%5C%22%7D%5D%22%7D";

                expect(filtered).toBe(expected);
            });


        });
    }
);
