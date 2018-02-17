// NOTE: This page is pretty complicated.  There is a lot of DOM being injected and you need to pay attention to the objects that get
// passed around from function to function.  I originally had things separated by building all the DOM all at once and then adding all the event handlers right after.
// I had to scrap that because it was too slow.  If you see something that makes you say "geez, this is so hard to read, why did he do that?" the answer is: it's like that
// to be fast.  If you make an architecture/DOM change be sure to test it against a large number of dnszone addresses in the table.
// C. Oakman - chriso@cpanel.net

// globals
var API;
var ZONE;
var DESTROYING_OLD_TABLE = false;
var EDIT_ZONE_LINE_VALID = {};
var OPEN_MODULE = 0;
var ADD_ZONE_LINE_VALID = {};

/* globals DNSSEC: false */
/* jshint -W003 */
/* jshint -W098 */

// TODO: put this in CPANEL.validate
var typeof_validator = function(obj) {
    if (typeof(obj.add) !== "function") {
        return false;
    }
    if (typeof(obj.attach) !== "function") {
        return false;
    }
    if (typeof(obj.title) !== "string") {
        return false;
    }
    return true;
};

// convert names to their explicit version in the zone file to avoid confusion
// foo  --> foo.example.com.
// foo. --> foo.example.com.
// foo.example.com  --> foo.example.com.
// foo.example.com. --> foo.example.com. (unmodified)
var format_dns_name = function(el) {
    el = YAHOO.util.Dom.get(el);
    var name = el.value;

    var domain = YAHOO.util.Dom.get("domain").value;

    if (name === "") {
        return;
    }

    // add a dot at the end of the name
    if (CPANEL.validate.end_of_string(name, ".") === false) {
        name += ".";
    }

    // add the domain if it does not already exist
    if (CPANEL.validate.end_of_string(name, domain + ".") === false) {
        name += domain + ".";
    }

    el.value = name;
};

var toggle_type_inputs = function() {
    // clear any validation from other types
    ADD_ZONE_LINE_VALID.address.clear_messages();
    ADD_ZONE_LINE_VALID.cname.clear_messages();
    ADD_ZONE_LINE_VALID.txtdata.clear_messages();
    ADD_ZONE_LINE_VALID.ipv6.clear_messages();
    ADD_ZONE_LINE_VALID.priority.clear_messages();
    ADD_ZONE_LINE_VALID.weight.clear_messages();
    ADD_ZONE_LINE_VALID.port.clear_messages();
    ADD_ZONE_LINE_VALID.target.clear_messages();

    var type = YAHOO.util.Dom.get("type").value;

    if (type === "A") {
        YAHOO.util.Dom.setStyle("type_A", "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_A", "display", "none");
    }

    if (type === "CNAME") {
        YAHOO.util.Dom.setStyle("type_CNAME", "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_CNAME", "display", "none");
    }

    if (type === "TXT") {
        YAHOO.util.Dom.setStyle("type_TXT", "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_TXT", "display", "none");
    }

    if (type === "AAAA") {
        YAHOO.util.Dom.setStyle("type_AAAA", "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_AAAA", "display", "none");
    }

    if (type === "SRV") {
        YAHOO.util.Dom.setStyle("type_SRV", "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_SRV", "display", "none");
    }
};

// toggle zone line type inputs
var toggle_types = function(e, o) {

    // clear validation messages when switching type
    EDIT_ZONE_LINE_VALID.address.clear_messages();
    EDIT_ZONE_LINE_VALID.cname.clear_messages();
    EDIT_ZONE_LINE_VALID.txtdata.clear_messages();
    EDIT_ZONE_LINE_VALID.ipv6.clear_messages();
    EDIT_ZONE_LINE_VALID.priority.clear_messages();
    EDIT_ZONE_LINE_VALID.port.clear_messages();
    EDIT_ZONE_LINE_VALID.weight.clear_messages();
    EDIT_ZONE_LINE_VALID.target.clear_messages();

    var type = YAHOO.util.Dom.get("edit_zone_line_type_" + o.index).value;

    if (type === "A") {
        YAHOO.util.Dom.setStyle("type_A_" + o.index, "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_A_" + o.index, "display", "none");
    }

    if (type === "AAAA") {
        YAHOO.util.Dom.setStyle("type_AAAA_" + o.index, "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_AAAA_" + o.index, "display", "none");
    }

    if (type === "CNAME") {
        YAHOO.util.Dom.setStyle("type_CNAME_" + o.index, "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_CNAME_" + o.index, "display", "none");
    }

    if (type === "SRV") {
        YAHOO.util.Dom.setStyle("type_SRV_priority_" + o.index, "display", "");
        YAHOO.util.Dom.setStyle("type_SRV_weight_" + o.index, "display", "");
        YAHOO.util.Dom.setStyle("type_SRV_port_" + o.index, "display", "");
        YAHOO.util.Dom.setStyle("type_SRV_target_" + o.index, "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_SRV_priority_" + o.index, "display", "none");
        YAHOO.util.Dom.setStyle("type_SRV_weight_" + o.index, "display", "none");
        YAHOO.util.Dom.setStyle("type_SRV_port_" + o.index, "display", "none");
        YAHOO.util.Dom.setStyle("type_SRV_target_" + o.index, "display", "none");
    }

    if (type === "TXT") {
        YAHOO.util.Dom.setStyle("type_TXT_" + o.index, "display", "");
    }
    else {
        YAHOO.util.Dom.setStyle("type_TXT_" + o.index, "display", "none");
    }
};

// message shown when no entries are returned from the API2 call
var show_no_zone_entries = function() {
    var html = "";
    html += "<div id=\"loading_div\" style=\"height: 75px; padding-top: 20px; text-align: center\">";
    html += LOCALE.maketext("The system did not find any zone records.") + "<br /><br />";
    html += "</div>";
    YAHOO.util.Dom.get("dns_zone_table").innerHTML = html;
};

