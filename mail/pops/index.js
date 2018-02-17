/*
* mail/pops/index.js                              Copyright(c) 2017 cPanel, Inc.
*                                                           All rights Reserved.
* copyright@cpanel.net                                         http://cpanel.net
* This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global require: false, define: false, PAGE: false */

define(
    [
        "angular",
        "cjt/modules",
        "jquery-chosen",
        "angular-chosen"
        // "ngRoute"
    ],
    function(angular) {
        return function() {
            // First create the application
            angular.module("cpanel.mail.Pops", [
                "angular-growl",
                "cjt2.cpanel",
                "cjt2.services.api",
                "cjt2.views.applicationController",
                "ngAnimate",
                "localytics.directives"
            ]);

            // Then load the application dependencies
            var app = require([
                "cjt/bootstrap",
                "app/services/emailAccountsService",
                "app/filters/emailLocaleString",
                "app/filters/encodeURIComponent",
                "app/filters/incomingSuspendedTooltip",
                "app/filters/landingPageHref",
                "app/filters/loginIncomingHref",
                "app/filters/loginIncomingText",
                "app/filters/loginIncomingTooltip",
                "app/filters/loginSuspendedTooltip",
                "app/filters/quotaProgressType",
                "app/views/listEmailAccounts",
                "app/views/addEmailAccount",
                "app/views/configurationOptions",
                "app/views/defaultAccount"
            ], function(BOOTSTRAP) {

                var app = angular.module("cpanel.mail.Pops");

                app.config(["$animateProvider", function($animateProvider) {
                    $animateProvider.classNameFilter(/(action-module|disappearing-table-row)/);
                }]);

                // TODO: Refactor into tabs and update Selenium tests
                // app.config(["$routeProvider",
                //     function($routeProvider) {

                //         if( !window.PAGE.accountsAreMaxed ) {
                //             $routeProvider.when("/addEmailAccount", {
                //                 controller: "addEmailAccountCtrl",
                //                 templateUrl: CJT.buildFullPath("mail/pops/views/addEmailAccount.ptt")
                //             });
                //         }

                //         $routeProvider.when("/listEmailAccounts", {
                //             controller: "listEmailAccountsCtrl",
                //             templateUrl: CJT.buildFullPath("mail/pops/views/listEmailAccounts.ptt")
                //         });

                //         if( window.PAGE.defaultAccountEnabled ) {
                //             $routeProvider.when("/defaultAccount", {
                //                 controller: "defaultAccountCtrl",
                //                 templateUrl: CJT.buildFullPath("mail/pops/views/defaultAccount.ptt")
                //             });
                //         }

                //         if( window.PAGE.showConfigSection ) {
                //             $routeProvider.when("/configurationOptions", {
                //                 controller: "configurationOptionsCtrl",
                //                 templateUrl: CJT.buildFullPath("mail/pops/views/configurationOptions.ptt")
                //             });
                //         }

                //     }
                // ]);

                // var tabs = {
                //     "/addEmailAccount": 0,
                //     "/listEmailAccounts": 1,
                //     "/defaultAccount": 2,
                //     "/configurationOptions": 3
                // };

                app.controller("baseController",
                    ["$scope",
                        function($scope) {

                            $scope.pageTabs = [];
                            $scope.loading = true;
                            $scope.activeTab = -1;
                            $scope.mailAccountsCount = PAGE.mailAccountsCount;
                            $scope.showAddAccount = !window.PAGE.accountsAreMaxed;
                            $scope.showDefaultAccount = window.PAGE.defaultAccountEnabled;
                            $scope.showConfigSection = window.PAGE.showConfigSection;

                            // TODO: Refactor into tabs and update Selenium tests
                            // $rootScope.$on("$routeChangeStart", function() {
                            //     $scope.loading = true;
                            // });

                            // $rootScope.$on("$routeChangeSuccess", function() {
                            //     $scope.loading = false;
                            //     $scope.activeTab = tabs[$location.path()];
                            // });

                            // $rootScope.$on("$routeChangeError", function() {
                            //     $scope.loading = false;
                            // });

                            // $scope.go = function(path) {

                            //     if( path === "" ) {
                            //         path = $scope.mailAccountsCount == 0 && $scope.showAddAccount ? "/addEmailAccount" : "/listEmailAccounts";
                            //     }

                            //     $location.path(path);
                            //     $scope.activeTab = tabs[path];
                            // }

                            // $scope.go($location.path());
                        }]
                );

                app.animation(".action-module", ["$animateCss", function($animateCss) {
                    return {
                        enter: function(elem, done) {
                            var height = elem[0].offsetHeight;
                            return $animateCss(elem, {
                                from: { height: "0" },
                                to: { height: height + "px" },
                                duration: 0.3,
                                easing: "ease-out",
                                event: "enter",
                                structural: true
                            })
                                .start()
                                .done(function() {
                                    elem[0].style.height = "";
                                    done();
                                });
                        },
                        leave: function(elem, done) {
                            var height = elem[0].offsetHeight;
                            return $animateCss(elem, {
                                event: "leave",
                                structural: true,
                                from: { height: height + "px" },
                                to: { height: "0" },
                                duration: 0.3,
                                easing: "ease-out",
                            })
                                .start()
                                .done(function() {
                                    done();
                                });
                        },
                    };
                }]);

                BOOTSTRAP("#body-content", "cpanel.mail.Pops");
            });

            return app;
        };
    }
);
