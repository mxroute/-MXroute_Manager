/*
# backup_restoration/test/services/backupAPI.spec.js Copyright 2017 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false, describe: false, it: false, module: false, inject: false, beforeEach: false, expect: false, spyOn: false */

define([
        "ngMocks",
        "backup_restoration/services/backupAPI"
    ],
    function() {
        "use strict";

        describe("File Backups List Service", function() {
            var backupAPIService, q, $scope;

            beforeEach(function() {
                module("cjt2.services.api");
                module("App");
                inject(function($injector) {
                    backupAPIService = $injector.get("backupAPIService");
                    q = $injector.get("$q");
                    $scope = $injector.get("$rootScope").$new();
                });
                $scope.$digest();
            });

            function testApiSuccess(apiCall, args, testResponse, done) {
                backupAPIService[apiCall].apply(backupAPIService, args)
                    .then(function(data) {
                        expect(data).toEqual(testResponse);
                        if (typeof done !== "undefined") {
                            done();
                        }
                    });

                $scope.$digest();
            }

            function testApiFailure(apiCall, params, done) {
                var fakeError = {
                    errors: ["Your API response has an error."]
                };

                var spy = spyOn(backupAPIService, "deferred");
                spy.and.callFake(function() {
                    return {
                        promise: q.reject(fakeError)
                    };
                });

                backupAPIService[apiCall].apply(backupAPIService, params)
                    .catch(function(error) {
                        expect(error).toEqual(fakeError);
                        done();
                    });

                $scope.$digest();
            }

            describe("listDirectory", function() {

                it("should return an array of objects when root (/) is the path", function(done) {

                    var testResponse = [{
                        conflict: 0,
                        exists: 1,
                        name: "mock1",
                        onDiskType: "file",
                        type: "file"
                    }, {
                        conflict: 0,
                        exists: 1,
                        name: "mock2",
                        onDiskType: "dir",
                        type: "dir"
                    }];
                    var path = "/";

                    var spy = spyOn(backupAPIService, "deferred");
                    spy.and.callFake(function() {
                        return {
                            promise: q.when(testResponse)
                        };
                    });

                    testApiSuccess("listDirectory", [path], testResponse, done);
                    expect(testResponse).toBeArrayOfObjects();
                    done();
                });


                it("should return an array of objects when passed a nested directory path", function(done) {

                    var testResponse = [{
                        conflict: 0,
                        exists: 1,
                        name: "mock3",
                        onDiskType: "file",
                        type: "file"
                    }, {
                        conflict: 0,
                        exists: 1,
                        name: "mock4",
                        onDiskType: "dir",
                        type: "dir"
                    }];

                    var path = "/test1/test2/";

                    var spy = spyOn(backupAPIService, "deferred");
                    spy.and.callFake(function() {
                        return {
                            promise: q.when(testResponse)
                        };
                    });
                    testApiSuccess("listDirectory", [path], testResponse, done);
                    expect(testResponse).toBeArrayOfObjects();
                    done();
                });

                it("should catch an error when given an invalid file path string", function(done) {
                    var path1 = "/test1/test2", // missing required trailing slash
                        path2 = "test1/test2/"; // missing required leading slash

                    testApiFailure("listDirectory", [path1], done);
                    testApiFailure("listDirectory", [path2], done);
                    testApiFailure("listDirectory", [], done);
                    done();
                });
            });

            describe("listFileBackups", function() {

                it("should return an array of objects when passed an existing file path", function(done) {
                    var testResponse = [{
                        backupDate: "2017-09-02",
                        backupId: "2017-09-02",
                        backupType: "incremental",
                        fileSize: 0,
                        fullpath: "/test1/test2/test3/mock5.html",
                        modifiedDate: "2017-08-22 15:49",
                        type: "file"
                    }, {
                        backupDate: "2017-09-03",
                        backupID: "2017-09-03",
                        backupType: "incremental",
                        fileSize: 0,
                        fullpath: "/test1/test2/test3/mock5.html",
                        modifiedDate: "2017-08-22 15:49",
                        type: "file"
                    }];

                    var fullPath = "/test1/test2/test3/mock5.html";

                    var spy = spyOn(backupAPIService, "deferred");
                    spy.and.callFake(function() {
                        return {
                            promise: q.when(testResponse)
                        };
                    });

                    testApiSuccess("listFileBackups", [fullPath], testResponse, done);
                    expect(testResponse).toBeArrayOfObjects();
                });

                it("should return an empty array when passed a non-existant file path", function(done) {
                    var testResponse = [];

                    var fullPath = "/test1/test2/test3/mock6.html";

                    var spy = spyOn(backupAPIService, "deferred");
                    spy.and.callFake(function() {
                        return {
                            promise: q.when(testResponse)
                        };
                    });

                    testApiSuccess("listFileBackups", [fullPath], testResponse, done);
                    expect(testResponse).toBeEmptyArray();
                });

                it("should catch an error when given an invalid file path string", function(done) {
                    var path1 = "test1/test2/mock7.html", // missing required leading slash
                        path2 = "test1/test2/mock8.html"; //  trailing slash should not be included

                    testApiFailure("listFileBackups", [path1], done);
                    testApiFailure("listFileBackups", [path2], done);
                    testApiFailure("listFileBackups", [], done);
                });

            });

            describe("restore", function() {

                it("should return an object indicating success when a file has been successfully restored", function(done) {
                    var testResponse = {
                        success: 1
                    };

                    var testFullPath = "/test1/test2/mock9.html",
                        testBackupPath = "/backup/2017-09-02",
                        testOverwrite = 1;

                    var spy = spyOn(backupAPIService, "deferred");

                    spy.and.callFake(function() {
                        return {
                            promise: q.when(testResponse)
                        };
                    });
                    testApiSuccess("restore", [testFullPath, testBackupPath, testOverwrite], testResponse, done);
                });

                it("should catch an error when the file exists and overwite is set to 0", function(done) {
                    var testFullPath = "/test1/test2/mock10.html",
                        testBackupPath = "/backup/2017-09-02",
                        testOverwrite = 0;

                    testApiFailure("restore", [testFullPath, testBackupPath, testOverwrite], done);
                });

                it("should catch an error when an invalid backup path is given", function(done) {
                    var testFullPath = "/test1/test2/mock11.html",
                        testBackupPath = "/backup/3017-09-02",
                        testOverwrite = 1;

                    testApiFailure("restore", [testFullPath, testBackupPath, testOverwrite], done);
                });

                it("should catch an error when an invalid file path is given", function(done) {
                    var testFullPath = "/test1/test2/mock12.html",
                        testBackupPath = "/backup/2017-09-02",
                        testOverwrite = 0;

                    testApiFailure("restore", [testFullPath, testBackupPath, testOverwrite], done);
                });
            });
        });
    }
);