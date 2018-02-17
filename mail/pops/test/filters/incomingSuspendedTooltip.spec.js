/*
# base/frontend/manager/mail/pops/test/filters/incomingSuspendedTooltip.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                               All rights Reserved.
# copyright@cpanel.net                                                                             http://cpanel.net
# This code is subject to the cPanel license.                                     Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/incomingSuspendedTooltip"
    ],
    function() {

        "use strict";

        describe("incomingSuspendedTooltip filter", function() {

            var incomingSuspendedTooltipFilter;

            var email = "emailaccount@somedomain.com";

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    incomingSuspendedTooltipFilter = _$filter_("incomingSuspendedTooltip");
                });
            });

            it("generates the correct tooltip for a suspended account", function() {
                var emailAccount = { email: email, suspended_incoming: true }; // eslint-disable-line camelcase
                var filtered = incomingSuspendedTooltipFilter(emailAccount);
                expect(filtered).toBe("“" + email + "” is suspended from receiving mail.");
            });

            it("generates the correct tooltip for an unsuspended account", function() {
                var emailAccount = { email: email, suspended_incoming: false }; // eslint-disable-line camelcase
                var filtered = incomingSuspendedTooltipFilter(emailAccount);
                expect(filtered).toBe("“" + email + "” can receive mail.");
            });

        });
    }
);