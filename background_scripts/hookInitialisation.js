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

    // ANY CODE YOU PUT HERE MUST GO IN STARTUP HOOK AFTER DEPLOYMENT

    //Initialize DB
    let dynamicDao = new DynamicDao('sqlite', null);

    console.log(dynamicDao.db);

    console.log("DD in Install");
    console.log(DynamicDao.SQL);

    await dynamicDao.createDatabase();
    await dynamicDao.retrieveDatabase();
    console.log(dynamicDao);

    console.log(DynamicDao.DB);


    let now = Date.now(); // Unix timestamp in milliseconds

    let session = new Session();
    //DynamicDao.localforage.setItem('session', session);


    //IMPORTANT
    // let activeSites = {
    //   'operation': "SELECT",
    //   'query': "hostname FROM session WHERE expirationDate >= ?",
    //   'values': [now]
    // };
    // activeSites = await dynamicDao.agnosticQuery(activeSites);
    // //console.log(activeSites);
    //
    // if (activeSites[0]) {
    //   activeSites[0].values.forEach((item, i) => {
    //     session.activeHostname = item[0];
    //   });
    // }
    //
    // let expiredSites = {
    //   'operation': "SELECT",
    //   'query': "hostname, loggedDate, expirationDate FROM session WHERE expirationDate < ?",
    //   'values': [now]
    // };
    // expiredSites = await dynamicDao.agnosticQuery(expiredSites);
    // //console.log(expiredSites);
    //
    // if (expiredSites[0]) {
    //   expiredSites[0].values.forEach((item, i) => {
    //     session.expiredHostname = item[0];
    //   });
    // }
    //
    // console.log(session.activeSites);
    // console.log(session.expiredSites);

    // let statement2 = {
    //   'operation': "SELECT",
    //   'query': "* FROM cookies",
    // };
    // result = await dynamicDao.agnosticQuery(statement2);
    // console.log(result);
    //
    // let getSession = {
    //   'operation': "SELECT",
    //   'query': "* FROM session",
    // };
    // result = await dynamicDao.agnosticQuery(getSession);
    // console.log(result);

    //Populate Telemetry Lists
    //var lists = await getLists();

    //TESTING HERE WITH WEB_EXT Run

    //Set other variables here:

    //Do any cleanup within install here

  } catch (e) {
    console.error(e);
  } finally {
    await dynamicDao.persistDatabase();
    //await dynamicDao.closeDatabase();
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

    //console.group("Starting Up");

    //Must be called before running any db methods
    const SQL = await DynamicDao.initSqlJs(DynamicDao.config);
    DynamicDao.SQL = SQL;
    //console.log("DynamicDao - handleStartup - sql.js loaded");

    //Initialize DB
    var dynamicDao = new DynamicDao('sqlite', null);
    //await dynamicDao.createDatabase();
    await dynamicDao.retrieveDatabase();

    let statement2 = {
      'operation': "SELECT",
      'query': "* FROM cookies",
    };
    result = await dynamicDao.agnosticQuery(statement2);
    console.log(result);

    //Load DB
    //var db = await retrieveDatabase(); //TODO: Not sure I need to retrieve this here

    //Do other things
  } catch (e) {
    console.error(e);
  } finally {
    await dynamicDao.persistDatabase();
    await dynamicDao.closeDatabase();
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

    console.log(DynamicDao.DB);

    //Get Host from URL
    let url = new URL(changeInfo.url);

    //Test getting localforage
    let session = await localforage.getItem('session');

    //Only act on "new" (for now) URL
    if (changeInfo.url && url.hostname && !(session.activeSites.includes(url.hostname))) {

      //Must be called before running any db methods
      // const SQL = await DynamicDao.initSqlJs(DynamicDao.config);
      // DynamicDao.SQL = SQL;
      // //console.log("DynamicDao - handleInstall - sql.js loaded");
      //
      // //Initialize DB
      // var dynamicDao = new DynamicDao('sqlite', null);
      //Test getting localforage

      console.log(DynamicDao);

      let dynamicDao = await DynamicDao.localforage.getItem('dynamicDao');
      console.log(dynamicDao);

      //await dynamicDao.retrieveDatabase();

      console.log("Tab: " + tabId +
        " URL changed to " + changeInfo.url + " The host is " + url.hostname);


      let now = Date.now(); // Unix timestamp in milliseconds
      let expires = (now + 24 * 60 * 60 * 1000);

      console.log(now);
      console.log(expires);

      //Insert the url.hostname into a separate database table
      // let insertHost = {
      //   'operation': "INSERT",
      //   'query': "INTO session (hostname, loggedDate, expirationDate) VALUES (?, ?, ?) RETURNING rowid",
      //   'values': [url.hostname, now, expires],
      // };
      // insertHost = await dynamicDao.agnosticQuery(insertHost);

      let activeSites = {
        'operation': "SELECT",
        'query': "hostname FROM session WHERE expirationDate >= ?",
        'values': [now]
      };
      activeSites = await dynamicDao.agnosticQuery(activeSites);
      console.log(activeSites);

      //Get cookies set
      details = {
        'url': changeInfo.url,
      };
      let cookies = await browser.cookies.getAll(details);
      //console.log(cookies);

      // Regular for loop instead of foreach due to asynchronous nature
      for (var cookie of cookies) {
        //console.log(cookie);
        cookie.hostOnly === true ? 1 : 0;
        cookie.expirationDate = parseInt(cookie.expirationDate);
        insertCookie = {
          'operation': "INSERT",
          'query': "INTO cookies (domain, expirationDate, hostOnly, name, value, hostname) VALUES (?, ?, ?, ?, ?, ?) RETURNING rowid",
          'values': [cookie.domain, cookie.expirationDate, cookie.hostOnly, cookie.name, cookie.value, hostId],
        };
        result = await dynamicDao.agnosticQuery(insertCookie);

        //console.log(result);
      }

      session.current = url.hostname;
      //console.log(session.log);

      //initialise count here

    } else {
      //increment count here based on url.hostname
    }
  } catch (e) {
    throw (e)
  } finally {
    //Persist to db
    await dynamicDao.persistDatabase();
    await dynamicDao.closeDatabase();
    console.log(dynamicDao.db);
  }
  return true;
}
