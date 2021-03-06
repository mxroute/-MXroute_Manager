/*
 * base/frontend/manager/security/tls_wizard/views/PendingCertificatesController.js
 *                                                 Copyright(c) 2015 cPanel, Inc.
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
        "cjt/util/locale",
        "app/views/Certificate",
        "cjt/modules",
        "cjt/directives/spinnerDirective",
        "app/services/CertificatesService",
        "app/services/LocationService",
        "cjt/directives/actionButtonDirective",
        "cjt/decorators/growlDecorator"
    ],
    function(_, angular, LOCALE) {
        "use strict";

        var app = angular.module("App");

        function PendingCertificatesController($scope, $location, $routeParams, $anchorScroll, $timeout, $window, CertificatesService, growl, LocationService, Certificate) {

            var provider_display_name = {};
            CPANEL.PAGE.products.forEach(function(p) {
                provider_display_name[p.provider] = p.provider_display_name;
            });

            $scope.show_introduction_block = CertificatesService.show_introduction_block;

            $scope.get_provider_display_name = function(provider) {
                return provider_display_name[provider] || provider;
            };

            $scope.html_escape = _.escape;

            $scope.get_time = function() {
                return parseInt(Date.now() / 1000, 10);
            };

            $scope.LOCALE = LOCALE;

            $scope.checking_pending_queue = false;

            //Needed pending fix of CPANEL-4645
            $scope.cjt1_LOCALE = window.LOCALE;

            $scope.pending_certificates = CertificatesService.get_pending_certificates();
            $scope.expanded_cert = null;

            $scope.get_product_by_id = function(provider_name, product_id) {
                return CertificatesService.get_product_by_id(provider_name, product_id);
            };

            $scope.get_cert_title = function(cert) {
                var sorted_domains = cert.domains.sort(function(a, b) {
                    if (a.length === b.length) {
                        return 0;
                    }
                    return a.length > b.length ? 1 : -1;
                });

                if (sorted_domains.length === 1) {
                    return sorted_domains[0];
                } else {
                    return LOCALE.maketext("“[_1]” and [quant,_2,other domain,other domains]", sorted_domains[0], sorted_domains.length - 1);
                }

            };

            $scope.check_pending_queue = function() {
                return CertificatesService.process_ssl_pending_queue().then(function(result) {

                    //----------------------------------------
                    //The intent here is to show at least one growl, always:
                    //
                    //  - growl (info) for each canceled cert
                    //
                    //  - growl (success) for each installed cert
                    //
                    //  - If we canceled nor installed any certificates,
                    //    growl (info) about no-op.
                    //----------------------------------------

                    var installed = [];
                    var canceled_count = 0;

                    result.data.forEach(function(oi) {
                        if (oi.installed) {
                            installed.push(oi);
                        } else {
                            /* jshint indent: false */
                            switch (oi.last_status_code) {
                                case "OrderCanceled":
                                case "OrderItemCanceled":
                                    canceled_count++;

                                    var provider_display_name = $scope.get_provider_display_name(oi.provider);

                                    var domains = oi.domains;
                                    if (domains.length === 1) {
                                        growl.info(LOCALE.maketext("“[_1]” reports that the certificate for “[_2]” has been canceled.", _.escape(provider_display_name), _.escape(domains[0])));
                                    } else {
                                        growl.info(LOCALE.maketext("“[_1]” reports that the certificate for “[_2]” and [quant,_3,other domain,other domains] has been canceled.", _.escape(provider_display_name), _.escape(domains[0]), domains.length - 1));
                                    }

                                    break;
                            }
                            /* jshint indent: 4 */
                        }
                    });

                    if (installed.length) {
                        var vhosts = [];

                        angular.forEach(installed, function(order_item) {
                            vhosts = vhosts.concat(order_item.vhost_names);
                        });
                        growl.success(LOCALE.maketext("[numerate,_2,A certificate,Certificates] for the following [numerate,_2,website was,websites were] available, and the system has installed [numerate,_2,it,them]: [list_and_quoted,_1]", vhosts, installed.length));
                    }

                    //We mentioned canceled and installed certificates earlier.
                    else if (!canceled_count) {
                        growl.info(LOCALE.maketext("The system processed the pending certificate queue successfully, but [numerate,_1,your pending certificate was not,none of your pending certificates were] available.", result.data.length));
                    }

                    return CertificatesService.fetch_pending_certificates().then(function() {
                        $scope.pending_certificates = CertificatesService.get_pending_certificates();
                        if ($scope.pending_certificates.length === 0) {
                            growl.info(LOCALE.maketext("You have no more pending [asis,SSL] certificates.") + " " + LOCALE.maketext("You will now return to the beginning of the wizard."));
                            CertificatesService.reset();
                            /* clear page-loaded domains and installed hosts to ensure we show the latests when we redirect to the purchase wizard */
                            CPANEL.PAGE.installed_hosts = null;
                            CPANEL.PAGE.domains = null;
                            $scope.get_new_certs();
                        } else {
                            $scope.prepare_pending_certificates();
                        }
                    });
                }, growl.error.bind(growl));

            };

            $scope.reset_and_create = function() {
                CertificatesService.hard_reset();
                $scope.get_new_certs();
            };

            $scope.get_new_certs = function() {
                LocationService.go_to_last_create_route().search("");
            };

            $scope.cancel_purchase = function(cert) {
                CertificatesService.cancel_pending_ssl_certificate_and_poll(cert.provider, cert.order_item_id).then(function(response) {
                    var payload = response.data[1].data;
                    var cert_pem = payload.certificate_pem;

                    var provider_html = _.escape($scope.get_provider_display_name(cert.provider));

                    if (cert_pem) {
                        //XXX Prompt to contact support?
                        //XXX use info rather than success?
                        growl.info(LOCALE.maketext("You have canceled this order, but “[_1]” already issued the certificate. The system will now install it. ([output,url,_2,Do you need help with this order?])", provider_html, cert.support_uri));
                        CertificatesService.install_certificate(
                            cert_pem,
                            cert.vhost_names
                        ).then(
                            function() {
                                growl.success(LOCALE.maketext("The system has installed the new [asis,SSL] certificate on to the [numerate,_1,website,websites] [list_and_quoted,_2].", cert.vhost_names.length, cert.vhost_names));
                            },
                            function(error_html) {
                                growl.error(LOCALE.maketext("The system failed to install the new [asis,SSL] certificate because of an error: [_1]", error_html));
                            }
                        );
                    } else if (payload.status_code === "RequiresApproval") {
                        growl.info(LOCALE.maketext("The system has canceled the request for this certificate; however, “[_1]” was already waiting on approval before processing your order. To ensure that this certificate order is canceled, you must [output,url,_2,contact support directly].", provider_html, cert.support_uri));
                    } else if (payload.status_code === "OrderCanceled") {
                        growl.info(LOCALE.maketext("This certificate’s order (ID “[_1]”) was already canceled directly via “[_2]”.", _.escape(cert.order_id), provider_html));
                    } else if (payload.status_code === "OrderItemCanceled") {
                        growl.info(LOCALE.maketext("This certificate (order item ID “[_1]”) was already canceled directly via “[_2]”.", _.escape(cert.order_item_id), provider_html));
                    } else {
                        growl.success(LOCALE.maketext("The system has canceled this certificate. Your credit card should not be charged for this order."));
                    }

                    CPANEL.PAGE.pending_certificates = null;
                    return CertificatesService.fetch_pending_certificates().then(function() {
                        /* refresh existing list */
                        $scope.pending_certificates = CertificatesService.get_pending_certificates();
                        if ($scope.pending_certificates.length === 0) {
                            $scope.get_new_certs();
                        } else {
                            $scope.prepare_pending_certificates();
                        }
                    }, function(error_html) {
                        growl.error(LOCALE.maketext("The system encountered an error as it attempted to refresh your pending certificates: [_1]", error_html));
                    });
                }, function(error_html) {
                    growl.error(LOCALE.maketext("The system encountered an error as it attempted to cancel your transaction: [_1]", error_html));
                });
            };

            $scope.get_displayed_domains = function(pcert) {
                var domains = pcert.domains;
                pcert.displayed_domains = [];
                pcert.display_meta.start = pcert.display_meta.items_per_page * (pcert.display_meta.current_page - 1);
                pcert.display_meta.limit = Math.min(domains.length, pcert.display_meta.start + pcert.display_meta.items_per_page);
                for (var i = pcert.display_meta.start; i < pcert.display_meta.limit; i++) {
                    pcert.displayed_domains.push(domains[i]);
                }
                return pcert.displayed_domains;
            };

            function _get_string_for_status_code(status_code, provider) {
                var str;

                if (status_code === "RequiresApproval") {
                    var provider_disp = $scope.get_provider_display_name(provider);
                    str = LOCALE.maketext("Waiting for “[_1]” to approve your order …", provider_disp);
                }

                return str;
            }

            $scope.get_cert_status = function(pending_certificate) {
                var status_code_str = _get_string_for_status_code(pending_certificate.last_status_code, pending_certificate.provider);

                if (status_code_str) {
                    return status_code_str;
                }

                var status = pending_certificate.status;
                if (status === "unconfirmed") {
                    return LOCALE.maketext("Pending Completion of Payment");
                } else if (status === "confirmed") {
                    return LOCALE.maketext("Payment Completed. Waiting for the provider to issue the certificate …");
                } else {
                    return LOCALE.maketext("Status Unknown");
                }
            };

            $scope.toggle_cert_collapse = function(cert) {
                if ($scope.expanded_cert === cert.order_item_id) {
                    $scope.collapse_cert(cert);
                } else {
                    $scope.expand_cert(cert);
                }
            };

            $scope.expand_cert = function(cert) {
                $location.path("/pending-certificates/" + cert.order_item_id);
                $scope.expanded_cert = cert.order_item_id;
                $anchorScroll($scope.expanded_cert);
            };

            $scope.collapse_cert = function() {
                $location.path("/pending-certificates");
                $scope.expanded_cert = null;
            };

            $scope.continue_purchase = function(pcert) {
                var domains = CertificatesService.get_all_domains();

                // Ensure no other purchasing certs exist
                CertificatesService.reset_purchasing_certificates();
                // rebuild purchasing certificate
                var cert = new Certificate();
                var cert_domains = [];
                var cert_product = CertificatesService.get_product_by_id(pcert.provider, pcert.product_id);
                var total_price = 0;

                cert.set_domains(cert_domains);
                cert.set_virtual_hosts(pcert.vhost_names);
                cert.set_product(cert_product);

                angular.forEach(pcert.domains, function(cert_domain) {
                    angular.forEach(domains, function(domain) {
                        if (domain.domain === cert_domain) {
                            cert_domains.push(domain);
                            total_price += domain.is_wildcard ? cert_product.wildcard_price : cert_product.price;
                        }
                    });
                });

                cert.set_price(total_price);

                CertificatesService.add_new_certificate(cert);

                // Removes purchasing certificates that might be saved in local storage.
                // These don't reappear until returning from logging in.
                CertificatesService.save();
                //
                $location.path("/purchase/" + pcert.provider + "/login/").search({
                    order_id: pcert.order_id
                });
            };

            $scope.rebuild_local_storage = function() {
                // Repair Orders
                var orders = {};
                var domains = CertificatesService.get_all_domains();
                var virtual_hosts = CertificatesService.get_virtual_hosts();

                angular.forEach($scope.pending_certificates, function(order_item) {
                    // build new order
                    orders[order_item.order_id] = orders[order_item.order_id] || {
                        access_token: "",
                        certificates: [],
                        order_id: order_item.order_id,
                        checkout_url: order_item.checkout_url
                    };
                    orders[order_item.order_id].certificates.push(order_item);

                    // re select the domains
                    angular.forEach(order_item.domains, function(cert_domain) {
                        angular.forEach(domains, function(domain) {
                            if (domain.domain === cert_domain) {
                                domain.selected = true;
                            }
                        });
                    });

                    // re select a product
                    angular.forEach(order_item.vhost_names, function(vhost_name) {
                        var vhost_id = CertificatesService.get_virtual_host_by_display_name(vhost_name);
                        var vhost = virtual_hosts[vhost_id];
                        var product = CertificatesService.get_product_by_id(
                            order_item.provider,
                            order_item.product_id
                        );
                        /* in case someone deletes the vhost while the certificate is pending */
                        if (vhost) {
                            vhost.set_product(product);
                        }
                    });

                });
                // add each new order
                angular.forEach(orders, function(order) {
                    CertificatesService.add_order(order);
                });
                // Then Save
                CertificatesService.save();
            };

            $scope.restore_orders = function() {
                // Rebuild to prevent doubling up
                CertificatesService.clear_stored_settings();
                /*  add in missing orders
                    we need to always do this in case a
                    localStorage exists that doesn't
                    contain *this* set of orders */
                var fetRet = CertificatesService.fetch_domains();
                if (_.isFunction(fetRet["finally"])) {
                    fetRet.then($scope.rebuild_local_storage);
                } else if (fetRet) {
                    $scope.rebuild_local_storage();
                }
            };

            $scope.prepare_pending_certificates = function() {
                $scope.pending_certificates.forEach(function(cert) {
                    cert.support_uri_is_http = /^http/.test(cert.support_uri);

                    cert.display_meta = cert.display_meta || {
                        items_per_page: 10,
                        current_page: 1
                    };
                });
            };

            $scope.init = function() {
                $scope.restore_orders();
                $scope.prepare_pending_certificates();

                if ($routeParams.orderitemid) {
                    $scope.expanded_cert = $routeParams.orderitemid;
                    $timeout(function() {
                        $anchorScroll($scope.expanded_cert);
                    }, 500);
                }
            };

            $scope.init();
        }

        app.controller("PendingCertificatesController", ["$scope", "$location", "$routeParams", "$anchorScroll", "$timeout", "$window", "CertificatesService", "growl", "LocationService", "Certificate", PendingCertificatesController]);

    }
);