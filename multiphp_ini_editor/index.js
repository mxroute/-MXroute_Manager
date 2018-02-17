/*
* multiphp_ini_editor/index.js                 Copyright(c) 2015 cPanel, Inc.
*                                                           All rights Reserved.
* copyright@cpanel.net                                         http://cpanel.net
* This code is subject to the cPanel license. Unauthorized copying is prohibited
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
        "uiBootstrap",
        "ngAnimate"
    ],
    function(angular, $, _, CJT) {
        return function() {
            // First create the application
            angular.module("App", ["ngRoute", "ui.bootstrap", "ngAnimate", "angular-growl", "cjt2.cpanel"]);

            // Then load the application dependencies
            var app = require(
                [
                    // Application Modules
                    "app/views/basicMode",
                    "app/views/editorMode"
                ], function() {

                    var app = angular.module("App");

                    app.firstLoad = {
                        phpAccountList: true
                    };

                    // Setup Routing
                    app.config(["$routeProvider", "$locationProvider", "growlProvider",
                        function($routeProvider, $locationProvider, growlProvider) {

                            // configure html5 to get links working on jsfiddle
                            // $locationProvider.html5Mode(true);

                            // Setup the routes
                            $routeProvider.when("/basic", {
                                controller: "basicMode",
                                templateUrl: CJT.buildFullPath("multiphp_ini_editor/views/basicMode.html.tt"),
                                reloadOnSearch: false
                            });

                            $routeProvider.when("/editor", {
                                controller: "editorMode",
                                templateUrl: CJT.buildFullPath("multiphp_ini_editor/views/editorMode.html.tt"),
                                reloadOnSearch: false
                            });

                            $routeProvider.otherwise({
                                "redirectTo": "/basic"
                            });

                            // Configure default growl behavior
                            growlProvider.globalTimeToLive({success: 5000, warning: 5000, info: 5000, error: 10000});
                            growlProvider.globalDisableCountDown(true);
                        }
                    ]);

                    app.run(["$rootScope", "$location", "growlMessages", function($rootScope, $location, growlMessages) {
                        // register listener to watch route changes
                        $rootScope.$on("$routeChangeStart", function() {
                            $rootScope.currentRoute = $location.path();
                            growlMessages.destroyAllMessages();
                        });
                    }]);

                    /**
                     * Initialize the application
                     * @return {[type]} [description]
                     */
                    app.init = function() {
                        // // apply the app after requirejs loads everything
                        // angular.bootstrap(document, ["App"]);

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
