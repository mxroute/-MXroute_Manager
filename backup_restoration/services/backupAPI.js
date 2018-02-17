/*
# backup_restoration/services/backupAPI.js        Copyright 2017 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "cjt/io/uapi-request",
        "cjt/services/APIService"
    ],
    function(angular, APIREQUEST) {

        var app;
        try {
            app = angular.module("App"); // For runtime
        } catch (e) {
            app = angular.module("App", []); // Fall-back for unit testing
        }

        app.factory("backupAPIService", [
            "APIService",
            function(
                APIService
            ) {

                // Set up the service's constructor and parent
                var BackupAPIService = function() {};
                BackupAPIService.prototype = new APIService();

                // Extend the prototype with any class-specific functionality
                angular.extend(BackupAPIService.prototype, {
                    /**
                     * Get a list of all directories and files of a given path
                     * @public
                     * @method listDirectory
                     * @param {string} path The full path of the directory
                     * @return {Promise} Promise that will fulfill the request.
                     */
                    listDirectory: function(path) {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Restore", "directory_listing");
                        apiCall.addArgument("path", path);
                        var deferred = this.deferred(apiCall, {
                            transformAPISuccess: function(response) {
                                return response.data;
                            },
                            transformAPIFailure: function(response) {
                                return response.error;
                            }
                        });

                        return deferred.promise;
                    },
                    /**
                     * Get all backups of a particular file
                     * @public
                     * @method listFileBackups
                     * @param {string} fullPath The full path of the file
                     * @return {Promise} Promise that will fulfill the request.
                     */
                    listFileBackups: function(fullPath) {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Restore", "query_file_info");
                        apiCall.addArgument("fullpath", fullPath);

                        var deferred = this.deferred(apiCall, {
                            transformAPISuccess: function(response) {
                                return response.data;
                            },
                            transformAPIFailure: function(response) {
                                return response.error;
                            }
                        });

                        return deferred.promise;
                    },
                    /**
                     * Restore a single file
                     * @public
                     * @method restore
                     * @param {string} fullPath The full path of the file
                     * @param {string} backupID The identification string for backup
                     * @return {Promise} Promise that will fulfill the request.
                     */
                    restore: function(fullPath, backupID) {
                        var apiCall = new APIREQUEST.Class();
                        apiCall.initialize("Restore", "restore_file");
                        apiCall.addArgument("backupID", backupID);
                        apiCall.addArgument("fullpath", fullPath);
                        apiCall.addArgument("overwrite", 1);

                        var deferred = this.deferred(apiCall, {
                            transformAPISuccess: function(response) {
                                return response.data;
                            },
                            transformAPIFailure: function(response) {
                                return response.error;
                            }
                        });

                        return deferred.promise;
                    },
                });

                return new BackupAPIService();
            }
        ]);
    }
);