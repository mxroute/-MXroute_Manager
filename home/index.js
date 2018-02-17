/*
 * home/index.js                 Copyright(c) 2015 cPanel, Inc.
 *                                                           All rights Reserved.
 * copyright@cpanel.net                                         http://cpanel.net
 * This code is subject to the cPanel license. Unauthorized copying is prohibited
 */

/* global require: false, define: false */

define(
    [
        "angular",
        "cjt/core",
        "ngSanitize",
        "cjt/modules",
        "uiBootstrap",
        "angular-chosen",
    ],
    function(angular, CJT) {
        return function() {
            // First create the application
            angular.module("App", ["ngSanitize", "ui.bootstrap", "cjt2.cpanel", "angular-growl","localytics.directives"]);

            // Then load the application dependencies
            var app = require(
                [
                    // Application Modules
                    "app/views/applicationListController",
                    "app/views/statisticsController",
                    "app/views/themesController",
                    "app/views/accountsController"
                ], function() {
                    var app = angular.module("App");

                    app.config(["growlProvider",
                        function(growlProvider) {

                            growlProvider.globalTimeToLive({success: 5000, warning: 5000, info: 5000, error: -1});
                            growlProvider.globalDisableCountDown(true);
                        }
                    ]);

                    /**
                     * Initialize the application
                     * @return {[type]} [description]
                     */
                    app.init = function() {

                        var appContent = angular.element("#content");

                        if (appContent[0] !== null) {
                            // apply the app after requirejs loads everything
                            angular.bootstrap(appContent[0], ["App"]);
                        }

                        // Chaining
                        return app;
                    };

                    // disable debug
                    app.config(["$compileProvider", function ($compileProvider) {
                        if(!CJT.config.debug) {
                            $compileProvider.debugInfoEnabled(false);
                        }
                    }]);
                    app.config(["$httpProvider", function ($httpProvider) {
                        $httpProvider.useApplyAsync(true);
                    }]);

                    // We can now run the bootstrap for the application
                    app.init();
                });

            return app;
        };
    }
);
