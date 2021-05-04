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
    activeTabUrl.html('<strong>' + activeTab[0].title + '</strong>' + ' - (' + activeTab[0].url + ')');

    if (url.hostname) {
      let request = browser.runtime.sendMessage({
        operation: 'popupControllerPageOpnened',
        activeTab: activeTab[0].url
      });
      request.then(handleResponse, handleError);
    } else {
      console.log("Config page");
    }

    //popupControllerPageOpnened().then();
    //getActiveTab().then(showCookiesForTab);

    // window.addEventListener("click", notifyBackgroundPage);

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
 * @return {Object}     retrievalSuccess      outcome of attempting retrieval
 */
function convertEpochToSpecificTimezone(timeEpoch, offset){
    var d = new Date(timeEpoch);
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);  //This converts to UTC 00:00
    var nd = new Date(utc + (3600000*offset));
    return nd.toLocaleString();
}


/**
 * Message managing related functions
 */

/*
 * notifyBackgroundPage()
 *
 * Sends messsage to Dynamic_Dao to retrieve information
 *
 * @param (object)      error     contains any errors produced
 *
 * @return {boolean}     retrievalSuccess      outcome of attempting retrieval
 */
// async function popupControllerPageOpnened(e) {
//   // let activeTab = await getActiveTab();
//
//   getActiveTab().then(getUrlFromTab);
//
//   let url = new URL(activeTab[0].url);
//
//
// }

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
  console.log(message);

  var firstCookieList = $('#first-party-list .accordion-body');
  var thirdCookieList = $('#third-party-list .accordion-body');
  var firstCookieCount = $('#first-party-count');
  var thirdCookieCount = $('#third-party-count');
  var firstCookie = 0;
  var thirdCookie = 0;

  console.log(firstCookieList);
  console.log(thirdCookieList);

  if (message.cookieClassification.length > 0) {
    //add an <li> item with the name and value of the cookie to the list
    for (let row of message.cookieClassification) {
      console.log(row);
      let li = document.createElement("li");
      let content = document.createTextNode("Name: "+ row.cookieName + ", Domain: " + row.cookieDomain  + ", Expiration: " + convertEpochToSpecificTimezone(row.cookieExpiration, +0));
      li.appendChild(content);

      if (row.hostOnly) {
        firstCookieList.append(li);
        firstCookie++;

      } else {
        thirdCookieList.append(li);
        thirdCookie++;
      }
    }
    console.log(firstCookie);
    console.log(thirdCookie);
    firstCookieCount.html(firstCookie);
    thirdCookieCount.html(thirdCookie);
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
