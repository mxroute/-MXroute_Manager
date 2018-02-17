/*
# _assets/master.js                               Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global require: false, define: false */

define(
    [
        "angular",
        "uiBootstrap",
        "ngSanitize",
        "cjt/services/notificationsService",
        "cjt/services/NVDataService"
    ],
    function(angular) {

        return function() {

            // First create the application
            angular.module("Master", [
                "ui.bootstrap",
                "ngSanitize",
                "cjt2.services.notifications",
                "cjt2.services.nvdata"
            ]);

            // Then load the application dependencies
            var app = require(
                [
                    "master/views/applicationListController",
                    "master/views/sidebarController"

                    // Application Modules
                ], function() {

                    var app = angular.module("Master");

                    /**
                     * Initialize the application
                     * @return {ngModule} Main module.
                     */
                    app.init = function() {

                        angular.element("#masterAppContainer").ready(function() {

                            var masterAppContainer = angular.element("#masterAppContainer");
                            if (masterAppContainer[0] !== null) {
                                // apply the app after requirejs loads everything
                                angular.bootstrap(masterAppContainer[0], ["Master"]);
                            }
                        });

                        angular.element("#sidebar").ready(function() {

                            var sidebar = angular.element("#sidebar");
                            if (sidebar[0] !== null) {
                                // apply the app after requirejs loads everything
                                angular.bootstrap(sidebar[0], ["Master"]);
                            }
                        });

                        // Add functionality to the navbar toggle button
                        angular.element("#btnSideBarToggle").bind("click", function() {
                            angular.element("#sidebar").toggleClass("active");
                        });

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
