/*
 * Hooks
 *
 * Contains hooks to events in the browser lifecycle with extension actions
 */

// Hook that triggers upon install to run initialize database script.
browser.runtime.onInstalled.addListener(handleInstall);

// Hook that triggers upon startup.
browser.runtime.onStartup.addListener(handleStartup);

// Hook when user updates a tab with new URL
browser.tabs.onUpdated.addListener(handleUpdated);

// Hook when webRequest is made on page
browser.webRequest.onCompleted.addListener(handleWebRequestOnComplete, {urls: ["<all_urls>"]});

// Hook when a message is sent from the
browser.runtime.onMessage.addListener(handleMessage);

//When cookie is updated
// browser.cookies.onChanged.addListener(handleChanged);

/*
 * Hook Functions
 *
 * Contains hook functions that respond to events in the browser lifecycle
 */

/*
 * handleInstall() - hooks runtime.onInstalled()
 *
 * Fired when the extension is first installed or updated,
 * checks for the database or initialises it.
 *
 * @param {object}      details         Contains information related
 *                                      to the install/upgrade process.
 */
async function handleInstall(details) {
  try {
    let now = Date.now(); // Unix timestamp in milliseconds

    //Must be called before running any db methods
    DynamicDao.SQL = await DynamicDao.initSqlJs(DynamicDao.config);

    DynamicDao.dbCreated = await DynamicDao.createDatabase(now);
    DynamicDao.DB = await DynamicDao.retrieveDatabase(DynamicDao.name);

    DynamicDao.dbCreated = await DynamicDao.createExternalDatabase(List.whoTracksMe);
    DynamicDao.TRACKER_DB = await DynamicDao.retrieveDatabase(DynamicDao.externalDB);

    // ANY CODE YOU PUT HERE MUST GO IN STARTUP HOOK AFTER DEPLOYMENT
    Session.activeSites = await Session.getActiveSites(now);
    Session.expiredSites = await Session.getExpiredSites(now);

    console.log(Session.activeSites);
    console.log(Session.expiredSites);

    //LOAD CLASSIFICATIONS
    List.listCategoriesMap = await List.getListCategoriesMap();
    WebRequest.webRequestCategoriesMap = await WebRequest.getWebRequestCategoriesMap();

    //LOAD LISTS FOR CLASIFICATION
    List.listsDownloaded = await List.retrieveLists();
    console.log("Lists downloaded = ", List.listsDownloaded);

    //LOAD OPEN COOKIE DATABASE
    List.openCookieDatabaseDownloaded = await List.retrieveOpenCookieDatabase(List.openCookieDatabase);
    console.log("OpenCookieDatabase downloaded = ", List.openCookieDatabaseDownloaded);

    // Operation for removing expired lists and reloading them
    List.expiredListsUpdated = await List.updateExpiredLists(now);
    console.log("Lists updated = ", List.expiredListsUpdated);

    // Operation for removing all lists values and reloading them
    List.listsDownloaded = !(await List.removeAllListsValues());
    List.listsDownloaded = await List.retrieveLists();
    console.log("Lists downloaded = ", List.listsDownloaded);

    // Operations for adding a new list and removing a new list
    // let testList = new List(3, 3, "https://github.com/easylist/easyTest", "EasyTest", "https://v.firebog.net/hosts/AdguardDNS.txt", now, now, 0);
    // testList.listLoaded = await testList.addList();
    // testList.listLoaded = !(await List.removeList(testList.rowid));
    // console.log(testList.listLoaded);
  } catch (e) {
    console.error(e);
  } finally {
    await DynamicDao.persistDatabase();
    return true;
  }

}

/*
 * handleStartup() - hooks runtime.onStartup()
 *
 * Fired when the browser is started up
 */
async function handleStartup() {
  try {
    //Load the survey tab
    browser.tabs.create({
      url: "https://uwe.eu.qualtrics.com/jfe/form/SV_bxEcfIzIjDUQNHo"
    });

    //Must be called before running any db methods
    DynamicDao.SQL = await DynamicDao.initSqlJs(DynamicDao.config);
    DynamicDao.DB = await DynamicDao.retrieveDatabase();
    DynamicDao.TRACKER_DB = await DynamicDao.retrieveDatabase(DynamicDao.externalDB);

    // ANY CODE YOU PUT HERE MUST GO IN STARTUP HOOK AFTER DEPLOYMENT
    let now = Date.now(); // Unix timestamp in milliseconds
    Session.activeSites = await Session.getActiveSites(now);
    Session.expiredSites = await Session.getExpiredSites(now);

    console.log(Session.activeSites);
    console.log(Session.expiredSites);

    //LOAD CLASSIFICATIONS
    List.listCategoriesMap = await List.getListCategoriesMap();
    WebRequest.webRequestCategoriesMap = await WebRequest.getWebRequestCategoriesMap();
    console.log(result);

    // Operation for removing expired lists and reloading them
    List.expiredListsUpdated = await List.updateExpiredLists(now);
    console.log("Lists updated = ", List.expiredListsUpdated);

    // Operation for removing all lists values and reloading them
    List.listsDownloaded = !(await List.removeAllListsValues());
    List.listsDownloaded = await List.retrieveLists();
    console.log("Lists downloaded = ", List.listsDownloaded);
  } catch (e) {
    console.error(e);
  } finally {
    return true;
  }
}

