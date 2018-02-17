/*
# base/frontend/manager/mail/pops/test/filters/encodeURIComponent.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                         All rights Reserved.
# copyright@cpanel.net                                                                       http://cpanel.net
# This code is subject to the cPanel license.                               Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/encodeURIComponent"
    ],
    function() {

        "use strict";

        describe("encodeURIComponent filter", function() {

            var encodeURIComponentFilter;

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    encodeURIComponentFilter = _$filter_("encodeURIComponent");
                });
            });

            it("does nothing to an empty string", function() {
                var filtered = encodeURIComponentFilter("");
                expect(filtered).toBe("");
            });

            it("encodes punctuation characters correctly", function() {
                var filtered = encodeURIComponentFilter(",/?:@&=+$#{}|[]\\<>?");
                expect(filtered).toBe("%2C%2F%3F%3A%40%26%3D%2B%24%23%7B%7D%7C%5B%5D%5C%3C%3E%3F");
            });

            it("encodes exactly the same as window.encodeURIComponent", function() {
                var filtered = encodeURIComponentFilter(",/?:@&=+$#{}|[]\\<>?");
                expect(filtered).toBe(window.encodeURIComponent(",/?:@&=+$#{}|[]\\<>?"));
            });

        });
    }
);