/*
# passwd/index.js                                 Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global require: false, define: false */
/* jshint -W098 */

define(
    [
        "angular",
        "cjt/core",
        "cjt/modules",
        "uiBootstrap"
    ],
    function(angular, CJT) {
        return function() {
            // First create the application
            angular.module("App", ["ui.bootstrap", "angular-growl", "cjt2.cpanel"]);

            // Then load the application dependencies
            var app = require(
                [
                    "app/views/ExternalAuthController",
                    "app/services/ExternalAuthService",
                ], function() {

                    var app = angular.module("App");

                    /**
                     * Initialize the application
                     * @return {ngModule} Main module.
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

                    // We can now run the bootstrap for the application
                    app.init();

                });

            return app;
        };
    }
);
