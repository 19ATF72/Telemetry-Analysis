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
class DynamicDao {

  constructor(name, db) {
    this.name = name;
    this.db = db;
  }

  static config = {
    locateFile: filename => `../node_modules/sql.js/dist/${filename}`
  };
  static initSqlJs = window.initSqlJs;
  static localforage = window.localforage;
  static SQL = null;

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
  toBinString(arr) {
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
  toBinArray(str) {
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
  async createDatabase() {

    try {
      //console.group("DynamicDao - createDatabase");

      var loadDb = await DynamicDao.localforage.getItem(this.name);
      //console.log("DynamicDao - createDatabase - localforage attempted retrieval");

      if (loadDb) {
        //console.log("DynamicDao - createDatabase - db loaded from storage");
        //Load db from memory
        var db = new DynamicDao.SQL.Database(this.toBinArray(loadDb));
        //console.log(db);
      } else {
        //console.log("DynamicDao - createDatabase - creating db");
        //Create the database
        var db = new DynamicDao.SQL.Database();
        //console.log(db);

        // Run a query without reading the results
        //db.run("CREATE TABLE test (col1, col2);");

        db.run("CREATE TABLE cookies (domain TEXT, expirationDate INTEGER, hostOnly INTEGER, name TEXT, value TEXT)");

        // Insert two rows: (1,111) and (2,222)
        //db.run("INSERT INTO test VALUES (?,?), (?,?), (?,?), (?,?), (?,?)", [1, 111, 2, 222, 3, 333, 4, 444, 5, 555]);

        db.run("INSERT INTO cookies (domain, expirationDate, hostOnly, name, value) VALUES (?,?,?,?,?)", ['www.example.org', '1234', 'true', 'testCookie', 'testAgain']);

        //TODO: Modify this to get a text file with SLITE creating instructions
        //Use statement iterator to run the whole file in one go.
      }
    } catch (e) {
      throw (e);
    } finally {
      // save
      await DynamicDao.localforage.setItem(this.name, this.toBinString(db.export()));
      db.close(); //TODO: Might remove once class.
    }
    return true; //TODO: Might not need to return dead db instead just true?
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
  async retrieveDatabase() {
    try {
      //console.group("DynamicDao - retrieveDatabase");

      var loadDb = await DynamicDao.localforage.getItem(this.name);

      if (loadDb) {
        //console.log("DynamicDao - retrieveDatabase - db loaded from storage");
        //Load db from memory
        this.db = new DynamicDao.SQL.Database(this.toBinArray(loadDb));
        //console.log(db);
      } else {
        throw new Error("DynamicDao - retrieveDatabase - Cannot load database")
      }
    } catch (e) {
      throw (e);
    }

    //console.groupEnd();
    return true;
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
  async agnosticQuery(statement) {
    try {

      console.log(statement);
      // var stmt = this.db.prepare(statement['operation'] + ' ' + statement['query'],
      //   statement['values']);
      var rs = null;
      switch (statement['operation']) {
        case 'SELECT':
          // while (stmt.step()) { //
          //   var row = stmt.getAsObject();
          //   var row2 = stmt.get();
          //   console.log('Here is a row: ' + JSON.stringify(row));
          // }
          // rs = "ASSIGN SOMEHOW" //TODO: figure out best way to return JSON

          //Might be useful for operating over select statement results.
          //db.each("SELECT name,age FROM users WHERE age >= $majority", {$majority:18},
          //    function (row){console.log(row.name + " is a grown-up.")}
          //);

          rs = this.db.exec(statement['operation'] + ' ' + statement['query'],
           statement['values']);
          //console.log(rs);
          break;
        case 'INSERT':
        case 'UPDATE':
        case 'DELETE':
          //stmt.run();
          // this.db.run(statement['operation'] + ' ' + statement['query'],
          //  statement['values']);
          // rs = this.db.getRowsModified();
          rs = this.db.exec(statement['operation'] + ' ' + statement['query'],
           statement['values']);
          //console.log(rs);
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
      await window.localforage.setItem(this.name, this.toBinString(this.db.export()));
      // stmt.free();
      // stmt.freemem();
      //db.close(); //TODO: Might remove once Class
    }
  }

  /*
   * persistDatabase()
   *
   * Updates IndexedDB storage with in memory Database
   *
   * @param {string}      name         Name for the new database
   *
   * @return {boolean}    success         Returns outcome of the operation
   */
  async persistDatabase() {
    try {
      //console.group("DynamicDao - persistDatabase");
      await DynamicDao.localforage.setItem(this.name, this.toBinString(this.db.export()));
    } catch (e) {
      throw (e);
      throw new Error("DynamicDao - retrieveDatabase - Could not persist DB")
    }
    return true;
  }

  /*
   * closeDatabase()
   *
   * Closes sql.js connection
   *
   * @return {boolean}    success         Returns outcome of the operation
   */
  async closeDatabase() {
    try {
      this.db.close();
      this.db = null;
    } catch (e) {
      throw (e);
      throw new Error("DynamicDao - closeDatabase - Closing database failed")
    }
    return true;
  }

}


// let statement = {
//   'operation': "SELECT",
//   'query': "* FROM cookies",
// };
//
// let statement1 = {
//   'operation': "SELECT",
//   'query': "* FROM test WHERE col1 BETWEEN $start AND $end",
//   'values': {
//     '$start': 1,
//     '$end': 5,
//   }
// };
//
// let statement2 = {
//   'operation': "SELECT",
//   'query': "* FROM test",
// };
//
// let statement3 = {
//   'operation': "INSERT",
//   'query': "INTO test VALUES (?,?) RETURNING rowid",
//   'values': [49, 49],
// };

// async function getLists():

// let statement = {
//   'operation': "SELECT",
//   'query': "* FROM cookies",
// };
// result = await dynamicDao.agnosticQuery(statement);
// console.log(result);
