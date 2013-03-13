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
    Services.prompt.alert(null, this, aString);
  },

  debug: function deadfly_debug(aString) {
    if (this.prefs.getBoolPref("debug")) {
      Services.console.logStringMessage(this + ":\n" + aString);
    }
  },

  expand: function deadfly_expand(aString) {
    var regx = /zzz.*(?=')/;
    if (regx.test(aString)) {
      var url = aString.match(regx).toString().split("'")[1];
      if (/adf.ly\/go.php/.test(url)) {
        url = atob(url.replace(/^https?:\/\/adf.ly\/go.php\?u\=/, ""));
      }
      return url;
    }
    return null;
  },

  action: function deadfly_action(aString, aURL, aDocument) {
    this.debug(this.strings.getFormattedString("expanding", [aURL]));
    var url = this.expand(aString);
    if (!url) {
      if (!this.prefs.getBoolPref("openAdFly")) {
        this.alert(this.strings.getFormattedString("not_expand", [aURL]));
        return;
      }
      this.debug(this.strings.getFormattedString("not_expand", [aURL]));
      url = aURL;
    }

    var referrerURI = null;
    if (this.prefs.getBoolPref("sendReferrer")) {
      referrerURI = makeURI(aDocument.location.href);
    }
    var getAction = this.prefs.getIntPref("action");
    switch (getAction) {
      case 30: break;
      case 20:
      case 21:
      case 0: // Display the URL in Location Bar
        if (this.isAdFly(url)) return;
        this.debug(this.strings.getFormattedString("showing", [url]));
        gURLBar.value = url;
        gURLBar.focus();
        break;
      case 10:
      case 11:
      case 12:
      case 13:
      case 2: // Load in new tab
        this.debug(this.strings.getFormattedString("opening", [url]));
        var bgLoad = Services.prefs.getBoolPref("browser.tabs.loadInBackground");
        gBrowser.loadOneTab(url, referrerURI, null, null, bgLoad);
        break;
      default: // Load in current tab
        this.debug(this.strings.getFormattedString("opening", [url]));
        loadURI(url, referrerURI);
    }
  },

  getFly: function deadfly_getfly(aURL, aDocument) {
    var deadfly = this;
    try {
      this.debug(this.strings.getFormattedString("retrieving", [aURL]));
      var req = new XMLHttpRequest();
      req.open("GET", aURL, true);
      if (Services.prefs.getIntPref("network.http.sendRefererHeader") > 0) {
        req.setRequestHeader("Referer", aDocument.location.href);
      }
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          deadfly.debug(deadfly.strings.getFormattedString("retrieved", [aURL]));
          deadfly.action(req.responseText, aURL, aDocument);
        }
      }
      req.onerror = function() {
        deadfly.debug(deadfly.strings.getFormattedString("aborting", [req.status]));
        req.abort();
      }
      req.send(null);
    } catch (ex) {
      this.alert(ex);
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
    if (!this.prefs.getBoolPref("redir.enabled")) return;

    var types = [
      "greasemonkey-user-script", // Greasemonkey
      "user-script",              // Greasemonkey prior to version 1.7
      "userscript"                // Scriptish
    ]

    var ids = ["http://userscripts.org/users/12/adf.ly Redir@greasespot.net",
               "adf.lyRedir@httpuserscripts.orgusers12"]

    var deadfly = this;
    AddonManager.getAddonsByTypes(types, function(addons) {
      var userscripts = [];
      addons.forEach(function(addon) {
        if (((addon.id === ids[0]) || (addon.id === ids[1]))
            && addon.isActive) {
          userscripts.push(addon);
        }
      })
      if (userscripts.length) {
        var name = userscripts[0].name;
        var message = deadfly.strings.getFormattedString("confirm_redir", [name, name]);
        var disable = Services.prompt.confirmEx(null, deadfly, message, 1027,
                                                "", "", "", null, {value:false});
        userscripts.forEach(function(userscript) {
          userscript.userDisabled = !disable;
        })
        deadfly.prefs.setBoolPref("redir.enabled", !disable);
      }
    })
  },

  initContextMenu: function deadfly_initContextMenu(aEvent) {
    gContextMenu.showItem("context-deadfly", gContextMenu.onLink &&
                                             DeAdFly.isAdFly(gContextMenu.linkURL));
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