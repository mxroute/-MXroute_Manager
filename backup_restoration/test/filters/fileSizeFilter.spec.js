/*
<<<<<<< HEAD
# backup_restoration/test/filters/fileSizeFilter.spec.js Copyright 2017 cPanel, Inc.
=======
# backup_restoration/test/filters/fileSizeFilter.spec.js    Copyright 2017 cPanel, Inc.
>>>>>>> HB-2791
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, expect: false, beforeEach: false */

define([
        "angular",
        "ngMocks",
        "backup_restoration/filters/fileSizeFilter"
    ],
    function(angular) {
        describe("the File Size Filter", function() {

            "use strict";
            var $filter;

            beforeEach(function() {

                module("App");

                inject(function(_$filter_) {
                    $filter = _$filter_;
                });
            });
            it("should divide the number to be less than 1024 and append the correct data size", function() {

                // Returned string from filter utilizes 'NO-BREAK SPACE' in string
                var tests = [{
                    value: 2,
                    expect: "2\u00a0bytes"
                }, {
                    value: 2000,
                    expect: "1.95\u00a0KB"
                }, {
                    value: 2048000,
                    expect: "1.95\u00a0MB"
                }, {
                    value: 2097152000,
                    expect: "1.95\u00a0GB"
                }, {
                    value: 2147480000000,
                    expect: "1.95\u00a0TB"
                }, {
                    value: "string test",
                    expect: "NaN\u00a0bytes"
                }, {
                    value: null,
                    expect: "0\u00a0bytes"
                }, {
                    value: undefined,
                    expect: "NaN\u00a0bytes"
                }];

                tests.forEach(function(test) {
                    expect($filter("convertedSize")(test.value)).toEqual(test.expect);
                });
            });
        });
    }
);