/*
# base/frontend/manager/mail/pops/test/filters/loginIncomingTooltip.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                           All rights Reserved.
# copyright@cpanel.net                                                                         http://cpanel.net
# This code is subject to the cPanel license.                                 Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/loginIncomingTooltip"
    ],
    function() {

        "use strict";

        describe("loginIncomingTooltip filter", function() {

            var loginIncomingTooltipFilter;

            var email = "emailaccount@somedomain.com";

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    loginIncomingTooltipFilter = _$filter_("loginIncomingTooltip");
                });
            });

            it("generates the correct tooltip for a suspended account", function() {
                var emailAccount = { email: email, suspended_login: true }; // eslint-disable-line camelcase
                var filtered = loginIncomingTooltipFilter(emailAccount);
                expect(filtered).toBe("Allow “" + email + "” to log in and to receive mail.");
            });

            it("generates the correct tooltip for an unsuspended account", function() {
                var emailAccount = { email: email, suspended_login: false }; // eslint-disable-line camelcase
                var filtered = loginIncomingTooltipFilter(emailAccount);
                expect(filtered).toBe("Suspend “" + email + "”’s logins and incoming mail.");
            });

        });
    }
);