/*
# base/frontend/manager/mail/pops/test/views/AddEmailAccount.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                    All rights Reserved.
# copyright@cpanel.net                                                                  http://cpanel.net
# This code is subject to the cPanel license.                          Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false, spyOn: false */

define(
    [
        "lodash",
        "angular",
        "mail/pops/views/addEmailAccount",
        "ngMocks"
    ],
    function(_) {

        var mockMailDomains = [
            { domain: "example.com" },
            { domain: "example2.com" },
            { domain: "example3.com" }
        ];

        describe("addEmailAccountCtrl", function() {

            var $rootScope, $q, scope, createController;

            var rejectAPICalls = false;

            var mockAPIFailure = "Failed to create email account for some reason";

            var mockEmailAccountsService = {
                addEmailAccount: function(emailAccount) {
                    return $q(function(resolve, reject) {
                        if( !rejectAPICalls ) {
                            resolve(emailAccount.email + "+" + emailAccount.domain);
                        }
                        else {
                            reject(mockAPIFailure);
                        }
                    });
                }
            };

            var emailAccountsServiceProvider = function() {
                this.$get = function() {
                    return mockEmailAccountsService;
                };
            };

            var mockFormController = {
                $setPristine: function() { },
                $setUntouched: function() { }
            };

            beforeEach(function() {
                module("cpanel.mail.Pops");

                rejectAPICalls = false;

                module(function($provide) {
                    $provide.provider("emailAccountsService", emailAccountsServiceProvider);
                });

                inject(function(_$rootScope_, _$controller_, _$q_) {

                    $rootScope = _$rootScope_;
                    scope = $rootScope.$new();

                    scope.addEmailAccountForm = mockFormController;

                    window.PAGE = {};

                    createController = function() {
                        return _$controller_("addEmailAccountCtrl", {
                            $scope: scope
                        });
                    };

                    $q = _$q_;
                });


            });

            describe("initialization", function() {

                it("should initialize the scope with values from PAGE", function() {

                    window.PAGE = {
                        requiredPasswordStrength: 11235,
                        userDefinedQuotaDefaultValue: 1234,
                        maxEmailQuota: 54321,
                        mailDomains: mockMailDomains
                    };

                    createController();

                    expect(scope.requiredPasswordStrength).toBe(window.PAGE.requiredPasswordStrength);
                    expect(scope.userDefinedDefaultQuota).toBe(window.PAGE.userDefinedQuotaDefaultValue);
                    expect(scope.defaultQuota).toBe(window.PAGE.userDefinedQuotaDefaultValue);
                    expect(scope.maxQuota).toBe(window.PAGE.maxEmailQuota.valueOf());
                    expect(scope.mailDomains).toEqual(_.map(window.PAGE.mailDomains, _.property("domain")));
                });

                it("should initialize a default emailAccount object in the scope", function() {

                    window.PAGE = {
                        defaultQuotaSelected: "unlimited",
                    };

                    createController();
                    expect(scope.emailAccount).toBeDefined();
                    expect(scope.emailAccount.account).toBeUndefined();
                    expect(scope.emailAccount.domain).toBeUndefined();
                    expect(scope.emailAccount.password).toBeUndefined();
                    expect(scope.emailAccount.password2).toBeUndefined();
                    expect(scope.emailAccount.quota).toBeUndefined();
                    expect(scope.emailAccount.quotaType).toBe(window.PAGE.defaultQuotaSelected);
                    expect(scope.emailAccount.sendWelcome).toBeTruthy();
                });

                it("should pick the first domain if any are provided", function() {

                    window.PAGE = {
                        mailDomains: mockMailDomains
                    };

                    createController();
                    expect(scope.emailAccount).toBeDefined();
                    expect(scope.emailAccount.account).toBeUndefined();
                    expect(scope.emailAccount.domain).toBe(mockMailDomains[0].domain);
                    expect(scope.emailAccount.password).toBeUndefined();
                    expect(scope.emailAccount.password2).toBeUndefined();
                    expect(scope.emailAccount.quota).toBeUndefined();
                    expect(scope.emailAccount.quotaType).toBeUndefined();
                    expect(scope.emailAccount.sendWelcome).toBeTruthy();

                });

            });

            describe("account submit", function() {

                var mockEmailAccount = {
                    account: "account_name",
                    domain: mockMailDomains[0].domain,
                    password: "apassword!$!",
                    quota: 512,
                    quotaType: "userdefined",
                    sendWelcome: 1
                };

                it("should call the addEmailAccount method on the service with the values from the scope", function() {

                    spyOn(mockEmailAccountsService, "addEmailAccount").and.callThrough();

                    createController();
                    scope.emailAccount = mockEmailAccount;
                    scope.addEmailAccount();

                    expect(mockEmailAccountsService.addEmailAccount).toHaveBeenCalledWith({
                        email: mockEmailAccount.account,
                        domain: mockEmailAccount.domain,
                        password: mockEmailAccount.password,
                        quota: mockEmailAccount.quota,
                        send_welcome_email: mockEmailAccount.sendWelcome // eslint-disable-line camelcase
                    });

                });

                it("should set success status with the right message and TTL when the account is successfully added", function() {

                    createController();
                    scope.emailAccount = mockEmailAccount;
                    scope.addEmailAccount();
                    scope.$apply();

                    var email = mockEmailAccount.account + "@" + mockEmailAccount.domain;

                    expect(scope.status).toEqual({
                        type: "success",
                        message: "Account “" + email + "” created.",
                        closeable: true,
                        autoClose: 10000
                    });

                });

                it("should set error status with the right message when the account addition fails", function() {

                    rejectAPICalls = true;

                    createController();
                    scope.emailAccount = mockEmailAccount;
                    scope.addEmailAccount();
                    scope.$apply();

                    expect(scope.status).toEqual({
                        type: "danger",
                        message: mockAPIFailure
                    });

                });

                it("should reset the form when the account is successfully added", function() {

                    spyOn(mockFormController, "$setPristine");
                    spyOn(mockFormController, "$setUntouched");

                    createController();
                    scope.emailAccount = mockEmailAccount;
                    scope.addEmailAccount();
                    scope.$apply();

                    expect(mockFormController.$setPristine).toHaveBeenCalled();
                    expect(mockFormController.$setUntouched).toHaveBeenCalled();

                    expect(scope.emailAccount).toBeDefined();
                    expect(scope.emailAccount.account).toBeUndefined();
                    expect(scope.emailAccount.domain).toBeUndefined();
                    expect(scope.emailAccount.password).toBeUndefined();
                    expect(scope.emailAccount.password2).toBeUndefined();
                    expect(scope.emailAccount.quota).toBeUndefined();
                    expect(scope.emailAccount.quotaType).toBeUndefined();
                    expect(scope.emailAccount.sendWelcome).toBeTruthy();
                });

                it("should reset the form with the domain when domains are specified and the account is successfully added", function() {

                    spyOn(mockFormController, "$setPristine");
                    spyOn(mockFormController, "$setUntouched");

                    window.PAGE.mailDomains = mockMailDomains;

                    createController();
                    scope.emailAccount = mockEmailAccount;
                    scope.addEmailAccount();
                    scope.$apply();

                    expect(mockFormController.$setPristine).toHaveBeenCalled();
                    expect(mockFormController.$setUntouched).toHaveBeenCalled();

                    expect(scope.emailAccount).toBeDefined();
                    expect(scope.emailAccount.account).toBeUndefined();
                    expect(scope.emailAccount.domain).toBe(mockMailDomains[0].domain);
                    expect(scope.emailAccount.password).toBeUndefined();
                    expect(scope.emailAccount.password2).toBeUndefined();
                    expect(scope.emailAccount.quota).toBeUndefined();
                    expect(scope.emailAccount.quotaType).toBeUndefined();
                    expect(scope.emailAccount.sendWelcome).toBeTruthy();
                });

            });

        });

    }
);