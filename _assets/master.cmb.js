/*
# _assets/views/applicationListController.js      Copyright(c) 2014 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false, PAGE: true */

define(
    'master/views/applicationListController',[
        "angular",
        "cjt/core",
        "uiBootstrap"
    ],
    function(angular, CJT) {

        // Retrieve the current application
        var app = angular.module("Master");

        // Setup the controller
        var controller = app.controller(
            "applicationListController", [
                "$scope",
                "$window",
                "notificationsService",
                "$timeout",
                function(
                    $scope,
                    $window,
                    notificationsService,
                    $timeout
                ) {

                    /**
                     * Initialize the scope variables
                     *
                     * @private
                     * @method _initializeScope
                     */
                    var _initializeScope = function() {
                        $scope.applicationList = [];
                        if (PAGE.applicationList) {
                            $scope.applicationList = PAGE.applicationList;
                        }

                        $scope.notificationsExist = false;

                        /** We are running into browser limits on the number of
                         *  concurrent HTTP connections. We want these AJAX
                         *  calls to be low priority so that CSS/sprites/etc.
                         *  will load first; otherwise, the UI takes longer to
                         *  be usable.
                         *
                         *  We need to reduce the number of concurrent
                         *  HTTP calls, but for now this stop-gap will
                         *  ensure that AJAX post-back calls don’t delay the
                         *  loading of critical UI resources.
                         */
                        $timeout(function() {
                            notificationsService.getCount().then(function(response) {
                                $scope.notificationsExist = response > 0 ? true : false;
                                $scope.notificationsCount = response;
                            });
                        });

                        angular.element($window).on("keyup", function(event) {
                            var tag = event.target.tagName.toLowerCase();
                            if (tag === "input" || tag === "select" || tag === "textarea") {
                                return;
                            }
                            // listen for either numberpad or left of shift / key
                            if (event.keyCode === 191 || event.keyCode === 111) {
                                document.getElementById("txtQuickFind").focus();
                            }
                        });
                    };

                    $scope.openApplication = function($item, $model) {
                        var url = $model.url;
                        // Not present in all browsers.
                        if (window.event) {
                            window.event.stopPropagation();
                        }

                        // check for the type of path needed and build it
                        if (url.search(/^http/i) === -1) {
                            if (url.search(/^\//) !== -1) {
                                url = CJT.getRootPath() + url;
                            } else {
                                url = CJT.buildFullPath(url);
                            }
                        }

                        if ($model.target) {
                            window.open(url, $model.target);
                        } else {
                            window.open(url, "_self");
                        }

                    };

                    /**
                     * Clears the quick find application field when
                     * pressing the Esc key
                     */
                    $scope.clearQuickFind = function(event) {
                        if (event.keyCode === 27) {
                            $scope.quickFindSelected = "";
                        }
                    };


                    /**
                     * Uses the dom processor to convert html entities &amp; to &
                     * This is preferable to an iterative list because there is no list to maintain.
                     */
                    $scope.formatAppName = function(model) {
                        if (!model) {
                            return "";
                        }

                        /*
                            because this element never gets added to the dom
                            it gets garbage collected after the function runs its course
                        */
                        var t = document.createElement("textarea");
                        t.innerHTML = model.name;
                        return t.value;

                    };

                    _initializeScope();
                }
            ]
        );

        return controller;
    }
);

/*
# _assets/views/sidebarController.js              Copyright(c) 2016 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false */

define(
    'master/views/sidebarController',[
        "angular"
    ],
    function(angular) {

        // Retrieve the current application
        var app = angular.module("Master");

        // Setup the controller
        var controller = app.controller(
            "sidebarController", [
                "$scope",
                function($scope) {

                // Placeholder controller for the sidebar to provide sidebar angular foothold

                }
            ]
        );

        return controller;
    }
);

/*
# _assets/master.js                               Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global require: false, define: false */

define(
    'master/master',[
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

