/*
# base/frontend/manager/mail/pops/test/views/listEmailAccounts.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                      All rights Reserved.
# copyright@cpanel.net                                                                    http://cpanel.net
# This code is subject to the cPanel license.                            Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false, spyOn: false */

define(
    [
        "lodash",
        "angular",
        "mail/pops/views/listEmailAccounts",
        "ngMocks"
    ],
    function(_) {

        var mockListAccountsData = [
            {"domain":"example.com","diskusedpercent":0,"humandiskquota":"256 MB","diskusedpercent20":0,"suspended_incoming":0,"txtdiskquota":"256.00","diskused":0,"login":"fake_email_18@example.com","humandiskused":"None","mtime":1500332027,"suspended_login":0,"_diskquota":"268435456","user":"fake_email_18","email":"fake_email_18@example.com","_diskused":0,"diskquota":"256.00"},
            {"mtime":1498591814,"login":"fake_email_19@example.com","diskused":0,"humandiskused":"None","suspended_login":0,"_diskquota":null,"email":"fake_email_19@example.com","_diskused":0,"user":"fake_email_19","diskquota":"unlimited","domain":"example.com","diskusedpercent":0,"humandiskquota":"None","diskusedpercent20":0,"txtdiskquota":"unlimited","suspended_incoming":0},
            {"humandiskquota":"None","domain":"example.com","diskusedpercent":0,"txtdiskquota":"unlimited","suspended_incoming":0,"diskusedpercent20":0,"suspended_login":0,"mtime":1498591799,"login":"fake_email_2@example.com","diskused":0,"humandiskused":"None","diskquota":"unlimited","_diskquota":null,"email":"fake_email_2@example.com","_diskused":0,"user":"fake_email_2"},
            {"humandiskused":"None","diskused":0,"login":"fake_email_20@example.com","mtime":1498591815,"suspended_login":0,"_diskquota":null,"user":"fake_email_20","_diskused":0,"email":"fake_email_20@example.com","diskquota":"unlimited","domain":"example.com","diskusedpercent":0,"humandiskquota":"None","diskusedpercent20":0,"suspended_incoming":0,"txtdiskquota":"unlimited"},
            {"txtdiskquota":"unlimited","suspended_incoming":0,"diskusedpercent20":0,"humandiskquota":"None","diskusedpercent":0,"domain":"example.com","diskquota":"unlimited","email":"fake_email_21@example.com","_diskused":0,"user":"fake_email_21","_diskquota":null,"suspended_login":0,"mtime":1498591816,"login":"fake_email_21@example.com","diskused":0,"humandiskused":"None"},
            {"diskquota":"unlimited","_diskused":0,"email":"fake_email_22@example.com","user":"fake_email_22","_diskquota":null,"suspended_login":0,"mtime":1498591816,"diskused":0,"login":"fake_email_22@example.com","humandiskused":"None","txtdiskquota":"unlimited","suspended_incoming":0,"diskusedpercent20":0,"humandiskquota":"None","diskusedpercent":0,"domain":"example.com"},
            {"domain":"example.com","diskusedpercent":0,"humandiskquota":"None","diskusedpercent20":0,"suspended_incoming":0,"txtdiskquota":"unlimited","login":"fake_email_23@example.com","diskused":0,"humandiskused":"None","mtime":1498591817,"suspended_login":0,"_diskquota":null,"user":"fake_email_23","_diskused":0,"email":"fake_email_23@example.com","diskquota":"unlimited"}
        ];

        describe("listEmailAccountsCtrl", function() {

            var $rootScope, $q, scope, createController;

            var rejectAPICalls = false;

            var mockAPIFailure = "Failed to create email account for some reason";

            var datalessAPI = function() {
                return $q(function(resolve, reject) {
                    if( !rejectAPICalls ) {
                        resolve("");
                    }
                    else {
                        reject(mockAPIFailure);
                    }
                });
            };

            var mockEmailAccountsService = {
                getEmailAccounts: function() {
                    return $q(function(resolve, reject) {
                        if( !rejectAPICalls ) {
                            resolve({
                                data: mockListAccountsData.slice(),
                                meta: { paginate: { total_records: mockListAccountsData.length } } // eslint-disable-line camelcase
                            });
                        }
                        else {
                            reject(mockAPIFailure);
                        }
                    });
                },
                changePassword: datalessAPI,
                changeQuota: datalessAPI,
                deleteEmailAccount: datalessAPI
            };

            var emailAccountsServiceProvider = function() {
                this.$get = function() {
                    return mockEmailAccountsService;
                };
            };

            var mockGrowlService = {
                success: function() {

                },
                error: function() {

                }
            };

            var growlProvider = function() {
                this.$get = function() {
                    return mockGrowlService;
                };
            };

            var mockComponentSettingSaverService = {
                register: function(componentName) {

                },
                set: function() {

                }
            };

            var componentSettingSaverServiceProvider = function() {
                this.$get = function() {
                    return mockComponentSettingSaverService;
                };
            };

            beforeEach(function() {
                module("cpanel.mail.Pops");

                rejectAPICalls = false;

                module(function($provide) {
                    $provide.provider("emailAccountsService", emailAccountsServiceProvider);
                    $provide.provider("ComponentSettingSaverService", componentSettingSaverServiceProvider);
                    $provide.provider("growl", growlProvider);
                });

                inject(function(_$rootScope_, _$controller_, _$q_) {

                    $rootScope = _$rootScope_;
                    scope = $rootScope.$new();

                    window.PAGE = {};

                    createController = function() {
                        return _$controller_("listEmailAccountsCtrl", {
                            $scope: scope
                        });
                    };

                    $q = _$q_;
                });


            });

            it("should initialize the scope with variables from PAGE", function() {

                window.PAGE = {
                    requiredPasswordStrength: 1234,
                    webmailEnabled: false,
                    externalAuthModulesConfigured: true,
                    showCalendarAndContactItems: false,
                    emailDiskUsageEnabled: true,
                    userDefinedQuotaDefaultValue: 4321,
                    maxEmailQuota: 5678,
                    nvdata: { "EmailAccountsTable": {
                        sortBy: "domain",
                        sortDirection: "desc",
                        pageSize: "50",
                        filterValue: "filterme!"
                    }}
                };

                createController();

                expect(scope.requiredPasswordStrength).toBe(window.PAGE.requiredPasswordStrength);
                expect(scope.webmailEnabled).toBe(window.PAGE.webmailEnabled);
                expect(scope.externalAuthConfig).toBe(window.PAGE.externalAuthModulesConfigured);
                expect(scope.showCalAndContacts).toBe(window.PAGE.showCalendarAndContactItems);
                expect(scope.emailDiskUsageEnabled).toBe(window.PAGE.emailDiskUsageEnabled);
                expect(scope.defaultQuota).toBe(window.PAGE.userDefinedQuotaDefaultValue);
                expect(scope.maxQuota).toBe(window.PAGE.maxEmailQuota);
                expect(scope.meta.sortBy).toBe("domain");
                expect(scope.meta.sortDirection).toBe("desc");
                expect(scope.meta.pageSize).toBe(50);
                expect(scope.meta.filterValue).toBe("filterme!");
            });

            describe("table actions", function() {

                beforeEach(function() {
                    createController();
                    spyOn(mockEmailAccountsService, "getEmailAccounts").and.callThrough();
                });

                it("should fetch from the API when the list is sorted", function() {
                    scope.sortList();
                    setTimeout(function() {
                        expect(mockEmailAccountsService.getEmailAccounts).toHaveBeenCalled();
                    }, 300);
                });

                it("should fetch from the API when the page is changed", function() {
                    scope.selectPage();
                    setTimeout(function() {
                        expect(mockEmailAccountsService.getEmailAccounts).toHaveBeenCalled();
                    }, 300);
                });

                it("should fetch from the API when the page size is changed", function() {
                    scope.selectPageSize();
                    setTimeout(function() {
                        expect(mockEmailAccountsService.getEmailAccounts).toHaveBeenCalled();
                    }, 300);
                });

                it("should fetch from the API when the list is searched", function() {
                    scope.searchList();
                    setTimeout(function() {
                        expect(mockEmailAccountsService.getEmailAccounts).toHaveBeenCalled();
                    }, 300);
                });

                it("should growl error if loading the accounts fails", function() {
                    spyOn(mockGrowlService, "error");
                    rejectAPICalls = true;
                    scope.fetch();
                    scope.$apply();
                    expect(mockGrowlService.error).toHaveBeenCalledWith(mockAPIFailure);
                });

                it("should add the api.filter properties when a filter value is specified", function() {

                    var theFilterValue = "filterme!";

                    var expectParams = {
                        "api.sort": 1,
                        "api.sort_column": "user",
                        "api.sort_method": "lexicographic",
                        "api.sort_reverse": 0,
                        "api.paginate": 1,
                        "api.paginate_start": 0,
                        "api.paginate_size": 20,
                        "api.paginate_page": 1,
                        "api.filter": 1,
                        "api.filter_term_0": theFilterValue,
                        "api.filter_column_0": "login"
                    };

                    scope.meta.filterValue = theFilterValue;
                    scope.fetch();
                    scope.$apply();

                    setTimeout(function() {
                        expect(mockEmailAccountsService.getEmailAccounts).toHaveBeenCalledWith(expectParams);
                    }, 300);

                });
            });

            describe("account actions", function() {

                beforeEach(function() {
                    createController();
                });

                it("should clear the expanded account and action module if the action is cancelled", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickPassword(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("password");
                    scope.cancelAction();
                    expect(scope.expandedAccount).toBeUndefined();
                    expect(scope.actionModule).toBeUndefined();
                });

                it("should set the expanded account when the password button is clicked", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickPassword(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                });

                it("should set the action module to 'password' when the password button is clicked", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickPassword(emailAccount);
                    expect(scope.actionModule).toBe("password");
                });

                it("should clear the action module if the password button is clicked a second time", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickPassword(emailAccount);
                    expect(scope.actionModule).toBe("password");
                    scope.onClickPassword(emailAccount);
                    expect(scope.actionModule).toBeUndefined();
                });

                it("should clear any inputted passwords when the password module is opened", function() {
                    scope.passwordChange.password = "newPassword";
                    scope.passwordChange.confirm = "newPassword";

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickPassword(emailAccount);

                    expect(scope.passwordChange).toEqual({});
                });

                it("should set success status and clear the inputted password when the password is successfully changed", function() {

                    spyOn(mockEmailAccountsService, "changePassword").and.callThrough();

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickPassword(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("password");

                    scope.passwordChange.password = "newPassword";
                    scope.onClickChangePassword();
                    scope.$apply();

                    expect(mockEmailAccountsService.changePassword).toHaveBeenCalledWith(
                        emailAccount.user,
                        emailAccount.domain,
                        "newPassword"
                    );

                    expect(scope.expandedAccount.status).toEqual({
                        type: "success",
                        message: "Password for “" + emailAccount.email + "” has been changed.",
                        closeable: true,
                        ttl: 10000
                    });

                    expect(scope.passwordChange).toEqual({});
                });

                it("should set error status when the password change fails", function() {

                    spyOn(mockEmailAccountsService, "changePassword").and.callThrough();

                    rejectAPICalls = true;

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickPassword(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("password");

                    scope.passwordChange.password = "newPassword";
                    scope.onClickChangePassword();
                    scope.$apply();

                    expect(mockEmailAccountsService.changePassword).toHaveBeenCalledWith(
                        emailAccount.user,
                        emailAccount.domain,
                        "newPassword"
                    );

                    expect(scope.expandedAccount.status).toEqual({
                        type: "danger",
                        message: mockAPIFailure
                    });

                });

                it("should set the expanded account when the quota button is clicked", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                });

                it("should set the action module to 'quota' when the quota button is clicked", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.actionModule).toBe("quota");
                });

                it("should clear the action module if the quota button is clicked a second time", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.actionModule).toBe("quota");
                    scope.onClickQuota(emailAccount);
                    expect(scope.actionModule).toBeUndefined();
                });

                it("should set the change quota type to 'userdefined' when the account has a quota", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.quotaChange.quotaType).toBe("userdefined");
                });

                it("should set the change quota type to 'unlimited' when the account has no quota", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[1]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.quotaChange.quotaType).toBe("unlimited");
                });

                it("should set the change quota value to the account's quota when it has one", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.quotaChange.quota).toBe(emailAccount.diskquota);
                });

                it("should set the change quota value to the default quota when the account has no quota", function() {
                    window.PAGE.userDefinedQuotaDefaultValue = 512;
                    var emailAccount = _.assign({}, mockListAccountsData[1]);
                    createController();
                    scope.onClickQuota(emailAccount);
                    expect(scope.quotaChange.quota).toBe(512);
                });

                it("should set the account quota values to the unlimited values when quota is changed to unlimited", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    scope.quotaChange.quotaType = "unlimited";
                    scope.onClickChangeQuota();
                    scope.$apply();
                    expect(emailAccount._diskquota).toBe(0);
                    expect(emailAccount.diskquota).toBe("unlimited");
                    expect(emailAccount.humandiskquota).toBe("&infin;");
                    expect(emailAccount.diskusedpercent).toBe(0);
                    expect(emailAccount.humandiskusedpercent).toBe("0%");
                });

                it("should set the account quota values to the new quota when quota is changed from unlimited", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[1]);
                    scope.onClickQuota(emailAccount);
                    scope.quotaChange.quotaType = "userdefined";
                    scope.quotaChange.quota = 256;
                    scope.onClickChangeQuota();
                    scope.$apply();
                    expect(emailAccount._diskquota).toBe(256);
                    expect(emailAccount.diskquota).toBe(256);
                    expect(emailAccount.humandiskquota).toBe(256);

                    var expected = ((emailAccount.diskused / emailAccount.diskquota) * 100).toFixed(2);
                    expect(emailAccount.diskusedpercent).toBe(expected);
                    expect(emailAccount.humandiskusedpercent).toBe(expected + "%");
                });

                it("should set success status with MB when the quota is successfully changed", function() {

                    spyOn(mockEmailAccountsService, "changeQuota").and.callThrough();
                    spyOn(mockGrowlService, "success");

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("quota");

                    scope.quotaChange.quota = 1123;
                    scope.quotaChange.quotaType = "userdefined";

                    scope.onClickChangeQuota();
                    scope.$apply();

                    expect(mockEmailAccountsService.changeQuota).toHaveBeenCalledWith(
                        emailAccount.user,
                        emailAccount.domain,
                        1123
                    );

                    var expected = "Changed Quota for “" + emailAccount.user + "@" + emailAccount.domain + "” to 1,123 MB.";

                    expect(scope.expandedAccount.status).toEqual({
                        type: "success",
                        message: expected,
                        closeable: true,
                        ttl: 10000
                    });

                });

                it("should set success status with “unlimited” when the quota is successfully changed", function() {

                    spyOn(mockEmailAccountsService, "changeQuota").and.callThrough();

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("quota");

                    scope.quotaChange.quotaType = "unlimited";

                    scope.onClickChangeQuota();
                    scope.$apply();

                    expect(mockEmailAccountsService.changeQuota).toHaveBeenCalledWith(
                        emailAccount.user,
                        emailAccount.domain,
                        0
                    );

                    var expected = "Changed Quota for “" + emailAccount.user + "@" + emailAccount.domain + "” to unlimited.";

                    expect(scope.expandedAccount.status).toEqual({
                        type: "success",
                        message: expected,
                        closeable: true,
                        ttl: 10000
                    });

                });

                it("should set error status when the quota change fails", function() {

                    spyOn(mockEmailAccountsService, "changeQuota").and.callThrough();

                    rejectAPICalls = true;

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickQuota(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("quota");

                    scope.quotaChange.quota = 1123;
                    scope.quotaChange.quotaType = "userdefined";

                    scope.onClickChangeQuota();
                    scope.$apply();

                    expect(mockEmailAccountsService.changeQuota).toHaveBeenCalledWith(
                        emailAccount.user,
                        emailAccount.domain,
                        1123
                    );

                    expect(scope.expandedAccount.status).toEqual({
                        type: "danger",
                        message: mockAPIFailure
                    });

                });

                it("should set the expanded account when the delete button is clicked", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickDelete(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                });

                it("should set the action module to 'delete' when the delete button is clicked", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickDelete(emailAccount);
                    expect(scope.actionModule).toBe("delete");
                });

                it("should clear the action module if the delete button is clicked a second time", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickDelete(emailAccount);
                    expect(scope.actionModule).toBe("delete");
                    scope.onClickDelete(emailAccount);
                    expect(scope.actionModule).toBeUndefined();
                });

                it("should set success status when the account is successfully deleted", function() {

                    spyOn(mockEmailAccountsService, "deleteEmailAccount").and.callThrough();

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickDelete(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("delete");

                    scope.onClickDeleteConfirm();
                    scope.$apply();

                    expect(mockEmailAccountsService.deleteEmailAccount).toHaveBeenCalledWith(
                        emailAccount.user,
                        emailAccount.domain
                    );

                    var email = emailAccount.user + "@" + emailAccount.domain;

                    expect(scope.expandedAccount.status).toEqual({
                        type: "success",
                        message: "Account “" + email + "” deleted.",
                        closeable: true,
                        ttl: 10000
                    });

                });

                it("should set error status when the delete fails", function() {

                    spyOn(mockEmailAccountsService, "deleteEmailAccount").and.callThrough();

                    rejectAPICalls = true;

                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickDelete(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("delete");

                    scope.onClickDeleteConfirm();
                    scope.$apply();

                    expect(mockEmailAccountsService.deleteEmailAccount).toHaveBeenCalledWith(
                        emailAccount.user,
                        emailAccount.domain
                    );

                    expect(scope.expandedAccount.status).toEqual({
                        type: "danger",
                        message: mockAPIFailure
                    });

                });

                it("should clear the expanded account when a module is closed", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickDelete(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("delete");
                    scope.onClickDelete(emailAccount);
                    expect(scope.actionModule).toBeUndefined();
                    scope.collapseFinished();
                    expect(scope.expandedAccount).toBeUndefined();
                });

                it("should not clear the expanded account if another module is opened", function() {
                    var emailAccount = _.assign({}, mockListAccountsData[0]);
                    scope.onClickDelete(emailAccount);
                    expect(scope.expandedAccount).toBe(emailAccount);
                    expect(scope.actionModule).toBe("delete");
                    scope.onClickPassword(emailAccount);
                    expect(scope.actionModule).toBe("password");
                    scope.collapseFinished();
                    expect(scope.expandedAccount).toBe(emailAccount);
                });

            });
        });
    }
);