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

  static name = "sqlite";
  static externalDB = "trackerDb";
  static config = {
    locateFile: filename => `../node_modules/sql.js/dist/${filename}`
  };
  static initSqlJs = window.initSqlJs;
  static localforage = window.localforage;
  static SQL = null;
  static DB = null;
  static TRACKER_DB = null;
  static dbCreated = false;

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
  static toBinString(arr) {
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
  static toBinArray(str) {
    var l = str.length,
      arr = new Uint8Array(l);
    for (var i = 0; i < l; i++) arr[i] = str.charCodeAt(i);
    return arr;
  }

  /*
   * createExpires()
   *
   * Returns expiry time from date passed
   *
   * @param {Integer}         Int         Epoch time to generate future time for
   *
   * @return {Uint8Array}    arr         Converted array version of database
   */
  static createExpires(now) {
    return (now + 24 * 60 * 60 * 1000);
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
  static async createDatabase(now) {
    let created = false;
    try {
      //console.group("DynamicDao - createDatabase");
      var loadDb = await DynamicDao.localforage.getItem(DynamicDao.name);
      //console.log("DynamicDao - createDatabase - localforage attempted retrieval");
      if (loadDb) {
        // console.log("DynamicDao - createDatabase - db loaded from storage");
        //Load db from memory
        var db = await new DynamicDao.SQL.Database(DynamicDao.toBinArray(loadDb));
      } else {
        // console.log("DynamicDao - createDatabase - creating db");
        //Create the database
        var db = await new DynamicDao.SQL.Database();
        let expires = DynamicDao.createExpires(now);

        //SESSION
        db.run(`CREATE TABLE session (
          hostname TEXT UNIQUE,
          loggedDate INTEGER,
          expirationDate INTEGER,
          visitCount INTEGER,
          lastAccessed INTEGER)`);

        //COOKIE
        db.run(`CREATE TABLE cookie (
          domain TEXT,
          expirationDate INTEGER,
          hostOnly INTEGER,
          name TEXT,
          value TEXT,
          session_rowid INTEGER,
          cookie_name_classification_rowid INTEGER,
          FOREIGN KEY(session_rowid) REFERENCES session(rowid)
          FOREIGN KEY(cookie_name_classification_rowid) REFERENCES cookie_name_classification(rowid))`);

        db.run(`CREATE TABLE cookie_name_classification (
          id TEXT,
          platform TEXT,
          category TEXT,
          name TEXT,
          domain TEXT,
          description TEXT,
          retention_period TEXT,
          data_controller TEXT,
          gdpr_portal TEXT,
          wildcard_match INTEGER)`);

        //LIST
        db.run(`CREATE TABLE list_value (
          dns TEXT,
          host TEXT,
          list_detail_rowid INTEGER,
          FOREIGN KEY(list_detail_rowid) REFERENCES list_detail(rowid))`);

        db.run(`CREATE TABLE list_category (
          name TEXT)`);

        db.run(`CREATE TABLE list_accuracy (
          name TEXT)`);

        db.run(`CREATE TABLE list_detail (
          list_category_rowid INTEGER,
          list_accuracy_rowid INTEGER,
          sourceRepo TEXT,
          description TEXT,
          sourceURL TEXT,
          lastUpdated INTEGER,
          expirationDate INTEGER,
          containsDNS INTEGER,
          FOREIGN KEY(list_category_rowid) REFERENCES list_category(rowid),
          FOREIGN KEY(list_accuracy_rowid) REFERENCES list_accuracy(rowid))`);

        //COOKIE + LIST
        db.run(`CREATE TABLE cookie_list_detail (
          cookie_rowid INTEGER REFERENCES cookie(rowid),
          list_detail_rowid INTEGER REFERENCES list_detail(rowid))`);

        //WEB REQUEST
        db.run(`CREATE TABLE web_request_detail (
          frameId INTEGER,
          ip TEXT,
          method TEXT,
          originUrl TEXT,
          statusLine TEXT,
          thirdParty INTEGER,
          timeStamp INTEGER,
          resourceUrl TEXT UNIQUE,
          accessCount INTEGER)`);

        db.run(`CREATE TABLE web_request_category (
          name TEXT)`);

        //WEB_REQUEST + SESSION
        db.run(`CREATE TABLE web_request_detail_session (
          session_rowid INTEGER,
          web_request_detail_rowid INTEGER,
          FOREIGN KEY(session_rowid) REFERENCES session(rowid),
          FOREIGN KEY(web_request_detail_rowid) REFERENCES web_request_detail(rowid)
          CONSTRAINT composite_key
          UNIQUE (session_rowid, web_request_detail_rowid)
          ON CONFLICT IGNORE)`);

        //WEB_REQUEST + LIST_DETAIL
        db.run(`CREATE TABLE web_request_detail_list_detail (
          web_request_detail_rowid INTEGER REFERENCES web_request_detail(rowid),
          list_detail_rowid INTEGER REFERENCES list_detail(rowid),
          CONSTRAINT composite_key
          UNIQUE (web_request_detail_rowid, list_detail_rowid)
          ON CONFLICT IGNORE)`);

        //WEB_REQUEST + WEB_REQUEST_CATEGORY
        db.run(`CREATE TABLE web_request_detail_web_request_category (
          web_request_detail_rowid INTEGER REFERENCES web_request_detail(rowid),
          web_request_category_rowid INTEGER REFERENCES web_request_category(rowid),
          CONSTRAINT composite_key
          UNIQUE (web_request_detail_rowid, web_request_category_rowid)
          ON CONFLICT IGNORE)`);
          

        //Insert list types
        db.run("INSERT INTO web_request_category (name) VALUES (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?)",
          ["fingerprinting", "fingerprinting_content", "cryptomining",
            "cryptomining_content", "tracking", "tracking_ad", "tracking_analytics",
            "tracking_social", "tracking_content", "any_basic_tracking",
            "any_strict_tracking", "any_social_tracking", "unclassified"
          ]);

        //Insert list types
        db.run("INSERT INTO list_category (name) VALUES (?), (?), (?), (?), (?)",
          ['suspicious', "advertising", "tracking", "malicious", "other", ]);

        //Insert list types
        db.run("INSERT INTO list_accuracy (name) VALUES (?), (?), (?)",
          ['low', "medium", "high"]);

        //Insert initial lists
        db.run("INSERT INTO list_detail (list_category_rowid, list_accuracy_rowid, sourceRepo, description, sourceURL, lastUpdated, expirationDate, containsDNS) VALUES (?,?,?,?,?,?,?,?)",
          [2, 3, "https://github.com/easylist/easylist", "Easylist", "https://v.firebog.net/hosts/Easylist.txt", now, expires, 0]);

        db.run("INSERT INTO list_detail (list_category_rowid, list_accuracy_rowid, sourceRepo, description, sourceURL, lastUpdated, expirationDate, containsDNS) VALUES (?,?,?,?,?,?,?,?)",
          [3, 3, "https://github.com/easylist/easylist", "Easyprivacy", "https://v.firebog.net/hosts/Easyprivacy.txt", now, expires, 0]);

        db.run("INSERT INTO list_detail (list_category_rowid, list_accuracy_rowid, sourceRepo, description, sourceURL, lastUpdated, expirationDate, containsDNS) VALUES (?,?,?,?,?,?,?,?)",
          [3, 3, "https://github.com/Kees1958/W3C_annual_most_used_survey_blocklist", "W3C_annual_most_used_survey_blocklist", "https://raw.githubusercontent.com/Kees1958/W3C_annual_most_used_survey_blocklist/master/TOP_EU_US_Ads_Trackers_HOST", now, expires, 1]);

        db.run("INSERT INTO session (hostname, loggedDate, expirationDate, visitCount) VALUES (?,?,?,?)",
          ['www.active.org', now, expires, 1]);
        db.run("INSERT INTO session (hostname, loggedDate, expirationDate, visitCount) VALUES (?,?,?,?)",
          ['www.expired.org', now, now, 1]);
        db.run("INSERT INTO session (hostname, loggedDate, expirationDate, visitCount) VALUES (?,?,?,?)",
          ['www.wikipedia.org', now, now, 1]);
        db.run("INSERT INTO cookie (domain, expirationDate, hostOnly, name, value, session_rowid) VALUES (?,?,?,?,?,?)",
          ['www.example.org', '1234', 'true', 'testCookie', 'testAgain', 1]);
        db.run("INSERT INTO cookie (domain, expirationDate, hostOnly, name, value, session_rowid) VALUES (?,?,?,?,?,?)",
          ['www.example.org', '1234', 'true', 'testCookie', 'testAgain', 3]);
        db.run("INSERT INTO cookie (domain, expirationDate, hostOnly, name, value, session_rowid) VALUES (?,?,?,?,?,?)",
          ['www.example1.org', '12341', 'true', 'testCookie1', 'testAgain11', 3]);

        //TODO: Modify this to get a text file with SLITE creating instructions
        //Use statement iterator to run the whole file in one go.
        created = true;
        await DynamicDao.localforage.setItem(DynamicDao.name, DynamicDao.toBinString(db.export()));
      }
    } catch (e) {
      console.error(e);
      throw (e);
    } finally {
      // save
      return created;
      //db.close();
    }
   //TODO: Might not need to return dead db instead just true?
  }

  /*
   * createDatabase()
   *
   * Creates database in sql.js and persists it to indexedDB
   *
   * @param {string}      name         Name for the new database
   *
   * @return {boolean}    success         Returns outcome of the operation
   */
  static async createExternalDatabase(location) {
    try {
      let loadTrackerDb = await DynamicDao.localforage.getItem(DynamicDao.externalDB);
      if (loadTrackerDb) {
        //Load db from memory
        var trackerDb = await new DynamicDao.SQL.Database(DynamicDao.toBinArray(loadTrackerDb));
      } else {
        // LOADING THE WhoTracksMe DATABASE FROM SERVER
        let dataPromise = fetch(location).then(res => res.arrayBuffer());
        let buf = await dataPromise;
        var trackerDb = await new DynamicDao.SQL.Database(await new Uint8Array(buf));
      }
    } catch (e) {
      console.error(e);
      //throw (e);
    } finally {
      await DynamicDao.localforage.setItem(DynamicDao.externalDB, DynamicDao.toBinString(trackerDb.export()));
      //trackerDb.close();
    }
    return true;
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
  static async retrieveDatabase(name) {
    try {
      //console.group("DynamicDao - retrieveDatabase");
      var loadDb = await DynamicDao.localforage.getItem(name);
      if (loadDb) {
        //console.log("DynamicDao - retrieveDatabase - db loaded from storage");
        //Load db from memory
        loadDb = new DynamicDao.SQL.Database(DynamicDao.toBinArray(loadDb));
      } else {
        throw new Error("DynamicDao - retrieveDatabase - Cannot load database");
      }
    } catch (e) {
      throw (e);
    }
    //console.groupEnd();
    return loadDb;
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
  static async agnosticQuery(statement) {
    try {
      //console.log(statement);
      var rs = DynamicDao.DB.exec(statement['operation'] + ' ' + statement['query'],
        statement['values']);
      switch (statement['operation']) {
        case 'SELECT':
          //Might be useful for operating over select statement results.
          //db.each("SELECT name,age FROM users WHERE age >= $majority", {$majority:18},
          //    function (row){console.log(row.name + " is a grown-up.")}
          //);
          break;
        case 'INSERT':
        case 'UPDATE':
          if (rs.length) {
            rs = rs[0].values[0][0];
          } else {
            // console.log("rs empty");
            rs = null;
          }
          case 'DELETE':
            //Get the amount of rows Removed
            //Or just return the rowid
            // Getting ID of row returned by SQL
            // rs = this.db.getRowsModified();
            break;
          default:
            throw new Error("DynamicDao - agnosticQuery - Invalid operation");
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return rs;
    }
  }

  /** NEEDS TO BE CONVERTED TO JUST USE AGNOSTIC QUERY AND PASS THE DB TO USE **/
  /*
   * externalAgnosticQuery()
   *
   * allows for performing a dynamic query
   *
   * @param {Array}     statement        Contains parts to build statement
   *
   * @return {}         values           Returns outcome of the operation
   */
  static async externalAgnosticQuery(statement) {
    try {
      var rs = DynamicDao.TRACKER_DB.exec(statement['operation'] + ' ' + statement['query'],
        statement['values']);
      switch (statement['operation']) {
        case 'SELECT':
          break;
        case 'INSERT':
        case 'UPDATE':
          if (rs.length) {
            rs = rs[0].values[0][0];
          } else {
            rs = null;
          }
          case 'DELETE':
            break;
          default:
            throw new Error("DynamicDao - externalAgnosticQuery - Invalid operation");
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return rs;
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
  static async persistDatabase() {
    try {
      //console.group("DynamicDao - persistDatabase");
      await DynamicDao.localforage.setItem(DynamicDao.name, DynamicDao.toBinString(DynamicDao.DB.export()));
      await DynamicDao.localforage.setItem(DynamicDao.externalDB, DynamicDao.toBinString(DynamicDao.externalDB.export()));
    } catch (e) {
      throw (e);
      throw new Error("DynamicDao - retrieveDatabase - Could not persist DB")
    } finally {
      return true;
    }
  }

  /*
   * closeDatabase()
   *
   * Closes sql.js connection
   *
   * @return {boolean}    success         Returns outcome of the operation
   */
  static async closeDatabase() {
    try {
      DynamicDao.DB.close();
      DynamicDao.externalDB.close();
    } catch (e) {
      throw (e);
      throw new Error("DynamicDao - closeDatabase - Closing database failed")
    }
    //return true;
    return null;
  }

}
