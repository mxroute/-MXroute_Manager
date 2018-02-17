/*
# base/frontend/manager/mail/pops/validators/emailAccountMinQuota.js Copyright(c) 2017 cPanel, Inc.
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
         * Directive that checks an input field for a minimum value, but only if another field is not set to unlimited
         * @attribute {Integer} emailMinQuota  - The minimum value allowed for the field
         * @attribute {String}  emailQuotaType - A string indicating the other form field to check for the "unlimited" value
         *
         * @example
         * <form name="formName">
         *     <div>
         *          <input id="userdefinedquota" type="radio" name="quotaType" value="userdefined">
         *          <input type="number" name="quota" email-min-quota="0" email-quota-type="formName.quotaType">
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

        module.directive("emailMinQuota", function () {
            return {
                require: "ngModel",
                restrict: "A",
                link: function ( scope, element, attrs, ngModel ) { // eslint-disable-line no-unused-vars

                    ngModel.$validators.emailMinQuota = function(model, view) { // eslint-disable-line no-unused-vars

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
                            else if( isNaN(view) ) {
                                // Value is not a number, let the numeric validator handle it
                                return true;
                            }
                            else {
                                var minQuota = parseInt(attrs.emailMinQuota, 10);
                                return view >= minQuota;
                            }
                        }
                        else {
                            return true;
                        }

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