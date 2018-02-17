/* jshint -W098 */
var DNSSEC = (function() {

    function toggle_loading_button(state) {
        if (state) {
            // make the button appear to be loading
            YAHOO.util.Dom.get("toggle_dnssec").disabled = true;
            YAHOO.util.Dom.setStyle("btnLoader", "display", "inline-block");
            YAHOO.util.Dom.addClass("btnLoader", "fa-spin");
        } else {
            // reset the button state
            YAHOO.util.Dom.get("toggle_dnssec").disabled = false;
            YAHOO.util.Dom.setStyle("btnLoader", "display", "none");
            YAHOO.util.Dom.removeClass("btnLoader", "fa-spin");
        }
    }

    function update_section() {
        if (YAHOO.util.Dom.get("dnssec_div") === null) {
            return;
        }
        var callback = {
            success: function(o) {
                YAHOO.util.Dom.get("dnssec_div").innerHTML = o.responseText;
            },
            failure: function(o) {
                YAHOO.util.Dom.get("dnssec_div").innerHTML = "<div style=\"padding: 20px\">" + CPANEL.icons.error + " " + LOCALE.maketext("AJAX Error") + ": " + LOCALE.maketext("Please refresh the page and try again.") + "</div>";
            }
        };

        // send the AJAX request
        var domain = YAHOO.util.Dom.get("domain").value;
        YAHOO.util.Connect.asyncRequest("GET", "dnssec.html?domain=" + domain, callback, "");

        YAHOO.util.Dom.get("dnssec_div").innerHTML = "<div style=\"padding: 20px\">" + CPANEL.icons.ajax + " " + LOCALE.maketext("Loading …") + "</div>";
    }

    function _toggle_dnssec(state) {
        var api_method = (state) ? "enable_dnssec" : "disable_dnssec";
        var domain = YAHOO.util.Dom.get("domain").value;

        var callback = {
            success: function(o) {
                toggle_loading_button(false);

                var result;
                try {
                    result = YAHOO.lang.JSON.parse(o.responseText);
                } catch (e) {
                    CPANEL.widgets.status_bar("dnssec_status_bar", "error", LOCALE.maketext("Error"), LOCALE.maketext("JSON parse failed."));
                    return;
                }

                if (result.status) {
                    if (result.metadata.DNSSEC && result.metadata.DNSSEC.failed) {
                        CPANEL.widgets.status_bar("dnssec_status_bar", "error", LOCALE.maketext("Error"), result.metadata.DNSSEC.failed[domain]);
                    } else {
                        update_section();
                    }
                } else {
                    CPANEL.widgets.status_bar("dnssec_status_bar", "error", LOCALE.maketext("Error"), result.errors[0]);
                }
            },
            failure: function(o) {
                toggle_loading_button(false);
                CPANEL.widgets.status_bar("dnssec_status_bar", "error", LOCALE.maketext("AJAX Error"), LOCALE.maketext("Please refresh the page and try again."));
            }
        };

        YAHOO.util.Connect.asyncRequest("GET", CPANEL.urls.uapi("DNSSEC", api_method, { "domain": domain } ), callback, "");
        toggle_loading_button(true);
    }

    function _toggle_warning(state) {
        if (state) {
            CPANEL.animate.slide_down("dnssec-disable-warning");
        } else {
            CPANEL.animate.slide_up("dnssec-disable-warning");
        }
    }

    function show_warning() {
        _toggle_warning(true);
    }

    function hide_warning() {
        _toggle_warning(false);
    }

    function show_digest(event, key) {
        var select = event.target;
        var selectedOption = select.options[select.selectedIndex];

        // hide the other digests
        for (var i = 0, len = select.options.length; i < len; i++) {
            YAHOO.util.Dom.setStyle("record_" + key + "_algo_" + select.options[i].value , "display", "none");
        }

        // show the one we want
        YAHOO.util.Dom.setStyle("record_" + key + "_algo_" + selectedOption.value, "display", "inline");
    }

    return {
        update_section: update_section,

        show_digest: show_digest,

        confirm_disable: show_warning,

        cancel_disable: hide_warning,

        enable: function() {
            _toggle_dnssec(true);
        },
        disable: function() {
            hide_warning();
            _toggle_dnssec(false);
        }
    };
})();

