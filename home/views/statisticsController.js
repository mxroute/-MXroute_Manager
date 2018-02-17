/*
 * home/views/statisticsController.js                Copyright(c) 2015 cPanel, Inc.
 *                                                                 All rights Reserved.
 * copyright@cpanel.net                                               http://cpanel.net
 * This code is subject to the cPanel license. Unauthorized copying is prohibited
 */

/* global define: false */

define(
    [
        "angular",
        "app/services/statisticsService",
        "cjt/directives/spinnerDirective",
        "cjt/decorators/growlDecorator"
    ],
    function(angular) {

        // Retrieve the current application
        var app = angular.module("App");

        var controller = app.controller(
            "statisticsController", [
                "$scope",
                "spinnerAPI",
                "statisticsService",
                "growl",
                "$timeout",
                function(
                    $scope,
                    spinnerAPI,
                    statisticsService,
                    growl,
                    $timeout) {

                    spinnerAPI.start("loadingStatsSpinner");

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
                        statisticsService.fetchExtendedStats().then(function(response) {
                            $scope.statistics = response;
                        }, function(error) {
                            growl.error(error);
                        }).finally(function() {
                            spinnerAPI.stop("loadingStatsSpinner");
                        });
                    });

                    $scope.getStatStatus = function(percentage) {

                        if (percentage >= 80) {
                            return "danger";
                        }

                        if (percentage >= 60) {
                            return "warning";
                        }

                        if (percentage >= 40) {
                            return "info";
                        }

                        if (percentage >= 0) {
                            return "success";
                        }
                    };

                }
            ]);

        return controller;
    }
);
