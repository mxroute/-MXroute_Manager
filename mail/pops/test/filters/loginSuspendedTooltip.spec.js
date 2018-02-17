/*
# base/frontend/manager/mail/pops/test/filters/loginSuspendedTooltip.js Copyright(c) 2017 cPanel, Inc.
#                                                                                       All rights Reserved.
# copyright@cpanel.net                                                                     http://cpanel.net
# This code is subject to the cPanel license.                             Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/loginSuspendedTooltip"
    ],
    function() {

        "use strict";

        describe("loginSuspendedTooltip filter", function() {

            var loginSuspendedTooltipFilter;

            var email = "emailaccount@somedomain.com";

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    loginSuspendedTooltipFilter = _$filter_("loginSuspendedTooltip");
                });
            });

            it("generates the correct tooltip for a suspended account", function() {
                var emailAccount = { email: email, suspended_login: true }; // eslint-disable-line camelcase
                var filtered = loginSuspendedTooltipFilter(emailAccount);
                expect(filtered).toBe("“" + email + "” is suspended from sending and reading mail.");
            });

            it("generates the correct tooltip for an unsuspended account", function() {
                var emailAccount = { email: email, suspended_login: false }; // eslint-disable-line camelcase
                var filtered = loginSuspendedTooltipFilter(emailAccount);
                expect(filtered).toBe("“" + email + "” can send and receive mail.");
            });

        });
    }
);