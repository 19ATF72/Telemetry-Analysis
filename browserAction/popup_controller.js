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
        activeTab: activeTab[0].url,
        tabTitle: activeTab[0].title
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
 * On dashboard button being clicked
 */
$("#dashboard-button").on("click", function() {
  browser.runtime.openOptionsPage();
  window.close();
});

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
        nameClass = 'alert-danger';
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
      } else if (row.sitesMatched) {
        nameClass = 'alert-warning';
        card = $([
          "<div class='col-sm-4'>",
          "<div class='card m-1 " + nameClass + "'>",
          "<a tabindex='" + index + "' id='card" + index + "' class='card-header'>" + row.cookieName + "</a>",
          "<div class='card-body'>",
          "<p class='card-subtitle text-muted'>" + convertEpochToSpecificTimezone(row.cookieExpiration, +0) + "</p>",
          "<p class='card-subtitle'>" + row.cookieDomain + "</p> <br />",
          "<p class='card-subtitle'>" + sanitize(row.sitesMatched[0][4]) + " - " + sanitize(row.sitesMatched[0][2]) + ", " + sanitize(row.sitesMatched[0][1]) + "</p>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));
      } else {
        nameClass = 'alert-success';
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

  //Similar cookies
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

  //WebRequest classification
  if (message.webRequestClassification) {
    let nameClass = '';
    let webRequestCard = '';
    for (let [index, row] of message.webRequestClassification.entries()) {
      if (row.listsMatched && row.domainMapping) {
        nameClass = 'alert-warning';
        if (row.listsMatched.length > 1) {
          nameClass = 'alert-danger';
        }
        webRequestCard = $([
          "<div class='col-sm-12'>",
          "<div class='webRequestCard card m-1 " + nameClass + "'>",
          "<a tabindex='" + index + "' id='webRequest" + index + "' class='card-header' data-bs-placement='top' role='button' data-bs-container='#webRequest" + index + "' data-bs-toggle='popover' data-bs-trigger='hover' data-bs-html='true' title='" + sanitize(row.domainMapping[0][1]) + ' : ' + sanitize(row.domainMapping[0][0]) + "' data-bs-content='<b>Owned by:</b> " + sanitize(row.domainMapping[0][3]) + " <br /> <b>Description:</b>" + sanitize(row.domainMapping[0][4]) + " <br /> <b>GDPR Portal:</b> " + sanitize(row.domainMapping[0][5]) + "'>" + sanitize(row.webRequestResourceUrl) + "</a>",
          "<div class='card-body' id='webRequestBody" + index + "'>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));

        webRequestList.append(webRequestCard);

        for (let [lindex, list] of row.listsMatched.entries()) {
          let webRequestSubtitle = $(["<p class='card-subtitle tracking-list'><b>" + list[4] + "</b> - " + list[2] + ", <br /> " + list[1] + "</p>"].join("\n"));
          // webRequestList.append(webRequestSubtitle);
          webRequestBelongsTo = $("#webRequestBody" + index + "");
          webRequestBelongsTo.append(webRequestSubtitle);
        }

      } else if (row.domainMapping) {
        webRequestCard = $([
          "<div class='col-sm-12'>",
          "<div class='card m-1 alert-success'>",
          "<a tabindex='" + index + "' id='webRequest" + index + "' class='card-header' data-bs-placement='top' role='button' data-bs-container='#webRequest" + index + "' data-bs-toggle='popover' data-bs-trigger='hover' data-bs-html='true' title='" + sanitize(row.domainMapping[0][1]) + ' : ' + sanitize(row.domainMapping[0][0]) + "' data-bs-content='<b>Owned by:</b> " + sanitize(row.domainMapping[0][3]) + " <br /> <b>Description:</b>" + sanitize(row.domainMapping[0][4]) + " <br /> <b>GDPR Portal:</b> " + sanitize(row.domainMapping[0][5]) + "'>" + sanitize(row.webRequestResourceUrl) + "</a>",
          "</div>",
          "</div>"
        ].join("\n"));

        webRequestList.append(webRequestCard);

      } else if (row.listsMatched) {
        nameClass = 'alert-warning';
        if (row.listsMatched.length > 1) {
          nameClass = 'alert-danger';
        }
        webRequestCard = $([
          "<div class='col-sm-12'>",
          "<div class='webRequestCard card m-1 " + nameClass + "'>",
          "<a tabindex='" + index + "' id='webRequest" + index + "' class='card-header' >" + sanitize(row.webRequestResourceUrl) + "</a>",
          "<div class='card-body' id='webRequestBody" + index + "'>",
          "</div>",
          "</div>",
          "</div>"
        ].join("\n"));

        webRequestList.append(webRequestCard);

        for (let [lindex, list] of row.listsMatched.entries()) {
          let webRequestSubtitle = $(["<p class='card-subtitle tracking-list'><b>" + list[4] + "</b> - " + list[2] + ", <br /> " + list[1] + "</p>"].join("\n"));
          webRequestBelongsTo = $("#webRequestBody" + index + "");
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

  //SiteMap classification
  if (message.siteMap) {
    let rootId = 'rootNode';
    let nodes = new vis.DataSet();
    let edges = new vis.DataSet();

    if (message.siteMap.firstColumn) {
      nodes.add([{
        id: rootId,
        label: message.siteMap.firstColumn[1] + "\n" + message.siteMap.firstColumn[0],
        title: "This site",
        group: 'firstColumn',
        level: 1,
      }]);
    }

    if (message.siteMap.thirdColumn) {
      for (let [index, row] of message.siteMap.thirdColumn.entries()) {
        nodes.add([{
          id: row.domain,
          label: row.title + "\n" + row.domain,
          title: "Country: "+ row.country + "\n" + row.privacyPolicy,
          group: 'thirdColumn',
          level: 3,
          value: row.count * 2,
        }]);
      }
    }

    if (message.siteMap.fourthColumn.length > 0) {
      for (let [index, row] of message.siteMap.fourthColumn.entries()) {
        nodes.add([{
          id: row.domain+row.parentDomain+row.title,
          label: row.title + "\n" + row.domain,
          group: 'fourthColumn',
          level: 4,
          value: row.count,
        }]);

        edges.add([{
          from: row.domain+row.parentDomain+row.title,
          to: row.parentDomain,
          title: "Also used by",
          value: row.count,
        }]);
      }
    }

    if (message.siteMap.secondColumn) {
      for (let [index, row] of message.siteMap.secondColumn.entries()) {
        if (row.parentDomain) {
          let parent = message.siteMap.thirdColumn.find(object => object["domain"] === row.parentDomain);

          nodes.add([{
            id: row.domain + row.parentDomain,
            label: row.domain,
            title: row.title+'\nPurposes: '+row.purposes,
            group: 'secondColumn',
            level: 2,
            value: row.count + parent.count,
          }]);

          edges.add([{
            from: row.domain + row.parentDomain,
            to: row.parentDomain,
            title: "Parent organisation",
            value: parent.count,
          }]);

          edges.add([{
            from: rootId,
            to: row.domain + row.parentDomain,
            title: "Interacts with",
            value: parent.count,
          }]);

        } else {

          nodes.add([{
            id: row.domain + row.parentDomain,
            label: row.domain,
            title: row.title+'\nPurposes: '+row.purposes,
            group: 'secondColumn',
            level: 2,
            value: row.count + row.count,
          }]);

          edges.add([{
            from: row.domain + row.parentDomain,
            to: row.parentDomain,
            title: "Parent organisation",
            value: row.count + row.count,
          }]);

          edges.add([{
            from: rootId,
            to: row.domain + row.parentDomain,
            title: "Interacts with",
            value: row.count + row.count,
          }]);
        }


      }
    }

    // create a network
    var container = document.getElementById("siteMap");
    var data = {
      nodes: nodes,
      edges: edges,
    };
    let options = {
      width: '100%',
      autoResize: true,

      nodes: {
        mass: 2,
      },

      groups: {
        fourthColumn: {
          shape: 'dot',
        },

        thirdColumn: {
          shape: 'dot',
        },

        secondColumn: {
          shape: 'dot',
        },

        firstColumn: {
          shape: 'star',
        }
      },

    };

    nodes_height = '300px';
    if (nodes.length >= 10) {
      nodes_height = '400px';
    }
    if (nodes.length >= 30) {
      nodes_height = '600px';
    }
    if (nodes.length >= 60) {
      nodes_height = '800px';
    }

    options.height = nodes_height;
    $('#siteMap').css("height", options.height);

    let network = new vis.Network(container, data, options);

  } else {
    let p = document.createElement("p");
    let content = document.createTextNode("No site map for this tab.");

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
