/**
 * Ensure jQuery is loaded correctly.
 */
window.onload = async function() {
  if (window.jQuery) {

    //Upon opening the extension tab
    let activeTab = await getActiveTab();
    let url = new URL(activeTab[0].url);

    //set the header of the panel
    let activeTabUrl = $('#current-website-url');
    activeTabUrl.html('<strong>' + url.hostname + '</strong>' + ' - (' + activeTab[0].title + ')');

    if (url.hostname) {
      let request = browser.runtime.sendMessage({
        operation: 'popupControllerPageOpnened',
        activeTab: activeTab[0].url
      });
      request.then(handleResponse, handleError);
    } else {
      console.log("Config page");
    }

  } else {
    console.log("jQuery not loading");
  }
}


/**
 * Helper functions
 */

/*
 * getActiveTab()
 *
 * Get information to tab where extension button was clicked
 *
 * @return {Object}     retrievalSuccess      outcome of attempting retrieval
 */
async function getActiveTab() {
  return browser.tabs.query({
    currentWindow: true,
    active: true
  });
}

/*
 * convertEpochToSpecificTimezone()
 *
 * Convert epoch time for DB to human readable string
 *
 * @return {String}     nd      Epoch time user readable
 */
function convertEpochToSpecificTimezone(timeEpoch, offset) {
  var d = new Date(timeEpoch);
  var utc = d.getTime() + (d.getTimezoneOffset() * 60000); //This converts to UTC 00:00
  var nd = new Date(utc + (3600000 * offset));
  return nd.toLocaleString();
}

/*
 * sanitize()
 *
 * Removes bad characters before rendering
 *
 * @return {String}     sanitized      outcome of sanitization
 */
function sanitize(string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match) => (map[match]));
}

/**
 * Message managing related functions
 */

/*
 * handleResponse()
 *
 * Sends messsage to Dynamic_Dao to retrieve information
 *
 * @param (object)      message     contains message from the background script
 *
 * @return {boolean}     retrievalSuccess      outcome of attempting retrieval
 */
