/*
# base/frontend/manager/mail/pops/views/addEmailAccount.js Copyright(c) 2017 cPanel, Inc.
#                                                                          All rights Reserved.
# copyright@cpanel.net                                                        http://cpanel.net
# This code is subject to the cPanel license.                Unauthorized copying is prohibited
*/

/* global define: false, PAGE: false */

define(
    [
        "lodash",
        "angular",
        "cjt/util/locale",
        "uiBootstrap",
        "cjt/directives/actionButtonDirective",
        "cjt/directives/passwordFieldDirective",
        "cjt/directives/validateEqualsDirective",
        "cjt/directives/validationContainerDirective",
        "cjt/directives/validationItemDirective",
        "app/validators/emailAccountAllowedChars",
        "app/validators/emailAccountFullLength",
        "app/validators/emailAccountMaxQuota",
        "app/validators/emailAccountMinQuota",
        "app/validators/emailAccountNumericQuota",
        "app/validators/emailAccountSafePeriods"
    ],
    function(_, angular, LOCALE) {

        var app = angular.module("cpanel.mail.Pops");

        app.controller("addEmailAccountCtrl",
            ["$rootScope", "$scope", "emailAccountsService",
                function($rootScope, $scope, emailAccountsService) {

                    $scope.requiredPasswordStrength = PAGE.requiredPasswordStrength;
                    $scope.userDefinedDefaultQuota = PAGE.userDefinedQuotaDefaultValue;
                    $scope.defaultQuota = PAGE.userDefinedQuotaDefaultValue;
                    $scope.maxQuota = PAGE.maxEmailQuota;
                    $scope.mailDomains = _.map(PAGE.mailDomains, _.property("domain"));
                    $scope.creatingAccount = false;
                    $scope.isRTL = PAGE.isRTL;

                    $scope.emailAccount = {
                        account: undefined,
                        domain: $scope.mailDomains.length > 0 ? $scope.mailDomains[0] : undefined,
                        password: undefined,
                        password2: undefined,
                        quota: $scope.defaultQuota,
                        quotaType: PAGE.defaultQuotaSelected,
                        sendWelcome: true
                    };

                    $scope.clearStatus = function() {
                        $scope.status = undefined;
                    };

                    /**
                     * Click handler for the Create Account button, pulls account, password, domain, quota, and sendWelcome
                     * out of the scope and submits them to the addEmailAccount method on the emailAccountsService.
                     */
                    $scope.addEmailAccount = function() {

                        var formOrder = ["add_email_account", "add_email_domain", "add_email_password1", "add_email_password2", "quota"];

                        if( $scope.addEmailAccountForm.$invalid ) {
                            $scope.addEmailAccountForm.$setSubmitted();
                            var focused = false;

                            angular.forEach(formOrder, function(name) {
                                if( $scope.addEmailAccountForm[name] && $scope.addEmailAccountForm[name].$invalid ) {
                                    $scope.addEmailAccountForm[name].$setDirty();
                                    if( !focused ) {
                                        angular.element("[name='addEmailAccountForm'] [name='" + name + "']").focus();
                                        focused = true;
                                    }
                                }
                            });

                            return;
                        }

                        var newAccount = {
                            email: $scope.emailAccount.account,
                            password: $scope.emailAccount.password,
                            domain: $scope.emailAccount.domain,
                            send_welcome_email: $scope.emailAccount.sendWelcome ? 1 : 0,
                            quota: 0
                        };

                        if( $scope.emailAccount.quotaType === "userdefined" ) {
                            newAccount.quota = $scope.emailAccount.quota;
                        }

                        $scope.creatingAccount = true;
                        $scope.status = undefined;

                        return emailAccountsService.addEmailAccount(newAccount).then(
                            function(data) {
                                $scope.creatingAccount = false;

                                var created = data.replace("+", "@");
                                $scope.status = {
                                    type: "success",
                                    message: LOCALE.maketext("Account “[_1]” created.", created),
                                    closeable: true,
                                    autoClose: 10000
                                };

                                $scope.emailAccount = {
                                    account: undefined,
                                    domain: $scope.mailDomains.length > 0 ? $scope.mailDomains[0] : undefined,
                                    quota: $scope.defaultQuota,
                                    quotaType: PAGE.defaultQuotaSelected,
                                    sendWelcome: true
                                };

                                $scope.addEmailAccountForm.$setPristine();
                                $scope.addEmailAccountForm.$setUntouched();

                                $rootScope.$broadcast("emailAccountAdded");
                            },
                            function(error) {
                                $scope.status = {
                                    type: "danger",
                                    message: error
                                };
                                $scope.creatingAccount = false;
                            }
                        );
                    };

                }]
        );

    }
);