// update the dnszone accounts table with fresh information from the server
var update_dns_zone = function() {
    // success function defined here so we can use a setTimeout to call it
    // need to call this function like this to prevent a possible race condition when the ajax request returns faster
    // than it takes the browser to destroy the table elements and all event handlers in it
    var ajax_success = function(o) {
        // if we are still destroying the table poll every 10 milliseconds until that task is finished
        if (DESTROYING_OLD_TABLE === true) {
            setTimeout(function() {
                ajax_success(o);
            }, 10);
            return;
        }

        // parse the JSON response data
        try {
            var data = YAHOO.lang.JSON.parse(o.responseText);
            // success
            if (data.cpanelresult && data.cpanelresult.data && data.cpanelresult.data[0].status === 1) {
                ZONE = data.cpanelresult.data[0].record;
                API.serialnum = data.cpanelresult.data[0].serialnum;
                build_dnszone_table();
            } else {
                var error_message = LOCALE.maketext("The system experienced an unknown error.");
                if (data.cpanelresult && data.cpanelresult.data && data.cpanelresult.data[0].statusmsg) {
                    error_message = data.cpanelresult.data[0].statusmsg;
                }
                CPANEL.widgets.status_bar("zone_table_status_bar", "error", LOCALE.maketext("Error"), error_message);
                show_no_zone_entries();
            }
        } catch (e) {
            CPANEL.widgets.status_bar("zone_table_status_bar", "error", LOCALE.maketext("Error"), LOCALE.maketext("JSON parse failed."));
            show_no_zone_entries();
            return;
        }
    };

    // failure function defined here so we can use a setTimeout to call it
    // need to call this function like this to prevent a possible race condition when the ajax request returns faster
    // than it takes the browser to destroy the table elements and all event handlers in it
    var ajax_failure = function(o) {
        // if we are still destroying the table poll every 10 milliseconds until that task is finished
        if (DESTROYING_OLD_TABLE === true) {
            setTimeout(function() {
                ajax_failure(o);
            }, 10);
        }
        // once the table is fully destroyed we can write things to it
        else {
            var html = "<div style=\"padding: 20px 60px; height: 460px\">";
            html += LOCALE.maketext("Please refresh the page and try again.");
            html += "</div>";
            YAHOO.util.Dom.get("dns_zone_table").innerHTML = html;
        }
    };

    // callback functions
    var callback = {
        success: function(o) {
            ajax_success(o);
        },
        failure: function(o) {
            ajax_failure(o);
        },
        timeout: 60000 // case 59906: Adjust timeout to 60 seconds for loaded dns clusters
    };

    // set this variable to prevent a race condition with the ajax request
    DESTROYING_OLD_TABLE = true;

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest("GET", CPANEL.urls.json_api(API), callback, "");
    //ajax_success({ responseText: document.getElementById('json').value });

    // put the current table into a hidden div and show the loading icon
    var old_table = YAHOO.util.Dom.get("dns_zone_table").innerHTML;
    /* jshint -W108 */
    var html = "";
    // if this is the first time the page loads give the table an initial height
    if (old_table === "") {
        html += '<div id="loading_div" style="height: 100px">&nbsp;';
        html += '<div style="padding: 20px">';
        html += CPANEL.icons.ajax + " " + LOCALE.maketext("Loading …");
        html += '</div>';
        html += '</div>';
    } else {
        var table_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("dns_zone_table"));
        html = '<div id="loading_div" style="height: ' + table_region.height + 'px">';
        html += '<div style="padding: 20px">';
        html += CPANEL.icons.ajax + " " + LOCALE.maketext("Loading …");
        html += '</div>';
        html += '<div id="old_dns_zone_table" style="display:none">';
        html += old_table;
        html += '</div></div>';
    }
    /* jshint +W108*/
    YAHOO.util.Dom.get("dns_zone_table").innerHTML = html;

    // while the AJAX request is being sent purge the previous table of all event handlers
    // NOTE: this is a recursive DOM manipulation function and can take some time to execute, particularly in ie6/7
    YAHOO.util.Event.purgeElement("old_dns_zone_table", true);

    // clear any validation that may still be hanging around (ie6 bug with the YUI panels)
    if (YAHOO.util.Dom.inDocument(OPEN_MODULE.id) === true) {
        if (YAHOO.util.Dom.getStyle(OPEN_MODULE.id, "display") !== "none") {
            before_hide_module(OPEN_MODULE);
        }
    }

    // toggle the race condition flag
    DESTROYING_OLD_TABLE = false;
};

// delete a zone line
var delete_zone_line = function(e, o) {
    var index = o.index;

    // create the API variables
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "ZoneEdit",
        "cpanel_jsonapi_func": "remove_zone_record",
        "domain": API.domain,
        "line": ZONE[o.index]["Line"]
    };

    var reset_module = function() {
        YAHOO.util.Dom.setStyle("delete_input_" + o.index, "display", "block");
        YAHOO.util.Dom.get("delete_status_" + o.index).innerHTML = "";
        toggle_module(null, {
            "id": "dnszone_table_delete_div_" + index,
            "index": index,
            "action": "delete"
        });
    };

    // callback functions
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                // error
                if (data.cpanelresult.error) {
                    reset_module();
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("Error"), data.cpanelresult.error);
                }
                // success, remove the record from the table
                else if (data.cpanelresult.data[0].result.status === 1) {
                    API.serialnum = data.cpanelresult.data[0].result.newserial;
                    // refresh to ensure table and backend are synchronized.
                    update_dns_zone();
                }
                // show error message
                else if (data.cpanelresult.data[0].result.status === 0) {
                    reset_module();
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("Error"), data.cpanelresult.data[0].result.statusmsg);
                }
            }
            // JSON parse error
            catch (e) {
                reset_module();
                CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("Error"), LOCALE.maketext("JSON parse failed."));
            }

        },
        failure: function(o) {
            reset_module();
            CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("AJAX Error"), LOCALE.maketext("Please refresh the page and try again."));
        }
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest("GET", CPANEL.urls.json_api(api2_call), callback, "");

    // show the ajax loading icon
    YAHOO.util.Dom.setStyle("delete_input_" + o.index, "display", "none");
    YAHOO.util.Dom.get("delete_status_" + o.index).innerHTML = CPANEL.icons.ajax + " " + LOCALE.maketext("The system is deleting the record …");

};

