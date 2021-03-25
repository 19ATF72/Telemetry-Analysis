// // DAO connection to database here
// async function getPlatform() {
//   var platformInfo = await browser.runtime.getPlatformInfo();
//   var browserInfo = await browser.runtime.getBrowserInfo();
//   //console.log(platformInfo);
//   //console.log(browserInfo);
// }
// getPlatform()

//
// function logCookie(c) {
//   console.log(c);
// }
//
// function logError(e) {
//   console.error(e);
// }
//
// var setCookie = browser.cookies.set({ url: "https://developer.mozilla.org/" });
// setCookie.then(logCookie, logError);

/**
 * DynamicDao - Micah Hobby - 17027531
 *
 * Handles database installation / removal and performing CRUD operations.
 * Also performs persisting the database to long term storage in IndexedDB.
 * The database used during execution is SQL.js a javascript library that allows
 * for creating virtual databases in memory using WebAssembly.
 * At the beggining and end of each session the database is retrieved or stored
 * to the persistant IndexedDB storage.
 **/

/*
 * Hooks
 *
 * Contains hooks to events in the browser lifecycle with extension actions
 */

// Hook that triggers upon install to run initialize database script.
browser.runtime.onInstalled.addListener(handleInstall);

// Hook that triggers upon startup.
browser.runtime.onStartup.addListener(handleStartup);

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
    //Initialize DB
    var db = await createDatabase("sqlite");

    //Populate Telemetry Lists
    //var lists = await getLists();

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
      url: "https://giphy.com/explore/cat"
    });

    console.group("Starting Up");

    //Load DB
    //var db = await retrieveDatabase(); //TODO: Not sure I need to retrieve this here

    //Do other things
  } catch (e) {
    console.error(e);
  }
}

/*
 * Helper Functions
 *
 * Contains functions useful to persisting/loading the database from IndexedDB
 */



/*
 * toBinString()
 *
 * Exports database to string, allows for saving to IndexedDB
 *
 * @param {Uint8Array}      arr         Array containing the database export
 *                                      to the install/upgrade process.
 *
 * @return {String}         strings     String version of the database
 */
function toBinString(arr) {
  var uarr = new Uint8Array(arr);
  var strings = [],
    chunksize = 0xffff;
  // There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
  for (var i = 0; i * chunksize < uarr.length; i++) {
    strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
  }
  return strings.join('');
}

/*
 * toBinArray()
 *
 * Restores database from string to javascript database
 *
 * @param {String}         str         String version of the database
 *
 * @return {Uint8Array}    arr         Converted array version of database
 */
