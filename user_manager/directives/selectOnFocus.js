/*
# user_manager/directives/selectOnFocus.js        Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/



/* global define: false */

define(
    [
        "angular",
    ],
    function(angular) {
        var module = angular.module("App");
        module.directive("selectOnFocus", [
            "$timeout",
            function ($timeout) {
                return {
                    restrict: "A",
                    link: function (scope, element, attrs) {
                        var focusedElement = null;

                        element.on("focus", function () {
                            var self = this;
                            if (focusedElement !== self) {
                                focusedElement = self;
                                $timeout(function () {
                                    if (self.select) {
                                        self.select();
                                    }
                                }, 10);
                            }
                        });

                        element.on("blur", function () {
                            focusedElement = null;
                        });
                    }
                };
            }
        ]);
    }
);