// edit a zone line
// note: this function only runs after validation has passed
var edit_zone_line = function(e, o) {

    var index = o.index;
    content_changed(o.index, true);
    var name = YAHOO.util.Dom.get("name_" + o.index).value;
    var ttl = YAHOO.util.Dom.get("ttl_" + o.index).value;
    var type = YAHOO.util.Dom.get("edit_zone_line_type_" + o.index).value;
    var ipv6 = YAHOO.util.Dom.get("ipv6_" + o.index).value;
    var priority = YAHOO.util.Dom.get("priority_" + o.index).value;
    var srv_target = YAHOO.util.Dom.get("target_" + o.index).value;
    var weight = YAHOO.util.Dom.get("weight_" + o.index).value;
    var port = YAHOO.util.Dom.get("port_" + o.index).value;

    // make sure we format the dns zone name, in case
    // the form is submitted using the Return key
    format_dns_name("name_" + o.index);
    EDIT_ZONE_LINE_VALID.name.verify();
    if (!EDIT_ZONE_LINE_VALID.name.is_valid()) {
        return false;
    }
    name = YAHOO.util.Dom.get("name_" + o.index).value;

    // create the API variables
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "ZoneEdit",
        "cpanel_jsonapi_func": "edit_zone_record",
        "domain": API.domain,
        "line": ZONE[o.index]["Line"],
        "class": "IN",
        "type": type,
        "name": name,
        "ttl": ttl,
        "serialnum": API.serialnum
    };

    var new_value = null;
    if (type === "A") {
        api2_call.address = YAHOO.util.Dom.get("edit_zone_line_address_" + o.index).value;
        new_value = api2_call.address;
    }
    if (type === "AAAA") {
        api2_call.address = ipv6;
        new_value = CPANEL.inet6.formatForDisplay(api2_call.address);
    }
    if (type === "CNAME") {
        api2_call.cname = YAHOO.util.Dom.get("cname_" + o.index).value;
        new_value = api2_call.cname;
    }
    if (type === "SRV") {
        api2_call.priority = priority;
        api2_call.weight = weight;
        api2_call.port = port;
        api2_call.target = srv_target;
    }
    if (type === "TXT") {
        api2_call.txtdata = YAHOO.util.Dom.get("txtdata_" + o.index).value;
        new_value = api2_call.txtdata;
    }

    var reset_module = function() {
        toggle_module(null, {
            "id": "dnszone_table_edit_div_" + index,
            "index": index,
            "action": "edit"
        });
        YAHOO.util.Dom.setStyle("edit_input_" + index, "display", "block");
        YAHOO.util.Dom.get("edit_status_" + index).innerHTML = "";
    };

    // callback functions
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("Error"), data.cpanelresult.error);
                } else if (data.cpanelresult.data[0].result.status === 1) {
                    CPANEL.widgets.status_bar("status_bar_" + index, "success", LOCALE.maketext("The system successfully updated the record."));
                    API.serialnum = data.cpanelresult.data[0].result.newserial;
                    YAHOO.util.Dom.get("name_value_" + index).innerHTML = name;
                    YAHOO.util.Dom.get("ttl_value_" + index).innerHTML = ttl;
                    YAHOO.util.Dom.get("type_value_" + index).innerHTML = type;
                    if (type === "SRV") {
                        new_value = LOCALE.maketext("Priority:") + " " + YAHOO.util.Dom.get("priority_" + index).value.html_encode() + "<br>";
                        new_value += LOCALE.maketext("Weight:") + " " + YAHOO.util.Dom.get("weight_" + index).value.html_encode() + "<br>";
                        new_value += LOCALE.maketext("Port:") + " " + YAHOO.util.Dom.get("port_" + index).value.html_encode() + "<br>";
                        new_value += LOCALE.maketext("Target:") + " " + YAHOO.util.Dom.get("target_" + index).value.html_encode();

                        // update the values in the master data structure since the combined value
                        // shown in the record column of the table isn't usable without some
                        // massaging

                        ZONE[index]["priority"] = priority;
                        ZONE[index]["weight"] = weight;
                        ZONE[index]["port"] = port;
                        ZONE[index]["target"] = srv_target;

                        YAHOO.util.Dom.get("value_value_hehe_" + index).innerHTML = "<span class=\"value-entry\">" + new_value + "</span>";
                    }
                    else {
                        YAHOO.util.Dom.get("value_value_hehe_" + index).innerHTML = "<span class=\"value-entry\">" + new_value.html_encode() + "</span>";
                    }
                } else if (data.cpanelresult.data[0].result.status === 0) {
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("Error"), data.cpanelresult.data[0].result.statusmsg);
                }
            } catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("Error"), LOCALE.maketext("JSON parse failed."));
            }
            reset_module();
        },

        failure: function(o) {
            CPANEL.widgets.status_bar("status_bar_" + index, "error", LOCALE.maketext("AJAX Error"), LOCALE.maketext("Please refresh the page and try again."));
            reset_module();
        }
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest("GET", CPANEL.urls.json_api(api2_call), callback, "");

    // show the ajax loading icon
    YAHOO.util.Dom.setStyle("edit_input_" + index, "display", "none");
    YAHOO.util.Dom.get("edit_status_" + index).innerHTML = CPANEL.icons.ajax + " " + LOCALE.maketext("The system is editing the record …");

};

var toggle_confirm_reset_zone = function() {
    YAHOO.util.Dom.get("reset_zone_file").disabled = YAHOO.util.Dom.get("reset_zone_file_checkbox").checked ? false : true;
};

var reset_zone_file = function() {
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "ZoneEdit",
        cpanel_jsonapi_func: "resetzone",
        domain: YAHOO.util.Dom.get("domain").value
    };

    var reset_zone_ui = function() {
        YAHOO.util.Dom.get("reset_zone_file_checkbox").checked = false;
        YAHOO.util.Dom.get("reset_zone_file").disabled = true;
        YAHOO.util.Dom.get("reset_zone_status").innerHTML = "";
    };

    // callback functions
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                // error
                if (data.cpanelresult.error) {
                    CPANEL.widgets.status_bar("reset_zone_status_bar", "error", LOCALE.maketext("Error"), data.cpanelresult.error);
                }
                // success
                else if (data.cpanelresult.data[0].result.status === 1) {
                    CPANEL.widgets.status_bar("reset_zone_status_bar", "success", LOCALE.maketext("Zone File Reset"));
                    update_dns_zone();
                }
                // unknown error
                else if (data.cpanelresult.data[0].result.status === 0) {
                    CPANEL.widgets.status_bar("reset_zone_status_bar", "error", LOCALE.maketext("Error"), data.cpanelresult.data[0].result.statusmsg);
                }
                reset_zone_ui();
            }
            // JSON parse error
            catch (e) {
                CPANEL.widgets.status_bar("reset_zone_status_bar", "error", LOCALE.maketext("Error"), LOCALE.maketext("JSON parse failed."));
                reset_zone_ui();
            }
        },
        failure: function(o) {
            CPANEL.widgets.status_bar("reset_zone_status_bar", "error", LOCALE.maketext("AJAX Error"), LOCALE.maketext("Please refresh the page and try again."));
            reset_zone_ui();
        }
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest("GET", CPANEL.urls.json_api(api2_call), callback, "");

    YAHOO.util.Dom.get("reset_zone_file").disabled = true;
    YAHOO.util.Dom.get("reset_zone_status").innerHTML = CPANEL.icons.ajax + " " + LOCALE.maketext("The system will now restore your defaults …");
};

var reset_add_zone_line_form = function() {
    YAHOO.util.Dom.setStyle("add_new_zone_line_submit", "display", "block");
    YAHOO.util.Dom.get("add_new_zone_line_status").innerHTML = "";

    YAHOO.util.Dom.get("name").value = "";
    YAHOO.util.Dom.get("ttl").value = "";
    YAHOO.util.Dom.get("type").value = "A";
    YAHOO.util.Dom.get("address").value = "";
    YAHOO.util.Dom.get("ipv6").value = "";
    YAHOO.util.Dom.get("cname").value = "";
    YAHOO.util.Dom.get("priority").value = "";
    YAHOO.util.Dom.get("weight").value = "";
    YAHOO.util.Dom.get("port").value = "";
    YAHOO.util.Dom.get("target").value = "";
    YAHOO.util.Dom.get("txtdata").value = "";

    for (var i in ADD_ZONE_LINE_VALID) {
        if (typeof_validator(ADD_ZONE_LINE_VALID[i]) === true) {
            ADD_ZONE_LINE_VALID[i].clear_messages();
        }
    }

    toggle_type_inputs();
};

var validate_address = function(select_el, address_el) {
    var type = YAHOO.util.Dom.get(select_el).value;
    if (type === "A") {
        return CPANEL.validate.ip(YAHOO.util.Dom.get(address_el).value);
    }
    return true;
};

var validate_v6_address = function(select_el, ipv6_el) {
    var type = YAHOO.util.Dom.get(select_el).value;
    if (type === "AAAA") {
        return CPANEL.validate.ipv6(YAHOO.util.Dom.get(ipv6_el).value);
    }
    return true;
};

var validate_address_no_local_ips = function(select_el, address_el) {
    var type = YAHOO.util.Dom.get(select_el).value;
    if (type === "A") {
        return CPANEL.validate.no_local_ips(YAHOO.util.Dom.get(address_el).value);
    }
    return true;
};

