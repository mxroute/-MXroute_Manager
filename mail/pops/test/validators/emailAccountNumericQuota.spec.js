/*
# base/frontend/manager/mail/pops/test/validators/emailAccountMinQuota.js Copyright(c) 2017 cPanel, Inc.
#                                                                                         All rights Reserved.
# copyright@cpanel.net                                                                       http://cpanel.net
# This code is subject to the cPanel license.                               Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "mail/pops/validators/emailAccountNumericQuota",
        "ngMocks"
    ],
    function(angular) {

        describe("The emailMinQuota directive", function() {

            var $rootScope, scope, formEl, quotaEl, quotaTypeEl;

            beforeEach(function() {
                module("cpanel.mail.Pops");
                inject(function(_$rootScope_) {
                    $rootScope = _$rootScope_;
                });
            });

            function compileDirective(id) {
                scope = $rootScope.$new();

                inject(function($compile, $templateCache) {
                    var doc = [
                        "<form id='basic' name='form'>",
                        "<input name='quota' type='text' ng-model='quota' email-numeric-quota email-quota-type='form.quotaType'>",
                        "<input name='quotaType' ng-model='quotaType'>",
                        "</form>",
                        " ",
                        "<form id='missing' name='form'>",
                        "<input name='quota' type='text' ng-model='quota' email-numeric-quota email-quota-type='form.quotaType'>",
                        "</form>"
                    ].join("\n");
                    var template = angular.element(doc).filter("#" + id);

                    formEl = $compile(template)(scope);
                    quotaEl = formEl.find("[name=quota]");
                    quotaTypeEl = formEl.find("[name=quotaType]");
                });

            }

            describe("with no other validators", function() {

                beforeEach(function() {
                    compileDirective("basic");
                });

                it("should add number and positiveInteger validators to the ngModelController for the account input", function() {
                    scope.$digest();
                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(typeof quotaNgModel.$validators.number).toBe("function");
                    expect(typeof quotaNgModel.$validators.positiveInteger).toBe("function");
                });

                it("should be valid when the quota is empty", function() {
                    scope.$digest();

                    expect(quotaEl.val()).toBeFalsy();

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when the quota is empty and the quota type is unlimited", function() {
                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBeFalsy();

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when the quota is empty and the quota type is userdefined", function() {
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBeFalsy();

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when the quota is a positive integer and the quota type is userdefined", function() {
                    scope.quota = 1;
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when the quota is a negative integer and the quota type is unlimited", function() {
                    scope.quota = -1;
                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("-1");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be invalid when the quota is an alpha string and the quota type is userdefined", function() {
                    scope.quota = "thisisnotanumber";
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("thisisnotanumber");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(false);
                });

                it("should be valid when the quota is an alpha string and the quota type changes from userdefined to unlimited", function() {
                    scope.quota = "thisisnotanumber";
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("thisisnotanumber");
                    expect(quotaTypeEl.val()).toBe("userdefined");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(false);

                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaTypeEl.val()).toBe("unlimited");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be invalid when the quota is an alpha string and the quota type changes from unlimited to userdefined", function() {
                    scope.quota = "thisisnotanumber";
                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("thisisnotanumber");
                    expect(quotaTypeEl.val()).toBe("unlimited");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);

                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaTypeEl.val()).toBe("userdefined");
                    expect(quotaNgModel.$valid).toBe(false);
                });

                it("should be valid when the quota type is empty", function() {
                    scope.quota = 1;
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1");
                    expect(quotaTypeEl.val()).toBeFalsy();

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when the quota is a floating point number and the quota type is unlimited", function() {
                    scope.quota = 1.123;
                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1.123");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should not be valid when the quota is a floating point number and the quota type is unlimited", function() {
                    scope.quota = 1.123;
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1.123");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(false);
                });

                it("should be valid when the quota is a floating point number and the quota type changes from userdefined to unlimited", function() {
                    scope.quota = 1.123;
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1.123");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(false);

                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1.123");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be invalid when the quota is a floating point number and the quota type changes from unlimited to userdefined", function() {
                    scope.quota = 1.123;
                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1.123");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);

                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1.123");
                    expect(quotaNgModel.$valid).toBe(false);
                });

            });

            describe("with a missing other component", function() {

                beforeEach(function() {
                    compileDirective("missing");
                });

                it("should be valid if the other component hasn't loaded yet and the quota is empty", function() {
                    scope.$digest();

                    expect(quotaEl.val()).toBeFalsy();

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid if the other component hasn't loaded yet and the quota input is NaN", function() {
                    scope.quota = "thisisnotanumber";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("thisisnotanumber");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid if the other component hasn't loaded yet and the quota input is a floating point number", function() {
                    scope.quota = 1.123;
                    scope.$digest();

                    expect(quotaEl.val()).toBe("1.123");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });
            });

        });
    }
);
