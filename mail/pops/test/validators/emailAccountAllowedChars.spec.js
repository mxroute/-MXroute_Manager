/*
# base/frontend/manager/mail/pops/test/validators/emailAccountAllowedChars.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                                  All rights Reserved.
# copyright@cpanel.net                                                                                http://cpanel.net
# This code is subject to the cPanel license.                                        Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "mail/pops/validators/emailAccountAllowedChars",
        "ngMocks"
    ],
    function(angular) {

        describe("The emailAllowedChars directive", function() {

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
                        "<input name='account' ng-model='account' email-allowed-chars>",
                        "</form>",
                        " ",
                        "<form id='required' name='form'>",
                        "<input name='account' ng-model='account' email-allowed-chars required>",
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

                it("should add a emailAllowedChars validator to the ngModelController for the account input", function() {
                    scope.$digest();
                    var accountNgModel = accountEl.controller("ngModel");
                    expect(typeof accountNgModel.$validators.emailAllowedChars).toBe("function");
                });

                it("should be valid when the account input is empty", function() {
                    scope.$digest();

                    expect(accountEl.val()).toBeFalsy();

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be valid when the input contains only the allowed characters", function(){
                    scope.account = "ABCDEFGHIJKLMNOPQRSTUVWXYZ.abcdefghijklmnopqrstuvwxyz-012345_6789";
                    scope.$digest();

                    expect(accountEl.val()).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ.abcdefghijklmnopqrstuvwxyz-012345_6789");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be invalid when the input contains any unallowed characters", function() {
                    scope.account = "!@#$%^&*()+={}[]|\\:\";'<>?,/";
                    scope.$digest();

                    expect(accountEl.val()).toBe("!@#$%^&*()+={}[]|\\:\";'<>?,/");

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