var validate_cname = function(select_el, cname_el) {
    var type = YAHOO.util.Dom.get(select_el).value;
    if (type === "CNAME") {
        var name = YAHOO.util.Dom.get(cname_el).value;
        return ((CPANEL.validate.zone_name(name)) && !(/\.$/.test(name)) &&  !CPANEL.validate.ip(name));
    }
    return true;
};

var validate_txtdata = function(select_el, txtdata_el) {
    var type = YAHOO.util.Dom.get(select_el).value;
    if (type === "TXT") {
        var txtdata = YAHOO.util.Dom.get(txtdata_el).value;
        return txtdata.trim().length > 0;
    }
    return true;
};

var validate_unique_cname = function(input_el, idx) {

    var name = YAHOO.util.Dom.get(input_el).value;

    for (var i = 0; i < ZONE.length; i++) {
        if (ZONE[i].type.toLowerCase() !== "cname") {
            continue;
        }

        if ((ZONE[i].name.toLowerCase() === name.toLowerCase()) && (i !== parseInt(idx))) {
            return false;
        }
    }

    return true;
};

var validate_port_weight_priority = function(select_el, input_el) {
    var type = YAHOO.util.Dom.get(select_el).value;
    if (type === "SRV") {
        var text_value = YAHOO.util.Dom.get(input_el).value;
        if (CPANEL.validate.integer(text_value)) {
            var value_as_int = parseInt(text_value,10);
            return value_as_int >= 0 && value_as_int <= 65535;
        }
        return false;
    }
    return true;
};

var validate_target = function(select_el, input_el) {
    var type = YAHOO.util.Dom.get(select_el).value;
    if (type === "SRV") {
        var field_value = YAHOO.util.Dom.get(input_el).value;

        // "." is a valid target, per RFC 2782

        if (field_value === ".") {
            return true;
        }
        return CPANEL.validate.zone_name(field_value);
    }
    return true;
};

// destroy the current dnszone table and build a new one from the ZONE variable
var build_dnszone_table = function() {

    YAHOO.util.Dom.get("dns_zone_table").innerHTML = build_dnszone_table_markup();
    activate_dnszone_table();
    OPEN_MODULE = 0;
};

/*
// we're not currently using this function; commenting out for now - C. Oakman 14 Sep 09
var validate_dnszone_with_changes = function(newrecord) {
    var domain = newrecord.domain;
    var newname = (newrecord.name.match(/\.$/) ? newrecord.name : (newrecord.name + domain + '.'));
    var newtype = newrecord.type;
    for (var i in ZONE) {
        if (ZONE[i].name == newname) {
            if (newtype == 'CNAME') {
                return(0, newname + ' already has a ' + ZONE[i].type + ' record.  You many not mix CNAME records with other records');
            } else if (ZONE[i].type == 'CNAME') {
                return(0, newname + ' already has a CNAME record.  You many not mix CNAME records with other records (' + newtype + ')');
            }
        }
    }
    return (1, 'OK');
}
*/

// build the HTML markup for the new dnszone table
var build_dnszone_table_markup = function() {

    /* jshint -W108 */
    // set the initial row stripe
    var row_toggle = 'rowA';

    // loop through the dnszone accounts and build the table
    var html = '<table id="table_dns_zone" class="table table-striped">';
    html += '<thead>';
    html += '<tr class="dt_header_row">';
    html += '<th>' + LOCALE.maketext("Name") + '</th>';
    html += '<th>TTL</th>';
    html += '<th>Class</th>';
    html += '<th>' + LOCALE.maketext("Type") + '</th>';
    html += '<th colspan="2">' + LOCALE.maketext("Record") + '</th>';
    html += '<th>' + LOCALE.maketext("Actions") + '</th>';
    html += '</tr>';
    html += '</thead>';

    for (var i = 0; i < ZONE.length; i++) {
        if (!ZONE[i]["type"].match(/^(A|AAAA|CNAME|SRV|TXT)$/)) {
            continue; // only edit these types
        }

        if (ZONE[i]["name"].match(/^default\._domainkey\./)) {
            continue; // do not show domain keys
        }

        html += '<tr id="info_row_' + i + '" class="dt_info_row ' + row_toggle + '">';

        // A, MX, CNAME, TXT records
        if (ZONE[i]['type'].match(/^(A|AAAA|CNAME|SRV|TXT)$/)) {
            /* jshint -W108 */
            html += '<td id="name_value_' + i + '">' + ZONE[i]['name'] + '</td>';
            html += '<td id="ttl_value_' + i + '">' + ZONE[i]['ttl'] + '</td>';
            html += '<td>' + ZONE[i]['class'] + '</td>';
            html += '<td id="type_value_' + i + '">' + ZONE[i]['type'] + '</td>';

            // A
            if (ZONE[i]["type"] === "A") {
                html += '<td colspan="2" id="value_value_hehe_' + i + '"><span class="value-entry">' + ZONE[i]['address'] + '</span></td>';
            }
            // CNAME
            else if (ZONE[i]["type"] === "CNAME") {
                html += '<td colspan="2" id="value_value_hehe_' + i + '"><span class="value-entry">' + ZONE[i]['cname'] + '</span></td>';
            }
            // TXT
            else if (ZONE[i]["type"] === "TXT") {
                var value_disp = CPANEL.util.wrap_string_after_pattern_and_html_encode(ZONE[i].txtdata, /.{10}/g);
                html += '<td colspan="2" id="value_value_hehe_' + i + '"><span class="value-entry">' + value_disp + '</span></td>';
            }
            else if (ZONE[i]["type"] === "AAAA") {
                html += '<td colspan="2" id="value_value_hehe_' + i + '"><span class="value-entry">' + CPANEL.inet6.formatForDisplay(ZONE[i]['address']).html_encode() + '</span></td>';
            }
            else if (ZONE[i]["type"] === "SRV") {
                html += '<td colspan="2" id="value_value_hehe_' + i + '"><span class="value-entry">' + LOCALE.maketext("Priority:") + " " + ZONE[i]['priority'].html_encode() + '<br>';
                html += LOCALE.maketext("Weight:") + " " + ZONE[i]['weight'].html_encode() + '<br>';
                html += LOCALE.maketext("Port:") + " " + ZONE[i]['port'].html_encode() + '<br>';
                html += LOCALE.maketext("Target:") + " " + ZONE[i]['target'].html_encode();
                html += '</span></td>';
            }
        }

        // action links
        html += '<td>';
        html += '<span class="btn btn-link" id="dnszone_table_edit_' + i + '"><span class="glyphicon glyphicon-pencil"></span> ' + LOCALE.maketext("Edit") + '</span>&nbsp;&nbsp;&nbsp;';
        html += '<span class="btn btn-link" id="dnszone_table_delete_' + i + '"><span class="glyphicon glyphicon-trash"></span> ' + LOCALE.maketext("Delete") + '</span>';
        html += '</td>';


        html += '</tr>';

        html += '<tr id="module_row_' + i + '" class="dt_module_row ' + row_toggle + '"><td colspan="7">';
        html += '<div id="dnszone_table_edit_div_' + i + '" class="dt_module"></div>';
        html += '<div id="dnszone_table_delete_div_' + i + '" class="dt_module"></div>';
        html += '<div id="status_bar_' + i + '" class="cjt_status_bar"></div>';
        html += '</td></tr>';

        // alternate row stripes
        row_toggle = (row_toggle === "rowA") ? row_toggle = 'rowB' : 'rowA';
    }
    html += '</table>';

    /* jshint +W108 */

    return html;
};

