/*
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Contributor(s):
 *  - LouCypher (original code)
 */

var DeAdFly = {

  get prefs() {
    return Services.prefs.getBranch("extensions.DeAdFly.");
  },

  get strings() {
    return document.getElementById("deadfly-strings");
  },

  toString: function deadfly_toString() {
    "use strict";
    return "DeAdFly";
  },

  isAdFly: function deadfly_isAdFly(aURL) {
    var domains = "adf.ly|j.gs|q.gs|9.bb|u.bb";
    var pattern = "^https?:\/\/(" + domains + ")\/(?=[A-Za-z0-9_\/]+)";
    return (new RegExp(pattern)).test(aURL);
  },

  alert: function deadfly_alert(aString) {
    Services.prompt.alert(null, DeAdFly, aString);
  },

  debug: function deadfly_debug(aString) {
    if (DeAdFly.prefs.getBoolPref("debug")) {
      Services.console.logStringMessage(DeAdFly + ":\n" + aString);
    }
  },

  expand: function deadfly_expand(aString) {
    var regx = /zzz.*(?=')/;
    if (regx.test(aString)) {
      var path = aString.match(regx).toString().split("'")[1];
      if (/adf.ly\/go.php/.test(path)) {
        path = atob(path.replace(/^https?:\/\/adf.ly\/go.php\?u\=/, ""));
      }
      return path;
    }
    return null;
  },

  getFly: function deadfly_getfly(aURL, aDocument, aCallback) {
    try {
      DeAdFly.debug(DeAdFly.strings.getFormattedString("retrieving", [aURL]));
      var req = new XMLHttpRequest();
      req.open("GET", aURL, true);
      if (Services.prefs.getIntPref("network.http.sendRefererHeader") > 0) {
        req.setRequestHeader("Referer", aDocument.location.href);
      }
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          DeAdFly.debug(DeAdFly.strings.getFormattedString("retrieved", [aURL]));
          aCallback(req.responseText, aURL, aDocument);
        }
      }
      req.onerror = function() {
        DeAdFly.debug(DeAdFly.strings.getFormattedString("aborting", [req.status]));
        req.abort();
      }
      req.send(null);
    } catch (ex) {
      DeAdFly.alert(ex);
    }
  },

  action: function deadfly_action(aString, aURL, aDocument) {
    DeAdFly.debug(DeAdFly.strings.getFormattedString("expanding", [aURL]));
    var url = DeAdFly.expand(aString);
    if (!url) {
      if (!DeAdFly.prefs.getBoolPref("openAdFly")) {
        DeAdFly.alert(DeAdFly.strings.getFormattedString("not_expand", [aURL]));
        return;
      }
      DeAdFly.debug(DeAdFly.strings.getFormattedString("not_expand", [aURL]));
      url = aURL;
    }

    var referrerURI = null;
    if (DeAdFly.prefs.getBoolPref("sendReferrer")) {
      referrerURI = makeURI(aDocument.location.href);
    }
    var getAction = DeAdFly.prefs.getIntPref("action");
    switch (getAction) {
      case 30: break;
      case 20:
      case 21:
      case 0: // Display the URL in Location Bar
        if (DeAdFly.isAdFly(url)) return;
        DeAdFly.debug(DeAdFly.strings.getFormattedString("showing", [url]));
        gURLBar.value = url;
        gURLBar.focus();
        break;
      case 10:
      case 11:
      case 12:
      case 13:
      case 2: // Load in new tab
        DeAdFly.debug(DeAdFly.strings.getFormattedString("opening", [url]));
        var bgLoad = Services.prefs.getBoolPref("browser.tabs.loadInBackground");
        gBrowser.loadOneTab(url, referrerURI, null, null, bgLoad);
        break;
      default: // Load in current tab
        DeAdFly.debug(DeAdFly.strings.getFormattedString("opening", [url]));
        loadURI(url, referrerURI);
    }
  },

  options: function deadfly_options() {
    var param = "addons://detail/" + encodeURIComponent("deadfly@loucypher")
                                   + "/preferences"
    if ("toEM" in window) {
      toEM(param);
    } else {
      BrowserOpenAddonsMgr(param);
    }
  },

  checkForUserScript: function deadfly_checkForUserScript() {
    if (!DeAdFly.prefs.getBoolPref("redir.enabled")) return;

    var types = [
      "greasemonkey-user-script", // Greasemonkey
      "user-script",              // Greasemonkey prior to version 1.7
      "userscript"                // Scriptish
    ]

    var ids = ["http://userscripts.org/users/12/adf.ly Redir@greasespot.net",
               "adf.lyRedir@httpuserscripts.orgusers12"]

    AddonManager.getAddonsByTypes(types, function(addons) {
      var userscripts = [];
      for (var i in addons) {
        if (((addons[i].id === ids[0]) || (addons[i].id === ids[1]))
            && addons[i].isActive) {
          userscripts.push(addons[i]);
        }
      }
      if (userscripts.length) {
        var name = userscripts[0].name;
        var message = DeAdFly.strings.getFormattedString("confirm_redir", [name, name]);
        var disable = Services.prompt.confirmEx(null, DeAdFly, message, 1027,
                                                "", "", "", null, {value:false});
        for (var i in userscripts) {
          userscripts[i].userDisabled = !disable;
        }
        DeAdFly.prefs.setBoolPref("redir.enabled", !disable);
      }
    })
  },

  initContextMenu: function deadfly_initContextMenu(aEvent) {
    gContextMenu.showItem("context-deadfly",
                          gContextMenu.onLink && DeAdFly.isAdFly(gContextMenu.linkURL));
  },

  onLoad: function deadfly_onLoad(aEvent) {
    var popup = document.getElementById("contentAreaContextMenu");
    popup.addEventListener("popupshowing", DeAdFly.initContextMenu, false);
    popup.removeEventListener("popuphiding", DeAdFly.initContextMenu, false);
    DeAdFly.checkForUserScript();
  }
}

window.addEventListener("load", DeAdFly.onLoad, false);
window.removeEventListener("unload", DeAdFly.onLoad, false);