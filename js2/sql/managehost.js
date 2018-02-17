/* jshint -W117 */
(function() {
    var init_page = function() {

        var hostname_error = LOCALE.maketext("The [output,em,Access Host] field must be a valid hostname, for example, [asis,example.com] or [asis,%.example.com].");
        var hostname_validator = new CPANEL.validate.validator(LOCALE.maketext("Remote Database Hosts"));
        hostname_validator.add("host", check_host, hostname_error);
        hostname_validator.attach();

        CPANEL.validate.attach_to_form("submit-button", hostname_validator);
    };

    /**
     * Checks the host name
     * @return {Boolean} true if the this is an  invalid mysql host name. false otherwise.
     */
    var check_host = function() {
        // Regex's copied from mysqladdonhosts.tmpl and Cpanel::Validate::DB
        // TODO Case 92005 Refactor MySQL Hostname Validation to use Cpanel::Validate::DB
        var mysql_ip_netmask_regex = /^(?:\d{1,3}\.){3}\d{1,3}\/(?:(?:255|0)\.){3}0$/;
        var mysql_ip_regex = /^(?:(?:(?:[%_\d]{1,3}\.){3}[%_\d]{1,3})|(?:(?:[%_\d]{1,3}\.){0,3}\%))$/;
        var mysql_host_regex = /^(?:\%\.)?(?:[a-zA-Z\d\-%_]+\.)*(?:[a-zA-Z%\d]+)$/;
        var ip_test = /^(?:[%_\d]{1,3}\.)*[%_\d]{1,3}$/;
        var host = YAHOO.util.Dom.get("host").value.trim();
        host = unescape(host);
        if (host.indexOf("/") !== -1) {
            return mysql_ip_netmask_regex.test(host);
        } else if (ip_test.test(host)) {
            return mysql_ip_regex.test(host);
        } else {
            return mysql_host_regex.test(host);
        }
        return false;
    };

    YAHOO.util.Event.onDOMReady(init_page);
})();