// add event handlers for the new dnszone table
var activate_dnszone_table = function() {
    for (var i in ZONE) {
        if (ZONE.hasOwnProperty(i)) {
            if (!ZONE[i]["type"].match(/^(A|AAAA|CNAME|SRV|TXT)$/)) {
                continue;
            } // only edit these types
            if (ZONE[i]["name"].match(/^default\._domainkey\./)) {
                continue;
            } // do not show domain keys

            YAHOO.util.Event.on("dnszone_table_edit_" + i, "click", toggle_module, {
                "id": "dnszone_table_edit_div_" + i,
                "index": i,
                "action": "edit"
            });
            YAHOO.util.Event.on("dnszone_table_delete_" + i, "click", toggle_module, {
                "id": "dnszone_table_delete_div_" + i,
                "index": i,
                "action": "delete"
            });
        }
    }
};

var toggle_module = function(e, o) {
    // if a div, that is not o, is already open, close it
    if (OPEN_MODULE && OPEN_MODULE.id !== o.id && YAHOO.util.Dom.getStyle(OPEN_MODULE.id, "display") !== "none") {
        var currently_open_div = OPEN_MODULE;
        before_hide_module(currently_open_div);
        CPANEL.animate.slide_up(currently_open_div.id, function() {
            after_hide_module(currently_open_div);
        });
    }

    // if o is currently displayed, hide it
    if (YAHOO.util.Dom.getStyle(o.id, "display") !== "none") {
        before_hide_module(o);
        CPANEL.animate.slide_up(o.id, function() {
            after_hide_module(o);
        });
    }
    // else show o and set it as the OPEN_MODULE
    else {
        before_show_module(o);
        CPANEL.animate.slide_down(o.id, function() {
            after_show_module(o);
        });
        OPEN_MODULE = o;
    }
};

