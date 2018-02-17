/*
# base/frontend/manager/mail/pops/validators/emailAccountMaxQuota.js Copyright(c) 2017 cPanel, Inc.
#                                                                                    All rights Reserved.
# copyright@cpanel.net                                                                  http://cpanel.net
# This code is subject to the cPanel license.                          Unauthorized copying is prohibited
*/

/* global define: false */

define(
    [
        "angular"
    ],
    function(angular) {

        /**
         * Directive that checks an input[type="number"] field for a positive integer, but only if another field is not set to unlimited
         * @attribute {String}  emailQuotaType - A string indicating the other form field to check for the "unlimited" value
         *
         * @example
         * <form name="formName">
         *     <div>
         *          <input id="userdefinedquota" type="radio" name="quotaType" value="userdefined">
         *          <input type="text" name="quota" email-numeric-quota email-quota-type="formName.quotaType">
         *          <span>MB</span>
         *     </div>
         *     <div>
         *         <input id="unlimitedquota" type="radio" name="quotaType" value="unlimited">
         *         <label for="unlimitedquota">Unlimited</label>
         *     </div>
         * </form>
         */

        var module;
        try {
            module = angular.module("cpanel.mail.Pops");
        }
        catch(e) {
            module = angular.module("cpanel.mail.Pops", []);
        }

        module.directive("emailNumericQuota", function () {
            return {
                require: "ngModel",
                restrict: "A",
                priority: 2,
                link: function ( scope, element, attrs, ngModel ) { // eslint-disable-line no-unused-vars

                    var testViewValue = function(view, testFunc) {

                        var quotaTypeModel = getNgOtherModel();
                        if( !quotaTypeModel ) {
                            return true;
                        }

                        var otherIsEmpty = quotaTypeModel.$isEmpty(quotaTypeModel.$viewValue);
                        if( otherIsEmpty ) {
                            // Somehow they deselected the radio button, skip this validation
                            return true;
                        }

                        if( quotaTypeModel.$viewValue !== "unlimited" ) {
                            if( ngModel.$isEmpty(view) ) {
                                // We have no value, skip this validation and let required take care of it
                                return true;
                            }
                            else {
                                return testFunc(view);
                            }
                        }
                        else {
                            return true;
                        }

                    };

                    ngModel.$validators.number = function(model, view) { // eslint-disable-line no-unused-vars

                        return testViewValue(view, function(view) {
                            return !isNaN(view);
                        });

                    };

                    ngModel.$validators.positiveInteger = function(model, view) { // eslint-disable-line no-unused-vars

                        return testViewValue(view, function(view) {

                            if( isNaN(view) ) {
                                // Ignore the NaN and let that be processed by the 'number' validator above
                                // This is because we display a different error message for that context
                                return true;
                            }
                            else {
                                var parsed = new Number(view);
                                // In this case, we really just want to compare value, not type
                                // eslint-disable-next-line eqeqeq
                                return parsed == parsed.toFixed(0);
                            }

                        });

                    };

                    scope.$watchGroup([
                        function() {
                            var ngOtherModel = getNgOtherModel();
                            return ngOtherModel && ngOtherModel.$viewValue;
                        },
                        function() {
                            var ngOtherModel = getNgOtherModel();
                            return ngOtherModel && ngOtherModel.$modelValue;
                        }
                    ], function() {
                        ngModel.$validate();
                    });

                    var _ngOtherModel;
                    function getNgOtherModel() {
                        if(!_ngOtherModel) {
                            _ngOtherModel = scope.$eval(attrs.emailQuotaType);
                        }
                        return _ngOtherModel;
                    }

                }
            };
        });

    }
);