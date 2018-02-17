/*
 * home/services/statisticsService.js        Copyright(c) 2015 cPanel, Inc.
 *                                                                 All rights Reserved.
 * copyright@cpanel.net                                               http://cpanel.net
 * This code is subject to the cPanel license. Unauthorized copying is prohibited
 */

/* global define: false */

define(
    [
        // Libraries
        "angular"
    ],
    function(angular) {

        // Fetch the current application
        var app = angular.module("App");

        /**
         * Setup the account list model's API service
         */
        app.factory("statisticsService", ["$q", "$http",
            function($q, $http) {

                // return the factory interface
                return {
                    /**
                     * Get extended stats.
                     * @return {Promise} - Promise that will fulfill the request.
                     */
                    fetchExtendedStats: function() {
                        // make a promise
                        var deferred = $q.defer();
                        $http.get("home/views/statistics.html.tt?secpolicy_ui=no")
                            .success(function(data) {
                                deferred.resolve(data);
                            }).error(function(msg) {
                                deferred.reject(msg);
                            });

                        // Pass the promise back to the controller
                        return deferred.promise;
                    }
                };
            }
        ]);
    }
);
