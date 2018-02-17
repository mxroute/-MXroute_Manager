/*
# ./test/directives/zone_editor_caa_validators.spec.js     Copyright 2017 cPanel, Inc.
#                                                                  All rights Reserved.
# copyright@cpanel.net                                                http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, expect: false */

define(["zone_editor/directives/caa_validators"], function(VALIDATORS) {
    "use strict";

    describe("caa value validator for iodef", function() {
        it("should validate mailto url", function() {
            var results = VALIDATORS.methods.caaValue("mailto:fred@fred.com", "iodef");
            expect(results.isValid).toBeTruthy();
        });

        it("should validate a url with http", function() {
            var results = VALIDATORS.methods.caaValue("http://www.fred.com/notify", "iodef");
            expect(results.isValid).toBeTruthy();
        });

        it("should validate a url with https", function() {
            var results = VALIDATORS.methods.caaValue("https://www.fred.com/notify", "iodef");
            expect(results.isValid).toBeTruthy();
        });

        it("should not validate just an email address", function() {
            var results = VALIDATORS.methods.caaValue("fred@fred.com", "iodef");
            expect(results.isValid).toBeFalsy();
        });

        it("should not validate a mailformed mailto url", function() {
            var tests = [
                "mailto:fredcom",
                "mailto:fred@fred",
                "fred@fred.com",
                "mailto:fred.fred@com"
            ];

            for (var i = 0, len = tests.length; i < len; i++) {
                var results = VALIDATORS.methods.caaValue(tests[i], "iodef");
                expect(results.isValid).toBeFalsy();
            }
        });
    });

    describe("caa value validator for issue and issuewild", function() {

        it("should not validate an empty string.", function() {
            var results = VALIDATORS.methods.caaValue("", "issue");
            expect(results.isValid).toBeFalsy();
        });

        it("should validate a single semicolon.", function() {
            var results = VALIDATORS.methods.caaValue(";", "issue");
            expect(results.isValid).toBeTruthy();
        });

        it("should not validate additional parameters after the semicolon.", function() {
            var results = VALIDATORS.methods.caaValue("; joe=ugly man=woman", "issue");
            expect(results.isValid).toBeFalsy();
        });

        it("should validate various domain names.", function() {
            var tests = [
                "certsrus.com",
                "certs.certsrus.com"
            ];

            for (var i = 0, len = tests.length; i < len; i++) {
                var results = VALIDATORS.methods.caaValue(tests[i], "issue");
                expect(results.isValid).toBeTruthy();
            }
        });

    });
});