/*
 * handleUpdated() - hooks tabs.onUpdated()
 *
 * Fired when a tab is updated in any way
 *
 * @param {Integer}   tabId          Id of tab ithat was updated
 * @param {Object}    changeInfo     Contains properties that have changed
 * @param {Object}    tabInfo        Contains new state of tab
 */
async function handleUpdated(tabId, changeInfo, tabInfo) {
  try {
    //Get URL from updated tab
    //Causes duplication when loading sites like reddit that load elements between URL loads causing multiple records per page
    //if (changeInfo.url) {
    //Check if site is done loading
    if (changeInfo.status == 'complete') {
      let url = new URL(tabInfo.url);
      // Check host from URL is valid, and not a system page, or other
      if (url.hostname) {
        // console.log("Tab: " + tabId +
        //   " URL changed to " + tabInfo.url + " The host is " + url.hostname);

        let now = Date.now(); // Unix timestamp in milliseconds

        if (Session.expiredSites.includes(url.hostname)) {
          console.log("Site is in expired list, needs caching and updating entry");
          //Find host and removed old cookies
          let hostId = await Session.getHostRowidByName(url.hostname);
          let removedRowids = await Site.removeCookies(hostId);
          //Alternatively could get the count of cookies on a site
          //Then if different compare cookie names
          //Then do replacement process
          //Get fresh cookies and store them
          let cookies = await Site.getCookies(tabInfo.url);
          let insertedRowids = await Site.insertCookies(cookies, hostId);
          hostId = await Session.updateHost(hostId, now);
          //Using indexOf instead of for loop to remove item from Array
          //Offers better performance on larger arrays according
          //https://javascript.plainenglish.io/how-to-remove-a-specific-item-from-an-array-in-javascript-a49b108404c
          let hostIndex = Session.expiredSites.indexOf(url.hostname)
          hostIndex > -1 ? Session.expiredSites.splice(hostIndex, 1) : false

          let visitCount = await Site.increaseVisitCount(url.hostname);

          //Set site in local memory
          Session.activeSites.push(url.hostname);

        } else if (!(Session.activeSites.includes(url.hostname))) {
          // console.log("Add to local memory, add to list for next startup");
          // Delay implemented to attempt capture of late js script set cookies.
          // Was impractical due to async nature of the setting and differences in timing
          // Instead opted towards using toolbar script for checking.
          // const delay = ms => new Promise(res => setTimeout(res, ms));
          // await delay(40000);
          let cookies = await Site.getCookies(tabInfo.url);
          let hostId = await Session.getHostRowid(url.hostname, now);

          // console.log(cookies);
          if (cookies.length) {
            let rowid = await Site.insertCookies(cookies, hostId);
          }
          Session.activeSites.push(url.hostname);

          //THIS IS THE CODE FOR RETRIEVING SITES FOR IDENTIFIERS
          // console.log("Retrieving sites with same cookie name identifier");
          // let matchedHosts = await Session.getHostsByCookieName(cookies, url.hostname);
          // console.log(matchedHosts);

        } else {
          // console.log("Site already in local memory");
          // console.log("Increment count for visits on this site");
          let visitCount = await Site.increaseVisitCount(url.hostname);
          // console.log(visitCount);

        }
        await DynamicDao.persistDatabase();
      }
    }
  } catch (e) {
    console.error(e);
    throw (e)
  } finally {
    return true;
  }
}

/*
 * handleWebRequest() - hooks webRequest.onCompleted()
 *
 * Fired when a webRequest is made for a page
 *
 * @param {Object}    requestDetails         Contains webRequest information
 */
async function handleWebRequestOnComplete(requestDetails) {
  try {
    if (!(requestDetails.fromCache) && DynamicDao.DB) {
      let now = Date.now(); // Unix timestamp in milliseconds
      let requestUrl = new URL(requestDetails.url);
      let strippedUrl = psl.parse(requestUrl.hostname);

      let siteHostname;
      if (!(requestDetails.documentUrl)) {
        siteHostname = new URL(requestDetails.url);
      } else {
        siteHostname = new URL(requestDetails.documentUrl);
      }

      if (siteHostname.protocol == "moz-extension:") {
        siteHostname.hostname = "www.expired.org";
      }

      if (requestDetails.frameId) {
        siteHostname = new URL(requestDetails.frameAncestors[requestDetails.frameAncestors.length-1].url);
      }

      let hostRowid = await Session.getHostRowid(siteHostname.hostname, now);
      let web_request_detail_rowid = await WebRequest.insertRequest(requestDetails, requestUrl, hostRowid, WebRequest.webRequestCategoriesMap);
      let list_detail_rowids = await WebRequest.classifyRequestByHostname(web_request_detail_rowid, requestUrl, strippedUrl, List.listCategoriesMap);
    }
  } catch (e) {
    console.error(e);
    throw (e)
  } finally {
    return true;
  }
}