function handleResponse(message) {

  $(function() {
    $("[data-bs-toggle='popover']").popover()
  })
  $('.popover-dismiss').popover({
    trigger: 'hover'
  })

  var firstCookieList = $('#first-party-list .accordion-body');
  var thirdCookieList = $('#third-party-list .accordion-body');
  var otherSitesWithCookiesList = $('#popular-trackers-list .accordion-body');
  var webRequestList = $('#web-requests-list .accordion-body');

  var firstCookieCount = $('#first-party-count');
  var thirdCookieCount = $('#third-party-count');
  var visitCount = $('#visitCount');
  var cookieCount = $('#cookieCount');
  var requestCount = $('#requestCount');
  var webRequestCount = $('#web-requests-count')
  var otherSitesWithCookiesCount = $('#sites-with-cookies');

  var firstCookie = 0;
  var thirdCookie = 0;

  let card;
  let hostList = [];

  //Set counts for page
  visitCount.text(message.visitCount);
  cookieCount.text(message.cookieClassification.length);
  requestCount.text(message.webRequestClassification.length);
  webRequestCount.text(message.webRequestClassification.length);
  otherSitesWithCookiesCount.text(message.hostsWithSameCookieName.length);

  //Cookie classification
  if (message.cookieClassification.length > 0) {
    for (let [index, row] of message.cookieClassification.entries()) {
      let nameClass = '';
      if (row.nameClassification && row.sitesMatched) {
        nameClass = 'alert-warning';
        card = $([
          "<div class='col-sm-4'>",
          "<div class='card m-1 " + nameClass + "'>",
          "<a tabindex='" + index + "' id='card" + index + "' class='card-header' data-bs-placement='top' role='button' data-bs-container='#card" + index + "' data-bs-toggle='popover' data-bs-trigger='hover' data-bs-html='true' title='" + sanitize(row.nameClassification[2]) + ' - ' + sanitize(row.nameClassification[1]) + "' data-bs-content='" + " <b>Description:</b> " + sanitize(row.nameClassification[5]) + " <br /> <b>Domain:</b> " + sanitize(row.nameClassification[4]) + " <br /> <b>Retention period:</b> " + sanitize(row.nameClassification[6]) + " <br /> <b>Data handler:</b> " + sanitize(row.nameClassification[7]) + " <br /> <b>GDPR Portal:</b> " + sanitize(row.nameClassification[8]) + "'>" + sanitize(row.cookieName) + "</a>",
          "<div class='card-body'>",
          "<p class='card-subtitle text-muted'>" + convertEpochToSpecificTimezone(row.cookieExpiration, +0) + "</p>",
          "<p class='card-subtitle'>" + row.cookieDomain + "</p> <br />",
          "<p class='card-subtitle'>" + sanitize(row.sitesMatched[0][4]) + " - " + sanitize(row.sitesMatched[0][2]) + ", " + sanitize(row.sitesMatched[0][1]) + "</p>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));
        console.log(card);
      } else if (row.nameClassification) {
        nameClass = 'alert-warning';
        card = $([
          "<div class='col-sm-4'>",
          "<div class='card m-1 " + nameClass + "'>",
          "<a tabindex='" + index + "' id='card" + index + "' class='card-header' data-bs-placement='top' role='button' data-bs-container='#card" + index + "' data-bs-toggle='popover' data-bs-trigger='hover' data-bs-html='true' title='" + sanitize(row.nameClassification[2]) + ' - ' + sanitize(row.nameClassification[1]) + "' data-bs-content='" + " <b>Description:</b> " + sanitize(row.nameClassification[5]) + " <br /> <b>Domain:</b> " + sanitize(row.nameClassification[4]) + " <br /> <b>Retention period:</b> " + sanitize(row.nameClassification[6]) + " <br /> <b>Data handler:</b> " + sanitize(row.nameClassification[7]) + " <br /> <b>GDPR Portal:</b> " + sanitize(row.nameClassification[8]) + "'>" + sanitize(row.cookieName) + "</a>",
          "<div class='card-body'>",
          "<p class='card-subtitle text-muted'>" + convertEpochToSpecificTimezone(row.cookieExpiration, +0) + "</p>",
          "<p class='card-subtitle'>" + row.cookieDomain + "</p>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));
      } else {
        card = $([
          "<div class='col-sm-4'>",
          "<div class='card m-1 " + nameClass + "'>",
          "<a tabindex='" + index + "' id='card" + index + "' class='card-header'>" + row.cookieName + "</a>",
          "<div class='card-body'>",
          "<p class='card-subtitle text-muted'>" + convertEpochToSpecificTimezone(row.cookieExpiration, +0) + "</p>",
          "<p class='card-subtitle'>" + row.cookieDomain + "</p>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));
      }

      if (row.cookieHostOnly) {
        firstCookieList.append(card);
        firstCookie++;

      } else {
        thirdCookieList.append(card);
        thirdCookie++;
      }
    }
    firstCookieCount.text(firstCookie);
    thirdCookieCount.text(thirdCookie);
  } else {
    let p = document.createElement("p");
    let content = document.createTextNode("No cookies in this tab.");

    p.appendChild(content);
  }

  if (message.hostsWithSameCookieName.length > 0) {
    for (let [index, row] of message.hostsWithSameCookieName.entries()) {
      if (row.sitesMatched.length > 0) {
        for (hostname of row.sitesMatched) {
          hostList.push(hostname[0]);
        }
        similarCard = $([
          "<div class='col-sm-4'>",
          "<div class='card m-1'>",
          "<a tabindex='" + index + "' id='card" + index + "' class='card-header'>" + row.cookieName + "</a>",
          "<div class='card-body'>",
          "<p class='card-subtitle cookies-with-similar'>" + hostList.join(' ') + "</p>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));

        otherSitesWithCookiesList.append(similarCard);
        hostList = [];
      }
    }
  } else {
    let p = document.createElement("p");
    let content = document.createTextNode("No cookies in this tab.");

    p.appendChild(content);
  }


  if (message.webRequestClassification) {
    let nameClass = '';
    let webRequestCard = '';
    for (let [index, row] of message.webRequestClassification.entries()) {
      if (row.listsMatched && row.dommainMapping) {
        nameClass = 'alert-warning';
        webRequestCard = $([
          "<div class='col-sm-12'>",
          "<div class='webRequestCard card m-1 "+nameClass+"'>",
          "<a tabindex='" + index + "' id='webRequest"+index+"' class='card-header' data-bs-placement='top' role='button' data-bs-container='#webRequest" + index + "' data-bs-toggle='popover' data-bs-trigger='hover' data-bs-html='true' title='" + sanitize(row.dommainMapping[0][1]) + ' : ' + sanitize(row.dommainMapping[0][0]) + "' data-bs-content='<b>Owned by:</b> " + sanitize(row.dommainMapping[0][3]) + " <br /> <b>Description:</b>" + sanitize(row.dommainMapping[0][4]) + " <br /> <b>GDPR Portal:</b> " + sanitize(row.dommainMapping[0][5]) + "'>" + sanitize(row.webRequestResourceUrl) + "</a>",
          "<div class='card-body' id='webRequestBody"+index+"'>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));

        webRequestList.append(webRequestCard);


        for (let [lindex, list] of row.listsMatched.entries()) {
          let webRequestSubtitle = $(["<p class='card-subtitle tracking-list'><b>" + list[4] + "</b> - " + list[2] + ", <br /> " + list[1] + "</p>"].join("\n"));
          // webRequestList.append(webRequestSubtitle);
          webRequestBelongsTo = $("#webRequestBody"+index+"");
          webRequestBelongsTo.append(webRequestSubtitle);
        }

      } else if (row.dommainMapping) {
        webRequestCard = $([
          "<div class='col-sm-12'>",
          "<div class='card m-1'>",
                    "<a tabindex='" + index + "' id='webRequest"+index+"' class='card-header' data-bs-placement='top' role='button' data-bs-container='#webRequest" + index + "' data-bs-toggle='popover' data-bs-trigger='hover' data-bs-html='true' title='" + sanitize(row.dommainMapping[0][1]) + ' : ' + sanitize(row.dommainMapping[0][0]) + "' data-bs-content='<b>Owned by:</b> " + sanitize(row.dommainMapping[0][3]) + " <br /> <b>Description:</b>" + sanitize(row.dommainMapping[0][4]) + " <br /> <b>GDPR Portal:</b> " + sanitize(row.dommainMapping[0][5]) + "'>" + sanitize(row.webRequestResourceUrl) + "</a>",
          "</div>",
          "</div>"
        ].join("\n"));

        webRequestList.append(webRequestCard);

      } else if (row.listsMatched) {
        nameClass = 'alert-warning';
        webRequestCard = $([
          "<div class='col-sm-12'>",
          "<div class='webRequestCard card m-1 "+nameClass+"'>",
          "<a tabindex='" + index + "' id='webRequest" + index + "' class='card-header' >" + sanitize(row.webRequestResourceUrl) + "</a>",
          "<div class='card-body' id='webRequestBody"+index+"'>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));

        webRequestList.append(webRequestCard);

        for (let [lindex, list] of row.listsMatched.entries()) {
          let webRequestSubtitle = $(["<p class='card-subtitle tracking-list'><b>" + list[4] + "</b> - " + list[2] + ", <br /> " + list[1] + "</p>"].join("\n"));
          webRequestBelongsTo = $("#webRequestBody"+index+"");
          webRequestBelongsTo.append(webRequestSubtitle);
        }
      }
      webRequestList.append(webRequestCard);
    }
  } else {
    let p = document.createElement("p");
    let content = document.createTextNode("No cookies in this tab.");

    p.appendChild(content);
  }
}

/*
 * handleError()
 *
 * Handles any error in sending / receiving message
 *
 * @param (object)      error     contains any errors produced
 */
function handleError(error) {
  console.log(`Error: ${error}`);
}