// build the HTML markup for the modules if it doesn't exist already
var before_show_module = function(o) {
    /* jshint -W108 */
    var el = YAHOO.util.Dom.get(o.id);
    if (el.innerHTML === "") {
        var html = "";
        if (o.action === "edit") {
            var all_values = ZONE[o.index]["name"] + ZONE[o.index]["ttl"] + ZONE[o.index]["type"];
            if (ZONE[o.index]["address"]) {
                all_values += ZONE[o.index]["address"];
            }
            if (ZONE[o.index]["cname"]) {
                all_values += ZONE[o.index]["cname"];
            }
            if (ZONE[o.index]["txtdata"]) {
                all_values += ZONE[o.index]["txtdata"];
            }
            if (ZONE[o.index]["ipv6"]) {
                all_values += ZONE[o.index]["ipv6"];
            }
            if (ZONE[o.index]["priority"]) {
                all_values += ZONE[o.index]["priority"];
            }
            if (ZONE[o.index]["weight"]) {
                all_values += ZONE[o.index]["weight"];
            }
            if (ZONE[o.index]["port"]) {
                all_values += ZONE[o.index]["port"];
            }
            if (ZONE[o.index]["target"]) {
                all_values += ZONE[o.index]["target"];
            }

            html += '<div class="form-group">';
            html += '<label>' + LOCALE.maketext("Name") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="name_' + o.index + '" />';
            html += '</div>';
            html += '<div id="name_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group">';
            html += '<label>TTL</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="ttl_' + o.index + '" />';
            html += '</div>';
            html += '<div id="ttl_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group">';
            html += '<label>' + LOCALE.maketext("Type") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<select class="form-control input-sm" id="edit_zone_line_type_' + o.index + '">';
            html += '<option selected="selected" value="A">A</option>';
            html += '<option value="AAAA">AAAA</option>';
            html += '<option value="CNAME">CNAME</option>';
            html += '<option value="SRV">SRV</option>';
            html += '<option value="TXT">TXT</option>';
            html += '</select>';
            html += '</div>';
            html += '<div class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_A_' + o.index + '">';
            html += '<label>' + LOCALE.maketext("Address") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="edit_zone_line_address_' + o.index + '" />';
            html += '</div>';
            html += '<div id="edit_zone_line_address_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_AAAA_' + o.index + '">';
            html += '<label>' + LOCALE.maketext("[output,abbr,IPv6,Internet Protocol Version 6] Address") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="ipv6_' + o.index + '" />';
            html += '</div>';
            html += '<div id="ipv6_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_CNAME_' + o.index + '" style="display: none">';
            html += '<label>CNAME</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="cname_' + o.index + '" />';
            html += '</div>';
            html += '<div id="cname_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_SRV_priority_' + o.index + '" style="display: none">';
            html += '<label>' + LOCALE.maketext("Priority") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="priority_' + o.index + '" />';
            html += '</div>';
            html += '<div id="priority_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_SRV_weight_' + o.index + '" style="display: none">';
            html += '<label>' + LOCALE.maketext("Weight") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="weight_' + o.index + '" />';
            html += '</div>';
            html += '<div id="weight_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_SRV_port_' + o.index + '" style="display: none">';
            html += '<label>' + LOCALE.maketext("Port") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="port_' + o.index + '" />';
            html += '</div>';
            html += '<div id="port_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_SRV_target_' + o.index + '" style="display: none">';
            html += '<label>' + LOCALE.maketext("Target") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="target_' + o.index + '" />';
            html += '</div>';
            html += '<div id="target_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group" id="type_TXT_' + o.index + '" style="display: none">';
            html += '<label>' + LOCALE.maketext("TXT Data") + '</label>';
            html += '<div class="row">';
            html += '<div class="col-xs-6">';
            html += '<input class="form-control input-sm" type="text" id="txtdata_' + o.index + '" />';
            html += '</div>';
            html += '<div id="txtdata_' + o.index + '_error" class="col-xs-6"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="form-group input-sm" id="edit_input_' + o.index + '">';
            html += '<div class="row">';
            html += '<div class="col-xs-12 col-sm-6">';
            html += '<input type="button" class="btn btn-primary btn-sm" value="' + LOCALE.maketext("Edit Record") + '" id="edit_zone_line_confirm_' + o.index + '" />';
            html += '<span class="btn btn-link btn-sm" id="edit_zone_line_cancel_' + o.index + '">cancel</span> ';
            html += '</div>';
            html += '<div style="display: none" id="edit_zone_line_current_values_' + o.index + '">' + all_values.html_encode() + '</div>';
            html += '<div class="col-xs-12 col-sm-6" id="edit_zone_line_current_values_' + o.index + '_error"></div>';
            html += '<div id="edit_status_' + o.index + '"></div>';
            html += '</div>';

        }

        if (o.action === 'delete') {
            html += LOCALE.maketext("Are you certain that you want to delete this record?") + '<br /><br />';
            html += '<div id="delete_input_' + o.index + '">';
            html += '<input type="button" class="btn btn-primary btn-sm" id="delete_zone_line_confirm_' + o.index + '" value="' + LOCALE.maketext("Delete") + '" />';
            html += '<span class="btn btn-link btn-sm" id="delete_zone_line_cancel_' + o.index + '">' + LOCALE.maketext("Cancel") + '</span>';
            html += '</div>';
            html += '<div id="delete_status_' + o.index + '"></div>';
        }
        /* jshint +W108 */
        el.innerHTML = html;
    }

    if (o.action === "edit") {
        YAHOO.util.Event.on("edit_zone_line_cancel_" + o.index, "click", toggle_module, o);
        YAHOO.util.Event.on("edit_zone_line_type_" + o.index, "change", toggle_types, o);
        YAHOO.util.Event.on("name_" + o.index, "blur", function() {
            format_dns_name(this);
            EDIT_ZONE_LINE_VALID.name.verify();
        });

        EDIT_ZONE_LINE_VALID = {};
        EDIT_ZONE_LINE_VALID.name = new CPANEL.validate.validator(LOCALE.maketext("Name"));
        EDIT_ZONE_LINE_VALID.name.add("name_" + o.index, "zone_name", LOCALE.maketext("A zone name [output,em,must] be a domain name, and can include a period at the end."));
        EDIT_ZONE_LINE_VALID.name.add("name_" + o.index, function() {
            return validate_unique_cname("name_" + o.index, o.index);
        }, LOCALE.maketext("Name matches an existing CNAME.") + "<br />" + LOCALE.maketext("All CNAMEs must be unique."));
        EDIT_ZONE_LINE_VALID.name.attach();

        EDIT_ZONE_LINE_VALID.ttl = new CPANEL.validate.validator("TTL");
        EDIT_ZONE_LINE_VALID.ttl.add("ttl_" + o.index, "positive_integer", LOCALE.maketext("The [output,acronym,TTL,Time To Live] value [output,em,must] be a positive integer."));
        EDIT_ZONE_LINE_VALID.ttl.attach();


        EDIT_ZONE_LINE_VALID.address = new CPANEL.validate.validator(LOCALE.maketext("Address"));
        EDIT_ZONE_LINE_VALID.address.add("edit_zone_line_address_" + o.index, function() {
            return validate_address("edit_zone_line_type_" + o.index, "edit_zone_line_address_" + o.index);
        }, LOCALE.maketext("The address [output,em,must] be an IP address."));
        EDIT_ZONE_LINE_VALID.address.add("edit_zone_line_address_" + o.index, function() {
            return validate_address_no_local_ips("edit_zone_line_type_" + o.index, "edit_zone_line_address_" + o.index);
        }, LOCALE.maketext("The address [output,em,cannot] be a local IP addres (for example, [output,class,127.0.0.1,code])."));

        EDIT_ZONE_LINE_VALID.address.attach();

        EDIT_ZONE_LINE_VALID.ipv6 = new CPANEL.validate.validator(LOCALE.maketext("[output,abbr,IPv6,Internet Protocol Version 6] Address"));
        EDIT_ZONE_LINE_VALID.ipv6.add("ipv6_" + o.index, function() {
            return validate_v6_address("edit_zone_line_type_" + o.index, "ipv6_" + o.index);
        }, LOCALE.maketext("This must be an [output,abbr,IPv6,Internet Protocol Version 6] address."));

        EDIT_ZONE_LINE_VALID.ipv6.attach();

        EDIT_ZONE_LINE_VALID.cname = new CPANEL.validate.validator("CNAME");
        EDIT_ZONE_LINE_VALID.cname.add("cname_" + o.index, function() {
            return validate_cname("edit_zone_line_type_" + o.index, "cname_" + o.index);
        }, LOCALE.maketext("The [asis,CNAME] value must be a valid zone name."));
        EDIT_ZONE_LINE_VALID.cname.attach();

        EDIT_ZONE_LINE_VALID.priority = new CPANEL.validate.validator(LOCALE.maketext("Priority"));
        EDIT_ZONE_LINE_VALID.priority.add("priority_" + o.index, function() {
            return validate_port_weight_priority("edit_zone_line_type_" + o.index, "priority_" + o.index);
        }, LOCALE.maketext("Must be integer between 0 and 65535."));
        EDIT_ZONE_LINE_VALID.priority.attach();

        EDIT_ZONE_LINE_VALID.weight = new CPANEL.validate.validator(LOCALE.maketext("Weight"));
        EDIT_ZONE_LINE_VALID.weight.add("weight_" + o.index, function() {
            return validate_port_weight_priority("edit_zone_line_type_" + o.index, "weight_" + o.index);
        }, LOCALE.maketext("Must be integer between 0 and 65535."));
        EDIT_ZONE_LINE_VALID.weight.attach();

        EDIT_ZONE_LINE_VALID.port = new CPANEL.validate.validator(LOCALE.maketext("Port"));
        EDIT_ZONE_LINE_VALID.port.add("port_" + o.index, function() {
            return validate_port_weight_priority("edit_zone_line_type_" + o.index, "port_" + o.index);
        }, LOCALE.maketext("Must be integer between 0 and 65535."));
        EDIT_ZONE_LINE_VALID.port.attach();

        EDIT_ZONE_LINE_VALID.target = new CPANEL.validate.validator(LOCALE.maketext("Target"));
        EDIT_ZONE_LINE_VALID.target.add("target_" + o.index, function() {
            return validate_target("edit_zone_line_type_" + o.index, "target_" + o.index);
        }, LOCALE.maketext("Target must be “.” or a valid zone name."));
        EDIT_ZONE_LINE_VALID.target.attach();

        EDIT_ZONE_LINE_VALID.txtdata = new CPANEL.validate.validator(LOCALE.maketext("TXT Data"));
        EDIT_ZONE_LINE_VALID.txtdata.add("txtdata_" + o.index, function() {
            return validate_txtdata("edit_zone_line_type_" + o.index, "txtdata_" + o.index);
        }, LOCALE.maketext("[asis,TXT] data [output,em,cannot] be empty."));
        EDIT_ZONE_LINE_VALID.txtdata.attach();

        EDIT_ZONE_LINE_VALID.content_changed = new CPANEL.validate.validator(LOCALE.maketext("The system successfully changed the content."));
        EDIT_ZONE_LINE_VALID.content_changed.add("edit_zone_line_current_values_" + o.index, function() {
            return content_changed(o.index);
        }, LOCALE.maketext("You must make changes to your settings before you click [output,em,Edit]."));
        EDIT_ZONE_LINE_VALID.content_changed.attach();


        CPANEL.validate.attach_to_form("edit_zone_line_confirm_" + o.index, EDIT_ZONE_LINE_VALID, function() {
            edit_zone_line(null, o);
        });

        CPANEL.util.catch_enter(["name_" + o.index, "ttl_" + o.index, "edit_zone_line_address_" + o.index, "cname_" + o.index, "txtdata_" + o.index], "edit_zone_line_confirm_" + o.index);

        YAHOO.util.Dom.get("name_" + o.index).value = CPANEL.util.get_text_content("name_value_" + o.index);
        YAHOO.util.Dom.get("ttl_" + o.index).value = CPANEL.util.get_text_content("ttl_value_" + o.index);

        var type = CPANEL.util.get_text_content("type_value_" + o.index);
        YAHOO.util.Dom.get("edit_zone_line_type_" + o.index).value = type;
        if (type === "A") {
            YAHOO.util.Dom.get("edit_zone_line_address_" + o.index).value = CPANEL.util.get_text_content("value_value_hehe_" + o.index);
        }
        if (type === "AAAA") {
            YAHOO.util.Dom.get("ipv6_" + o.index).value = CPANEL.util.get_text_content("value_value_hehe_" + o.index);
        }
        if (type === "CNAME") {
            YAHOO.util.Dom.get("cname_" + o.index).value = CPANEL.util.get_text_content("value_value_hehe_" + o.index);
        }
        if (type === "SRV") {
            YAHOO.util.Dom.get("priority_" + o.index).value = ZONE[o.index]["priority"].html_encode();
            YAHOO.util.Dom.get("weight_" + o.index).value = ZONE[o.index]["weight"].html_encode();
            YAHOO.util.Dom.get("port_" + o.index).value = ZONE[o.index]["port"].html_encode();
            YAHOO.util.Dom.get("target_" + o.index).value = ZONE[o.index]["target"].html_encode();
        }
        if (type === "TXT") {
            YAHOO.util.Dom.get("txtdata_" + o.index).value = CPANEL.util.get_text_content("value_value_hehe_" + o.index);
        }
        toggle_types(null, o);
    }
};

