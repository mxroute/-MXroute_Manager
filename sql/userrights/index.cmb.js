/*
# base/frontend/manager/sql/userrights/index.js
#                                                 Copyright(c) 2016 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false */


define(
    'app/index',[
        "angular",
        "lodash",
        "cjt/util/locale",
        "cjt/io/uapi-request",
        "cjt/io/uapi",  //preload
        "cjt/modules",
        "cjt/directives/formWaiting",
        "cjt/decorators/growlAPIReporter",
        "uiBootstrap",
        "cjt/services/APICatcher",
    ],
    function(angular, _, LOCALE, APIREQUEST) {
        "use strict";

        return function() {
            // First create the application
            var app = angular.module("App", [
                "cjt2.cpanel",
                "cjt2.decorators.growlAPIReporter",
                "ui.bootstrap",
            ]);

            var content_el = angular.element("#ng_content")[0];
            if (!content_el) {
                throw "Need #ng_content!";
            }

            app.controller("BaseController", [
                "$rootScope",
                "$scope",
                "APICatcher",
                "growl",
                function($rootScope, $scope, api, growl) {
                    angular.extend(
                        $scope,
                        {
                            save_privs: function save_privs(ng_form) {

                                //HACK ..
                                var the_form = document.forms[ng_form.$name];

                                var privs_str;
                                if (the_form.ALL.checked) {
                                    privs_str = "ALL";
                                }
                                else {
                                    privs_str = "";
                                    var privs = [].slice.call(the_form.privileges);
                                    for (var p=0; p<privs.length; p++) {
                                        if (privs[p].checked) {
                                            privs_str += "," + privs[p].value;
                                        }
                                    }

                                    privs_str = privs_str.replace(/^,/,"");
                                }

                                var apicall = new APIREQUEST.Class().initialize(
                                    "Mysql",
                                    "set_privileges_on_database",
                                    {
                                        user: CPANEL.PAGE.username,
                                        database: CPANEL.PAGE.dbname,
                                        privileges: privs_str
                                    }
                                );

                                return api.promise(apicall).then( function(resp) {
                                    var els = [].slice.call(the_form.elements);

                                    //So that a reset() will now treat the
                                    //saved values as default.
                                    for (var e=0; e<els.length; e++) {
                                        if (els[e].type === "checkbox") {
                                            els[e].defaultChecked = els[e].checked;
                                        }
                                    }

                                    growl.success( LOCALE.maketext("You saved “[_1]”’s privileges on the database “[_2]”.", _.escape(CPANEL.PAGE.username), _.escape(CPANEL.PAGE.dbname)) );
                                } );
                            },
                        }
                    );
                },
            ] );

            angular.bootstrap( content_el, ["App"] );

            return app;
        };
    }
);

