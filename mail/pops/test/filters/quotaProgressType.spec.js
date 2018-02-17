/*
# base/frontend/manager/mail/pops/test/filters/loginIncomingText.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                        All rights Reserved.
# copyright@cpanel.net                                                                      http://cpanel.net
# This code is subject to the cPanel license.                              Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "lodash",
        "angular",
        "ngResource",
        "ngMocks",
        "mail/pops/filters/quotaProgressType"
    ],
    function(_) {

        "use strict";

        describe("quotaProgressType filter", function() {

            var quotaProgressTypeFilter;

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$filter_) {
                    quotaProgressTypeFilter = _$filter_("quotaProgressType");
                });
            });

            it("should return 'success' if the percentage is less than 40", function() {
                _.each(_.range(0, 39), function(perc) {
                    var filtered = quotaProgressTypeFilter(perc);
                    expect(filtered).toBe("success");
                });
            });

            it("should return 'info' if the percentage is between 40 and 59", function() {
                _.each(_.range(40, 59), function(perc) {
                    var filtered = quotaProgressTypeFilter(perc);
                    expect(filtered).toBe("info");
                });
            });

            it("should return 'warning' if the percentage is between 60 and 79", function() {
                _.each(_.range(60, 79), function(perc) {
                    var filtered = quotaProgressTypeFilter(perc);
                    expect(filtered).toBe("warning");
                });
            });

            it("should return 'danger' if the percentage is 80 or above", function() {
                _.each(_.range(80, 100), function(perc) {
                    var filtered = quotaProgressTypeFilter(perc);
                    expect(filtered).toBe("danger");
                });
            });

        });
    }
);