/*
 * handleMessage() - hooks runtime.onMessage()
 *
 * Fired when a message is sent from anywhere in the system, used for sending
 * information to the display
 *
 * @param {Object}      request          Contents of message sent
 * @param {Object}      sender           Origin of the message sent
 * @param {Function}    sendResponse     Function to send response to message
 */
function handleMessage(request, sender, sendResponse) {
  switch (request.operation) {
    case 'popupControllerPageOpnened':
      let url = new URL(request.activeTab);
      let hostIdFufilled;
      let cookiesFufilled;
      let visitCountFufilled;
      let cookieClassificationFufilled;
      let webRequestClassificationFufilled;
      let hostsWithSameCookieNameFufilled;

      //Refresh cookies in database
      return Session.getHostRowidByName(url.hostname)
      .then(function(hostRowid) {
        hostIdFufilled = hostRowid;
        return new Promise(function(resolve, reject) {
          removed = Site.removeCookies(hostRowid);
          resolve(removed);
        });
      })
      .then(function(removed) {
        return new Promise(function(resolve, reject) {
          let cookies = Site.getCookies(url.href);
          resolve(cookies);
        });
      })
      .then(function(cookies) {
        cookiesFufilled = cookies;
        return new Promise(function(resolve, reject) {
          let insertedRowids = Site.insertCookies(cookies, hostIdFufilled);
          resolve(insertedRowids);
        });
      })
      .then(function(insertedRowids) {
        return new Promise(function(resolve, reject) {
          let visitCount = Site.getVisitCountById(hostIdFufilled);
          resolve(visitCount);
        });
      })
      .then(function(visitCount) {
        visitCountFufilled = visitCount
        return new Promise(function(resolve, reject) {
          let cookieClassification = Site.getCookieClassification(cookiesFufilled);
          resolve(cookieClassification);
        });
      })
      .then(function(cookieClassification) {
        return new Promise(function(resolve, reject) {
          cookieClassificationFufilled = cookieClassification;
          let webRequestClassification = WebRequest.getWebRequestClassification(hostIdFufilled);
          resolve(webRequestClassification);
        });
      })
      .then(function(webRequestClassification) {
        return new Promise(function(resolve, reject) {
          webRequestClassificationFufilled = webRequestClassification;
          let hostsWithSameCookieName = Session.getHostsByCookieName(cookiesFufilled, url.hostname);
          resolve(hostsWithSameCookieName);
        });
      })
      .then(function(hostsWithSameCookieName) {
        return new Promise(function(resolve, reject) {
          hostsWithSameCookieNameFufilled = hostsWithSameCookieName;
          response = {cookieClassification: cookieClassificationFufilled, hostsWithSameCookieName: hostsWithSameCookieNameFufilled, webRequestClassification: webRequestClassificationFufilled, visitCount: visitCountFufilled};
          resolve(response);
        });
      });
      break;
    case 'optionPageAccessed':
      let listsFufilled;
      //Refresh cookies in database
      return List.retrieveListsForDisplay()
      .then(function(listDetails) {
        listDetailsFufilled = listDetails;
        return new Promise(function(resolve, reject) {
          resolve(listDetails);
        });
      });
      break;
    case 'addList':
      let now = Date.now(); // Unix timestamp in milliseconds
      let listAddedFufilled;
      let newList = new List(request.newList.classification, request.newList.accuracy, request.newList.sourceRepo, request.newList.name, request.newList.filterLocation, now, now, 0);
      return newList.addList()
      .then(function(retrievalSuccess) {
        listAddedFufilled = retrievalSuccess;
        return new Promise(function(resolve, reject) {
          resolve(listAddedFufilled);
        });
      });
      break;
    case 'deleteList':
      let listDeletedFufilled;
      let removeList = new List(null, null, null, null, null, null, null, null);
      removeList.rowid = request.rowid;
      return removeList.removeList()
      .then(function(removalSuccess) {
        listDeletedFufilled = removalSuccess;
        return new Promise(function(resolve, reject) {
          resolve(listDeletedFufilled);
        });
      });
      break;
    default:
      console.log("Message not implemented yet");
      break;

  }

}

// Need to recall function on second page reload and compare count of site.
// If new cookeis are created display a warning message to the user saying as much
// Also display what the new cookies added are?

//With handleChanged record if any updates are ocurring between
//page loads and point this out to users?
//Too low level, does not allow for recording the host easily
// function handleChanged (changeInfo) {
//   var ts = new Date();
//   console.log(ts.toISOString());
//
//   console.log(changeInfo.cause);
//   console.log(changeInfo.cookie);
//   console.log("\n");
//   console.log('Cookie changed: ' +
//             '\n * Cookie: ' + JSON.stringify(changeInfo.cookie) +
//             '\n * Cause: ' + changeInfo.cause +
//             '\n * Removed: ' + changeInfo.removed);
// }