// add event handlers and validation to an input div
var after_show_module = function(o) {
    if (o.action === "delete") {
        YAHOO.util.Event.on("delete_zone_line_cancel_" + o.index, "click", toggle_module, o);
        YAHOO.util.Event.on("delete_zone_line_confirm_" + o.index, "click", delete_zone_line, o);
    }
};

// hide validation messages before we hide the module
var before_hide_module = function(o) {
    if (o.action === "edit") {
        // hide all validation
        for (var i in EDIT_ZONE_LINE_VALID) {
            if (typeof_validator(EDIT_ZONE_LINE_VALID[i]) === true) {
                EDIT_ZONE_LINE_VALID[i].clear_messages();
            }
        }
    }
};

// restore a module's markup and input fields to their original (blank) values after the module is hidden
var after_hide_module = function(o) {
    if (o.action === "edit") {
        // remove any event handlers (includes validation)
        YAHOO.util.Event.purgeElement(o.id, true);

        YAHOO.util.Dom.get("name_" + o.index).value = "";
        YAHOO.util.Dom.get("ttl_" + o.index).value = "";
        YAHOO.util.Dom.get("edit_zone_line_address_" + o.index).value = "";
        YAHOO.util.Dom.get("cname_" + o.index).value = "";
        YAHOO.util.Dom.get("priority_" + o.index).value = "";
        YAHOO.util.Dom.get("port_" + o.index).value = "";
        YAHOO.util.Dom.get("target_" + o.index).value = "";
        YAHOO.util.Dom.get("ipv6_" + o.index).value = "";
        YAHOO.util.Dom.get("weight_" + o.index).value = "";
        YAHOO.util.Dom.get("txtdata_" + o.index).value = "";
    }
};

// check that the content has changed before we send an edit request
var content_changed = function(index, force_change) {
    var old_content = YAHOO.util.Dom.get("edit_zone_line_current_values_" + index).innerHTML;

    var new_content = YAHOO.util.Dom.get("name_" + index).value;
    new_content += YAHOO.util.Dom.get("ttl_" + index).value;
    new_content += YAHOO.util.Dom.get("edit_zone_line_type_" + index).value;
    new_content += YAHOO.util.Dom.get("edit_zone_line_address_" + index).value;
    new_content += YAHOO.util.Dom.get("cname_" + index).value;
    new_content += YAHOO.util.Dom.get("txtdata_" + index).value.html_encode();
    new_content += YAHOO.util.Dom.get("ipv6_" + index).value.html_encode();
    new_content += YAHOO.util.Dom.get("priority_" + index).value.html_encode();
    new_content += YAHOO.util.Dom.get("weight_" + index).value.html_encode();
    new_content += YAHOO.util.Dom.get("port_" + index).value.html_encode();
    new_content += YAHOO.util.Dom.get("target_" + index).value.html_encode();
    new_content = new_content.html_encode();
    if (force_change) {
        YAHOO.util.Dom.get("edit_zone_line_current_values_" + index).innerHTML = new_content;
    }
    return (old_content !== new_content);
};



// when a user switches a domain
var switch_domain = function() {
    var domain = YAHOO.util.Dom.get("domain").value;
    if (domain === "_select_") {
        CPANEL.animate.slide_up("add_record_and_zone_table");
    } else {
        CPANEL.animate.slide_down("add_record_and_zone_table");
        API.domain = domain;
        DNSSEC.update_section();
        update_dns_zone();
    }
    reset_add_zone_line_form();
};

// function to add a new zone line
var add_new_zone_line = function() {

    var name = YAHOO.util.Dom.get("name").value;
    var ttl = YAHOO.util.Dom.get("ttl").value;
    var type = YAHOO.util.Dom.get("type").value;

    // make sure we format the dns zone name, in case
    // the form is submitted using the Return key
    format_dns_name("name");
    ADD_ZONE_LINE_VALID.name.verify();
    if (!ADD_ZONE_LINE_VALID.name.is_valid()) {
        return false;
    }
    name = YAHOO.util.Dom.get("name").value;

    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "ZoneEdit",
        cpanel_jsonapi_func: "add_zone_record",
        domain: API.domain,
        "class": "IN",
        type: type,
        name: name,
        ttl: ttl
    };


    if (type === "A") {
        api2_call.address = YAHOO.util.Dom.get("address").value;
    }
    if (type === "AAAA") {
        api2_call.address = YAHOO.util.Dom.get("ipv6").value;
    }
    if (type === "CNAME") {
        api2_call.cname = YAHOO.util.Dom.get("cname").value;
    }
    if (type === "SRV") {
        api2_call.priority = YAHOO.util.Dom.get("priority").value;
        api2_call.weight = YAHOO.util.Dom.get("weight").value;
        api2_call.port = YAHOO.util.Dom.get("port").value;
        api2_call.target = YAHOO.util.Dom.get("target").value;
    }
    if (type === "TXT") {
        api2_call.txtdata = YAHOO.util.Dom.get("txtdata").value;
    }

    // callback functions
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                // update the table and display the status
                if (data.cpanelresult.error) {
                    CPANEL.widgets.status_bar("add_record_status_bar", "error", LOCALE.maketext("Error"), data.cpanelresult.error);
                } else if (data.cpanelresult.data[0].result.status === 1) {
                    CPANEL.widgets.status_bar("add_record_status_bar", "success", LOCALE.maketext("The system successfully added the record."));
                    update_dns_zone();
                } else if (data.cpanelresult.data[0].result.status === 0) {
                    CPANEL.widgets.status_bar("add_record_status_bar", "error", LOCALE.maketext("Error"), data.cpanelresult.data[0].result.statusmsg);
                } else {
                    CPANEL.widgets.status_bar("add_record_status_bar", "error", LOCALE.maketext("Error"), LOCALE.maketext("The system experienced an unknown error."));
                }
                reset_add_zone_line_form();
            } catch (e) {
                CPANEL.widgets.status_bar("add_record_status_bar", "error", LOCALE.maketext("Error"), LOCALE.maketext("JSON parse failed."));
                update_dns_zone();
                reset_add_zone_line_form();
            }
        },
        failure: function(o) {
            CPANEL.widgets.status_bar("add_record_status_bar", "error", LOCALE.maketext("AJAX Error"), LOCALE.maketext("Please refresh the page and try again."));
            update_dns_zone();
            reset_add_zone_line_form();
        }
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest("GET", CPANEL.urls.json_api(api2_call), callback, "");

    // show the ajax loading icon
    YAHOO.util.Dom.setStyle("add_new_zone_line_submit", "display", "none");
    YAHOO.util.Dom.get("add_new_zone_line_status").innerHTML = CPANEL.icons.ajax + " " + LOCALE.maketext("Adding record …");

};

