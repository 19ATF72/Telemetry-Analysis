/*
 * Hooks
 *
 * Contains hooks to events in the browser lifecycle with extension actions
 */

// Hook that triggers upon install to run initialize database script.
browser.runtime.onInstalled.addListener(handleInstall);

// Hook that triggers upon startup.
browser.runtime.onStartup.addListener(handleStartup);

//When user updates a tab with new URL
browser.tabs.onUpdated.addListener(handleUpdated);

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
    //Must be called before running any db methods
    DynamicDao.SQL = await DynamicDao.initSqlJs(DynamicDao.config);
    DynamicDao.dbCreated = await DynamicDao.createDatabase();
    DynamicDao.DB = await DynamicDao.retrieveDatabase();

    // ANY CODE YOU PUT HERE MUST GO IN STARTUP HOOK AFTER DEPLOYMENT
    let now = Date.now(); // Unix timestamp in milliseconds
    Session.activeSites = await Session.getActiveSites(now);
    Session.expiredSites = await Session.getExpiredSites(now);

    console.log(Session.activeSites);
    console.log(Session.expiredSites);

    //Populate Telemetry Lists
    //var lists = await getLists();
  } catch (e) {
    console.error(e);
  } finally {
    await DynamicDao.persistDatabase();
    //await DynamicDao.closeDatabase();
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

    // ANY CODE YOU PUT HERE MUST GO IN STARTUP HOOK AFTER DEPLOYMENT
    let now = Date.now(); // Unix timestamp in milliseconds
    Session.activeSites = await Session.getActiveSites(now);
    Session.expiredSites = await Session.getExpiredSites(now);

    console.log(Session.activeSites);
    console.log(Session.expiredSites);

    let getCookies = {
      'operation': "SELECT",
      'query': "* FROM cookies",
    };
    result = await DynamicDao.agnosticQuery(getCookies);
    console.log(result);

    let getSession = {
      'operation': "SELECT",
      'query': "* FROM session",
    };
    result = await DynamicDao.agnosticQuery(getSession);
    console.log(result);
  } catch (e) {
    console.error(e);
  } finally {
    //await DynamicDao.persistDatabase(); //No need to persist
    //await DynamicDao.closeDatabase();
    return true;
  }
}

/*
 * handleUpdated() - hooks runtime.onUpdated()
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
        console.log("Tab: " + tabId +
          " URL changed to " + tabInfo.url + " The host is " + url.hostname);

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
          //Set site in local memory
          Session.activeSites.push(url.hostname);

        } else if (!(Session.activeSites.includes(url.hostname))) {
          console.log("Add to local memory, add to list for next startup");
          // Delay implemented to attempt capture of late js script set cookies.
          // Was impractical due to async nature of the setting and differences in timing
          // Instead opted towards using toolbar script for checking.
          // const delay = ms => new Promise(res => setTimeout(res, ms));
          // await delay(40000);
          let cookies = await Site.getCookies(tabInfo.url);
          let hostId = await Session.insertHost(url.hostname, now);
          let rowid = await Site.insertCookies(cookies, hostId);
          Session.activeSites.push(url.hostname);

          // console.log("Testing checking for sites with same identifier");
          //
          // console.log(cookies);
          //
          // let sameIdentifier = await Session.getHostsWithSameCookieName(cookies);

        } else {
          console.log("Site already in local memory");
          console.log("Increment count for visits on this site");
          let visitCount = await Site.increaseVisitCount(url.hostname);
          console.log(visitCount);

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
