/*
# base/frontend/manager/mail/pops/test/validators/emailAccountSafePeriods.js Copyright(c) 2017 cPanel, Inc.
#                                                                                            All rights Reserved.
# copyright@cpanel.net                                                                          http://cpanel.net
# This code is subject to the cPanel license.                                  Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "mail/pops/validators/emailAccountSafePeriods",
        "ngMocks"
    ],
    function(angular) {

        describe("The emailSafePeriods directive", function() {

            var $rootScope, scope, formEl, accountEl;

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
                        "<input name='account' ng-model='account' email-safe-periods>",
                        "</form>",
                        " ",
                        "<form id='required' name='form'>",
                        "<input name='account' ng-model='account' email-safe-periods required>",
                        "</form>"
                    ].join("\n");
                    var template = angular.element(doc).filter("#" + id);

                    formEl = $compile(template)(scope);
                    accountEl = formEl.find("[name=account]");
                });

            }

            describe("with no other validators", function() {

                beforeEach(function() {
                    compileDirective("basic");
                });

                it("should add a emailSafePeriods validator to the ngModelController for the account input", function() {
                    scope.$digest();
                    var accountNgModel = accountEl.controller("ngModel");
                    expect(typeof accountNgModel.$validators.emailSafePeriods).toBe("function");
                });

                it("should be valid when the account input is empty", function() {
                    scope.$digest();

                    expect(accountEl.val()).toBeFalsy();

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be valid when the input contains single periods that aren't the first or last character", function(){
                    scope.account = "abcd.efg.hijkl.mnop";
                    scope.$digest();

                    expect(accountEl.val()).toBe("abcd.efg.hijkl.mnop");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be invalid when the input begins with a period", function() {
                    scope.account = ".this.is.not.allowed";
                    scope.$digest();

                    expect(accountEl.val()).toBe(".this.is.not.allowed");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(false);
                });

                it("should be invalid when the input ends with a period", function() {
                    scope.account = "this.is.not.allowed.";
                    scope.$digest();

                    expect(accountEl.val()).toBe("this.is.not.allowed.");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(false);
                });

                it("should be invalid when the input has a double period anywhere", function() {
                    scope.account = "this..is..not..allowed";
                    scope.$digest();

                    expect(accountEl.val()).toBe("this..is..not..allowed");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(false);
                });

            });

            describe("with required on the account input", function() {

                beforeEach(function() {
                    compileDirective("required");
                });

                it("should be invalid when the input is empty", function() {
                    scope.$digest();

                    expect(accountEl.val()).toBeFalsy();

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(false);
                });

            });

        });
    }
);