// page initialization
var init_select_box = function() {
    YAHOO.util.Event.on("type", "change", toggle_type_inputs);
    YAHOO.util.Event.on("name", "blur", function() {
        format_dns_name(this);
        setTimeout(ADD_ZONE_LINE_VALID.name.verify(), 25);
    });

    ADD_ZONE_LINE_VALID.name = new CPANEL.validate.validator(LOCALE.maketext("Name"));
    ADD_ZONE_LINE_VALID.name.add("name", "zone_name", LOCALE.maketext("A zone name [output,em,must] be a domain name, and can include a period at the end."));
    ADD_ZONE_LINE_VALID.name.add("name", function() {
        return validate_unique_cname("name");
    }, LOCALE.maketext("Name matches an existing CNAME.") + "<br />" + LOCALE.maketext("All CNAMEs must be unique."));
    ADD_ZONE_LINE_VALID.name.attach();

    ADD_ZONE_LINE_VALID.ttl = new CPANEL.validate.validator("TTL");
    ADD_ZONE_LINE_VALID.ttl.add("ttl", "positive_integer", LOCALE.maketext("The [output,acronym,TTL,Time To Live] value [output,em,must] be a positive integer."));
    ADD_ZONE_LINE_VALID.ttl.attach();

    ADD_ZONE_LINE_VALID.address = new CPANEL.validate.validator(LOCALE.maketext("Address"));
    ADD_ZONE_LINE_VALID.address.add("address", function() {
        return validate_address("type", "address");
    }, LOCALE.maketext("The address [output,em,must] be an IP address."));
    ADD_ZONE_LINE_VALID.address.add("address", function() {
        return validate_address_no_local_ips("type", "address");
    }, LOCALE.maketext("The address [output,em,cannot] be a local IP addres (for example, [output,class,127.0.0.1,code])."));
    ADD_ZONE_LINE_VALID.address.attach();

    ADD_ZONE_LINE_VALID.ipv6 = new CPANEL.validate.validator(LOCALE.maketext("[output,abbr,IPv6,Internet Protocol Version 6] Address"));
    ADD_ZONE_LINE_VALID.ipv6.add("ipv6", function() {
        return validate_v6_address("type", "ipv6");
    }, LOCALE.maketext("This must be an [output,abbr,IPv6,Internet Protocol Version 6] address."));
    ADD_ZONE_LINE_VALID.ipv6.attach();

    ADD_ZONE_LINE_VALID.cname = new CPANEL.validate.validator("CNAME");
    ADD_ZONE_LINE_VALID.cname.add("cname", function() {
        return validate_cname("type", "cname");
    }, LOCALE.maketext("The [asis,CNAME] value must be a valid zone name."));
    ADD_ZONE_LINE_VALID.cname.attach();

    ADD_ZONE_LINE_VALID.priority = new CPANEL.validate.validator(LOCALE.maketext("Priority"));
    ADD_ZONE_LINE_VALID.priority.add("priority", function() {
        return validate_port_weight_priority("type", "priority");
    }, LOCALE.maketext("Must be integer between 0 and 65535."));
    ADD_ZONE_LINE_VALID.priority.attach();

    ADD_ZONE_LINE_VALID.weight = new CPANEL.validate.validator(LOCALE.maketext("Weight"));
    ADD_ZONE_LINE_VALID.weight.add("weight", function() {
        return validate_port_weight_priority("type", "weight");
    }, LOCALE.maketext("Must be integer between 0 and 65535."));
    ADD_ZONE_LINE_VALID.weight.attach();

    ADD_ZONE_LINE_VALID.port = new CPANEL.validate.validator(LOCALE.maketext("Port"));
    ADD_ZONE_LINE_VALID.port.add("port", function() {
        return validate_port_weight_priority("type", "port");
    }, LOCALE.maketext("Must be integer between 0 and 65535."));
    ADD_ZONE_LINE_VALID.port.attach();

    ADD_ZONE_LINE_VALID.target = new CPANEL.validate.validator(LOCALE.maketext("Target"));
    ADD_ZONE_LINE_VALID.target.add("target", function() {
        return validate_target("type", "target");
    }, LOCALE.maketext("Target must be “.” or a valid zone name."));
    ADD_ZONE_LINE_VALID.target.attach();

    ADD_ZONE_LINE_VALID.txtdata = new CPANEL.validate.validator(LOCALE.maketext("TXT Data"));
    ADD_ZONE_LINE_VALID.txtdata.add("txtdata", function() {
        return validate_txtdata("type", "txtdata");
    }, LOCALE.maketext("[asis,TXT] data [output,em,cannot] be empty."));
    ADD_ZONE_LINE_VALID.txtdata.attach();

    CPANEL.validate.attach_to_form("submit", ADD_ZONE_LINE_VALID, add_new_zone_line);
};
YAHOO.util.Event.onDOMReady(init_select_box);

var init_dns_zone = function() {

    // initialize the API variables
    API = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "ZoneEdit",
        "cpanel_jsonapi_func": "fetchzone",
        "domain": YAHOO.util.Dom.get("domain").value
    };

    CPANEL.util.catch_enter(["name", "ttl", "address", "cname", "txtdata", "ipv6", "priority", "weight", "port", "target"], "submit");

    // add an event handler on the domain select
    if (YAHOO.util.Dom.inDocument("domain_select_exists") === true) {
        YAHOO.util.Event.on("domain", "change", switch_domain);
        switch_domain();
    } else {
        DNSSEC.update_section();
        update_dns_zone();
    }

    // setup handlers for the reset zone functionality
    YAHOO.util.Event.on("reset_zone_file_checkbox", "click", toggle_confirm_reset_zone);
    YAHOO.util.Event.on("reset_zone_file", "click", reset_zone_file);

};
YAHOO.util.Event.onDOMReady(init_dns_zone);

//this style rule must be independent of external style sheets
(function() {
    var _stylesheet = [
        //other rules can be added to this array
        ["div.dt_module", "display:none"]
    ];
    // var inserter;
    var first_stylesheet = document.styleSheets[0];
    if ("insertRule" in first_stylesheet) { //W3C DOM
        _stylesheet.forEach(function(rule) {
            first_stylesheet.insertRule(rule[0] + " {" + rule[1] + "}", 0);
        });
    } else { //IE
        _stylesheet.forEach(function(rule) {
            first_stylesheet.addRule(rule[0], rule[1], 0);
        });
    }
})();
