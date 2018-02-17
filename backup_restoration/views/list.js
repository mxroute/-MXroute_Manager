/*
# backup_restoration/views/list.js                   Copyright 2017 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
        "lodash",
        "cjt/util/locale",
        "app/services/backupAPI",
        "uiBootstrap"
    ],
    function(angular, _, LOCALE) {

        // Retrieve the current application
        var app = angular.module("App");

        app.controller("restoreModalController", [
            "$scope",
            "$uibModalInstance",
            "fileExists",
            function(
                $scope,
                $uibModalInstance,
                fileExists
            ) {
                $scope.fileExists = fileExists;
                $scope.closeModal = function() {
                    $uibModalInstance.close();
                };

                $scope.runIt = function() {
                    $uibModalInstance.close(true);
                };
            }
        ]);

        // Setup the controller
        var controller = app.controller(
            "listController", [
                "$scope",
                "growl",
                "backupAPIService",
                "$uibModal",
                function(
                    $scope,
                    growl,
                    backupAPIService,
                    $uibModal
                ) {
                    /**
                     * Called when path changes
                     *
                     * @scope
                     * @method buildBreadcrumb
                     */
                    $scope.buildBreadcrumb = function() {
                        $scope.directoryBreadcrumb = [];
                        // If at root directory, no path is needed and the full string of currentPath is the entirety of directoryBreadcrumb
                        if ($scope.currentPath === "/") {
                            $scope.directoryBreadcrumb = [{
                                folder: $scope.currentPath,
                                path: $scope.currentPath
                            }];
                        } else {
                            // If in a sub-directory, build each directoryBreadcrumb element splitted by "/" and build each path
                            var directories = $scope.currentPath.split("/");
                            for (var i = 0, length = directories.length; i < length; i++) {
                                $scope.directoryBreadcrumb.push({
                                    folder: directories[i],
                                    path: $scope.currentPath.split(directories[i])[0] + directories[i]
                                });
                            }
                        }
                    };

                    /**
                     * Change to a different directory and get the list of files in that directory
                     *
                     * @scope
                     * @method changeDirectory
                     * @param  {String} path file system path user is directing to
                     */
                    $scope.changeDirectory = function(path) {
                        $scope.loadingData = true;
                        $scope.fileBackupList = [];
                        // Call API to fetch the new directory info

                        if (path === "..") {
                            path = $scope.directoryBreadcrumb[$scope.directoryBreadcrumb.length - 3].path;
                        }

                        // add necessary trailing slash to path string for proper API format
                        if (path.charAt(path.length - 1) !== "/") {
                            path = path + "/";
                        }

                        backupAPIService.listDirectory(path)
                            .then(function(directoryPath) {
                                $scope.currentPath = path;
                                $scope.buildBreadcrumb();
                                $scope.addPaths(directoryPath);
                                $scope.loadingData = false;
                            }, function(error) {
                                growl.error(error);
                                $scope.loadingData = false;
                            });
                    };

                    /**
                     * Select an item, get the backup list of that item or change to that directory
                     *
                     * @scope
                     * @method selectItem
                     * @param  {Object} item file or directory user selects
                     */
                    $scope.selectItem = function(item) {
                        if (item.type.indexOf("dir") !== -1) {
                            $scope.changeDirectory(item.fullPath);
                        } else {
                            $scope.selectedItemName = item.parsedName;
                            $scope.selectedItemExists = item.exists;
                            $scope.loadingData = true;
                            backupAPIService.listFileBackups(item.fullPath)
                                .then(function(itemData) {
                                    $scope.fileBackupList = itemData;
                                    $scope.loadingData = false;
                                }, function(error) {
                                    growl.error(error);
                                    $scope.loadingData = false;
                                });
                        }
                    };

                    /**
                     * Adds the full path to the data and the path to the parent directory
                     * as properties on the data object
                     * Also adds a parsed name and where regular space
                     * characters are replaced with a non breaking space
                     * @scope
                     * @method addPaths
                     * @param {Array} directories Array of data objects that need path properties added.
                     **/
                    $scope.addPaths = function(directories) {
                        $scope.currentDirectoryContent = [];
                        for (var i = 0, length = directories.length; i < length; i++) {
                            directories[i]["path"] = $scope.currentPath;
                            directories[i]["fullPath"] = $scope.currentPath + directories[i].name;
                            directories[i]["parsedName"] = directories[i].name.replace(/\s/g, "\u00A0");
                            $scope.currentDirectoryContent.push(directories[i]);
                        }
                    };

                    /**
                     * Process requested backup version to restore a single file
                     *
                     * @scope
                     * @method restore
                     * @param {Object} backup selected to be processed
                     *   @param {string} fullpath The full path to the target file location
                     *   @param {string} backupPath The backup's path on the disk
                     **/
                    $scope.restore = function(backup) {
                        $scope.selectedFilePath = backup.fullpath;
                        $scope.selectedBackupID = backup.backupID;
                        var $uibModalInstance = $uibModal.open({
                            templateUrl: "restoreModalContent.tmpl",
                            controller: "restoreModalController",
                            resolve: {
                                fileExists: $scope.selectedItemExists
                            }
                        });

                        $uibModalInstance.result.then(function(proceedRestoration) {
                            if (proceedRestoration) {
                                // Run restoration
                                $scope.dataRestoring = true;
                                backupAPIService.restore($scope.selectedFilePath, $scope.selectedBackupID)
                                    .then(function(response) {
                                        if (response.success) {
                                            $scope.dataRestoring = false;
                                            growl.success(LOCALE.maketext("File “[_1]” restored successfully.", _.escape($scope.selectedFilePath)));
                                        }
                                    }, function(error) {
                                        $scope.dataRestoring = false;
                                        growl.error(LOCALE.maketext("Restoration failure for file “[_1]”: “[_2]”.", _.escape($scope.selectedFilePath), error));
                                    });
                            }
                        });
                    };

                    /**
                     * Initializes data
                     * @scope
                     * @method init
                     **/

                    $scope.init = function() {
                        // Displays directory structure starting at /home/USERNAME
                        $scope.currentPath = "/";
                        $scope.initialDataLoaded = false;
                        backupAPIService.listDirectory($scope.currentPath)
                            .then(function(directory) {
                                $scope.buildBreadcrumb();
                                $scope.addPaths(directory);
                                $scope.initialDataLoaded = true;
                            }, function(error) {
                                growl.error(error);
                                $scope.initialDataLoaded = true;
                            });

                    };

                    $scope.init();
                }
            ]
        );

        return controller;
    }
);