/*
# base/frontend/manager/mail/pops/test/filters/landingPageHref.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                      All rights Reserved.
# copyright@cpanel.net                                                                    http://cpanel.net
# This code is subject to the cPanel license.                            Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/landingPageHref"
    ],
    function() {

        "use strict";

        describe("landingPageHref filter", function() {

            var landingPageHrefFilter;

            var landingPageFuncs = [
                "suspend_incoming",
                "unsuspend_incoming",
                "suspend_login",
                "unsuspend_login"
            ];

            var email = "emailaccount@somedomain.com";
            var encodedEmail = "emailaccount%40somedomain.com";

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    landingPageHrefFilter = _$filter_("landingPageHref");
                });
            });

            it("properly generates the HREFs for the landing page links", function() {
                landingPageFuncs.forEach(function(func) {
                    var filtered = landingPageHrefFilter(email, func);
                    var expected = "../../landing.html?app_key=email_accounts&uapi_module=Email&uapi_func=" + func + "&uapi_data=%7B%22email%22%3A%22" + encodedEmail + "%22%7D";
                    expect(filtered).toBe(expected);
                });
            });

        });
    }
);
