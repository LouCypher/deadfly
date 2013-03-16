/*
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Contributor(s):
 *  - LouCypher (original code)
 */

// ==UserScript==
// @name              DeAdFly
// @id                deadfly.user.js@loucypher
// @namespace         http://userscripts.org/users/12
// @description       Expand AdF.ly link via context menu.
// @version           1.0a
// @author            LouCypher
// @license           MPL 2.0
// @icon              https://raw.github.com/LouCypher/deadfly/master/src/chrome/skin/classic/deadfly-48.png
// @icon64URL         https://raw.github.com/LouCypher/deadfly/master/src/chrome/skin/classic/deadfly-64.png
// @contributionURL   http://loucypher.github.com/userscripts/donate.html?DeAdFly
// @homepageURL       https://github.com/LouCypher/deadfly
// @supportURL        https://github.com/LouCypher/deadfly/issues
// @downloadURL       https://raw.github.com/LouCypher/deadfly/master/userscript/deadfly.user.js
// @updateURL         https://raw.github.com/LouCypher/deadfly/master/userscript/deadfly.user.js
// @resource          html https://raw.github.com/LouCypher/deadfly/master/userscript/deadfly.html
// @resource          icon https://raw.github.com/LouCypher/deadfly/master/src/chrome/skin/classic/deadfly-16.png
// @resource          license https://raw.github.com/LouCypher/userscripts/master/licenses/MPL/LICENSE.txt
// @include           *
// @grant             GM_log
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_openInTab
// @grant             GM_xmlhttpRequest
// @grant             GM_getResourceURL
// @grant             GM_getResourceText
// @grant             GM_registerMenuCommand
// ==/UserScript==

var gContextMenu;
var gMenuItem;
var gInput;
start(document);

function start(doc) {
  if (("contextMenu" in doc.documentElement && "HTMLMenuItemElement" in window)) {
    appendHTML(doc);
    GM_registerMenuCommand("DeAdFly Options", showConfig, "D");
  }
}

function appendHTML(doc) {
  var div = doc.body.appendChild(doc.createElement("menu"));
  div.outerHTML = GM_getResourceText("html");
  doc.documentElement.addEventListener("contextmenu", initContextMenu, false);
  gContextMenu = $("#deadfly-context-menu");
  gMenuItem = $("#deadfly-getfly");
  gMenuItem.icon = GM_getResourceURL("icon");
  gMenuItem.addEventListener("click", getFly, false);

  $("#deadfly-config-open").icon = GM_getResourceURL("icon");
  $("#deadfly-config-open").addEventListener("click", showConfig, false);
  $("#deadfly-config-close").addEventListener("click", hideConfig, false);

  $("#deadfly-openfly").addEventListener("change", setValue, false);
  $("#deadfly-openfly").checked = GM_getValue("openAdFly", true);

  $("#deadfly-log").addEventListener("change", setValue, false);
  $("#deadfly-log").checked = GM_getValue("log", false);
  
  var options = doc.querySelectorAll("#deadfly-config input");
  for (var i = 0; i < options.length; i++) {
    options[GM_getValue("action", 0)].setAttribute("checked", "");
    options[i].addEventListener("change", function(e) {
      GM_setValue("action", parseInt(e.target.value));
    }, false);
  }
}

function initContextMenu(aEvent) {
  var node = aEvent.target; // the web element you right click on
  if ((node.nodeName == "A") && node.hasAttribute("href")) {
    var domains = "adf.ly|j.gs|q.gs|9.bb|u.bb";
    var pattern = "^https?:\/\/(" + domains + ")\/(?=[A-Za-z0-9_\/]+)";
    var isAdFly = (new RegExp(pattern)).test(node.href);
    if (isAdFly) {
      node.setAttribute("contextmenu", gContextMenu.id);
      gMenuItem.href = node.href;
    }
  }
}

function log(aString) {
  if (GM_getValue("log", false)) {
    console.log("DeAdFly:\n" + aString);
    GM_log(aString);
  }
}

function expand(aString) {
  var regx = /zzz.*(?=')/;
  if (regx.test(aString)) {
    var url = aString.match(regx).toString().split("'")[1];
    if (/adf.ly\/go.php/.test(url)) {
      url = atob(url.replace(/^https?:\/\/adf.ly\/go.php\?u\=/, ""));
    }
    return url;
  }
  return null;
}

function action(aString, aURL) {
  log("expanding " + aURL);
  var url = expand(aString);
  if (!url) {
    if (!GM_getValue("openAdFly", true)) {
      alert("Could not expand\n" + aURL);
      return;
    }
  }
  log("Could not expand " + aURL);
  url = aURL;

  var action = GM_getValue("action", 0);
  switch (action) {
    case 2: log("showing " + url); prompt("Original URL:", url); break;
    case 1: log("opening " + url); GM_openInTab(url); break;
    default: log("opening " + url); location.assign(url);
  }
}

function showError(aReq) {
  var status = aReq.status ? aReq.status + " error" : "Connection error";
  alert("DeAdFly: " + status);
  log("aborting. " + status);
  aReq.abort();
}

function getFly(aEvent) {
  var node = aEvent.target; // <menuitem> element
  log("retrieving " + node.href);
  try {
    GM_xmlhttpRequest({
      method: "GET",
      url: node.href,
      timeout: 10000,
      onreadystatechange: function(req) {
        if (req.readyState == 4 && req.status == 200) {
          log(this.url + " retrieved");
          action(req.responseText, this.url);
        }
      },
      ontimeout: showError,
      onerror: showError
    })
  } catch(ex) {
    alert(ex);
  }
}

function showConfig() {
  $("#deadfly-config").style.display = "block";
  $("#deadfly-config-open").disabled = true;
}

function hideConfig() {
  $("#deadfly-config").style.display = "";
  $("#deadfly-config-open").disabled = false;
}

function setValue(aEvent) {
  var node = aEvent.target;
  var prefname = node.name;
  GM_setValue(prefname, node.checked);
}

function $(aSelector, aNode) {
  return (aNode || document).querySelector(aSelector);
}