(function(){var e=CPANEL.validate,t=YAHOO.util.Dom,n=CPANEL.namespace("CPANEL.Applications");n.SSL={scroll_to_element:function(e,n){if(!e)return;var r=document.compatMode,i=document.body;r&&r.indexOf("CSS")!=-1&&!YAHOO.env.ua.webkit&&(i=document.documentElement);var s=t.getDocumentScrollLeft();e=t.get(e);var o=new YAHOO.util.Scroll(i,{scroll:{to:[s,t.getY(e)]}},.5,YAHOO.util.Easing.easeBothStrong);n&&o.onComplete.subscribe(n),window.setTimeout(function(){o.animate()},0)},isValidSSLDomain:function(t){var n=t.value.trim();return e.host(n.replace(/^\*\./,""))},isOptionalIfUndefined:function(e){return e&&e.value!==""?!0:!1},isAlphaOrWhitespace:function(e){return e&&e.value!==""?/^[\-A-Za-z ]+$/.test(e.value):!1}}})();