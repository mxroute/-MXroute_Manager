/*
base/frontend/manager/security/tls_wizard/services/HasIdVerMix.js
                                                  Copyright(c) 2016 cPanel, Inc.
                                                            All rights reserved.
copyright@cpanel.net                                           http://cpanel.net
This code is subject to the cPanel license.  Unauthorized copying is prohibited.
*/


/* global define: false */
/* jshint -W100 */
define(
    [
        "angular",
        "lodash",
    ],
    function(_) {
        "use strict";

        return angular.module("App").factory("HasIdVerMix", [
            "$log",
            function the_factory($log) {
                return {
                    set_identity_verification: function(identity_verification) {
                        if (typeof identity_verification !== "object") {
                            $log.error("bad idver", identity_verification);
                            throw new Error();
                        }

                        this.identity_verification = identity_verification;
                    },

                    get_identity_verification: function() {
                        return this.identity_verification;
                    },
                };
            },
        ]);
    }
);
