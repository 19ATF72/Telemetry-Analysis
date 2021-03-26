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
    const SQL = await DynamicDao.initSqlJs(DynamicDao.config);
    DynamicDao.SQL = SQL;
    //console.log("DynamicDao - handleInstall - sql.js loaded");

    //Initialize DB
    var dynamicDao = new DynamicDao('sqlite', null);
    await dynamicDao.createDatabase();
    await dynamicDao.retrieveDatabase();

    let statement2 = {
      'operation': "SELECT",
      'query': "* FROM cookies",
    };
    result = await dynamicDao.agnosticQuery(statement2);
    console.log(result);

    await dynamicDao.persistDatabase();
    await dynamicDao.closeDatabase();

    // ANY CODE YOU PUT HERE MUST GO IN STARTUP FOR DEPLOYMENT

    //Populate Telemetry Lists
    //var lists = await getLists();

    //TESTING HERE WITH WEB_EXT Run

    //Set other variables here:

    //Do any cleanup within install here

  } catch (e) {
    console.error(e);
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
    await dynamicDao.persistDatabase();
    await dynamicDao.closeDatabase();

    //Load DB
    //var db = await retrieveDatabase(); //TODO: Not sure I need to retrieve this here

    //Do other things
  } catch (e) {
    console.error(e);
  }
}

/*
 * Hook Functions
 *
 * Contains hook functions that respond to events in the browser lifecycle
 */

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
    //Must be called before running any db methods
    const SQL = await DynamicDao.initSqlJs(DynamicDao.config);
    DynamicDao.SQL = SQL;
    //console.log("DynamicDao - handleInstall - sql.js loaded");

    //Initialize DB
    var dynamicDao = new DynamicDao('sqlite', null);
    await dynamicDao.retrieveDatabase();

    //Get Host from URL
    let url = new URL(changeInfo.url);

    //Only act on "new" (for now) URL
    if (changeInfo.url && url.hostname && !(session.log.includes(url.hostname))) {

      console.log("Tab: " + tabId +
        " URL changed to " + changeInfo.url + " The host is " + url.hostname);

      //Get cookies set
      details = {
        'url': changeInfo.url,
      };
      let cookies = await browser.cookies.getAll(details);
      //console.log(cookies);

      //Record to sql.js
      // cookies.forEach((cookie, i) => {
      //
      // });

      for (var cookie of cookies) {
        console.log(cookie);
        cookie.hostOnly === true ? 1 : 0;
        cookie.expirationDate = parseInt(cookie.expirationDate);
        let statement = {
          'operation': "INSERT",
          'query': "INTO cookies (domain, expirationDate, hostOnly, name, value) VALUES (?, ?, ?, ?, ?)",
          'values': [cookie.domain, cookie.expirationDate, cookie.hostOnly, cookie.name, cookie.value],
        };
        result = await dynamicDao.agnosticQuery(statement);
        console.log(result);
      }

      session.current = url.hostname;
      console.log(session.log);

      //Persist to db


      //initialise count here

    } else {
      //increment count here based on url.hostname
    }
  } catch (e) {
    throw (e)
  } finally {
    await dynamicDao.persistDatabase();
    await dynamicDao.closeDatabase();
  }
  return true;
}
