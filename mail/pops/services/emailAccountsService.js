/*
# base/frontend/manager/mail/pops/services/emailAccountService.js Copyright(c) 2017 cPanel, Inc.
#                                                                                 All rights Reserved.
# copyright@cpanel.net                                                               http://cpanel.net
# This code is subject to the cPanel license.                       Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        // Libraries
        "angular",
        "cjt/io/api",
        "cjt/io/uapi-request",
        "cjt/util/locale"
    ],
    function(angular, API, APIREQUEST, LOCALE) { // eslint-disable-line no-unused-vars

        var app;
        try {
            app = angular.module("cpanel.mail.Pops"); // For runtime
        }
        catch (e) {
            app = angular.module("cpanel.mail.Pops", []); // Fall-back for unit testing
        }

        app.factory("emailAccountsService", ["$q", "APIService",
            function($q, APIService) {

                var EmailAccountsService = function() {};
                EmailAccountsService.prototype = new APIService();

                angular.extend(EmailAccountsService.prototype, {

                    _dataWrapper: function(apiCall) {
                        return this.deferred(apiCall, {
                            transformAPISuccess: function(response) {
                                return response.data;
                            }
                        }).promise;
                    },

                    /**
                     * Adds an email account
                     * @method addEmailAccount
                     * @param {Object} emailAccount The email account to add
                     * @return {Promise} Returns a promise that resolves to a string with account+domain
                     */
                    addEmailAccount: function(emailAccount) {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Email", "add_pop", emailAccount);
                        return this._dataWrapper(apiCall);
                    },

                    /**
                     * Gets whether or not the shared address book is enabled
                     * @method isSharedAddressBookEnabled
                     * @return {Promise} Returns a promise that resolves to a boolean indicating whether or not the shared AB is enabled
                     */
                    isSharedAddressBookEnabled: function() {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("DAV", "has_shared_global_addressbook");
                        return this._dataWrapper(apiCall);
                    },

                    /**
                     * Enables the shared address book
                     * @method enableSharedAddressBook
                     * @return {Promise} Returns a promise that resolves to a boolean indicating whether or not the shared AB is enabled
                     */
                    enableSharedAddressBook: function() {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("DAV", "enable_shared_global_addressbook");
                        return this._dataWrapper(apiCall);
                    },

                    /**
                     * Disables the shared address book
                     * @method disableSharedAddressBook
                     * @return {Promise} Returns a promise that resolves to a boolean indicating whether or not the shared AB is enabled
                     */
                    disableSharedAddressBook: function() {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("DAV", "disable_shared_global_addressbook");
                        return this._dataWrapper(apiCall);
                    },

                    /**
                     * Changes the password for an email account
                     * @method changePassword
                     * @param  {String} email    A string indicating which email account to change the password for
                     * @param  {String} domain   A string indicating which domain to change the password for
                     * @param  {String} password A string indicating the new password
                     * @return {Promise}         Returns a promise that resolves with no data on success
                     */
                    changePassword: function(email, domain, password) {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Email", "passwd_pop", {
                            email: email,
                            domain: domain,
                            password: password
                        });
                        return this._dataWrapper(apiCall);
                    },

                    /**
                     * Changes the quota for an email account
                     * @method changeQuota
                     * @param  {String}  email    A string indicating which email account to change the quota for
                     * @param  {String}  domain   A string indicating which domain to change the quota for
                     * @param  {Integer} quota    An integer specifying the new quota in MB
                     * @return {Promise}          Returns a promise that resolves with no data on success
                     */
                    changeQuota: function(email, domain, quota) {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Email", "edit_pop_quota", {
                            email: email,
                            domain: domain,
                            quota: quota
                        });
                        return this._dataWrapper(apiCall);
                    },

                    /**
                     * Deletes an email account
                     * @method deleteEmailAccount
                     * @param  {String}  email    A string indicating which email account to delete
                     * @param  {String}  domain   A string indicating which domain to delete
                     * @return {Promise}          Returns a promise that resolves with no data on success
                     */
                    deleteEmailAccount: function(email, domain) {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Email", "delete_pop", { email: email, domain: domain });
                        return this._dataWrapper(apiCall);
                    },

                    /**
                     * Gets the list of email accounts
                     * @method getEmailAccounts
                     * @param  {Object}  apiParams An object providing the UAPI filter, paginate, and sort properties
                     * @return {Promise}           Returns a promise that resolves to the list of email accounts
                     */
                    getEmailAccounts: function (apiParams) {

                        if( this.currentGetRequest && this.currentGetRequest.jqXHR ) {
                            this.currentGetRequest.jqXHR.abort();
                        }

                        var apiCall = new APIREQUEST.Class();

                        // We always format the data on the frontend so avoid doing it on the backend for non-displayed data
                        if (!apiParams) {
                          apiParams = {};
                        }
                        apiParams["no_human_readable_keys"] = 1;
                        apiCall.initialize("Email", "list_pops_with_disk", apiParams);

                        var deferred = $q.defer();
                        var service = this;

                        // We want to be able to access the underlying jQuery XHR object here so that we can
                        // .abort() any in flight calls to list_pops_with_disk when a new one is submitted.
                        this.currentGetRequest = new APIService.AngularAPICall(apiCall, {
                            done: function(response) {

                                service.currentGetRequest = undefined;

                                if( response.parsedResponse.error ) {
                                    deferred.reject(response.parsedResponse.error);
                                }
                                else {

                                    var result = response.parsedResponse;

                                    result.data.forEach(function(emailAccount) {

                                        emailAccount.diskused = parseInt(emailAccount.diskused, 10);

                                        if (emailAccount._diskquota === 0 || emailAccount.diskquota === 0 || emailAccount.diskquota === "unlimited") {
                                            emailAccount.diskquota = 0;
                                            emailAccount.humandiskquota = "&infin;";
                                            emailAccount.diskusedpercent = 0;
                                        } else {
                                            emailAccount.diskquota = parseInt(emailAccount.diskquota, 10);
                                            emailAccount.humandiskquota = emailAccount.diskquota;
                                            emailAccount.diskusedpercent = ((emailAccount.diskused / emailAccount.diskquota) * 100).toFixed(2);
                                        }

                                        emailAccount.humandiskusedpercent = LOCALE.maketext("[_1]%", emailAccount.diskusedpercent);
                                        emailAccount.suspended_login = ("" + emailAccount.suspended_login) === "1"; // eslint-disable-line camelcase
                                        emailAccount.suspended_incoming = ("" + emailAccount.suspended_incoming) === "1"; // eslint-disable-line camelcase
                                    });

                                    deferred.resolve(result);
                                }

                            },
                            fail: function() {
                                service.currentGetRequest = undefined;
                            }
                        });

                        return deferred.promise;
                    },

                    /**
                     * Gets the usage for the default email account
                     * @method getDefaultAccountUsage
                     * @return {Promise} Returns a promise that resolves to a pretty formatted string indicating the default account's disk usage
                     */
                    getDefaultAccountUsage: function() {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Email", "get_main_account_disk_usage");
                        return this._dataWrapper(apiCall);
                    }

                });

                return new EmailAccountsService();
            }
        ]);

    }
);
