/*
# zone_editor/index.js                            Copyright(c) 2016 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/
/* global require: false, define: false, PAGE: false */

define(
    [
        "angular",
        "jquery",
        "lodash",
        "cjt/core",
        "cjt/modules",
        "ngRoute",
        "uiBootstrap"
    ],
    function(angular, $, _, CJT) {
        return function() {
            // First create the application
            angular.module("cpanel.zoneEditor", ["ngRoute", "ui.bootstrap", "angular-growl", "cjt2.cpanel"]);

            // Then load the application dependencies
            var app = require(
                [
                    "app/services/page_data_service",
                    "app/services/domains",
                    "app/services/zones",
                    "app/services/dnssec",
                    "app/services/features",
                    "app/models/dynamic_table",
                    "app/directives/convert_to_full_record_name",
                    "app/views/domain_selection",
                    "app/views/manage",
                    "app/views/dnssec",
                    "app/models/dmarc_record"
                ], function() {

                    var app = angular.module("cpanel.zoneEditor");

                    // setup the defaults for the various services.
                    app.factory("defaultInfo", [
                        "pageDataService",
                        function(pageDataService) {
                            return pageDataService.prepareDefaultInfo(PAGE);
                        }
                    ]);

                    app.config([
                        "$routeProvider",
                        "$compileProvider",
                        "growlProvider",
                        function($routeProvider, $compileProvider, growlProvider) {

                            growlProvider.globalTimeToLive({success: 5000, warning: 5000, info: 5000, error: 10000});
                            growlProvider.globalDisableCountDown(true);

                            if(!CJT.config.debug) {
                                $compileProvider.debugInfoEnabled(false);
                            }

                            $routeProvider.when("/list", {
                                controller: "ListDomainsController",
                                controllerAs: "list",
                                templateUrl: "zone_editor/views/domain_selection.ptt"
                            });

                            $routeProvider.when("/manage/:domain", {
                                controller: "ManageZoneRecordsController",
                                controllerAs: "manage",
                                templateUrl: "zone_editor/views/manage.ptt"
                            });

                            $routeProvider.when("/dnssec/:domain", {
                                controller: "DnsSecController",
                                controllerAs: "dnssec",
                                templateUrl: "zone_editor/views/dnssec.ptt"
                            });

                            $routeProvider.otherwise({
                                "redirectTo": "/list"
                            });
                        }
                    ]);

                    /**
                     * Initialize the application
                     * @return {ngModule} Main module.
                     */
                    app.init = function() {

                        var appContent = angular.element("#content");

                        if(appContent[0] !== null){
                            // apply the app after requirejs loads everything
                            angular.bootstrap(appContent[0], ["cpanel.zoneEditor"]);
                        }

                        // Chaining
                        return app;
                    };

                    // We can now run the bootstrap for the application
                    app.init();

                });

            return app;
        };
    }
);
