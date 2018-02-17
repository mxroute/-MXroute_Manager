/*
# base/frontend/manager/mail/pops/test/filters/loginIncomingText.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                        All rights Reserved.
# copyright@cpanel.net                                                                      http://cpanel.net
# This code is subject to the cPanel license.                              Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/loginIncomingText"
    ],
    function() {

        "use strict";

        describe("loginIncomingHref filter", function() {

            var loginIncomingTextFilter;

            var email = "emailaccount@somedomain.com";

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    loginIncomingTextFilter = _$filter_("loginIncomingText");
                });
            });

            it("generates the correct tooltip for a suspended account", function() {
                var emailAccount = { email: email, suspended_login: true }; // eslint-disable-line camelcase
                var filtered = loginIncomingTextFilter(emailAccount);
                expect(filtered).toBe("Unsuspend");
            });

            it("generates the correct tooltip for an unsuspended account", function() {
                var emailAccount = { email: email, suspended_login: false }; // eslint-disable-line camelcase
                var filtered = loginIncomingTextFilter(emailAccount);
                expect(filtered).toBe("Suspend");
            });

        });
    }
);