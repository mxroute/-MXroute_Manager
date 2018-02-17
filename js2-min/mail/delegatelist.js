(function(){"use strict";var YAHOO=window.YAHOO;var CPANEL=window.CPANEL;var PAGE=window.PAGE;var LOCALE=window.LOCALE;var DOM=YAHOO.util.Dom;var EVENT=YAHOO.util.Event;var progressOverlay;var addList={},removeList={};function showProgressOverlay(content_html){if(!progressOverlay||!progressOverlay.cfg){progressOverlay=new CPANEL.ajax.Page_Progress_Overlay(null,{zIndex:2e3,covers:CPANEL.Y.one("#delegateWrapper"),show_status:true,status_html:content_html})}else{progressOverlay.set_status_now(content_html)}progressOverlay.show()}var addUsers=function(){move_selected_items("available_users","assigned_users")};var removeUsers=function(){move_selected_items("assigned_users","available_users")};var register_add=function(item){if(!(item in removeList)){addList[item]=undefined;return true}delete removeList[item];return false};var register_remove=function(item){if(!(item in addList)){removeList[item]=undefined;return true}delete addList[item];return false};var get_listopt_by_value=function(email){return DOM.get("listopt_"+email)};var move_selected_items=function(sourceId,targetId){var sourceEl=DOM.get(sourceId),targetEl=DOM.get(targetId);var isAdd=targetId==="assigned_users";var addbuttonEl=CPANEL.Y.one("#add_button"),delbuttonEl=CPANEL.Y.one("#del_button");addbuttonEl.disabled=true;delbuttonEl.disabled=true;var source_opts=sourceEl.options;var sourceEl_length=source_opts.length;for(var i=sourceEl_length-1;i>=0;i--){if(source_opts[i].selected){var cur_source_opt=source_opts[i];var itemvalue=cur_source_opt.value;var needs_save;if(isAdd){needs_save=register_add(itemvalue)}else{needs_save=register_remove(itemvalue)}if(needs_save){enable_save();DOM.addClass(cur_source_opt,"needs-save")}else{DOM.removeClass(cur_source_opt,"needs-save");if(!obj_has_members(addList)&&!obj_has_members(removeList)){disable_save()}}insert_option_into_list(cur_source_opt,targetEl)}}addbuttonEl.disabled=false;delbuttonEl.disabled=false};var insert_option_into_list=function(newopt,select_el){var newvalue=newopt.value;var opts=select_el.options;var opts_length=opts.length;newopt.selected=false;for(var o=0;o<opts_length;o++){if(opts[o].value>newvalue){select_el.insertBefore(newopt,opts[o]);return}}select_el.appendChild(newopt)};var set_list_keys_as_saved=function(the_list){for(var value in the_list){var opt=get_listopt_by_value(value);DOM.removeClass(opt,"needs-save")}};var updateDelegatesWith=function(delegateList){var delegate_lookup={};for(var d=delegateList.length;d>=0;d--){delegate_lookup[delegateList[d]]=1}var assignedUsers=CPANEL.Y.one("#assigned_users");var show_refresh_warning;var cur_opts=assignedUsers.options;for(var o=cur_opts.length-1;o>=0;o--){if(!(cur_opts[o].value in delegate_lookup)){cur_opts[o].disabled=true;show_refresh_warning=true}}for(var x=0;x<delegateList.length;x++){var cur_delegate=delegateList[x];var the_opt=get_listopt_by_value(cur_delegate);var needs_insert;if(the_opt){if(the_opt.parentNode!==assignedUsers){needs_insert=true}}else{var the_opt=new Option(cur_delegate);the_opt.id="listopt_"+cur_delegate;needs_insert=true}if(needs_insert){insert_option_into_list(the_opt,assignedUsers)}}if(show_refresh_warning){makeNoticeOfTypeWithText("warn",LOCALE.maketext("The data on this page is no longer synchronized with the server. Please [output,url,_1,refresh the page].","javascript:window.reload()"))}};var makeNoticeOfTypeWithText=function(type,text){var notice=new CPANEL.widgets.Dynamic_Page_Notice({visible:false,level:type,content:text});notice.animated_show()};var handleSuccess=function(obj){var infoString=LOCALE.maketext("You have successfully updated delegation of administrative privileges for the mailing list “[_1]”.",PAGE.list.html_encode());updateDelegatesWith(obj.cpanel_data.delegates);progressOverlay.hide();makeNoticeOfTypeWithText("success",infoString);disable_save()};var update_list_admins=function(){showProgressOverlay(LOCALE.maketext("Saving …"));var removeApiCall={data:{delegates:removeList?Object.keys(removeList).join(","):"",list:PAGE.list},func:"remove_mailman_delegates",module:"Email",version:"3"};var addApiCall={data:{delegates:addList?Object.keys(addList).join(","):"",list:PAGE.list},func:"add_mailman_delegates",module:"Email",version:"3"};removeApiCall.callback=CPANEL.ajax.build_page_callback(function(obj){set_list_keys_as_saved(removeList);removeList={};if(obj_has_members(addList)){CPANEL.api(addApiCall)}else{handleSuccess(obj)}},{on_error:progressOverlay.hide.bind(progressOverlay)});addApiCall.callback=CPANEL.ajax.build_page_callback(function(obj){set_list_keys_as_saved(addList);addList={};handleSuccess(obj)},{on_error:progressOverlay.hide.bind(progressOverlay)});if(obj_has_members(removeList)){CPANEL.api(removeApiCall)}else if(obj_has_members(addList)){CPANEL.api(addApiCall)}};var obj_has_members=function(obj){for(var key in obj){if(obj.hasOwnProperty(key)){return true}}return false};var enable_save=function(){DOM.get("save_button").disabled=false};var disable_save=function(){DOM.get("save_button").disabled=true};var initialize=function(){EVENT.on("add_button","click",addUsers);EVENT.on("available_users","dblclick",addUsers);EVENT.on("del_button","click",removeUsers);EVENT.on("assigned_users","dblclick",removeUsers);EVENT.on("save_button","click",update_list_admins)};EVENT.onDOMReady(initialize)})();