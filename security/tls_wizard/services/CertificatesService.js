/*
 * base/frontend/manager/security/tls_wizard/services/CertificatesService.js
 *                                                 Copyright(c) 2015 cPanel, Inc.
 *                                                           All rights Reserved.
 * copyright@cpanel.net                                         http://cpanel.net
 * This code is subject to the cPanel license. Unauthorized copying is prohibited
 */


/* global define: false */
/* jshint -W100 */
define(
    [
        "angular",
        "lodash",
        "cjt/util/locale",
        "cjt/util/parse",
        "cjt/io/api",
        "cjt/io/uapi-request",
        "app/views/Certificate",
        "app/services/VirtualHost",
        "cjt/io/uapi", // IMPORTANT: Load the driver so its ready
        "cjt/decorators/growlDecorator"
    ],
    function(angular, _, LOCALE, cjt2_parse, API, APIREQUEST) {
        "use strict";

        //Curious that JS doesn’t expose sprintf(). Anyway.
        //http://www.codigomanso.com/en/2010/07/simple-javascript-formatting-zero-padding/
        function _sprintf_02d(n) {
            return ("0" + n).slice(-2);
        }

        var app = angular.module("App");

        function CertificatesServiceFactory(VirtualHost, Certificate, $q, growl, growlMsg, $log) {
            var CertificatesService = {};
            var virtual_hosts = [];
            var all_domains = [];
            var selected_domains = [];
            var products = [];
            var orders = [];
            var pending_certificates = [];
            var installed_hosts = null;
            var purchasing_certs = [];
            var ssl_domains = {};
            var installed_hosts_map = {};
            var products_search_options;
            var wildcard_map = {};
            var domain_search_options;
            var current_date = new Date();
            var introduction_dismissed = false;

            function api_error(which_api, error_msg_html) {
                var error = LOCALE.maketext("The “[_1]” [asis,API] failed due to the following error: [_2]", _.escape(which_api), error_msg_html);
                growl.error(error);
            }

            CertificatesService.add_new_certificate = function(cert) {
                purchasing_certs.push(cert);
            };

            CertificatesService.get_purchasing_certs = function() {
                return purchasing_certs;
            };

            CertificatesService.get_order_by_id = function(order_id) {
                for (var i = 0; i < orders.length; i++) {
                    if (orders[i].order_id === order_id) {
                        return orders[i];
                    }
                }
            };
            CertificatesService.add_order = function(order) {
                var existing_order = CertificatesService.get_order_by_id(order.order_id);
                if (existing_order) {
                    // update existing order
                    angular.extend(existing_order, order);
                } else {
                    // add orer
                    orders.push(order);
                }
            };

            CertificatesService.restore = function() {
                if (CertificatesService.get_virtual_hosts().length) {
                    return false;
                }
                var stored_settings = _get_stored_settings_json();
                if (!stored_settings) {
                    return false;
                }
                var storage = JSON.parse(stored_settings);
                angular.forEach(storage.virtual_hosts, function(vhost) {
                    virtual_hosts.push(new VirtualHost(vhost));
                });
                angular.forEach(storage.purchasing_certs, function(cert) {
                    CertificatesService.add_new_certificate(new Certificate(cert));
                });
                orders = storage.orders;
                return virtual_hosts.length === storage.virtual_hosts.length && orders.length === storage.orders.length;
            };

            CertificatesService.add_virtual_host = function(virtual_host, is_ssl) {
                var new_vhost = new VirtualHost({
                    display_name: virtual_host,
                    is_ssl: is_ssl
                });
                var vhost_id = virtual_hosts.length;
                virtual_hosts.push(new_vhost);
                return vhost_id;
            };

            CertificatesService.get_virtual_hosts = function() {
                return virtual_hosts;
            };

            CertificatesService.doesDomainMatchOneOf = function(domain, domains) {
                if (domains === null || domain === null) {
                    return false;
                }

                return domains.some(function(domain_1) {
                    var domain_2 = domain;
                    if (domain_1 === domain_2) {
                        return true;
                    }

                    var possible_wildcard;
                    var domain_to_match;

                    if (/^\*/.test(domain_1)) {
                        possible_wildcard = domain_1;
                        domain_to_match = domain_2;
                    } else if (/^\*/.test(domain_2)) {
                        possible_wildcard = domain_2;
                        domain_to_match = domain_1;
                    } else {
                        return false;
                    }

                    possible_wildcard = possible_wildcard.replace(/^\*\./, "");
                    domain_to_match = domain_to_match.replace(/^[^\.]+\./, "");

                    if (possible_wildcard === domain_to_match) {
                        return true;
                    }
                });
            };

            CertificatesService.add_raw_domain = function(raw_domain) {
                raw_domain.virtual_host = raw_domain.vhost_name;

                raw_domain.order_by_name = raw_domain.domain.match(/^www./) ? raw_domain.domain.replace(/^www\./, "") : raw_domain.domain;
                /* for consistency and ease of filtering */
                raw_domain.is_wildcard = raw_domain.domain.indexOf("*.") === 0;
                raw_domain.is_proxy = raw_domain.is_proxy.toString() === "1";
                raw_domain.stripped_domain = raw_domain.domain;
                CertificatesService.add_domain(raw_domain);

                // Adding this check here, but should probably check to make sure these weren't manually created (in a later version)
                var matches_autogenerated = raw_domain.domain.match(/^(mail|ipv6)\./);

                if (!raw_domain.is_wildcard && !raw_domain.is_proxy && !matches_autogenerated) {
                    CertificatesService.add_domain(angular.extend({}, raw_domain, {
                        domain: "*." + raw_domain.domain,
                        is_wildcard: true
                    }));
                }

            };

            CertificatesService.domain_covered_by_wildcard = function(domain) {
                return wildcard_map[domain];
            };

            CertificatesService.compare_wildcard_domain = function(wildcard_domain, compare_domain) {
                return wildcard_map[compare_domain] === wildcard_domain.domain;
            };

            /* map these for faster lookup */
            CertificatesService.build_wildcard_map = function() {
                wildcard_map = {};
                var domains = CertificatesService.get_all_domains();
                var re;
                domains.forEach(function(domain) {
                    // only need to map wildcards
                    if (domain.is_wildcard === false) {
                        return false;
                    }

                    //The “stripped_domain” isn’t stripped in the case of
                    //wildcard domains that actually exist in Apache vhosts.
                    re = new RegExp("^[^\\.]+\\." + _.escapeRegExp(domain.stripped_domain.replace(/^\*\./,"")) + "$");

                    domains.forEach(function(match_domain) {
                        if (domain.domain !== match_domain.domain && re.test(match_domain.domain)) {
                            wildcard_map[match_domain.domain] = domain;
                        }
                    });

                });
            };

            CertificatesService.get_domain_certificate_status = function(domain) {

                var ihost = CertificatesService.get_domain_certificate(domain.domain);

                if (ihost && ihost.certificate) {
                    var expiration_date = new Date(ihost.certificate.not_after * 1000);
                    var days_until_expire = (expiration_date - current_date) / 1000 / 60 / 60 / 24;
                    if (expiration_date < current_date) {
                        return "expired";
                    } else if (days_until_expire < 30 && days_until_expire > 0) {
                        return "expiring_soon";
                    } else {
                        return "active";
                    }
                }

                return "unsecured";
            };

            CertificatesService.add_domain = function(domain_obj) {
                var vhost_id = CertificatesService.get_virtual_host_by_display_name(domain_obj.virtual_host);
                if (vhost_id !== 0 && !vhost_id) {
                    vhost_id = CertificatesService.add_virtual_host(domain_obj.virtual_host, 1);
                }
                virtual_hosts[vhost_id].is_ssl = 1;

                /* prevent adding of duplicates */
                if (CertificatesService.get_domain_by_domain(domain_obj.domain)) {
                    return;
                }

                // assume installed hosts is there, we will ensure this later

                ssl_domains[domain_obj.domain] = null;


                // domain certificate finding

                var ihost = installed_hosts_map[domain_obj.virtual_host];

                if (ihost && ihost.certificate) {

                    // vhost has certificate, but does it cover this domain

                    angular.forEach(ihost.certificate.domains, function(domain) {
                        if (domain_obj.domain === domain) {
                            ssl_domains[domain_obj.domain] = ihost;
                            return;
                        }

                        var wildcard_domain = domain_obj.domain.replace(/^[^.]+\./, "*.");
                        if (wildcard_domain === domain) {
                            ssl_domains[domain_obj.domain] = ihost;
                        }
                    });

                }


                domain_obj.type = domain_obj.is_wildcard ? "wildcard_domain" : "main_domain";
                domain_obj.proxy_type = domain_obj.is_proxy ? "proxy_domain" : "main_domain";
                domain_obj.certificate_status = CertificatesService.get_domain_certificate_status(domain_obj);

                return virtual_hosts[vhost_id].add_domain(domain_obj);
            };


            CertificatesService.remove_virtual_host = function(display_name) {
                var index = CertificatesService.get_virtual_host_by_display_name(display_name);
                if (index) {
                    virtual_hosts[index].remove_all_domains();
                }
            };

            CertificatesService.get_virtual_host_by_display_name = function(display_name) {
                for (var i = 0; i < virtual_hosts.length; i++) {
                    if (virtual_hosts[i].display_name === "*") {
                        /* There can be only one if we requested an all-vhosts install */
                        return 0;
                    } else if (virtual_hosts[i].display_name === display_name) {
                        return i;
                    }
                }
            };

            //TODO: This code is duplicated all over and should
            //probably be de-duplicated.
            var _run_uapi = function(apiCall) {
                var deferred = $q.defer();

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                return deferred.promise;
            };

            CertificatesService.set_confirmed_status_for_ssl_certificates = function(provider, order) {
                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                var order_item_ids = [];

                angular.forEach(order.certificates, function(item) {
                    order_item_ids.push(item.order_item_id);
                });

                apiCall.initialize("Market", "set_status_of_pending_queue_items");
                apiCall.addArgument("provider", provider);
                apiCall.addArgument("status", "confirmed");
                apiCall.addArgument("order_item_id", order_item_ids);

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;

                        //This specific case is unusual because we want to
                        //give the error handler the entire object so that it
                        //can check for “data” in the response. See the
                        //documentation for Market::set_status_of_pending_queue_items.
                        var method = response.status ? "resolve" : "reject";

                        deferred[method](response);
                    });

                return deferred.promise;
            };

            CertificatesService.fetch_domains = function() {

                var ret = CertificatesService.fetch_installed_hosts();

                if (_.isFunction(ret.then) !== false) {
                    return ret.then(function() {
                        return CertificatesService.fetch_domains();
                    });
                }

                if (CertificatesService.get_all_domains().length) {
                    return true;
                }

                if (CPANEL.PAGE.domains) {
                    angular.forEach(CPANEL.PAGE.domains, function(domain) {
                        CertificatesService.add_raw_domain(domain);
                    });
                    if (CertificatesService.get_all_domains().length) {
                        return true;
                    }
                }

                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("WebVhosts", "list_ssl_capable_domains");
                apiCall.addFilter("domain", "matches", "^(?!www)");

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                deferred.promise.then(function(result) {
                    angular.forEach(result.data, function(domain) {
                        CertificatesService.add_raw_domain(domain);
                    });
                }, function(error) {
                    api_error("WebVHosts::list_ssl_capable_domains", error);
                });

                return deferred.promise;
            };

            CertificatesService.get_store_login_url = function(provider, escaped_url) {
                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Market", "get_login_url");
                apiCall.addArgument("provider", provider);
                apiCall.addArgument("url_after_login", escaped_url);

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                return deferred.promise;
            };

            function _get_stored_settings_json() {
                return localStorage.getItem("tls_wizard_data");
            }

            CertificatesService.store_settings = function(extras) {
                var storable_settings = CertificatesService.get_storable_settings(extras);
                localStorage.setItem("tls_wizard_data", storable_settings);
                var retrieved_data = _get_stored_settings_json();
                return retrieved_data === storable_settings;
            };

            CertificatesService.save = CertificatesService.store_settings;

            //Returns at least an empty object.
            CertificatesService.get_stored_extra_settings = function get_stored_extra_settings() {
                var settings = _get_stored_settings_json();
                if (settings) {
                    settings = JSON.parse(settings).extras;
                }

                return settings || {};
            };

            CertificatesService.clear_stored_settings = function() {
                return localStorage.removeItem("tls_wizard_data");
            };

            CertificatesService.get_storable_settings = function(extras) {

                //Preserve the “extras”, which contains things like
                //identity verification for OV and EV certs.
                //
                var storage = _get_stored_settings_json();
                storage = storage ? JSON.parse(storage) : {};
                if (!storage.extras) {
                    storage.extras = {};
                }

                if (extras) {
                    _.assign(storage.extras, extras);
                }

                //Clobber everything else.
                _.assign(storage, {
                    orders: orders,

                    //Used in the “Advanced” screen
                    //NB: Each one has a .toJSON() method defined.
                    virtual_hosts: virtual_hosts,

                    //Used in the “Simple” screen
                    //NB: Each one has a .toJSON() method defined.
                    purchasing_certs: CertificatesService.get_purchasing_certs(),
                });

                return JSON.stringify(storage);
            };

            CertificatesService.get_all_domains = function() {
                all_domains = [];
                angular.forEach(virtual_hosts, function(vhost) {
                    all_domains = all_domains.concat(vhost.get_domains());
                });
                return all_domains;
            };

            CertificatesService.get_all_selected_domains = function() {
                selected_domains = [];
                angular.forEach(virtual_hosts, function(vhost) {
                    selected_domains = selected_domains.concat(vhost.get_selected_domains());
                });
                return selected_domains;
            };

            CertificatesService.get_products = function() {
                return products;
            };

            CertificatesService.fetch_products = function() {

                if (CertificatesService.get_products().length) {
                    return true;
                }

                if (CPANEL.PAGE.products) {
                    angular.forEach(CPANEL.PAGE.products, function(product) {
                        CertificatesService.add_raw_product(product);
                    });
                    if (CertificatesService.get_products().length) {
                        return true;
                    }
                }

                products = [];
                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Market", "get_all_products");
                apiCall.addFilter("enabled", "eq", "1");
                apiCall.addFilter("product_group", "eq", "ssl_certificate");
                apiCall.addSorting("recommended", "dsc", "numeric");
                apiCall.addSorting("x_price_per_domain", "asc", "numeric");

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                deferred.promise.then(function(results) {
                    angular.forEach(results.data, function(product) {

                        //typecasts
                        product.product_id += "";

                        ["x_warn_after", "x_price_per_domain", "x_max_http_redirects"].forEach(function(attr) {
                            if (product[attr]) {
                                product[attr] = cjt2_parse.parseNumber(product[attr]);
                            }
                        });

                        CertificatesService.add_raw_product(product);
                    });

                }, function(error) {
                    api_error("Market::get_all_products", error);
                });

                return deferred.promise;
            };

            CertificatesService._make_certificate_term_label = function(term_unit, term_value) {
                var unit_strings = {
                    "year": LOCALE.maketext("[quant,_1,Year,Years]", term_value),
                    "month": LOCALE.maketext("[quant,_1,Month,Months]", term_value),
                    "day": LOCALE.maketext("[quant,_1,Day,Days]", term_value)
                };
                return unit_strings[term_unit] || term_value + " " + term_unit;
            };

            CertificatesService._make_validation_type_label = function(validation_type) {
                var validation_type_labels = {
                    "dv": LOCALE.maketext("[output,abbr,DV,Domain Validated] Certificate"),
                    "ov": LOCALE.maketext("[output,abbr,OV,Organization Validated] Certificate"),
                    "ev": LOCALE.maketext("[output,abbr,EV,Extended Validation] Certificate")
                };
                return validation_type_labels[validation_type] || validation_type;
            };

            CertificatesService.add_raw_product = function(raw_product) {
                raw_product.id = raw_product.product_id;
                raw_product.provider = raw_product.provider_name;
                raw_product.provider_display_name = raw_product.provider_display_name || raw_product.provider;
                raw_product.price = Number(raw_product.x_price_per_domain);
                raw_product.wildcard_price = Number(raw_product.x_price_per_wildcard_domain);
                raw_product.wildcard_parent_domain_included = raw_product.x_wildcard_parent_domain_free && raw_product.x_wildcard_parent_domain_free.toString() === "1";
                raw_product.icon_mime_type = raw_product.icon_mime_type ? raw_product.icon_mime_type : "image/png";
                raw_product.is_wildcard = !isNaN(raw_product.wildcard_price) ? true : false;
                raw_product.x_certificate_term = raw_product.x_certificate_term || [1, "year"];
                raw_product.x_certificate_term_display_name = CertificatesService._make_certificate_term_label(raw_product.x_certificate_term[1], raw_product.x_certificate_term[0]);
                raw_product.x_certificate_term_key = raw_product.x_certificate_term.join("_");
                raw_product.x_validation_type_display_name = CertificatesService._make_validation_type_label(raw_product.x_validation_type);
                raw_product.validity_period = raw_product.x_certificate_term;
                products.push(raw_product);
            };

            CertificatesService.get_domain_search_options = function() {
                if (domain_search_options) {
                    return domain_search_options;
                }

                domain_search_options = {
                    domainType: {
                        label: LOCALE.maketext("Domain Types:"),
                        item_key: "type",
                        options: [{
                            "value": "main_domain",
                            "label": LOCALE.maketext("Non-Wildcard"),
                            "description": LOCALE.maketext("Only list Non-Wildcard domains.")
                        }, {
                            "value": "wildcard_domain",
                            "label": LOCALE.maketext("Wildcard"),
                            "description": LOCALE.maketext("Only list Wildcard domains.")
                        }]
                    },
                    proxyDomainType: {
                        label: LOCALE.maketext("Proxy Subdomain Types:"),
                        item_key: "proxy_type",
                        options: [{
                            "value": "proxy_domain",
                            "label": LOCALE.maketext("[asis,cPanel] Proxy Subdomains"),
                            "description": LOCALE.maketext("Only list proxy subdomains.")
                        }, {
                            "value": "main_domain",
                            "label": LOCALE.maketext("Other Domains"),
                            "description": LOCALE.maketext("Only list non-Proxy domains.")
                        }]
                    },
                    sslType: {
                        label: LOCALE.maketext("[asis,SSL] Types:"),
                        item_key: "certificate_type",
                        options: [{
                            "value": "unsecured",
                            "label": LOCALE.maketext("Unsecured or Self-signed"),
                            "description": LOCALE.maketext("Only list unsecured or self-signed domains.")
                        }, {
                            "value": "dv",
                            "label": CertificatesService._make_validation_type_label("dv"),
                            "description": LOCALE.maketext("Only list domains with [asis,DV] Certificates.")
                        }, {
                            "value": "ov",
                            "label": CertificatesService._make_validation_type_label("ov"),
                            "description": LOCALE.maketext("Only list domains with [asis,OV] Certificates.")
                        }, {
                            "value": "ev",
                            "label": CertificatesService._make_validation_type_label("ev"),
                            "description": LOCALE.maketext("Only list domains with [asis,EV] Certificates.")
                        }]
                    },
                    sslStatus: {
                        label: LOCALE.maketext("[asis,SSL] Statuses:"),
                        item_key: "certificate_status",
                        options: [{
                            "value": "unsecured",
                            "label": LOCALE.maketext("Unsecured"),
                            "description": LOCALE.maketext("Only list unsecured domains.")
                        }, {
                            "value": "active",
                            "label": LOCALE.maketext("Active"),
                            "description": LOCALE.maketext("Only list domains with an active certificate.")
                        }, {
                            "value": "expired",
                            "label": LOCALE.maketext("Expired"),
                            "description": LOCALE.maketext("Only list domains whose certificate is expiring soon.")
                        }, {
                            "value": "expiring_soon",
                            "label": LOCALE.maketext("Expiring Soon"),
                            "description": LOCALE.maketext("Only list domains with certificates that expire soon.")
                        }]
                    }
                };

                return CertificatesService.get_domain_search_options();
            };

            CertificatesService.get_product_search_options = function() {
                if (products_search_options) {
                    return products_search_options;
                }

                products_search_options = {
                    validationType: {
                        label: LOCALE.maketext("[asis,SSL] Validation Types"),
                        item_key: "x_validation_type",
                        options: []
                    },
                    sslProvider: {
                        label: LOCALE.maketext("[asis,SSL] Providers"),
                        item_key: "provider",
                        options: []
                    },
                    certTerms: {
                        label: LOCALE.maketext("Certificate Terms"),
                        item_key: "x_certificate_term_key",
                        options: []
                    }
                };

                var products = CertificatesService.get_products();

                var certTerms = {},
                    providers = {},
                    validationTypes = {};

                angular.forEach(products, function(product) {
                    certTerms[product.x_certificate_term_key] = {
                        "value": product.x_certificate_term_key,
                        "label": product.x_certificate_term_display_name,
                        "description": LOCALE.maketext("Only list products with a term of ([_1]).", product.x_certificate_term_display_name)
                    };
                    providers[product.provider] = {
                        "value": product.provider,
                        "label": product.provider_display_name,
                        "description": LOCALE.maketext("Only list products from the “[_1]” provider.", product.provider_display_name)
                    };
                    validationTypes[product.x_validation_type] = {
                        "value": product.x_validation_type,
                        "label": product.x_validation_type_display_name,
                        "description": LOCALE.maketext("Only list products that use the “[_1]” validation type.", product.x_validation_type_display_name)
                    };
                });

                angular.forEach(certTerms, function(item) {
                    products_search_options.certTerms.options.push(item);
                });
                angular.forEach(providers, function(item) {
                    products_search_options.sslProvider.options.push(item);
                });
                angular.forEach(validationTypes, function(item) {
                    products_search_options.validationType.options.push(item);
                });

                for (var key in products_search_options) {
                    if (products_search_options.hasOwnProperty(key)) {
                        if (products_search_options[key].options.length <= 1) {
                            delete products_search_options[key];
                        }
                    }
                }

                return CertificatesService.get_product_search_options();
            };

            CertificatesService.get_product_by_id = function(provider_name, product_id) {
                for (var i = 0; i < products.length; i++) {
                    if (products[i].id === product_id && products[i].provider === provider_name) {
                        return products[i];
                    }
                }

                return;
            };

            var _ensure_domains_can_pass_dcv = function(domains, dcv_constraints) {
                var flat_domains = [];
                angular.forEach(domains, function(domain) {
                    if (domain.resolved === -1) {
                        flat_domains.push(domain.domain);
                        domain.resolving = true;
                    }
                });

                if (flat_domains.length === 0) {
                    return;
                }

                var product_has_no_redirects = function(p) {
                    //Compare against 0 to accommodate providers that
                    //don’t define this particular product attribute.
                    return 0 === p.x_max_http_redirects;
                };

                var apiCall = (new APIREQUEST.Class()).initialize(
                    "DCV",
                    "check_domains_via_http", {
                        domain: flat_domains,
                        dcv_file_allowed_characters: JSON.stringify(dcv_constraints.dcv_file_allowed_characters),
                        dcv_file_random_character_count: dcv_constraints.dcv_file_random_character_count,
                        dcv_file_extension: dcv_constraints.dcv_file_extension,
                        dcv_file_relative_path: dcv_constraints.dcv_file_relative_path,
                        dcv_user_agent_string: dcv_constraints.dcv_user_agent_string,
                    }
                );

                return _run_uapi(apiCall).then(function(results) {
                    for (var d = 0; d < domains.length; d++) {
                        var domain = domains[d];

                        domain.resolving = false;
                        domain.resolution_failure_reason = results.data[d].failure_reason;
                        domain.redirects_count = cjt2_parse.parseNumber(results.data[d].redirects_count);

                        //Success with redirects likely means that even
                        //rebuilding .htaccess didn’t fix the issue,
                        //so the customer will need to investigate manually.
                        if (domain.redirects_count && !domain.resolution_failure_reason) {
                            var prods_that_exclude_redirects = products.filter(product_has_no_redirects);

                            if (prods_that_exclude_redirects.length) {
                                var message = LOCALE.maketext("“[_1]”’s [output,abbr,DCV,Domain Control Validation] check completed correctly, but the check required an [asis,HTTP] redirection. The system tried to exclude such redirections from this domain by editing the website document root’s “[_2]” file, but the redirection persists. You should investigate further.", _.escape(domain.domain), ".htaccess");

                                growl.warning(message);

                                if (prods_that_exclude_redirects.length === products.length) {
                                    domain.resolution_failure_reason = LOCALE.maketext("This domain’s [output,abbr,DCV,Domain Control Validation] check completed correctly, but the check required [asis,HTTP] redirection. Because none of the available certificate products allows [asis,HTTP] redirection for [asis,DCV], you cannot use this interface to purchase an [asis,SSL] certificate for this domain.");
                                }

                            }
                        }

                        domain.resolved = !domain.resolution_failure_reason ? 1 : 0;
                    }
                }, function(error) {
                    api_error("DCV::check_domains_via_http", error);
                });
            };

            CertificatesService.get_default_provider_name = function() {

                var product;
                var products = CertificatesService.get_products();
                /* if it's set, use that */

                var cpStoreProducts = products.filter(function(product) {
                    if (product.provider_name === "cPStore") {
                        return true;
                    }
                });

                if (cpStoreProducts.length) {
                    /* if cPStore exists, use that */
                    product = cpStoreProducts[0];
                } else {
                    /* otherwise use first */
                    product = products[0];
                }

                return product.provider_name;

            };

            CertificatesService.get_provider_specific_dcv_constraints = function(provider_name) {

                var apiCall = (new APIREQUEST.Class()).initialize(
                    "Market",
                    "get_provider_specific_dcv_constraints", {
                        provider: provider_name
                    }
                );

                return _run_uapi(apiCall);
            };


            CertificatesService.ensure_domains_can_pass_dcv = function(domains, provider_name) {

                return CertificatesService.get_provider_specific_dcv_constraints(provider_name).then(function(results) {

                    return _ensure_domains_can_pass_dcv(domains, results.data);

                }, function(error) {
                    api_error("Market::get_provider_specific_dcv_constraints", error);
                });

            };

            CertificatesService.verify_login_token = function(provider, login_token, url_after_login) {
                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Market", "validate_login_token");
                apiCall.addArgument("login_token", login_token);
                apiCall.addArgument("url_after_login", url_after_login);
                apiCall.addArgument("provider", provider);

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                return deferred.promise;
            };

            CertificatesService.set_url_after_checkout = function(provider, access_token, order_id, url_after_checkout) {
                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Market", "set_url_after_checkout");
                apiCall.addArgument("provider", provider);
                apiCall.addArgument("access_token", access_token);
                apiCall.addArgument("order_id", order_id);
                apiCall.addArgument("url_after_checkout", url_after_checkout);

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;

                        //This specific case is unusual because we want to
                        //give the error handler the entire object so that it
                        //can check for “data” in the response. See the
                        //documentation for Market::set_url_after_checkout.
                        var method = response.status ? "resolve" : "reject";

                        deferred[method](response);
                    });

                return deferred.promise;
            };

            CertificatesService.fetch_valid_www_subject_names = function(domains, provider_name) {

                var www_domains = domains.filter(function(domain) {
                    if (domain.is_wildcard || domain.is_proxy) {
                        return false;
                    }
                    return true;
                }).map(function(domain) {
                    return {
                        domain: "www." + domain.domain,
                        resolved: -1
                    };
                });

                return CertificatesService.ensure_domains_can_pass_dcv(www_domains, provider_name).then(function() {
                    return www_domains;
                });

            };

            //Returns a YYYY-MM-DD string
            //
            //AngularJS sets all date models as Date objects,
            //so we convert those to YYYY-MM-DD for the order.
            //It’s a bit hairy because we can’t use
            //.toISOString() since that date will be UTC, while
            //the numbers we want are the ones the user gave.
            function _date_to_yyyymmdd(the_date) {
                return [
                    the_date.getFullYear(),
                    _sprintf_02d(1 + the_date.getMonth()),
                    _sprintf_02d(the_date.getDate()),
                ].join("-");
            }

            var _request_certificates = function(provider, access_token, certificates, url_after_checkout, www_domains) {
                var www_domain_map = {};
                var failed_www_domains = [];
                www_domains.forEach(function(domain) {
                    www_domain_map[domain.domain] = domain.resolved === 1;
                    if (!www_domain_map[domain.domain]) {
                        failed_www_domains.push(domain.domain);
                    }
                });

                if (failed_www_domains.length) {
                    growl.warning(LOCALE.maketext("The following “www” [numerate,_1,domain,domains] did not resolve, so the following [numerate,_3,certificate,certificates] will not secure [numerate,_1,it,them]: [list_and_quoted,_2]", failed_www_domains.length, failed_www_domains, certificates.length));
                }

                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Market", "request_ssl_certificates");
                apiCall.addArgument("provider", provider);
                apiCall.addArgument("access_token", access_token);
                apiCall.addArgument("url_after_checkout", url_after_checkout);

                var json_certs = certificates.map(function(cert) {

                    var new_cert = {
                        product_id: cert.get_product().id,
                        subject_names: cert.get_subject_names(),
                        vhost_names: cert.get_virtual_hosts(),
                        price: cert.get_price(),
                        validity_period: cert.get_validity_period()
                    };

                    if (cert.get_product().x_identity_verification) {
                        var iden_ver = cert.get_identity_verification();

                        new_cert.identity_verification = {};
                        cert.get_product().x_identity_verification.forEach(function(idv) {
                            var k = idv.name;

                            //If the form didn’t give us any data for it,
                            //then don’t submit it.
                            if (!iden_ver[k]) {
                                return;
                            }

                            //“date” items come from AngularJS as Date objects,
                            //but they come from JSON as ISO 8601 strings.
                            if (idv.type === "date") {
                                var date_obj;

                                try {
                                    date_obj = new Date(iden_ver[k]);
                                } catch (e) {
                                    $log.warn("new Date() failed; ignoring", iden_ver[k], e);
                                }

                                if (date_obj) {
                                    new_cert.identity_verification[k] = _date_to_yyyymmdd(date_obj);
                                }
                            } else {
                                new_cert.identity_verification[k] = iden_ver[k];
                            }
                        });
                    }

                    var valid_www_domains = [];
                    new_cert.subject_names.forEach(function(subject_name) {
                        var domain = subject_name[1];
                        if (www_domain_map["www." + domain]) {
                            valid_www_domains.push(["dNSName", "www." + domain]);
                        }
                    });

                    new_cert.subject_names = new_cert.subject_names.concat(valid_www_domains);

                    return JSON.stringify(new_cert);
                });

                apiCall.addArgument("certificate", json_certs);

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                deferred.promise.catch(CertificatesService.reset.bind(CertificatesService));

                return deferred.promise;
            };


            CertificatesService.request_certificates = function(provider, access_token, certificates, url_after_checkout) {

                /* build domains for www check */
                var all_domains = [];
                var cert_domains = [];

                certificates.forEach(function(certificate, cert_key) {

                    cert_domains[cert_key] = [];

                    certificate.get_domains().forEach(function(domain) {
                        if (domain.is_wildcard) {
                            return false;
                        }
                        all_domains.push(domain);
                        cert_domains[cert_key].push(domain);
                    });

                });

                /* no wwws, all wildcards or something */
                if (all_domains.length === 0) {
                    return _request_certificates(provider, access_token, certificates, url_after_checkout, all_domains);
                }

                /* www check */
                return CertificatesService.fetch_valid_www_subject_names(all_domains, provider).then(function(www_domains) {

                    return _request_certificates(provider, access_token, certificates, url_after_checkout, www_domains);

                });

            };

            CertificatesService.get_pending_certificates = function() {
                return pending_certificates;
            };

            var _assign_pending_certificates = function(new_pending) {
                pending_certificates = new_pending;
                pending_certificates.forEach(function(pcert) {

                    //Typecasts
                    pcert.order_id += "";
                    pcert.order_item_id += "";
                    pcert.product_id += "";
                });
            };

            CertificatesService.fetch_pending_certificates = function() {

                if (CPANEL.PAGE.pending_certificates) {
                    _assign_pending_certificates(CPANEL.PAGE.pending_certificates);

                    /* if exists on page load use it, but if view switching, we want to reload, so clear this variable */
                    CPANEL.PAGE.pending_certificates = null;
                    if (pending_certificates.length) {
                        return true;
                    }
                }

                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Market", "get_pending_ssl_certificates");

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                deferred.promise.then(function(result) {
                    _assign_pending_certificates(result.data);
                }, function(error) {
                    api_error("Market::pending_certificates", error);
                });

                return deferred.promise;
            };

            CertificatesService.add_raw_installed_host = function(ihost) {
                ihost.certificate.is_self_signed = parseInt(ihost.certificate.is_self_signed, 10) === 1;
                installed_hosts.push(ihost);
                installed_hosts_map[ihost.servername] = ihost;
            };

            CertificatesService.get_domain_certificate = function(domain) {
                return ssl_domains[domain];
            };

            CertificatesService.get_domain_by_domain = function(domain) {
                var domains = CertificatesService.get_all_domains();
                for (var i = 0; i < domains.length; i++) {
                    if (domains[i].domain === domain) {
                        return domains[i];
                    }
                }
                return;
            };

            CertificatesService.get_virtual_host_certificate = function(virtual_host) {
                for (var i = 0; i < installed_hosts.length; i++) {
                    if (installed_hosts[i].servername === virtual_host.display_name) {
                        return installed_hosts[i];
                    }
                }

                return installed_hosts[0];
            };

            CertificatesService.fetch_installed_hosts = function() {
                if (installed_hosts) {
                    return true;
                }

                if (CPANEL.PAGE.installed_hosts) {
                    if (!CPANEL.PAGE.installed_hosts.length) {
                        return true; /* Defined, but no installed hosts */
                    }
                    installed_hosts = [];
                    installed_hosts_map = {};
                    ssl_domains = {};
                    angular.forEach(CPANEL.PAGE.installed_hosts, function(ihost) {
                        CertificatesService.add_raw_installed_host(ihost);
                    });
                    if (installed_hosts.length) {
                        return true;
                    }
                }

                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("SSL", "installed_hosts");

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                deferred.promise.then(function(result) {
                    installed_hosts = [];
                    installed_hosts_map = {};
                    ssl_domains = {};
                    angular.forEach(result.data, function(ihost) {
                        CertificatesService.add_raw_installed_host(ihost);
                    });
                }, function(error) {
                    api_error("SSL::installed_hosts", error);
                });

                return deferred.promise;
            };

            var _make_batch = function(calls) {
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Batch", "strict");

                apiCall.addArgument("command", calls.map(JSON.stringify, JSON));

                return apiCall;
            };

            CertificatesService.install_certificate = function(cert, vhost_names) {
                var apiCall = _make_batch(vhost_names.map(function(vh) {
                    return [
                        "SSL",
                        "install_ssl", {
                            cert: cert,
                            domain: vh
                        }
                    ];
                }));

                return _run_uapi(apiCall);
            };

            CertificatesService.get_ssl_certificate_if_available = function(provider, order_item_id) {
                var apiCall = new APIREQUEST.Class();
                apiCall.initialize("Market", "get_ssl_certificate_if_available");
                apiCall.addArgument("provider", provider);
                apiCall.addArgument("order_item_id", order_item_id);

                return _run_uapi(apiCall);
            };

            CertificatesService.get_installed_ssl_for_domain = function(domain) {
                var apiCall = new APIREQUEST.Class();
                apiCall.initialize("SSL", "installed_host");
                apiCall.addArgument("domain", domain);

                return _run_uapi(apiCall);
            };

            CertificatesService.cancel_pending_ssl_certificate_and_poll = function(provider, order_item_id) {
                var apiCall = _make_batch([
                    [
                        "Market",
                        "cancel_pending_ssl_certificate", {
                            provider: provider,
                            order_item_id: order_item_id
                        }
                    ],
                    [
                        "Market",
                        "get_ssl_certificate_if_available", {
                            provider: provider,
                            order_item_id: order_item_id
                        }
                    ],
                ]);

                return _run_uapi(apiCall);
            };

            CertificatesService.cancel_pending_ssl_certificates = function(provider, order_item_ids) {
                var apiCall = _make_batch(order_item_ids.map(function(oiid) {
                    return [
                        "Market",
                        "cancel_pending_ssl_certificate", {
                            provider: provider,
                            order_item_id: oiid
                        }
                    ];
                }));

                return _run_uapi(apiCall);
            };

            CertificatesService.cancel_certificate = function(virtual_host, provider, order_item_id) {
                CertificatesService.cancel_pending_ssl_certificate(provider, order_item_id).then(function() {
                    angular.forEach(virtual_host.get_selected_domains(), function(domain) {
                        domain.selected = false;
                    });
                });
            };

            CertificatesService.process_ssl_pending_queue = function() {

                var deferred = $q.defer();
                var apiCall = new APIREQUEST.Class();

                apiCall.initialize("Market", "process_ssl_pending_queue");

                API.promise(apiCall.getRunArguments())
                    .done(function(response) {
                        response = response.parsedResponse;
                        if (response.status) {
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response.error);
                        }
                    });

                return deferred.promise;
            };

            CertificatesService.hard_reset = function() {
                CertificatesService.reset();
                CPANEL.PAGE.domains = null;
            };

            CertificatesService.reset = function() {
                virtual_hosts = [];
                all_domains = [];
                products = [];
                installed_hosts = null;
                purchasing_certs = [];
                ssl_domains = {};
                orders = [];
                wildcard_map = {};
            };

            CertificatesService.reset_purchasing_certificates = function() {
                purchasing_certs = [];
            };

            CertificatesService.dismiss_introduction = function() {
                introduction_dismissed = true;
            };

            CertificatesService.show_introduction_block = function() {
                return !introduction_dismissed && !growlMsg.getAllMessages().length;
            };

            return CertificatesService;
        }

        return app.factory("CertificatesService", ["VirtualHost", "Certificate", "$q", "growl", "growlMessages", "$log", CertificatesServiceFactory]);
    });
