/*
# base/frontend/manager/mail/pops/views/listEmailAccounts.js Copyright(c) 2017 cPanel, Inc.
#                                                                            All rights Reserved.
# copyright@cpanel.net                                                          http://cpanel.net
# This code is subject to the cPanel license.                  Unauthorized copying is prohibited
*/

/* global define: false, PAGE: false */

define(
    [
        "lodash",
        "angular",
        "cjt/util/locale",
        "uiBootstrap",
        "cjt/directives/actionButtonDirective",
        "cjt/directives/loadingPanel",
        "cjt/directives/toggleSortDirective",
        "cjt/directives/searchDirective",
        "cjt/directives/pageSizeDirective",
        "cjt/filters/startFromFilter",
        "cjt/decorators/paginationDecorator",
        "cjt/services/ComponentSettingSaverService"
    ],
    function(_, angular, LOCALE) {

        var app;
        try {
            app = angular.module("cpanel.mail.Pops");
        }
        catch(e) {
            app = angular.module("cpanel.mail.Pops", []);
        }

        app.controller("listEmailAccountsCtrl",
            ["$rootScope", "$scope", "$timeout", "emailAccountsService", "growl", "$window", "ComponentSettingSaverService",
                function($rootScope, $scope, $timeout, emailAccountsService, growl, $window, ComponentSettingSaverService) {

                    var COMPONENT_NAME = "EmailAccountsTable";
                    $scope.emailAccounts = [];
                    $scope.filteredList = [];

                    $scope.requiredPasswordStrength = PAGE.requiredPasswordStrength;
                    $scope.webmailEnabled = PAGE.webmailEnabled;
                    $scope.externalAuthConfig = PAGE.externalAuthModulesConfigured;
                    $scope.showCalAndContacts = PAGE.showCalendarAndContactItems;
                    $scope.emailDiskUsageEnabled = PAGE.emailDiskUsageEnabled;
                    $scope.defaultQuota = PAGE.userDefinedQuotaDefaultValue;
                    $scope.maxQuota = PAGE.maxEmailQuota;
                    $scope.expandedAccount = undefined;
                    $scope.loadingEmailAccounts = false;

                    $scope.actionModule = undefined;

                    $scope.passwordChange = {
                        password: undefined,
                        confirm: undefined
                    };

                    $scope.changingPassword = false;

                    $scope.quotaChange = {
                        quotaType: undefined,
                        quota: undefined
                    };

                    $scope.changingQuota = false;

                    $scope.meta = {
                    // sort settings
                        sortReverse: false,
                        sortBy: "user",
                        sortDirection: "asc",
                        sortFields: ["user", "domain", "_diskused", "_diskquota", "diskusedpercent"],

                        // search settings
                        filterValue: "",

                        // pager settings
                        maxPages: 5,
                        totalItems: $scope.emailAccounts.length,
                        currentPage: 1,
                        pageSize: 20,
                        pageSizes: [20, 50, 100, 500],
                        start: 0,
                        limit: 10
                    };

                    $scope.setMetaFromComponentSettings = function(settings) {

                        if( settings.hasOwnProperty("sortBy") && settings.sortBy && _.find($scope.meta.sortFields, function(f) { return f === settings.sortBy; }) ) {
                            $scope.meta.sortBy = settings.sortBy;
                        }

                        if( settings.hasOwnProperty("sortDirection") && settings.sortDirection && (settings.sortDirection === "asc" || settings.sortDirection === "desc" ) ) {
                            $scope.meta.sortDirection = settings.sortDirection;
                        }

                        if( settings.hasOwnProperty("pageSize") && settings.pageSize && _.find($scope.meta.pageSizes, function(s) { return s === parseInt(settings.pageSize); }) ) {
                            $scope.meta.pageSize = parseInt(settings.pageSize);
                        }

                        if( settings.hasOwnProperty("filterValue") ) {
                            $scope.meta.filterValue = settings.filterValue;
                        }

                    };

                    $scope.saveMetaToComponentSettings = function() {
                        ComponentSettingSaverService.set(COMPONENT_NAME, {
                            sortBy: $scope.meta.sortBy,
                            sortDirection: $scope.meta.sortDirection,
                            pageSize: $scope.meta.pageSize,
                            filterValue: $scope.meta.filterValue
                        });
                    };

                    $scope.clearStatus = function() {
                        $scope.expandedAccount.status = undefined;
                    };

                    $scope.onMenuToggle = function(index) {
                        var dropdownContainer = angular.element("#email_table_menu_" + index);
                        if( !dropdownContainer || dropdownContainer.length !== 1 ) {
                            return;
                        }

                        dropdownContainer = dropdownContainer[0];
                        var position = dropdownContainer.getBoundingClientRect().top;
                        var buttonHeight = dropdownContainer.getBoundingClientRect().height;

                        var dropdownMenu = angular.element("#email_table_menu_" + index + " .dropdown-menu");
                        if( !dropdownMenu || dropdownMenu.length !== 1 ) {
                            return;
                        }

                        dropdownMenu = dropdownMenu[0];
                        var menuHeight = parseInt($window.getComputedStyle(dropdownMenu).height);

                        $scope.isDropUp = position > menuHeight && $window.innerHeight - position < buttonHeight + menuHeight;
                    };

                    /**
                     * Generic click handler for the cancel links in action modules
                     */
                    $scope.cancelAction = function() {
                        $scope.expandedAccount = undefined;
                        $scope.actionModule = undefined;
                    };

                    /**
                     * Click handler for the password link, opens the change password module for the account
                     * @param  {Object} emailAccount The email account to open the change password module for
                     */
                    $scope.onClickPassword = function(emailAccount) {

                        $scope.passwordChange = {};

                        if( $scope.expandedAccount === emailAccount && $scope.actionModule === "password" ) {
                            $scope.actionModule = undefined;
                        }
                        else {
                            if( $scope.expandedAccount ) {
                                $scope.expandedAccount.status = undefined;
                            }
                            $scope.actionModule = "password";
                            $scope.expandedAccount = emailAccount;
                        }
                    };

                    /**
                     * Click handler for the change password button, submits the new password to emailAccountsService.changePassword
                     */
                    $scope.onClickChangePassword = function() {

                        $scope.changingPassword = true;
                        $scope.expandedAccount.status = undefined;

                        return emailAccountsService.changePassword($scope.expandedAccount.user, $scope.expandedAccount.domain, $scope.passwordChange.password).then(
                            function() {

                                $scope.expandedAccount.status = {
                                    message: LOCALE.maketext("Password for “[_1]” has been changed.", $scope.expandedAccount.user + "@" + $scope.expandedAccount.domain),
                                    type: "success",
                                    closeable: true,
                                    ttl: 10000
                                };

                                $scope.changingPassword = false;
                                $scope.passwordChange = {};
                                $scope.actionModule = undefined;
                            },
                            function(error) {
                                if( $scope.expandedAccount ) {
                                    $scope.expandedAccount.status = undefined;
                                }
                                $scope.expandedAccount.status = { type: "danger", message: error };
                                $scope.changingPassword = false;
                            }
                        );

                    };

                    /**
                     * Click handler for the quota link, opens the change quota module for the account
                     * @param  {Object} emailAccount The email account to open the change quota module for
                     */
                    $scope.onClickQuota = function(emailAccount) {
                        if( $scope.expandedAccount === emailAccount && $scope.actionModule === "quota" ) {
                            $scope.actionModule = undefined;
                        }
                        else {

                            if( $scope.expandedAccount ) {
                                $scope.expandedAccount.status = undefined;
                            }

                            $scope.actionModule = "quota";
                            $scope.expandedAccount = emailAccount;

                            if( !emailAccount._diskquota || emailAccount._diskquota === 0 ) {
                                $scope.quotaChange.quotaType = "unlimited";
                                $scope.quotaChange.quota = $scope.defaultQuota;
                            }
                            else {
                                $scope.quotaChange.quotaType = "userdefined";
                                $scope.quotaChange.quota = emailAccount.diskquota;
                            }
                        }
                    };

                    /**
                     * Click handler for the save button on the change quota module, submits the new quota to emailAccountsService.changeQuota
                     */
                    $scope.onClickChangeQuota = function() {

                        $scope.changingQuota = true;
                        $scope.expandedAccount.status = undefined;

                        var emailAccount = $scope.expandedAccount;
                        var quotaValue = $scope.quotaChange.quotaType === "unlimited" ? 0 : $scope.quotaChange.quota;

                        return emailAccountsService.changeQuota(emailAccount.user, emailAccount.domain, quotaValue).then(
                            function() {

                                $scope.changingQuota = false;

                                var statusText;

                                if( $scope.quotaChange.quotaType === "unlimited" ) {
                                    statusText = LOCALE.maketext("Changed Quota for “[_1]” to unlimited.", emailAccount.user + "@" + emailAccount.domain);
                                }
                                else {
                                    statusText = LOCALE.maketext("Changed Quota for “[_1]” to [numf,_2] MB.", emailAccount.user + "@" + emailAccount.domain, quotaValue);
                                }

                                $scope.expandedAccount.status = {
                                    type: "success",
                                    message: statusText,
                                    closeable: true,
                                    ttl: 10000
                                };

                                if( $scope.quotaChange.quotaType === "unlimited" || quotaValue === 0 ) {
                                    emailAccount._diskquota = 0;
                                    emailAccount.diskquota = "unlimited";
                                    emailAccount.humandiskquota = "&infin;";
                                    emailAccount.diskusedpercent = 0;
                                }
                                else {
                                    emailAccount._diskquota = quotaValue;
                                    emailAccount.diskquota = quotaValue;
                                    emailAccount.humandiskquota = quotaValue;
                                    emailAccount.diskusedpercent = ((emailAccount.diskused / emailAccount.diskquota) * 100).toFixed(2);
                                }

                                emailAccount.humandiskusedpercent = LOCALE.maketext("[_1]%", emailAccount.diskusedpercent);

                                $scope.actionModule = undefined;
                            },
                            function(error) {
                                $scope.changingQuota = false;
                                $scope.expandedAccount.status = { type: "danger", message: error };
                            }
                        );
                    };

                    /**
                     * Click handler for the delete link, opens the delete module for the account
                     * @param  {Object} emailAccount The email account to open the delete module for
                     */
                    $scope.onClickDelete = function(emailAccount) {
                        if( $scope.expandedAccount === emailAccount && $scope.actionModule === "delete" ) {
                            $scope.actionModule = undefined;
                        }
                        else {

                            if( $scope.expandedAccount ) {
                                $scope.expandedAccount.status = undefined;
                            }

                            $scope.actionModule = "delete";
                            $scope.expandedAccount = emailAccount;
                        }
                    };

                    /**
                     * Click handler for the delete button on the delete module, submits the account to emailAccountService.deleteEmailAccount
                     */
                    $scope.onClickDeleteConfirm = function() {

                        $scope.deletingAccount = true;
                        $scope.expandedAccount.status = undefined;
                        $scope.expandedAccount.deleting = true;

                        return emailAccountsService.deleteEmailAccount($scope.expandedAccount.user, $scope.expandedAccount.domain).then(
                            function() {

                                $scope.expandedAccount.deleted = true;
                                $scope.expandedAccount.status = {
                                    message: LOCALE.maketext("Account “[_1]” deleted.", $scope.expandedAccount.user + "@" + $scope.expandedAccount.domain),
                                    type: "success",
                                    closeable: true,
                                    ttl: 10000
                                };

                                $scope.deletingAccount = false;
                                $scope.actionModule = undefined;
                            },
                            function(error) {
                                $scope.expandedAccount.status = { type: "danger", message: error };
                                $scope.deletingAccount = false;
                            }
                        );
                    };

                    /**
                     * Callback for clicking on one of the table headers to sort by column
                     */
                    $scope.sortList = function() {

                        if( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        $scope.currentFetchTimeout = $timeout(function() {
                            $scope.saveMetaToComponentSettings();
                            $scope.meta.currentPage = 1;
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback for clicking on one of the pagination nav links to move between pages
                     */
                    $scope.selectPage = function() {

                        if( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        $scope.currentFetchTimeout = $timeout(function() {
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback for selecting a page size from the pagination <select>
                     */
                    $scope.selectPageSize = function() {

                        if( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        $scope.currentFetchTimeout = $timeout(function() {
                            $scope.saveMetaToComponentSettings();
                            $scope.meta.currentPage = 1;
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback for entering filter input into the search bar
                     */
                    $scope.searchList = function() {

                        $scope.filterTermPending = true;

                        if( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        $scope.currentFetchTimeout = $timeout(function() {
                            $scope.saveMetaToComponentSettings();
                            $scope.meta.currentPage = 1;
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback that clears the expandedAccount field after all open modules have been collapsed
                     */
                    $scope.collapseFinished = function() {
                        if( $scope.actionModule === undefined ) {
                            $scope.expandedAccount = undefined;
                        }
                    };

                    /**
                     * Calls emailAccountsService.getEmailAccounts to load the email accounts for the current page
                     */
                    $scope.fetch = function() {

                        $scope.loadingEmailAccounts = true;
                        $scope.meta.mobileItemCountText = undefined;

                        var sortMethod = "lexicographic";

                        if( $scope.meta.sortBy === "_diskused" || $scope.meta.sortBy === "diskusedpercent" ) {
                            sortMethod = "numeric";
                        }
                        else if( $scope.meta.sortBy === "_diskquota" ) {
                            sortMethod = "numeric_zero_as_max";
                        }

                        var apiParams = {
                            "api.sort": 1,
                            "api.sort_column": $scope.meta.sortBy,
                            "api.sort_method": sortMethod,
                            "api.sort_reverse": $scope.meta.sortDirection === "asc" ? 0 : 1,
                            "api.paginate": 1,
                            "api.paginate_start": ($scope.meta.currentPage - 1) * $scope.meta.pageSize,
                            "api.paginate_size": $scope.meta.pageSize,
                            "api.paginate_page": $scope.meta.currentPage
                        };

                        if( $scope.meta.filterValue && $scope.meta.filterValue !== "" ) {
                            apiParams["api.filter"] = 1;
                            apiParams["api.filter_term_0"] = $scope.meta.filterValue;
                            apiParams["api.filter_column_0"] = "login";
                        }

                        $scope.filteredList = [];

                        // Setting min-height to the current height to prevent the page jumping
                        // around when the list is fetching
                        var container = angular.element("#popsAccountList");

                        if( container && container[0] ) {
                            container.css({ minHeight: $window.getComputedStyle(container[0]).height });
                        }

                        var apiPromise = emailAccountsService.getEmailAccounts(apiParams);
                        $scope.fetchPromise = apiPromise;

                        apiPromise.then(
                            function(response) {

                                // We only want to actually process the response if it's the last request we sent
                                if( $scope.fetchPromise !== apiPromise ) {
                                    return;
                                }

                                var data = response.data;
                                var metadata = response.meta;

                                $scope.meta.totalItems = metadata.paginate.total_records;

                                if ($scope.meta.totalItems > _.min($scope.meta.pageSizes)) {
                                    $scope.showPager = true;
                                    var start = ($scope.meta.currentPage - 1) * $scope.meta.pageSize;
                                    $scope.meta.start = start + 1;
                                    $scope.meta.limit = start + data.length;

                                } else {
                                // hide pager and pagination
                                    $scope.showPager = false;

                                    if (data.length === 0) {
                                        $scope.meta.start = 0;
                                    } else {
                                    // table statistics
                                        $scope.meta.start = 1;
                                    }

                                    $scope.meta.limit = data.length;
                                }

                                $scope.meta.mobileItemCountText = LOCALE.maketext("Displaying [_1] to [_2] out of [_3] records",
                                    $scope.meta.start, $scope.meta.limit, $scope.meta.totalItems
                                );

                                angular.element("#popsAccountList").css({ minHeight: "" });
                                $scope.filteredList = data;
                                $scope.loadingEmailAccounts = false;
                                $scope.filterTermPending = false;
                            },
                            function(error) {
                                growl.error(error);
                                $scope.loadingEmailAccounts = false;
                                $scope.filterTermPending = false;
                            }
                        );

                    };

                    $scope.getSearchClass = function() {
                        if( !$scope.filterTermPending && !$scope.loadingEmailAccounts && $scope.meta.filterValue ) {
                            return $scope.filteredList.length > 0 ? "success" : "danger";
                        }
                        else {
                            return "";
                        }
                    };

                    var unregisterAddListener = $rootScope.$on("emailAccountAdded", $scope.fetch);

                    if( PAGE.nvdata && PAGE.nvdata.hasOwnProperty(COMPONENT_NAME) ) {
                        $scope.setMetaFromComponentSettings(PAGE.nvdata[COMPONENT_NAME]);
                    }

                    $scope.$on("$destroy", function() {
                        ComponentSettingSaverService.unregister(COMPONENT_NAME);
                        unregisterAddListener();
                    });

                    ComponentSettingSaverService.register(COMPONENT_NAME);
                    $timeout($scope.fetch);
                }]
        );

    }
);