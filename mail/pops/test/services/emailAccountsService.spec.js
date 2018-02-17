/*
# base/frontend/manager/mail/pops/test/services/emailAccountsService.spec.js Copyright(c) 2017 cPanel, Inc.
#                                                                                            All rights Reserved.
# copyright@cpanel.net                                                                          http://cpanel.net
# This code is subject to the cPanel license.                                  Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false, spyOn: false */

define([
    "angular",
    "ngMocks",
    "mail/pops/services/emailAccountsService"
],
function(angular) {

    "use strict";

    describe("emailAccountsService", function() {

        var emailAccountsService, $q, $rootScope;

        var mockListAccountsData = [
            {"domain":"example.com","diskusedpercent":0,"humandiskquota":"256 MB","diskusedpercent20":0,"suspended_incoming":0,"txtdiskquota":"256.00","diskused":0,"login":"fake_email_18@example.com","humandiskused":"None","mtime":1500332027,"suspended_login":0,"_diskquota":"268435456","user":"fake_email_18","email":"fake_email_18@example.com","_diskused":0,"diskquota":"256.00"},
            {"mtime":1498591814,"login":"fake_email_19@example.com","diskused":0,"humandiskused":"None","suspended_login":0,"_diskquota":null,"email":"fake_email_19@example.com","_diskused":0,"user":"fake_email_19","diskquota":"unlimited","domain":"example.com","diskusedpercent":0,"humandiskquota":"None","diskusedpercent20":0,"txtdiskquota":"unlimited","suspended_incoming":0},
            {"humandiskquota":"None","domain":"example.com","diskusedpercent":0,"txtdiskquota":"unlimited","suspended_incoming":0,"diskusedpercent20":0,"suspended_login":0,"mtime":1498591799,"login":"fake_email_2@example.com","diskused":0,"humandiskused":"None","diskquota":"unlimited","_diskquota":null,"email":"fake_email_2@example.com","_diskused":0,"user":"fake_email_2"},
            {"humandiskused":"None","diskused":0,"login":"fake_email_20@example.com","mtime":1498591815,"suspended_login":0,"_diskquota":null,"user":"fake_email_20","_diskused":0,"email":"fake_email_20@example.com","diskquota":"unlimited","domain":"example.com","diskusedpercent":0,"humandiskquota":"None","diskusedpercent20":0,"suspended_incoming":0,"txtdiskquota":"unlimited"},
            {"txtdiskquota":"unlimited","suspended_incoming":0,"diskusedpercent20":0,"humandiskquota":"None","diskusedpercent":0,"domain":"example.com","diskquota":"unlimited","email":"fake_email_21@example.com","_diskused":0,"user":"fake_email_21","_diskquota":null,"suspended_login":0,"mtime":1498591816,"login":"fake_email_21@example.com","diskused":0,"humandiskused":"None"},
            {"diskquota":"unlimited","_diskused":0,"email":"fake_email_22@example.com","user":"fake_email_22","_diskquota":null,"suspended_login":0,"mtime":1498591816,"diskused":0,"login":"fake_email_22@example.com","humandiskused":"None","txtdiskquota":"unlimited","suspended_incoming":0,"diskusedpercent20":0,"humandiskquota":"None","diskusedpercent":0,"domain":"example.com"},
            {"domain":"example.com","diskusedpercent":0,"humandiskquota":"None","diskusedpercent20":0,"suspended_incoming":0,"txtdiskquota":"unlimited","login":"fake_email_23@example.com","diskused":0,"humandiskused":"None","mtime":1498591817,"suspended_login":0,"_diskquota":null,"user":"fake_email_23","_diskused":0,"email":"fake_email_23@example.com","diskquota":"unlimited"}
        ];

        var mockListAccountsMetadata = {
            "transformed":1,
            "paginate": {
                "total_pages": 1,
                "results_per_page": "10",
                "total_results": 7,
                "start_result": 1,
                "current_page": 1
            }
        };

        var apiErrorMessage = "The API call was rejected with an error";
        var rejectCalls = false;

        var MockAPIService = function() { };
        MockAPIService.AngularAPICall = function(apiCall, handlers) {
            this.apiCall = apiCall;
            this.handlers = handlers;
        };

        angular.extend(MockAPIService.AngularAPICall.prototype, {
            done: function() {
                if( rejectCalls ) {
                    this.handlers.done({
                        parsedResponse: { error: apiErrorMessage }
                    });
               }
                else {
                    this.timeout = setTimeout(function() {
                        this.handlers.done({
                            parsedResponse: {
                               meta: mockListAccountsMetadata,
                                data: mockListAccountsData
                            }
                        });
                    }, 3000);
                }
            },
            fail: function() {},
            jqXHR: {
                abort: function() {
                    clearTimeout(this.timeout);
                    this.timeout = undefined;
                }
            }
        });

        angular.extend(MockAPIService.prototype, {

            deferred: function(apiCall, handlers) {

                var response;

                if( !handlers.transformAPISuccess ) {
                    handlers.transformAPISuccess = function(response) {
                        return response;
                    };
                }

                if( this.rejectCalls ) {
                    response = $q(function(resolve, reject) { // eslint-disable-line no-unused-vars
                        reject(apiErrorMessage);
                    });
                }
                else if( apiCall.func === "add_pop" ) {
                    response = $q(function(resolve) {
                        resolve(handlers.transformAPISuccess({
                            data: apiCall.args.email + "+" + apiCall.args.domain
                        }));
                    });
                }
                else if( apiCall.func === "has_shared_global_addressbook" ) {
                    response = $q(function(resolve) {
                        resolve(handlers.transformAPISuccess({
                            data: { shared: true }
                        }));
                    });
                }
                else if( apiCall.func === "enable_shared_global_addressbook" ) {
                    response = $q(function(resolve) {
                        resolve(handlers.transformAPISuccess({
                            data: { shared: true }
                        }));
                    });
                }
                else if( apiCall.func === "disable_shared_global_addressbook" ) {
                    response = $q(function(resolve) {
                        resolve(handlers.transformAPISuccess({
                            data: { shared: false }
                        }));
                    });
                }
                else if( apiCall.func === "passwd_pop" ) {
                    // This API call returns only metadata
                    response = $q(function(resolve) {
                        resolve(handlers.transformAPISuccess({
                            data: null, meta: {}
                        }));
                    });
                }
                else if( apiCall.func === "edit_pop_quota" ) {
                    // This API call returns only metadata
                    response = $q(function(resolve) {
                        resolve(handlers.transformAPISuccess({
                            data: null, meta: {}
                        }));
                    });
                }
                else if( apiCall.func === "delete_pop" ) {
                    // This API call returns only metadata
                    response = $q(function(resolve) {
                        resolve(handlers.transformAPISuccess({
                            data: null, meta: {}
                        }));
                    });
                }

                return { promise: response };
            }

        });

        beforeEach(function () {
            module("cpanel.mail.Pops");

            module(function($provide) {
                $provide.value("APIService", MockAPIService);
            });

            inject(function ($injector) {
                $q = $injector.get("$q");
                emailAccountsService = $injector.get("emailAccountsService");
                $rootScope = $injector.get("$rootScope");
            });

            rejectCalls = false;
        });

        describe("addEmailAccount", function() {

            it("should return a string that is email+domain", function() {
                emailAccountsService.addEmailAccount({ email: "someemail", domain: "somedomain.com" }).then(function(data) {
                    expect(data).toBeDefined();
                    expect(data).toBe("someemail+somedomain.com");
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.addEmailAccount({}).then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });
        });

        describe("isSharedAddressBookEnabled", function() {

            it("should return an object with a shared boolean property", function() {
                emailAccountsService.isSharedAddressBookEnabled().then(function(data) {
                    expect(data.shared).toBeDefined();
                    expect(data.shared === true || data.shared === false).toBeTruthy();
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.isSharedAddressBookEnabled().then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });
        });

        describe("enableSharedAddressBook", function() {

            it("should return an object with shared === true", function() {
                emailAccountsService.enableSharedAddressBook().then(function(data) {
                    expect(data.shared).toBeDefined();
                    expect(data.shared).toBeTruthy();
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.enableSharedAddressBook().then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });
        });

        describe("disableSharedAddressBook", function() {

            it("should return an object with shared === false", function() {

                emailAccountsService.disableSharedAddressBook().then(function(data) {
                    expect(data.shared).toBeDefined();
                    expect(data.shared).toBeFalsy();
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.disableSharedAddressBook().then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });
        });

        describe("changePassword", function() {

            it("should not return any data", function() {

                emailAccountsService.changePassword("email", "domain.com", "newpassword").then(function(data) {
                    expect(data).toBeNull();
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.changePassword().then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });
        });

        describe("changeQuota", function() {

            it("should not return any data", function() {

                emailAccountsService.changeQuota("email", "domain.com", 1024).then(function(data) {
                    expect(data).toBeNull();
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.changeQuota().then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });
        });

        describe("deleteEmailAccount", function() {

            it("should not return any data", function() {

                emailAccountsService.deleteEmailAccount("email", "domain.com").then(function(data) {
                    expect(data).toBeNull();
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.deleteEmailAccount().then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });
        });

        describe("getEmailAccounts", function() {

            it("should return the response with both data and metadata", function() {

                emailAccountsService.getEmailAccounts().then(function(emailAccountsResponse) {
                    expect(emailAccountsResponse.data).toBeDefined();
                    expect(emailAccountsResponse.meta).toBeDefined();
                });

                $rootScope.$apply();
            });

            it("should convert humandiskquota to the &infin; entity for unlimited quotas", function() {

                emailAccountsService.getEmailAccounts().then(function(emailAccountsResponse) {
                    expect(emailAccountsResponse.data).toBeDefined();
                    expect(emailAccountsResponse.data.length).toBeGreaterThan(0);
                    emailAccountsResponse.data.forEach(function(account) {
                        if( account._diskquota === 0 || account.diskquota === "unlimited" ) {
                            expect(account.humandiskquota).toBe("&infin;");
                        }
                    });
                });

                $rootScope.$apply();
            });

            it("should convert suspended_login to a boolean value", function() {

                emailAccountsService.getEmailAccounts().then(function(emailAccountsResponse) {
                    expect(emailAccountsResponse.data).toBeDefined();
                    expect(emailAccountsResponse.data.length).toBeGreaterThan(0);
                    emailAccountsResponse.data.forEach(function(account) {
                        expect(account.suspended_login).toBeDefined();
                        expect(account.suspended_login === true || account.suspended_login === false).toBeTruthy();
                    });
                });

                $rootScope.$apply();
            });

            it("should convert suspended_incoming to a boolean value", function() {

                emailAccountsService.getEmailAccounts().then(function(emailAccountsResponse) {
                    expect(emailAccountsResponse.data).toBeDefined();
                    expect(emailAccountsResponse.data.length).toBeGreaterThan(0);
                    emailAccountsResponse.data.forEach(function(account) {
                        expect(account.suspended_incoming).toBeDefined();
                        expect(account.suspended_incoming === true || account.suspended_incoming === false).toBeTruthy();
                    });
                });

                $rootScope.$apply();
            });

            it("should return the error message if something goes wrong", function() {

                rejectCalls = true;

                emailAccountsService.getEmailAccounts().then(
                    function() { },
                    function(error) {
                        expect(error).toBe(apiErrorMessage);
                    }
                );

                $rootScope.$apply();
            });

            it("should abort an existing API call if one's in flight", function() {

                var fakeAPICall = new MockAPIService.AngularAPICall();
                spyOn(fakeAPICall.jqXHR, "abort");
                spyOn(fakeAPICall, "done");
                emailAccountsService.currentGetRequest = fakeAPICall;

                emailAccountsService.getEmailAccounts();
                expect(fakeAPICall.jqXHR.abort).toHaveBeenCalled();
                expect(fakeAPICall.done).not.toHaveBeenCalled();
            });

            it("should set the diskquota to 0 and humandiskusedpercent to 0% if there is no quota", function() {

                emailAccountsService.getEmailAccounts().then(function(emailAccountsResponse) {
                    expect(emailAccountsResponse.data).toBeDefined();
                    expect(emailAccountsResponse.data.length).toBeGreaterThan(0);
                    emailAccountsResponse.data.forEach(function(account) {
                        if( account.txtdiskquota === "unlimited" ) {
                            expect(account.diskquota).toBeDefined();
                            expect(account.diskquota).toBe(0);
                            expect(account.humandiskusedpercent).toBeDefined();
                            expect(account.humandiskusedpercent).toBe("0%");
                        }
                    });
                });

                $rootScope.$apply();
            });

            it("should set the humandiskquotapercent to <VALUE>% string if there is a quota", function() {
                emailAccountsService.getEmailAccounts().then(function(emailAccountsResponse) {
                    expect(emailAccountsResponse.data).toBeDefined();
                    expect(emailAccountsResponse.data.length).toBeGreaterThan(0);
                    emailAccountsResponse.data.forEach(function(account) {
                        if( account.txtdiskquota !== "unlimited" ) {
                            expect(account.humandiskusedpercent).toBeDefined();
                            expect(account.humandiskusedpercent).toBe("" + ((account.diskused / account.diskquota) * 100).toFixed(2) + "%");
                        }
                    });
                });

                $rootScope.$apply();
            });
        });

    });

});