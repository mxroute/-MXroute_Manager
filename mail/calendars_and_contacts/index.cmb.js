/*
# templates/mail/calenadars_and_contacts/views/configController.js
#                                                 Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false, PAGE: true */

define(
    'app/views/configController',[
        "angular",
        "cjt/util/locale",
        "uiBootstrap",
        "cjt/filters/wrapFilter"
    ],
    function(angular, LOCALE) {

        // Retrieve the current application
        var app = angular.module("App");

        // Setup the controller
        var controller = app.controller(
            "configController", [
                "$scope",
                function(
                    $scope
                ) {

                    /**
                     * Initialize the view
                     *
                     * @private
                     * @method _initializeView
                     */
                    var _initializeView = function() {
                        // check for page data in the template if this is a first load
                        if (app.firstLoad.config && PAGE.config) {
                            app.firstLoad.config = false;
                            $scope.showInfoBlock = false;
                            $scope.config    = PAGE.config;
                            $scope.secureResources = _mergeArrays(PAGE.config.ssl.calendars, PAGE.config.ssl.contacts);
                            $scope.resources = _mergeArrays(PAGE.config.no_ssl.calendars, PAGE.config.no_ssl.contacts);
                        }
                    };

                    $scope.toggleInfoBlock = function() {
                        $scope.showInfoBlock = !$scope.showInfoBlock;
                    };

                    /**
                     * Merge the calendar array with the contacts array for use in the template.
                     * Adds a type property to each object so they can still be identified.
                     *
                     * @private
                     * @param  {Array} calendars   Array of calendar configuration objects
                     * @param  {Array} contacts    Array of contacts configuration objects
                     * @return {Array}             Merged/modified array
                     */
                    var _mergeArrays = function(calendars, contacts) {
                        calendars = calendars || [];
                        contacts  = contacts  || [];

                        calendars.forEach(function(calendar) {
                            calendar.type = LOCALE.maketext("Calendar");
                        });

                        contacts.forEach(function(addressBook) {
                            addressBook.type = LOCALE.maketext("Contacts");
                        });

                        return calendars.concat(contacts);
                    };

                    _initializeView();

                }
            ]
        );

        return controller;
    }
);

/*
# templates/mail/calenadars_and_contacts/index.js
#                                                 Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global require: false, define: false */

define(
    'app/index',[
        "angular",
        "cjt/core",
        "cjt/modules",
        "ngRoute",
        "uiBootstrap",
    ],
    function(angular, CJT) {
        return function() {
            // First create the application
            angular.module("App", ["ngRoute", "ui.bootstrap", "cjt2.cpanel"]);

            // Then load the application dependencies
            var app = require(
                [
                    // Application Modules
                    "cjt/views/applicationController",
                    "app/views/configController",
                ], function() {

                    var app = angular.module("App");

                    app.firstLoad = {
                        config: true,
                    };

                    // routing
                    app.config(["$routeProvider",
                        function($routeProvider) {

                            // Setup the routes
                            $routeProvider.when("/config/", {
                                controller: "configController",
                                templateUrl: CJT.buildFullPath("mail/calendars_and_contacts/views/configView.ptt")
                            });

                            $routeProvider.otherwise({
                                "redirectTo": "/config/"
                            });
                        }
                    ]);

                    /**
                     * Initialize the application
                     * @return {ngModule} Main module.
                     */
                    app.init = function() {

                        var appContent = angular.element("#content");

                        // apply the app after requirejs loads everything
                        angular.bootstrap(appContent[0], ["App"]);

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