function toBinArray(str) {
  var l = str.length,
    arr = new Uint8Array(l);
  for (var i = 0; i < l; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

/*
 * CRUD + Load/Unload Functions
 *
 * Contains functions used for interacting with the database
 */

/*
 * createDatabase()
 *
 * Creates database in sql.js and persists it to indexedDB
 *
 * @param {string}      name         Name for the new database
 *
 * @return {boolean}    success         Returns outcome of the operation
 */
async function createDatabase(name) {

  try {
    //console.group("DynamicDao - createDatabase");

    const config = {
      locateFile: filename => `../node_modules/sql.js/dist/${filename}`
    }
    const initSqlJs = window.initSqlJs;
    const SQL = await initSqlJs(config);
    //console.log("DynamicDao - createDatabase - sql.js loaded");

    var loadDb = await window.localforage.getItem(name);
    //console.log("DynamicDao - createDatabase - localforage attempted retrieval");

    if (loadDb) {
      //console.log("DynamicDao - createDatabase - db loaded from storage");
      //Load db from memory
      var db = new SQL.Database(toBinArray(loadDb));
      //console.log(db);
    } else {
      //console.log("DynamicDao - createDatabase - creating db");
      //Create the database
      var db = new SQL.Database();
      //console.log(db);

      // Run a query without reading the results
      db.run("CREATE TABLE test (col1, col2);");
      // Insert two rows: (1,111) and (2,222)
      db.run("INSERT INTO test VALUES (?,?), (?,?), (?,?), (?,?), (?,?)", [1, 111, 2, 222, 3, 333, 4, 444, 5, 555]);

      //TODO: Modify this to get a text file with SLITE creating instructions
      //Use statement iterator to run the whole file in one go.

    }
  } catch (e) {
    throw (e);
  } finally {
    // save
    await window.localforage.setItem("sqlite", toBinString(db.export()));
    db.close(); //TODO: Might remove once class.
  }
  return db //TODO: Might not need to return dead db instead just true?
}

/*
 * retrieveDatabase()
 *
 * Retrieves sqlite string persisted in indexedDB
 *
 * @param {string}      name         Name for the new database
 *
 * @return {boolean}    success         Returns outcome of the operation
 */
async function retrieveDatabase(name) {

  try {
    //console.group("DynamicDao - retrieveDatabase");

    var config = {
      locateFile: filename => `../node_modules/sql.js/dist/${filename}`
    }
    var initSqlJs = window.initSqlJs;
    var SQL = await initSqlJs(config);
    //console.log("DynamicDao - retrieveDatabase - sql.js loaded");

    var loadDb = await window.localforage.getItem(name);

    if (loadDb) {
      //console.log("DynamicDao - retrieveDatabase - db loaded from storage");
      //Load db from memory
      var db = new SQL.Database(toBinArray(loadDb));
      //console.log(db);
    } else {
      //db = null;
      throw new Error("DynamicDao - retrieveDatabase - Cannot load database")
    }
  } catch (e) {
    throw (e);
  }

  //console.groupEnd();
  return db;

};

/*
 * agnosticQuery()
 *
 * allows for performing a dynamic query
 *
 * @param {Array}     statement        Contains parts to build statement
 *
 * @return {}         values           Returns outcome of the operation
 */
async function agnosticQuery(statement) {
  try {
    var db = await retrieveDatabase("sqlite");

    console.log(statement);
    var stmt = db.prepare(statement['operation'] + ' ' + statement['query'],
      statement['values']);
    var rs = null;

    console.log(statement['operation']);
    switch (statement['operation']) {
      case 'SELECT':
        while (stmt.step()) { //
          var row = stmt.getAsObject();
          var row2 = stmt.get();
          console.log('Here is a row: ' + JSON.stringify(row));
        }
        rs = "ASSIGN SOMEHOW" //TODO: figure out best way to return JSON
        break;
        //Might be useful for operating over select statement results.
        //db.each("SELECT name,age FROM users WHERE age >= $majority", {$majority:18},
        //    function (row){console.log(row.name + " is a grown-up.")}
        //);
      case 'INSERT':
      case 'UPDATE':
      case 'DELETE':
        stmt.run()
        rs = db.getRowsModified();
        console.log(rs);
        break;
      default:
        throw new Error("DynamicDao - agnosticQuery - Invalid operation");
    }

    if(rs){
      return rs;
    }
    throw new Error("DynamicDao - agnosticQuery - SQL operation failed");
  } catch (e) {
    console.error(e);
    throw (e)
  } finally {
    //Commit changes in SQL db to IndexedDB
    await window.localforage.setItem("sqlite", toBinString(db.export()));
    stmt.free();
    stmt.freemem();
    db.close(); //TODO: Might remove once Class
  }
}

let statement = {
  'operation': "SELECT",
  'query': "col1, col2 FROM test WHERE col1=:aval AND col2=:bval",
  'values': {
    ':aval': 1,
    ':bval': 111
  }
};

let statement1 = {
  'operation': "SELECT",
  'query': "* FROM test WHERE col1 BETWEEN $start AND $end",
  'values': {
    '$start': 1,
    '$end': 5,
  }
};

let statement2 = {
  'operation': "SELECT",
  'query': "* FROM test",
};

let statement3 = {
  'operation': "INSERT",
  'query': "INTO test VALUES (?,?)",
  'values': [49, 49],
};

async function test() {
  try {
    result = await agnosticQuery(statement2);
    result = await agnosticQuery(statement3);
    result = await agnosticQuery(statement2);

  } catch (e) {

  }
}

test()


// async function getLists():
