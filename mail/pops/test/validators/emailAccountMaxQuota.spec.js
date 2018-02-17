/*
# base/frontend/manager/mail/pops/test/validators/emailAccountMaxQuota.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                              All rights Reserved.
# copyright@cpanel.net                                                                            http://cpanel.net
# This code is subject to the cPanel license.                                    Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "mail/pops/validators/emailAccountMaxQuota",
        "ngMocks"
    ],
    function(angular) {

        describe("The emailMaxQuota directive", function() {

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
                        "<input name='quota' type='text' ng-model='quota' email-max-quota='10' email-quota-type='form.quotaType'>",
                        "<input name='quotaType' ng-model='quotaType'>",
                        "</form>",
                        " ",
                        "<form id='missing' name='form'>",
                        "<input name='quota' type='number' ng-model='quota' email-max-quota='10' email-quota-type='form.quotaType'>",
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

                it("should add a emailMaxQuota validator to the ngModelController for the account input", function() {
                    scope.$digest();
                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(typeof quotaNgModel.$validators.emailMaxQuota).toBe("function");
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

                it("should be valid when the quota is equal to the max and the quota type is userdefined", function() {
                    scope.quota = 10;
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("10");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when the quota is less than the max and the quota type is userdefined", function() {
                    scope.quota = 2;
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("2");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when the quota is greater than the max and the quota type is unlimited", function() {
                    scope.quota = 11;
                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("11");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be invalid when the quota is greater than the max and the quota type is userdefined", function() {
                    scope.quota = 11;
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("11");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(false);
                });

                it("should be valid when the quota is greater than the max and the quota type changes from userdefined to unlimited", function() {
                    scope.quota = 11;
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("11");
                    expect(quotaTypeEl.val()).toBe("userdefined");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(false);

                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaTypeEl.val()).toBe("unlimited");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be invalid when the quota is greater than the max and the quota type changes from unlimited to userdefined", function() {
                    scope.quota = 11;
                    scope.quotaType = "unlimited";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("11");
                    expect(quotaTypeEl.val()).toBe("unlimited");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);

                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaTypeEl.val()).toBe("userdefined");
                    expect(quotaNgModel.$valid).toBe(false);
                });

                it("should be valid when the quota type is empty", function() {
                    scope.quota = 11;
                    scope.$digest();

                    expect(quotaEl.val()).toBe("11");
                    expect(quotaTypeEl.val()).toBeFalsy();

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

                it("should be valid when a userdefined quota is NaN", function() {
                    scope.quota     = "thisisnotanumber";
                    scope.quotaType = "userdefined";
                    scope.$digest();

                    expect(quotaEl.val()).toBe("thisisnotanumber");
                    expect(quotaTypeEl.val()).toBe("userdefined");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
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

                it("should be valid if the other component hasn't loaded yet and the quota input is greater than the max", function() {
                    scope.quota = 11;
                    scope.$digest();

                    expect(quotaEl.val()).toBe("11");

                    var quotaNgModel = quotaEl.controller("ngModel");
                    expect(quotaNgModel.$valid).toBe(true);
                });

            });

        });
    }
);
