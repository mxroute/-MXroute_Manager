/*
# base/frontend/manager/mail/pops/views/defaultAccount.js Copyright(c) 2017 cPanel, Inc.
#                                                                         All rights Reserved.
# copyright@cpanel.net                                                       http://cpanel.net
# This code is subject to the cPanel license.               Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular",
    ],
    function(angular) {

        var app = angular.module("cpanel.mail.Pops");

        app.controller("defaultAccountCtrl",
            ["$scope", "growl", "emailAccountsService",
                function($scope, growl, emailAccountsService) {
                    emailAccountsService.getDefaultAccountUsage().then(
                        function(data) {
                            $scope.defaultAccountDiskUsed = data;
                        },
                        function(error) {
                            growl.error(error);
                        }
                    );
                }]
        );

    }
);