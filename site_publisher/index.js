/* global define: false, require: false */

define(
    [
        "angular",
        "cjt/core",
        "cjt/modules",
        "ngRoute",
        "uiBootstrap"
    ],
    function(angular, CJT) {
        return function() {

            // First create the application
            angular.module("App", [
                "ngRoute",
                "ui.bootstrap",
                "angular-growl",
                "cjt2.cpanel"
            ]);

            var app = require(
                [
                    "uiBootstrap",
                    // Application Modules
                    "cjt/views/applicationController",
                    "app/views/publishController"
                ], function() {

                    var app = angular.module("App");

                    app.firstLoad = {
                        publish: true,
                    };

                    app.value("PAGE", CPANEL.PAGE);

                    //If using views
                    app.controller("BaseController", ["$rootScope", "$scope", "$route", "$location",
                        function($rootScope, $scope, $route, $location) {

                            $scope.loading = false;
                            //Convenience functions so we can track changing views for loading purposes
                            $rootScope.$on("$routeChangeStart", function() {
                                $scope.loading = true;
                            });
                            $rootScope.$on("$routeChangeSuccess", function() {
                                $scope.loading = false;
                            });
                            $rootScope.$on("$routeChangeError", function() {
                                $scope.loading = false;
                            });
                            $scope.current_route_matches = function(key) {
                                return $location.path().match(key);
                            };
                            $scope.go = function(path) {
                                $location.path(path);
                            };
                        }
                    ]);

                    //viewName

                    app.config(["$routeProvider", "$locationProvider", "growlProvider",
                        function($routeProvider, $locationProvider, growlProvider) {

                            growlProvider.globalTimeToLive({success: 5000, warning: 5000, info: 5000, error: -1});
                            growlProvider.globalDisableCountDown(true);

                            // Setup a route - copy this to add additional routes as necessary
                            $routeProvider.when("/publish", {
                                controller: "publishController",
                                templateUrl: CJT.buildFullPath("site_publisher/views/publishView.html.tt"),
                                resolve: {}
                            });

                            //default route
                            $routeProvider.otherwise({
                                "redirectTo": "/publish"
                            });

                        }
                    ]);
                    //end of using views

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
