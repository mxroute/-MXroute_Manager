/*
 * base/frontend/manager/security/tls_wizard/views/VirtualHostsController.js
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
        "angular",
        "cjt/util/locale",
        "jquery",
        "cjt/modules",
        "ngSanitize",
        "app/services/CertificatesService",
        "app/services/IdVerDefaults",
        "cjt/filters/qaSafeIDFilter",
        "cjt/directives/searchSettingsPanel",
        "cjt/directives/triStateCheckbox",
        "cjt/directives/spinnerDirective",
        "cjt/decorators/growlDecorator",
        "app/services/CountriesService",
        "app/services/LocationService",
    ],
    function(angular, LOCALE, $) {
        "use strict";

        var app = angular.module("App");

        function VirtualHostsController($rootScope, $scope, $controller, $location, $filter, $timeout, $sce, $routeParams, $window, CertificatesService, IdVerDefaults, SpinnerAPI, growl, COUNTRIES, LocationService, SearchSettingsModel) {

            $scope.show_introduction_block = CertificatesService.show_introduction_block;

            $scope.domains = CertificatesService.get_all_domains();
            $scope.virtual_hosts = CertificatesService.get_virtual_hosts();
            $scope.pending_certificates = CertificatesService.get_pending_certificates();
            $scope.showExistingCertificates = false;
            $scope.working_virtual_host = null;
            $scope.LOCALE = LOCALE;
            $scope.resolution_timeout = 0;
            $scope.cart_items = [];
            $scope.filterValue = null;
            $scope.checkout_mode = false;
            $scope.filteredProducts = [];
            $scope.showAdvancedSettings = true;
            $rootScope.addToCartGrowl = null;

            $scope.COUNTRIES = COUNTRIES;

            var identity_verification = {};
            $scope.identity_verification = identity_verification;

            var saved_idver = CertificatesService.get_stored_extra_settings().advanced_identity_verification;

            for (var vh = 0; vh < $scope.virtual_hosts.length; vh++) {
                var vh_name = $scope.virtual_hosts[vh].get_display_name();

                identity_verification[vh_name] = {};

                if (saved_idver && saved_idver[vh_name]) {
                    IdVerDefaults.restore_previous(identity_verification[vh_name], saved_idver[vh_name]);
                } else {
                    IdVerDefaults.set_defaults(identity_verification[vh_name]);
                }
            }

            // reset on visit to purchase certs
            angular.forEach($scope.virtual_hosts, function(virtual_host) {
                virtual_host.reset();
                /* don't show wildcards in this interface */
                virtual_host.show_wildcards = false;
            });

            /* to reset after reset */
            $scope.domains = CertificatesService.get_all_domains();
            $scope.domains = $filter("filter")($scope.domains, {
                is_wildcard: false
            });
            $scope.virtual_hosts = CertificatesService.get_virtual_hosts();

            $scope.virtual_hosts = $filter("filter")($scope.virtual_hosts, function(vhost) {
                return !vhost.display_name.match(/^\*\./);
            });

            var default_search_values = {
                "certTerms": {
                    "1_year": true,
                    "2_year": false,
                    "3_year": false
                }
            };

            $scope.searchFilterOptions = new SearchSettingsModel(CertificatesService.get_product_search_options(), default_search_values);

            $scope.filter_products = function() {

                var filteredProducts = CertificatesService.get_products();

                filteredProducts = $scope.searchFilterOptions.filter(filteredProducts);

                $scope.filteredProducts = filteredProducts;
            };

            $scope.slow_scroll_to_top = function() {
                $("body,html").animate({
                    "scrollTop": 0
                }, 2000);
            };

            $scope.go_to_product_filters = function() {
                $scope.showAdvancedSettings = true;
                $scope.slow_scroll_to_top();
            };

            var build_steps = ["domains", "providers", "cert-info"];
            var qaFilter = $filter("qaSafeID");

            $scope.get_cart_certs_title = function() {
                return LOCALE.maketext("[quant,_1,Certificate,Certificates]", $scope.get_cart_items().length);
            };

            $scope.get_vhost_showing_text = function() {
                var vhosts = $filter("filter")($scope.get_virtual_hosts(), $scope.filterValue);
                return LOCALE.maketext("[output,strong,Showing] [numf,_1] of [quant,_2,website,websites]", vhosts.length, $scope.get_virtual_hosts().length);
            };

            $scope.get_domains_showing_text = function(virtual_host) {
                var num_start = 1 + virtual_host.display_meta.start;
                var num_limit = virtual_host.display_meta.limit;
                var num_of = virtual_host.get_domain_count(true);
                return LOCALE.maketext("[output,strong,Showing] [numf,_1] - [numf,_2] of [quant,_3,domain,domains].", num_start, num_limit, num_of);
            };

            $scope.deselect_unresolved_msg = function(virtual_host) {
                var unresolved_count = virtual_host.get_selected_domains().filter(function(domain) {
                    return domain.resolved === 0;
                }).length;
                return LOCALE.maketext("Deselect all unresolved domains ([numf,_1]).", unresolved_count);
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

            $scope.get_certpanel_class = function(virtual_host) {
                if (!$scope.pending_certificate(virtual_host)) {
                    return "panel-primary";
                } else {
                    return "panel-default";
                }
            };

            $scope.view_pending_certificate = function(virtual_host) {
                var order_item_id = $scope.pending_certificate(virtual_host);
                $scope.go_to_pending(order_item_id);
            };

            $scope.get_currency_string = function(num, price_unit) {
                num += 0.001;
                var str = LOCALE.numf(num);
                str = "$" + str.substring(0, str.length - 1);
                if (price_unit) {
                    str += " " + price_unit;
                }
                return str;
            };

            $scope.get_virtual_hosts = function() {
                var virtual_hosts = $scope.virtual_hosts;
                if ($scope.filterValue) {
                    virtual_hosts = $filter("filter")(virtual_hosts, $scope.filterValue);
                }
                if ($scope.checkout_mode) {
                    virtual_hosts = $filter("filter")(virtual_hosts, {
                        added_to_cart: true
                    });
                }
                return virtual_hosts;
            };

            $scope.get_virtual_host_classes = function(virtual_host) {
                return {
                    "col-lg-4": $scope.virtual_hosts.length > 2,
                    "col-lg-6": $scope.virtual_hosts.length <= 2,
                    "panel-success": virtual_host.is_ssl
                };
            };

            $scope.get_step_panel_classes = function(virtual_host, current) {
                var classes = ["col-sm-12", "col-xs-12"];
                // add step type specific classes

                if ($scope.working_virtual_host === virtual_host.display_name) {
                    classes.push("col-md-4");
                    classes.push("col-lg-4");
                } else {
                    classes.push("col-md-12");
                    classes.push("col-lg-12");
                }

                if (current) {
                    classes.push("cert-step-panel-current");
                }

                return classes;

            };

            $scope.get_cart_price = function() {
                var price = 0;
                angular.forEach($scope.get_cart_items(), function(virtual_host) {
                    price += virtual_host.get_price();
                });
                return price;
            };

            $scope.get_cart_items = function() {
                $scope.cart_items = $filter("filter")($scope.virtual_hosts, {
                    added_to_cart: true
                });
                return $scope.cart_items;
            };

            $scope.checkout = function() {
                $scope.checkout_mode = true;
            };

            $scope.get_product_form_fields = function() {
                return [];
            };

            $scope.get_step = function(virtual_host) {
                return virtual_host.get_step();
            };

            $scope.go_step = function(virtual_host, step) {
                if ($scope.can_step(virtual_host, step)) {
                    return virtual_host.go_step(step);
                }
            };

            $scope.focus_virtual_host = function() {
                //$scope.working_virtual_host = virtual_host.display_name;
            };

            $scope.check_selected_domains = function(virtual_host) {
                if ($scope.resolution_timeout) {
                    $timeout.cancel($scope.resolution_timeout);
                }
                if (virtual_host && virtual_host.added_to_cart) {
                    var domains = $filter("filter")(virtual_host.get_selected_domains(), function(domain) {
                        if (domain.resolved !== 1) {
                            return true;
                        }
                    });
                    if (domains.length) {
                        growl.warning(LOCALE.maketext("You have altered an item in your cart. The system has removed that item. After you make the necessary changes, add that item back to your cart."));
                        $scope.remove_from_cart(virtual_host);
                    }
                }
                $scope.resolution_timeout = $timeout(function(domains) {
                    $scope.ensure_dns(domains);
                }, 850, true, CertificatesService.get_all_selected_domains()); // JNK: Lowered wait time since I keep missing it when testing
            };

            $scope.deselect_domains = function(domains) {
                angular.forEach(domains, function(domain) {
                    domain.selected = false;
                });
            };

            $scope.get_current_or_default_provider = function() {
                return CertificatesService.get_default_provider_name();
            };

            $scope.ensure_dns = function(domains) {
                domains = $filter("filter")(domains, {
                    selected: true,
                    resolved: -1
                });
                if (!domains.length) {
                    return false;
                }
                angular.forEach(domains, function(domain) {
                    domain.resolving = true;
                    SpinnerAPI.start($scope.get_spinner_id(domain.domain));
                });
                var provider_name = $scope.get_current_or_default_provider();
                return CertificatesService.ensure_domains_can_pass_dcv(domains, provider_name).finally(function() {
                    var to_focus_element;
                    angular.forEach(domains, function(domain) {
                        if (domain.resolved === 0 && domain.selected) {
                            /* checked domain doesn't resolve */
                            var vhost_index = CertificatesService.get_virtual_host_by_display_name(domain.vhost_name);
                            var vhost = $scope.virtual_hosts[vhost_index];
                            if (vhost && vhost.get_step() === "providers") {
                                /* if we are on the providers section, send them back to the domains section to see errors */
                                $scope.go_step(vhost, "domains");

                                /* set focus to top domain in domains list */
                                var element = $window.document.getElementById($scope.get_domain_id(domain));
                                if (element && !to_focus_element) {
                                    /* only focus first element */
                                    to_focus_element = element;
                                    $timeout(function() {
                                        to_focus_element.focus();
                                    });
                                }
                            }
                        }
                        SpinnerAPI.stop($scope.get_spinner_id(domain.domain));
                    });
                });
            };

            $scope.get_domain_id = function(domain_obj) {
                return qaFilter(domain_obj.vhost_name + "_" + domain_obj.domain);
            };

            $scope.check_product_match = function(product_a, product_b) {
                if (!product_a || !product_b) {
                    return false;
                }
                if (product_a.id === product_b.id && product_a.provider === product_b.provider) {
                    return true;
                }
            };

            $scope.can_step = function(virtual_host, step) {
                if (step === build_steps[0]) {
                    return true;
                } else if (step === build_steps[1]) {
                    // providers
                    /* can progress if domains are selected, after they are resolved they user is kicked back to domains if there is an error */
                    return virtual_host.get_selected_domains().length ? true : false;
                } else if (step === build_steps[2]) {
                    // cert-info
                    var product = virtual_host.get_product();
                    if (!product) {
                        return false;
                    }
                    product = CertificatesService.get_product_by_id(product.provider, product.id);
                    if (!product) {
                        return false;
                    }
                    if (!$scope.get_product_form_fields(product)) {
                        return false;
                    }
                }
                return false;
            };

            $scope.get_product_by_id = function(provider_name, product_id) {
                return CertificatesService.get_product_by_id(provider_name, product_id);
            };

            $scope.can_next_step = function(virtual_host) {
                var current_step = virtual_host.get_step();
                var next_step;
                angular.forEach(build_steps, function(step, index) {
                    if (step === current_step) {
                        next_step = build_steps[index + 1];
                    }
                });

                return $scope.can_step(virtual_host, next_step);

            };

            $scope.next_step = function(virtual_host) {
                var current_step = virtual_host.get_step();
                var next_step;
                angular.forEach(build_steps, function(step, index) {
                    if (step === current_step) {
                        next_step = build_steps[index + 1];
                    }
                });

                if ($scope.can_step(virtual_host, next_step)) {
                    $scope.focus_virtual_host(virtual_host);
                    virtual_host.go_step(next_step);
                }
            };

            $scope.get_spinner_id = function(domain) {
                return qaFilter("dns_resolving_" + domain);
            };

            $scope.get_products = function() {
                return $scope.filteredProducts;
            };

            $scope.set_product = function(virtual_host, product) {
                virtual_host.set_product_price(product.price);
                virtual_host.set_product(product);
            };

            $scope.all_domains_resolved = function(virtual_host) {
                var domains = virtual_host.get_selected_domains();

                domains = $filter("filter")(domains, function(domain) {
                    if (domain.resolved !== 1) {
                        return false;
                    }
                    return true;
                });

                if (domains.length === 0) {
                    // No Resolved and Selected Domains
                    return false;
                }

                return true;
            };

            $scope.can_add_to_cart = function(virtual_host) {
                var product = virtual_host.get_product();
                if (!product) {
                    return false;
                }
                product = CertificatesService.get_product_by_id(product.provider, product.id);
                if (!product) {
                    // No Valid Product Selected
                    return false;
                }

                return true;

            };

            $scope.add_to_cart = function(virtual_host) {
                if (!$scope.can_add_to_cart(virtual_host) || !$scope.all_domains_resolved(virtual_host)) {
                    return false;
                }
                virtual_host.added_to_cart = true;
                virtual_host.go_step("added-to-cart");

                virtual_host.set_identity_verification($scope.identity_verification[virtual_host.display_name]);

                $scope.working_virtual_host = null;
                if ($rootScope.addToCartGrowl) {
                    $rootScope.addToCartGrowl.ttl = 0;
                    $rootScope.addToCartGrowl = null;
                }
                var options = {
                    ttl: -1,
                    variables: {
                        buttonLabel: LOCALE.maketext("Proceed to checkout."),
                        showAction: true,
                        action: function() {
                            $scope.purchase();
                        }
                    }
                };
                $rootScope.addToCartGrowl = growl.success(LOCALE.maketext("Item Successfully Added to Cart."), options);
            };

            $scope.get_domain_certificate = function(domain) {
                return CertificatesService.get_domain_certificate(domain);
            };

            $scope.view_existing_certificate = function() {

            };

            $scope.get_virtual_host_certificate = function(virtual_host) {
                return CertificatesService.get_virtual_host_certificate(virtual_host);
            };

            $scope.build_csr_url = function(virtual_host) {
                var ihost = $scope.get_virtual_host_certificate(virtual_host);
                if (ihost && ihost.certificate) {
                    var url = "";
                    url += "../../ssl/install.html?id=";
                    url += encodeURIComponent(ihost.certificate.id);
                    return url;
                }
            };

            $scope.get_existing_certificate_name = function(virtual_host) {
                var ihost = $scope.get_virtual_host_certificate(virtual_host);

                var name;
                if (ihost && ihost.certificate) {
                    var cert = ihost.certificate;
                    if (cert.validation_type === "dv") {
                        name = LOCALE.maketext("A [output,abbr,DV,Domain Validated] certificate is installed.");
                    } else if (cert.validation_type === "ov") {
                        name = LOCALE.maketext("An [output,abbr,OV,Organization Validated] certificate is installed.");
                    } else if (cert.validation_type === "ev") {
                        name = LOCALE.maketext("An [output,abbr,EV,Extended Validation] certificate is installed.");
                    } else if (cert.is_self_signed) {
                        name = LOCALE.maketext("A self-signed certificate is installed.");
                    }
                }
                if (!name) {
                    name = LOCALE.maketext("A certificate of unknown type is installed.");
                }

                return name;
            };

            $scope.get_domain_lock_classes = function(virtual_host) {
                var ihost = $scope.get_virtual_host_certificate(virtual_host);
                if (ihost && ihost.certificate) {
                    if (ihost.certificate.is_self_signed) {
                        return "grey-padlock";
                    } else {
                        return "green-padlock";
                    }
                }
            };

            $scope.remove_from_cart = function(virtual_host) {
                if ($rootScope.addToCartGrowl) {
                    $rootScope.addToCartGrowl.ttl = 0;
                    $rootScope.addToCartGrowl.destroy();
                    $rootScope.addToCartGrowl = null;
                }
                virtual_host.added_to_cart = false;
            };

            $scope.go_to_simple = function() {
                CertificatesService.hard_reset();
                LocationService.go_to_simple_create_route().search("");
            };

            $scope.purchase = function() {

                /* storing on and removing from rootscope due to scope change */
                if ($rootScope.addToCartGrowl) {
                    $rootScope.addToCartGrowl.ttl = 0;
                    $rootScope.addToCartGrowl.destroy();
                    $rootScope.addToCartGrowl = null;
                }

                var success = CertificatesService.save({
                    advanced_identity_verification: identity_verification,
                });

                if (!success) {
                    growl.error(LOCALE.maketext("Failed to save information to browser cache."));
                } else {
                    $location.path("/purchase");
                }

            };

            if ($routeParams["domain"]) {
                angular.forEach($filter("filter")($scope.domains, {
                    domain: $routeParams["domain"]
                }, true), function(domain) {
                    domain.selected = true;
                    $scope.check_selected_domains(domain.vhost_name);
                });

                /* refresh virtual_hosts */
                $scope.virtual_hosts = CertificatesService.get_virtual_hosts();
                $scope.filterValue = $routeParams["domain"];
            }

        }

        app.controller("VirtualHostsController", ["$rootScope", "$scope", "$controller", "$location", "$filter", "$timeout", "$sce", "$routeParams", "$window", "CertificatesService", "IdVerDefaults", "spinnerAPI", "growl", "CountriesService", "LocationService", "SearchSettingsModel", VirtualHostsController]);


    });