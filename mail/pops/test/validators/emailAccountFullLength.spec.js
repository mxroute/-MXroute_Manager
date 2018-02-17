/*
# base/frontend/manager/mail/pops/test/validators/emailAccountFullLength.js Copyright(c) 2017 cPanel, Inc.
#                                                                                           All rights Reserved.
# copyright@cpanel.net                                                                         http://cpanel.net
# This code is subject to the cPanel license.                                 Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false */

define(
    [
        "angular",
        "mail/pops/validators/emailAccountFullLength",
        "ngMocks"
    ],
    function(angular) {

        describe("The emailFulllength directive", function() {

            var $rootScope, scope, formEl, accountEl, domainEl;

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
                        "<input name='account' ng-model='account' email-fulllength='10' email-other-value='form.domain'>",
                        "<input name='domain' ng-model='domain'>",
                        "</form>",
                        " ",
                        "<form id='missing' name='form'>",
                        "<input name='account' ng-model='account' email-fulllength='10' email-other-value='form.domain'>",
                        "</form>",
                        " ",
                        "<form id='invalid' name='form'>",
                        "<input name='account' ng-model='account' email-fulllength='10' email-other-value='form.domain'>",
                        "<input name='domain' ng-model='domain' maxlength='2'>",
                        "</form>"
                    ].join("\n");
                    var template = angular.element(doc).filter("#" + id);

                    formEl = $compile(template)(scope);
                    accountEl = formEl.find("[name=account]");
                    domainEl = formEl.find("[name=domain]");
                });

            }

            describe("with no other validators", function() {

                beforeEach(function() {
                    compileDirective("basic");
                });

                it("should add a emailFulllength validator to the ngModelController for the account input", function() {
                    scope.$digest();
                    var accountNgModel = accountEl.controller("ngModel");
                    expect(typeof accountNgModel.$validators.emailFulllength).toBe("function");
                });

                it("should be valid when the account and domain input are empty", function() {
                    scope.$digest();

                    expect(accountEl.val()).toBeFalsy();

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be valid when the account is empty but the domain is less than the max length - 1", function() {
                    scope.domain = "123456789";
                    scope.$digest();

                    expect(accountEl.val()).toBeFalsy();

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be invalid when the account is empty but the domain is greater than the max length - 1", function() {
                    scope.domain = "1234567890";
                    scope.$digest();

                    expect(accountEl.val()).toBeFalsy();

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(false);
                });

                it("should be valid when the combined length of the inputs is less than the max length - 1", function(){
                    scope.account = "1234";
                    scope.domain = "5678";
                    scope.$digest();

                    expect(accountEl.val()).toBe("1234");
                    expect(domainEl.val()).toBe("5678");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be invalid when the combined length of the inputs is greater than the max length - 1", function() {
                    scope.account = "12345";
                    scope.domain = "67890";
                    scope.$digest();

                    expect(accountEl.val()).toBe("12345");
                    expect(domainEl.val()).toBe("67890");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(false);
                });

                it("should be invalid when the other value is valid then changes to invalid", function() {
                    scope.account = "1234";
                    scope.domain = "5678";
                    scope.$digest();

                    expect(accountEl.val()).toBe("1234");
                    expect(domainEl.val()).toBe("5678");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);

                    scope.domain = "567890";
                    scope.$digest();

                    expect(accountNgModel.$valid).toBe(false);
                });

            });

            describe("with a missing other component", function() {

                beforeEach(function() {
                    compileDirective("missing");
                });

                it("should be valid if the other component hasn't loaded yet and the account input is empty", function() {
                    scope.$digest();

                    expect(accountEl.val()).toBeFalsy();

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

                it("should be invalid if the other component hasn't loaded yet and the account input is greater than the max length - 1", function() {
                    scope.account = "0123456789";
                    scope.$digest();

                    expect(accountEl.val()).toBe("0123456789");

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(false);
                });

            });

            describe("with an invalid other component", function() {

                beforeEach(function() {
                    compileDirective("invalid");
                });

                it("should be valid if the other value is invalid but the total length is less than max length - 1", function() {
                    scope.account = "1234";
                    scope.domain = "5678";
                    scope.$digest();

                    expect(accountEl.val()).toBe("1234");
                    expect(domainEl.val()).toBe("5678");

                    var domainNgModel = domainEl.controller("ngModel");
                    expect(domainNgModel.$valid).toBe(false);

                    var accountNgModel = accountEl.controller("ngModel");
                    expect(accountNgModel.$valid).toBe(true);
                });

            });

        });
    }
);
