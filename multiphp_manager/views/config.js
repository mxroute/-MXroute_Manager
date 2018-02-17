/*
 * multiphp_manager/views/config.js                Copyright(c) 2015 cPanel, Inc.
 *                                                           All rights Reserved.
 * copyright@cpanel.net                                         http://cpanel.net
 * This code is subject to the cPanel license. Unauthorized copying is prohibited
 */

/* global define: false, PAGE: true */

define(
    [
        "angular",
        "cjt/util/locale",
        "lodash",
        "uiBootstrap",
        "cjt/decorators/growlDecorator",
        "app/services/configService",
        "app/views/impactedDomainsPopup"
    ],
    function(angular, LOCALE, _) {

        // Retrieve the current application
        var app = angular.module("App");

        var controller = app.controller(
            "config",
            ["$scope", "configService", "$uibModal", "$timeout", "alertService", "growl", "growlMessages",
            function($scope, configService, $uibModal, $timeout, alertService, growl, growlMessages) {
                // Setup data structures for the view
                $scope.loadingVhostList = false;
                $scope.phpVersionsEmpty = true;
                $scope.selectedVersion = "";
                $scope.phpVhostList = [];

                $scope.vhostSelected = false;
                var selectedVhostList = [];

                $scope.totalSelectedDomains = 0;

                $scope.checkdropdownOpen = false;

                // meta information
                $scope.meta = {
                    // Sort settings
                    sortReverse : false,
                    sortBy: "vhost",
                    sortDirection: "asc",

                    // Search/Filter options
                    filterBy: "*",
                    filterCompare: "contains",
                    filterValue: "",

                    // Pager settings
                    maxPages: 0,
                    totalItems: $scope.phpVhostList.length,
                    currentPage: 1,
                    pageSize: 10,
                    pageSizes: [10, 20, 50, 100],
                    start: 0,
                    limit: 10
                };

                var impactedDomains = {
                    loading: false,
                    warn: false,
                    show: false,
                    showMore: false,
                    text: ""
                };

                $scope.selectAllVhosts = function() {
                    if($scope.allRowsSelected) {
                        $scope.phpVhostList.forEach(function(item){
                            item.rowSelected = true;

                            if( selectedVhostList.indexOf(item.vhost) !== -1 ) {
                                return;
                            }

                            selectedVhostList.push(item.vhost);
                        });
                    } else {

                        var unselectedDomains = $scope.phpVhostList.map(function(item){
                            item.rowSelected = false;
                            return item.vhost;
                        });

                        selectedVhostList = _.difference(selectedVhostList, unselectedDomains);
                    }

                    $scope.totalSelectedDomains = selectedVhostList.length;
                    $scope.vhostSelected = $scope.totalSelectedDomains > 0;
                };

                var processImpactedDomains = function(vhostInfo, selected){
                    // Get impacted domains for this vhost selection and show them to
                    // to warn the user about the impact that the change has.
                    if(selected){
                        vhostInfo.impactedDomains.loading = true;
                        configService.fetchImpactedDomains("domain", vhostInfo.vhost)
                        .then(function(result){
                            // Original vhost we are getting this data for, is also
                            // returned as part of the result. Let's remove that so we can
                            // just show the other impacted domains.
                            var domains = _.without(result.data.domains, vhostInfo.vhost);
                            if(result.status && domains.length > 0){
                                vhostInfo.impactedDomains.show = vhostInfo.impactedDomains.warn = vhostInfo.rowSelected;
                                vhostInfo.impactedDomains.showMore = domains.length > 10;
                                vhostInfo.impactedDomains.text = LOCALE.maketext("A change to the “[output,strong,_1]” domain‘s PHP version affects the following domains:", vhostInfo.vhost);
                                vhostInfo.impactedDomains.domains = _.sortBy(domains);
                            }
                        },
                        function(error){
                            growl.error(error);
                        }).finally(function(){
                            vhostInfo.impactedDomains.loading = false;
                        });
                    } else {
                        vhostInfo.impactedDomains.show = vhostInfo.impactedDomains.warn = selected;
                    }
                };

                $scope.selectVhost = function(vhostInfo) {
                    if(typeof vhostInfo !== "undefined"){
                        processImpactedDomains(vhostInfo, vhostInfo.rowSelected);

                        if(vhostInfo.rowSelected) {
                            selectedVhostList.push(vhostInfo.vhost);
                            $scope.allRowsSelected = $scope.phpVhostList.every(function(item){
                                return item.rowSelected;
                            });
                        } else {
                            selectedVhostList = selectedVhostList.filter(function(item) {
                                return item !== vhostInfo.vhost;
                            });

                            // Unselect Select All checkbox.
                            $scope.allRowsSelected = false;
                        }
                    }

                    $scope.totalSelectedDomains = selectedVhostList.length;
                    $scope.vhostSelected = $scope.totalSelectedDomains > 0;
                };

                $scope.rowClass = function(vhostInfo){
                    if(vhostInfo.impactedDomains.warn){
                        return "warning";
                    }

                    if(vhostInfo.impactedDomains.loading){
                        return "processing";
                    }
                };

                $scope.showAllImpactedDomains = function (vhostInfo) {
                    // var viewingProfile = angular.copy(thisProfile);
                    $uibModal.open({
                        templateUrl: "impactedDomainsPopup.ptt",
                        controller: "impactedDomainsPopup",
                        resolve: {
                            data: function () {
                                return vhostInfo;
                            }
                        }
                    });
                };

                $scope.clearAllSelections = function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    selectedVhostList = [];
                    $scope.phpVhostList.forEach(function(item){
                        item.rowSelected = false;
                    });

                    $scope.checkdropdownOpen = false;
                    $scope.allRowsSelected = false;
                    $scope.totalSelectedDomains = 0;
                    $scope.vhostSelected = false;
                };

                /**
                 * Select a specific page
                 * @param  {Number} page Page number
                 */
                $scope.selectPage = function(page) {
                    // set the page if requested.
                    if (page && angular.isNumber(page)) {
                        $scope.meta.currentPage = page;
                    }

                    return fetchVhostList();
                };

                // Apply the new PHP version setting of a selected user
                $scope.applyDomainPhp = function () {
                    // Destroy all growls and alerts before attempting to submit something.
                    growlMessages.destroyAllMessages();
                    alertService.clear();

                    return configService.applyDomainSetting($scope.selectedVersion, selectedVhostList)
                        .then(
                            function(data) {
                                if(typeof data !== "undefined") {
                                    growl.success(LOCALE.maketext("Successfully applied [asis,PHP] version “[_1]” to the selected [numerate,_2,domain,domains].", $scope.selectedVersion, selectedVhostList.length));
                                    $scope.selectPage();
                                }
                            }, function(response) {
                                if(typeof(response.raw) !== "undefined"){
                                    var errors = response.raw.errors;
                                    // ::TODO:: Should scroll to the error alert when
                                    // multiple errors occur.
                                    if(errors.length > 0){
                                        var successfulDomains = response.data.vhosts;
                                        errors.forEach(function(error){
                                            alertService.add({
                                                type: "danger",
                                                message: error,
                                                id: "alertMessages",
                                                replace: false,
                                                closeable: true
                                            });
                                        });

                                        var secondPartOfErrorMsg = LOCALE.maketext("For more information, check the error message at the top of the page.");
                                        if(successfulDomains.length <= 0){
                                            var errorMsg = LOCALE.maketext("Failed to apply [asis,PHP] version “[_1]” to the selected [numerate,_2,domain,domains].",
                                                                $scope.selectedVersion,
                                                                errors.length) +
                                                            " " +
                                                            secondPartOfErrorMsg;
                                            growl.error(errorMsg);
                                            return;
                                        }

                                        growl.success(LOCALE.maketext("Successfully applied [asis,PHP] version “[_1]” to [numerate,_2,a domain,some domains].",
                                                        $scope.selectedVersion,
                                                        successfulDomains.length));
                                        var msg = LOCALE.maketext("Failed to apply [asis,PHP] version “[_1]” to [numerate,_2,a domain,some domains].",
                                                        $scope.selectedVersion,
                                                        errors.length) +
                                                    " " +
                                                    secondPartOfErrorMsg;
                                        growl.error(msg);
                                    }
                                }
                                else {
                                    growl.error(response.error);
                                }
                            }).finally(function(){
                            resetForm();
                        });
                };

                /**
                 * Fetch the list of vhosts for the user account with their default PHP versions.
                 * @return {Promise} Promise that when fulfilled will result in the list being loaded with the account's vhost list.
                 */
                var fetchVhostList = function() {
                    $scope.loadingVhostList = true;
                    return configService
                        .fetchList($scope.meta)
                        .then(function(results) {
                            applyListToTable(results);
                        }, function(error) {

                            // failure
                            growl.error(error);
                        })
                        .then(function() {
                            $scope.loadingVhostList = false;
                        });
                };

                var resetForm = function() {
                    setDomainPhpDropdown();
                    selectedVhostList = [];
                    $scope.phpVhostList.forEach(function(item){
                            item.rowSelected = false;
                        });
                    // Unselect Select All checkbox.
                    $scope.allRowsSelected = false;

                    $scope.totalSelectedDomains = 0;
                    $scope.vhostSelected = false;
                };

                var setDomainPhpDropdown = function(versionList){
                    // versionList is sent to the function when the
                    // dropdown is bound the first time.
                    if(typeof versionList !== "undefined") {
                        $scope.phpVersions = versionList;

                        // Cannot show "inherit" in the dropdown if system default itself doesn't exist.
                        if(typeof $scope.systemPhp !== "undefined" && $scope.systemPhp !== "") {
                            // A new entry 'inherit' will be added to PHP version list. It allows domains
                            // to reset back to 'inherit' value.
                            $scope.phpVersions.push("inherit");
                        }
                    }

                    if($scope.phpVersions.length > 0) {
                        $scope.selectedVersion = $scope.phpVersions[0];
                        $scope.phpVersionsEmpty = false;
                    } else {
                        $scope.phpVersionsEmpty = true;
                    }
                };

                var applyListToTable = function(resultList) {
                    var vhostList = resultList.items;
                    // update the total items after search
                    $scope.meta.totalItems = resultList.totalItems;

                    var filteredList = vhostList;
                    // filter list based on page size and pagination
                    if($scope.meta.totalItems > _.min($scope.meta.pageSizes)){
                        var start = ($scope.meta.currentPage - 1) * $scope.meta.pageSize;

                        $scope.showPager = true;

                        // table statistics
                        $scope.meta.start = start + 1;
                        $scope.meta.limit = start + filteredList.length;
                    } else {
                        // hide pager and pagination
                        $scope.showPager = false;

                        if(filteredList.length === 0) {
                            $scope.meta.start = 0;
                        } else {
                            // table statistics
                            $scope.meta.start = 1;
                        }

                        $scope.meta.limit = filteredList.length;
                    }

                    var countNonSelected = 0;
                    // Select the rows if they were previously selected on this page.
                    filteredList.forEach(function(item){
                        if (selectedVhostList.indexOf(item.vhost) !== -1) {
                            item.rowSelected = true;
                        } else {
                            item.rowSelected = false;
                            countNonSelected++;
                        }

                        item.impactedDomains = angular.copy(impactedDomains);
                        // Initialize the 'inherited' bool flag for every time to false.
                        item.inherited = false;
                        var version_source = item.phpversion_source;
                        if( typeof version_source !== "undefined" ) {
                            var type = "", value = "";
                            if( typeof version_source.domain !== "undefined" ) {
                                type = "domain";
                                value = version_source.domain;
                            } else if (typeof version_source.system_default !== "undefined") {
                                type = "system_default";
                                value = LOCALE.maketext("System Default");
                            }

                            if((type === "domain" && value !== item.vhost) ||
                                type === "system_default"){
                                item.inherited = true;
                                item.inheritedInfo = LOCALE.maketext("This domain inherits its [asis,PHP] version “[output,em,_1]” from: [output,strong,_2]", item.version, value);
                            }
                        }
                    });

                    $scope.phpVhostList = filteredList;

                    // Clear the 'Select All' checkbox if at least one row is not selected.
                    $scope.allRowsSelected = (filteredList.length > 0) && (countNonSelected === 0);
                };

                $scope.$on("$viewContentLoaded", function() {
                    // Destroy all growls and alerts before attempting to submit something.
                    growlMessages.destroyAllMessages();
                    alertService.clear();


                    // Load the domain table
                    if (PAGE.vhostListData.status) {
                        $scope.loadingVhostList = false;
                        var results = configService.prepareList(PAGE.vhostListData);
                        applyListToTable(results);
                    } else {
                        growl.error(PAGE.vhostListData.errors[0]);
                    }

                    // Load system PHP version.
                    if(PAGE.systemPHPData.status) {
                        $scope.systemPhp = PAGE.systemPHPData.data.version;
                    } else {
                        growl.error(PAGE.systemPHPData.errors[0]);
                    }

                    // Load the installed PHP versions.
                    if(PAGE.versionListData.status) {
                        setDomainPhpDropdown(PAGE.versionListData.data.versions);
                    } else {
                        growl.error(PAGE.versionListData.errors[0]);
                    }
                });
            }
        ]);

        return controller;
    }
);
