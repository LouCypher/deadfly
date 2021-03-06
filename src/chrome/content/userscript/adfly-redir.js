/*
    Redirect adf.ly to its target location.
    Copyright (C) 2012 LouCypher

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>
*/

// ==UserScript==
// @name            adf.ly Redir
// @namespace       http://userscripts.org/users/12
// @description     Redirect adf.ly to its target location.
// @version         6.1
// @author          LouCypher
// @contributor     AMZMA (bug reports and feature requests)
// @license         GPL
// @homepageURL     https://github.com/LouCypher/userscripts/tree/master/adf.ly-redir
// @updateURL       https://raw.github.com/LouCypher/userscripts/master/adf.ly-redir/adf.ly_Redir.user.js
// @downloadURL     https://raw.github.com/LouCypher/userscripts/master/adf.ly-redir/adf.ly_Redir.user.js
// @resource        license https://raw.github.com/LouCypher/userscripts/master/licenses/GPL/LICENSE.txt
// @include         http://adf.ly/*
// @include         https://adf.ly/*
// @include         http://j.gs/*
// @include         http://q.gs/*
// @include         http://9.bb/*
// @include         http://u.bb/*
// @exclude         http://adf.ly/go/*
// @exclude         https://adf.ly/go/*
// ==/UserScript==

(function() {
  if (/locked/.test(location.pathname)) {
    redir(GM_getValue("originalURL"));
    return;
  }

  var xpath = "/html/head/script[not(@src) and text()[contains(.,'var zzz =')]]";
  var script = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
  if (script) {
    var regx = /zzz.*(?=')/;
    var url = script.textContent.match(regx).toString().split("'")[1];
    if (/adf.ly\/go.php/.test(url)) {
      url = atob(url.replace(/^https?:\/\/adf.ly\/go.php\?u\=/, ""));
    }
    GM_setValue("originalURL", url);
    redir(url);
    return;
  }

  function redir(aURL) {
    GM_deleteValue("originalURL");
    document.title = "Redirecting\u2026";
    document.body.innerHTML = "Redirecting\u2026";
    location.replace(aURL);
  }
})()