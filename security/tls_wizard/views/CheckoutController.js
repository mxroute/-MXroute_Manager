/*
* base/frontend/manager/security/tls_wizard/views/CheckoutController.js
*                                                 Copyright(c) 2016 cPanel, Inc.
*                                                           All rights reserved.
* copyright@cpanel.net                                         http://cpanel.net
* This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* global define: false */
/* jshint -W100 */

// Then load the application dependencies


define(
    [
        "lodash",
        "angular",
        "jquery",
        "cjt/util/locale",
        "cjt/util/query",
        "app/views/Certificate",
        "cjt/modules",
        "app/services/CertificatesService",
        "app/services/LocationService",
        "cjt/directives/spinnerDirective",
        "cjt/decorators/growlDecorator",
        "uiBootstrap",
    ],
    function(_, angular, $, LOCALE, QUERY) {
        "use strict";

        var app = angular.module("App");

        function CheckoutController($scope, $controller, $location, $filter, $routeParams, $window, $timeout, CertificatesService, spinnerAPI, growl, $q, $modal, $log, Certificate, LocationService) {

            var steps = {
                "cPStore": ["login", "send_cart_items", "checkout", "payment_callback", "checkout_complete"],
                "default": ["login", "send_cart_items", "checkout", "payment_callback", "checkout_complete"]
            };
            $scope.pending_certificates = CertificatesService.get_pending_certificates();
            $scope.LOCALE = LOCALE;
            $scope.purchase_steps = [];
            $scope.current_step = -1;
            $scope.start_step = null;
            $scope.providers = [];
            $scope.certificates_count = 0;
            $scope.steps = [];

            $scope.html_escape = _.escape.bind(_);

            $scope.get_step_classes = function(provider, step) {
                var steps = $scope.get_steps(provider.name).length;
                var step_index = $scope.get_step_index(provider.name, step);
                var cols = Math.floor(12 / steps);
                var classes = ["col-xs-12", "col-sm-12", "col-md-" + cols, "col-lg-" + cols, "checkout-step"];
                if ($scope.current_step_index === step_index) {
                    classes.push("checkout-step-current");
                    if ("checkout_complete" === step) {
                        classes.push("checkout-step-completed");
                    }
                } else if ($scope.current_step_index > step_index) {
                    classes.push("checkout-step-completed");
                }

                return classes;
            };

            $scope.cert_count_title = function() {
                return LOCALE.maketext("Purchasing [quant,_1,certificate,certificates] …", $scope.certificates_count);
            };

            $scope.get_purchases_title = function(provider) {
                return LOCALE.maketext("Completing [numerate,_2,purchase,purchases] for the “[_1]” provider …", $scope.html_escape(provider.display_name), provider.certificates.length);
            };

            $scope.sending_items_msg = function() {
                return LOCALE.maketext("Sending your [numerate,_1,item,items] to the store cart …", $scope.certificates_count);
            };

            $scope.starting_polling_msg = function() {
                return LOCALE.maketext("Starting background polling for the [numerate,_1,certificate,certificates]. The system will download and install the [numerate,_1,certificate,certificates] when available.", $scope.certificates_count);
            };

            $scope.get_provider_by_name = function(name) {
                for (var i = 0; i < $scope.providers.length; i++) {
                    if ($scope.providers[i].name === name) {
                        return $scope.providers[i];
                    }
                }
            };

            $scope.get_steps = function(provider_name) {
                if (steps[provider_name]) {
                    return steps[provider_name];
                }
                return steps["default"];
            };

            $scope.get_current_step = function() {
                return $scope.steps[$scope.current_step_index];
            };

            $scope.get_step_index = function(provider_name, step) {
                for (var i = 0; i < $scope.steps.length; i++) {
                    if ($scope.steps[i].provider === provider_name && $scope.steps[i].step === step) {
                        return i;
                    }
                }
                return 0;
            };

            $scope.get_step_url = function(step) {
                return "/" + encodeURIComponent(step.provider) + "/" + encodeURIComponent(step.step);
            };

            $scope.get_next_step = function() {
                if ($scope.current_step_index + 1 < $scope.steps.length) {
                    return $scope.steps[$scope.current_step_index + 1];
                }
            };

            $scope.get_param = function(key) {
                return QUERY.parse_query_string(location.search.replace(/^\?/, ""))[key] || $routeParams[key];
            };

            $scope.require_params = function(keys) {
                var bad_keys = [];
                var too_many_keys = [];
                angular.forEach(keys, function(key) {
                    var value = $scope.get_param(key);
                    if (!value) {
                        bad_keys.push(key);
                    } else if (value instanceof Array) {
                        too_many_keys.push(key);
                    }
                });

                if (bad_keys.length) {
                    growl.error(LOCALE.maketext("The following [numerate,_1,parameter is,parameters are] required but [numerate,_1,does,do] not appear in the [asis,URL]: [list_and_quoted,_2]", bad_keys.length, bad_keys));
                }

                if (too_many_keys.length) {
                    growl.error(LOCALE.maketext("The following [numerate,_1,parameter appears,parameters appear] more than once in the [asis,URL]: [list_and_quoted,_2]", too_many_keys.length, too_many_keys));
                }

                return bad_keys.length || too_many_keys.length ? false : true;
            };

            $scope.in_debug_mode = false;

            $scope.get_route_url = function() {
                var route_url = "";
                route_url += $location.absUrl().replace(/tls_wizard\/.+/, "tls_wizard/#/purchase");
                return route_url;
            };

            function _pem_to_base64(pem) {
                return pem
                    .replace(/^\s*-\S+/, "")
                    .replace(/-\S+\s*$/, "")
                    .replace(/\s+/g, "");
            }

            //$q.all() will reject the “aggregate” promise with the
            //exact same value as the one that failed. That’s not good
            //enough; we also need to know which promise failed in addition
            //to why it failed.
            //
            //This transforms all failure callback payloads into 2-member
            //arrays:   [ <promise_index>, <payload> ]
            //
            //So, if you do:
            //  _q_all_with_err_index( [ prA, prB, prC ] )
            //
            //...and “prB” fails with the string "hahaha", the
            //failure callback will receive [ 1, "hahaha" ].
            //
            //TODO: Consider making this a reusable component, along with
            //altered logic that, in the event of failure, will wait to see
            //if more of the promises fail and actually indicate what each
            //promise did.
            //
            function _q_all_with_err_index(promises_array) {
                if (!(promises_array instanceof Array)) {
                    throw "Only arrays here!";
                }

                return $q.all(promises_array.map(function(p, i) {
                    return $q(function(resolve, reject) {
                        p.then(
                            resolve,
                            function(payload) {
                                reject([i, payload]);
                            }
                        );
                    });
                }));
            }

            $scope.dismiss_modal = function() {
                this.modal.dismiss();
            };

            $scope.go_to_purchase_page = LocationService.go_to_last_create_route;

            $scope.go_to_login = function() {
                this.go_step(this.get_current_step().provider, "login");
            };

            $scope.do_current_step = function() {
                var step = $scope.get_current_step();

                if (!step) {
                    // something is severely wrong
                    // maybe they hit the back button a lot for some random reason.
                    // let's send them back somewhere safe.
                    LocationService.go_to_last_create_route();
                    return;
                }

                var next_step = $scope.get_next_step();
                var order_id = $scope.get_param("order_id");
                var login_code = $scope.get_param("code");
                var order = CertificatesService.get_order_by_id(order_id);
                var order_status = $scope.get_param("order_status");
                var provider = $scope.get_provider_by_name(step.provider);
                var access_token = $scope.get_param("access_token");
                var ret_url;

                if (step.step === "login") {
                    ret_url = $scope.get_route_url() + $scope.get_step_url(step);
                    if (order) {
                        ret_url += "?order_id=" + order.order_id;
                    }
                    if (login_code) {
                        /* Back from Login, Verify It */
                        CertificatesService.verify_login_token(step.provider, login_code, ret_url).then(function(result) {
                            if (order) {
                                /* there's an order, so don't create another one */
                                $scope.go_step(step.provider, "checkout", {
                                    order_id: order.order_id,
                                    access_token: result.data.access_token
                                });
                            } else {
                                /* no order, so create one */
                                $scope.go_step(step.provider, "send_cart_items", {
                                    access_token: result.data.access_token
                                });
                            }
                        }, function(error_html) {
                            $scope.return_to_wizard();
                            growl.error(LOCALE.maketext("The system encountered an error as it attempted to verify the login token: [_1]", error_html) + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                        });
                    } else {
                        /* There's no login code */
                        CertificatesService.get_store_login_url(step.provider, ret_url).then(function(result) {
                            $window.location.href = result.data;
                        }, function(error_html) {
                            $scope.return_to_wizard();
                            growl.error(LOCALE.maketext("The system encountered an error as it attempted to get the store login [output,abbr,URL,Uniform Resource Location]: [_1]", error_html) + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                        });
                    }
                } else if (step.step === "send_cart_items") {
                    /* create order / build cart */
                    if (!$scope.require_params(["access_token"])) {
                        return;
                    }
                    ret_url = $scope.get_route_url() + $scope.get_step_url(next_step);
                    return CertificatesService.request_certificates(step.provider, access_token, provider.certificates).then(function(result) {
                        var order = result.data;
                        order.order_id = order.order_id.toString();

                        CertificatesService.add_order(order);
                        CertificatesService.save();

                        $scope.go_step(step.provider, "checkout", {
                            order_id: order.order_id,
                            access_token: access_token
                        });
                    }, function(error_html) {
                        $scope.return_to_wizard();
                        growl.error(LOCALE.maketext("The system encountered an error as it attempted to request the [asis,SSL] [numerate,_2,certificate,certificates]: [_1]", error_html, $scope.get_provider_by_name(step.provider).certificates.length) + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                    });
                } else if (step.step === "checkout") {
                    if (!$scope.require_params(["order_id"])) {
                        return;
                    }
                    ret_url = $scope.get_route_url() + $scope.get_step_url(step);
                    if (order_status) {
                        /* are we back from checking out? */
                        $scope.go_step(step.provider, "payment_callback", {
                            order_id: order.order_id,
                            order_status: order_status
                        });
                    } else {
                        if (!$scope.require_params(["access_token"])) {
                            return;
                        }
                        /* no? let's update the checkout url and head to checkout */
                        CertificatesService.set_url_after_checkout(step.provider, access_token, order.order_id, ret_url).then(function() {
                            $window.location.href = order.checkout_url;
                        }, function(response) { //NB: the argument is *not* the error!
                            var is_other_user = response.data && response.data.error_type === "OrderNotFound";

                            if (is_other_user) {
                                $scope.order_id = order.order_id;
                                $scope.provider = $scope.get_provider_by_name(step.provider);

                                $scope.modal = $modal.open({
                                    template: document.getElementById("user-mismatch-modal").text,
                                    scope: $scope,
                                    backdrop: "static",
                                    animation: false,
                                    size: "sm"
                                });
                            } else {
                                LocationService.go_to_last_create_route();
                                growl.error(LOCALE.maketext("The system encountered an error as it attempted to set the [asis,URL] after checkout: [_1]", _.escape(response.error)) + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                            }

                        });
                    }
                } else if (step.step === "payment_callback") {
                    /* post checkout processing */
                    CPANEL.PAGE.pending_certificates = null;
                    CPANEL.PAGE.installed_hosts = null;
                    if (order_status === "success") {
                        growl.success(LOCALE.maketext("You have successfully completed your certificate order (order ID “[_1]”). If you need help with this order, use the support [numerate,_2,link,links] below.", _.escape(order_id), order.certificates.length));

                        CertificatesService.set_confirmed_status_for_ssl_certificates(step.provider, order).then(function() {
                            // successful
                            $scope.go_step(step.provider, next_step.step);
                        }, function(response) {

                            //This is here to accommodate cases where the certificate
                            //becomes available, and gets installed, prior to the
                            //browser’s being able to set the certificate to “confirmed”.
                            //When that happens, we get back a data structure that
                            //describes which vhosts’ pending queue entries didn’t exist;
                            //we then do what can be done to ensure that the cert(s)
                            //is/are installed where it/they should be.
                            //
                            if (response.data && response.data.error_type === "EntryDoesNotExist") {
                                var not_found = response.data.order_item_ids;

                                var msg = LOCALE.maketext("There are no pending certificates from “[_1]” with the following order item [numerate,_2,ID,IDs]: [join,~, ,_3]. The system will now verify that the [numerate,_2,certificate has,certificates have] been issued and installed.", _.escape(step.provider), not_found.length, not_found.map(_.escape.bind(_)));

                                growl.info(msg);

                                var certificates = provider.certificates;

                                not_found.forEach(function(oiid) {

                                    //Fetch the new SSL cert.
                                    var provider_promise = CertificatesService.get_ssl_certificate_if_available(step.provider, oiid);

                                    //There will only be one vhost
                                    //per certificate for now, but with
                                    //wildcard support that could change.
                                    certificates.forEach(function(cert) {

                                        cert.get_virtual_hosts().forEach(function(vhost_name) {
                                            var domain = cert.get_domains().filter(function(domain) {
                                                return domain.virtual_host === vhost_name;
                                            }).pop().domain;

                                            var big_p = _q_all_with_err_index([
                                                CertificatesService.get_installed_ssl_for_domain(),
                                                provider_promise
                                            ]);

                                            big_p.then(function yay(responses) {
                                                    var installed_pem = responses[0].data.certificate.text;
                                                    var installed_b64;

                                                    if (installed_pem) {
                                                        installed_b64 = _pem_to_base64(installed_pem);
                                                    }

                                                    var provider_pem = responses[1].data.certificate_pem;
                                                    var provider_b64;
                                                    if (provider_pem) {
                                                        provider_b64 = _pem_to_base64(provider_pem);
                                                    } else {
                                                        var status_code = responses[1].data.status_code;

                                                        //There is ambiguity over the spelling of “canceled”.
                                                        if (/OrderCancell?ed/.test(status_code)) {
                                                            growl.error(LOCALE.maketext("“[_1]” indicated that the order with [asis,ID] “[_2]” has been canceled.", _.escape(step.provider), _.escape(order_id)));
                                                        } else if (/OrderItemCancell?ed/.test(status_code)) {
                                                            growl.error(LOCALE.maketext("“[_1]” indicated that the certificate with order item [asis,ID] “[_2]” has been canceled.", _.escape(step.provider), _.escape(oiid)));
                                                        } else {
                                                            growl.error(LOCALE.maketext("“[_1]” has not issued a certificate for order item [asis,ID] “[_2]”. Contact them for further assistance.", _.escape(step.provider), _.escape(oiid)));
                                                        }

                                                        //Since there’s no new certificate,
                                                        //there’s nothing more we can do.
                                                        LocationService.go_to_last_create_route();
                                                        return;
                                                    }

                                                    if (provider_b64 === installed_b64) {
                                                        //This is the most optimal outcome:
                                                        //we confirmed that the new cert is
                                                        //installed, as the user wanted.

                                                        growl.success(LOCALE.maketext("The system confirmed that the certificate for the website “[_1]” is installed.", _.escape(vhost_name)));

                                                        //We still want to reset and have them
                                                        //re-evaluate the rest of the order
                                                        //since we had something “unexpected” happen.
                                                        //(...right??...?)
                                                        LocationService.go_to_last_create_route();
                                                    } else {
                                                        //We’re here because there’s a new
                                                        //certificate, but it’s not installed.
                                                        //The user has asked for that installation,
                                                        //so let’s see if we can finish the job.

                                                        if (installed_b64) {
                                                            growl.info(LOCALE.maketext("“[_1]” has an [asis,SSL] certificate installed, but it is not the certificate that you just ordered (order item [asis,ID] “[_2]”). The system will now install this certificate.", _.escape(vhost_name), _.escape(oiid)));
                                                        } else {
                                                            var no_cert_msg;
                                                            no_cert_msg = LOCALE.maketext("You do not have an [asis,SSL] certificate installed for the website “[_1]”.", _.escape(vhost_name));

                                                            no_cert_msg += LOCALE.maketext("The system will now install the new certificate.");

                                                            growl.info(no_cert_msg);
                                                        }

                                                        CertificatesService.install_certificate(provider_pem, [domain]).then(
                                                            function yay() {
                                                                growl.success(LOCALE.maketext("The system installed the certificate onto the website “[_1]”.", _.escape(vhost_name)));
                                                            },
                                                            function nay(error_html) {
                                                                growl.error(LOCALE.maketext("The system failed to install the certificate onto the website “[_1]” because of the following error: [_2]", _.escape(vhost_name), error_html));
                                                            }
                                                        ).then(LocationService.go_to_last_create_route);
                                                    }

                                                },
                                                function onerror(idx_and_response) {
                                                    //We’re here because we failed either
                                                    //to fetch the new cert or to query
                                                    //the current SSL state.

                                                    var promise_i = idx_and_response[0];
                                                    var error_html = idx_and_response[1];

                                                    if (promise_i === 0) {
                                                        growl.error(LOCALE.maketext("The system failed to locate the installed [asis,SSL] certificate for the website “[_1]” because of the following error: [_2]", _.escape(vhost_name), error_html));
                                                    } else if (promise_i === 1) {
                                                        growl.error(LOCALE.maketext("The system failed to query “[_1]” for order item [asis,ID] “[_2]” ([_3]) because of the following error: [_4]", _.escape(step.provider), _.escape(oiid), _.escape(vhost_name), error_html));
                                                    } else {
                                                        //should never happen
                                                        growl.error("Unknown index: " + promise_i);
                                                    }

                                                    LocationService.go_to_last_create_route();
                                                });
                                        });
                                    });
                                });
                            } else {
                                var error_html = response.error;
                                growl.error(LOCALE.maketext("The system failed to begin polling for [quant,_2,new certificate,new certificates] because of an error: [_1]", error_html, $scope.certificates_count) + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                            }
                        });
                        // get info from local storage
                    } else {
                        if (order_status === "error") {
                            CertificatesService.reset();
                            CertificatesService.save();
                            $scope.return_to_wizard();
                            growl.error(LOCALE.maketext("The system encountered an error as it attempted to complete your transaction.") + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                        } else if (/^cancel?led$/.test(order_status)) { //cPStore gives two l’s
                            var order_item_ids = [];
                            angular.forEach(order.certificates, function(cert) {
                                order_item_ids.push(cert.order_item_id);
                            });
                            growl.warning(LOCALE.maketext("You seem to have canceled your transaction.") + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                            $location.url($location.path()); // clear out the params so we do not get a cancel on subsequent orders
                            CertificatesService.cancel_pending_ssl_certificates(step.provider, order_item_ids).then(function() {
                                /* need to clear old unused in page data to get a fresh load */
                                CertificatesService.reset();
                                CertificatesService.save();
                                $scope.return_to_wizard();
                            }, function(error_html) {
                                growl.error(LOCALE.maketext("The system encountered an error as it attempted to cancel your transaction: [_1]", error_html) + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                            });
                        }
                        return false;
                    }
                } else if (step.step === "checkout_complete") {
                    // go next step or to done page
                    if (!next_step) {
                        CertificatesService.reset();
                        CertificatesService.save();
                        //done
                        growl.success(LOCALE.maketext("The system has completed the [numerate,_1,purchase,purchases] and will begin to poll for your [numerate,_2,certificate,certificates].", $scope.providers.length, $scope.certificates_count));
                        $timeout($scope.go_to_pending, 1000);
                    }
                }
            };

            $scope.return_to_wizard = function() {
                var cur_url = $location.absUrl();
                // force reset for specific cases, use path redirect otherwise;
                // this allows us to not clear growl notifications if we don't have to.
                // could be replaced with replaceState if we ever get to IE11
                if ($scope.get_param("code")) {
                    var new_url = cur_url.replace(/([^#?]+\/).*/, "$1#" + LocationService.last_create_route());
                    $window.location.href = new_url;
                } else {
                    LocationService.go_to_last_create_route();
                }
            };

            $scope.check_step_success = function(step_index) {
                if (step_index < $scope.current_step_index) {
                    return true;
                }
            };

            $scope.go_step = function(provider, step, params) {
                $location.path("/purchase/" + provider + "/" + step + "/");

                if (params) {
                    $location.search(params);
                }
            };

            $scope.get_providers = function() {
                $scope.providers = [];

                var steps;
                $scope.purchasing_certs.forEach(function(cert) {
                    var product = cert.get_product();
                    var provider = $scope.get_provider_by_name(product.provider);
                    if (!provider) {
                        provider = {
                            name: product.provider,
                            display_name: product.provider_display_name || product.provider,
                            certificates: []
                        };
                        $scope.providers.push(provider);
                        steps = $scope.get_steps(provider.name);
                        angular.forEach(steps, function(step) {
                            $scope.steps.push({
                                provider: provider.name,
                                step: step
                            });
                        });
                    }
                    provider.certificates.push(cert);
                    $scope.certificates_count++;
                });

                return $scope.providers;
            };

            $scope.go_to_pending = function(order_item_id) {
                if (order_item_id) {
                    $location.path("/pending-certificates/" + order_item_id);
                } else {
                    $location.path("/pending-certificates");
                }
            };

            $scope.pending_certificate = function(virtual_host) {
                var result = false;
                angular.forEach($scope.pending_certificates, function(pcert) {
                    angular.forEach(pcert.vhost_names, function(vhost_name) {
                        if (vhost_name === virtual_host.display_name) {
                            result = pcert.order_item_id;
                        }
                    });
                });
                return result;
            };

            $scope.view_pending_certificate = function(virtual_host) {
                var order_item_id = $scope.pending_certificate(virtual_host);
                $scope.go_to_pending(order_item_id);
            };

            $scope.begin = function() {

                //Only the “Simple” screen populates this.
                $scope.purchasing_certs = CertificatesService.get_purchasing_certs();

                if ($scope.purchasing_certs.length === 0) {

                    //The “Advanced” screen goes here, as does a resumed checkout.
                    CertificatesService.get_virtual_hosts().filter( function(vhost) {
                        if (!vhost.has_selected_domains()) {
                            return false;
                        }
                        var product = vhost.get_product();
                        if (!product) {
                            $log.warn("has selected, but no product?");
                            return;
                        }
                        if (!CertificatesService.get_product_by_id(product.provider, product.id)) {
                            $log.warn("Unknown product!", product);
                            return;
                        }
                        return true;
                    }).forEach(function(virtual_host) {
                        var product = virtual_host.get_product();
                        var cert = new Certificate();
                        cert.set_product(product);
                        cert.set_price(virtual_host.get_price());
                        cert.set_domains(virtual_host.get_selected_domains());
                        cert.set_virtual_hosts([virtual_host.display_name]);

                        if (product.x_identity_verification) {
                            var id_ver = virtual_host.get_identity_verification();

                            //It’s ok if we don’t have the idver because
                            //that means we’re resuming a checkout, which
                            //means that the idver is already sent in, and
                            //the only reason we’re assembling cert/vhost/etc.
                            //is so that the controller can quantify the
                            //domains propertly in localization.
                            if (id_ver) {
                                cert.set_identity_verification(id_ver);
                            }
                        }

                        CertificatesService.add_new_certificate(cert);
                    });

                    $scope.purchasing_certs = CertificatesService.get_purchasing_certs();
                }

                $scope.get_providers();
                $scope.current_provider_name = $routeParams.provider;
                $scope.current_step_id = $routeParams.step;
                $scope.current_step_index = $scope.get_step_index($scope.current_provider_name, $scope.current_step_id);

                $scope.do_current_step();
                $timeout(function() {
                    _resizedWindow();
                }, 1);
            };

            $scope.init = function() {
                CertificatesService.restore();
                $scope.begin();
            };

            function _resizedWindow() {
                $(".checkout-step-inner").each(function(index, block) {
                    block = $(block);
                    var wrapper = block.find(".content-wrapper");
                    var padding = (block.height() - wrapper.height()) / 2;
                    wrapper.css("padding-top", padding);
                });
            }

            var window = angular.element($window);
            window.bind("resize", _resizedWindow);

            $scope.init();
        }

        app.controller("CheckoutController", ["$scope", "$controller", "$location", "$filter", "$routeParams", "$window", "$timeout", "CertificatesService", "spinnerAPI", "growl", "$q", "$uibModal", "$log", "Certificate", "LocationService", CheckoutController]);
    }
);
