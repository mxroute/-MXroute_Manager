/*
# base/frontend/manager/mail/pops/test/filters/emailLocaleString.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                        All rights Reserved.
# copyright@cpanel.net                                                                      http://cpanel.net
# This code is subject to the cPanel license.                              Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "cjt/util/locale",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/emailLocaleString"
    ],
    function(angular, LOCALE) { // eslint-disable-line no-unused-vars

        "use strict";

        describe("emailLocaleString filter", function() {

            var emailLocaleStringFilter;

            var localeStrings = [
                "Allow “[_1]” to log in.",
                "Suspend “[_1]”’s logins.",
                "Allow “[_1]” to receive mail.",
                "Suspend “[_1]” from receiving mail.",
                "Access Webmail for “[_1]”.",
                "Manage external authentication for “[_1]”.",
                "Configure calendars and contacts for “[_1]”.",
                "Manage disk usage for “[_1]”."
            ];

            var localeStringsWithoutParams = [
                "Access Webmail",
                "Manage External Authentication",
                "Manage Disk Usage"
            ];

            var emails = [
                "someuser@somedomain.com",
                "anotheruser@anotherdomain.com",
                "yetadifferentuser@somedomain.com"
            ];

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    emailLocaleStringFilter = _$filter_("emailLocaleString");
                });
            });

            it("properly injects the email into the locale string", function() {
                localeStrings.forEach(function(ls) {
                    emails.forEach(function(email) {
                        var filtered = emailLocaleStringFilter(email, ls);
                        var localeText = LOCALE.makevar(ls, email);
                        var raw = ls.replace("[_1]", email);
                        expect(filtered).toBe(localeText);
                        expect(filtered).toBe(raw);
                    });
                });
            });

            it("doesn't mess up strings without parameters in them", function() {
                localeStringsWithoutParams.forEach(function(ls) {
                    emails.forEach(function(email) {
                        var filtered = emailLocaleStringFilter(email, ls);
                        expect(filtered).toBe(ls);
                    });
                });
            });

        });
    }
);
