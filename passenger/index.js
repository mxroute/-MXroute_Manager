/*
# passenger/index.js                              Copyright(c) 2017 cPanel, Inc.
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
        "uiBootstrap",
        "jquery-chosen",
        "angular-chosen"
    ],
    function(angular, $, _, CJT) {
        return function() {
            // First create the application
            angular.module("cpanel.applicationManager", ["ngRoute", "ui.bootstrap", "angular-growl", "cjt2.cpanel", "localytics.directives"]);

            // Then load the application dependencies
            var app = require(
                [
                    "cjt/services/autoTopService",
                    "app/services/apps",
                    "app/services/domains",
                    "app/views/manage",
                    "app/views/details",
                    "app/directives/table_row_form"
                ], function() {

                    var app = angular.module("cpanel.applicationManager");

                    app.value("defaultInfo", PAGE);

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

                            $routeProvider.when("/manage", {
                                controller: "ManageApplicationsController",
                                controllerAs: "manage",
                                templateUrl: "passenger/views/manage.ptt"
                            });

                            $routeProvider.when("/details/:applname?", {
                                controller: "ConfigurationDetailsController",
                                controllerAs: "details",
                                templateUrl: "passenger/views/details.ptt"
                            });

                            $routeProvider.otherwise({
                                "redirectTo": "/manage"
                            });
                        }
                    ]);

                    app.run(["autoTopService", function(autoTopService) {
                        autoTopService.initialize();
                    }]);

                    /**
                     * Initialize the application
                     * @return {ngModule} Main module.
                     */
                    app.init = function() {

                        var appContent = angular.element("#content");

                        if(appContent[0] !== null){
                            // apply the app after requirejs loads everything
                            angular.bootstrap(appContent[0], ["cpanel.applicationManager"]);
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
