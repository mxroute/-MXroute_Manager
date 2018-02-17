/*
# mail/greylisting/index.js                       Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global require: false, define: false */

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
            angular.module("App", ["ngRoute", "ui.bootstrap", "angular-growl", "cjt2.cpanel"]);

            // Then load the application dependencies
            var app = require(
                [
                    // Application Modules
                    "cjt/views/applicationController",
                    "app/views/domains",
                ], function() {

                    var app = angular.module("App");

                    app.firstLoad = {
                        domainList: true,
                    };

                    // routing
                    app.config(["$routeProvider", "growlProvider",
                        function($routeProvider, growlProvider) {

                            growlProvider.globalTimeToLive({success: 5000, warning: 5000, info: 5000, error: 10000});
                            growlProvider.globalDisableCountDown(true);

                            // Setup the routes
                            $routeProvider.when("/domains/", {
                                controller: "domainListController",
                                templateUrl: CJT.buildFullPath("mail/greylisting/views/domains.ptt")
                            });

                            $routeProvider.otherwise({
                                "redirectTo": "/domains/"
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
                            angular.bootstrap(appContent[0], ["App"]);
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
