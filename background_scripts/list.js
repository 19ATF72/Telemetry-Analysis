/**
 * Site - Micah Hobby - 17027531
 *
 * Handles recording of cookies / sites for the database.
 **/
class List {
  static listsDownloaded = false;
  static expiredListsUpdated = false;
  static openCookieDatabase = 'https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/master/open-cookie-database.csv'
  static openCookieDatabaseDownloaded = false;

  constructor(list_category_rowid, list_accuracy_rowid, sourceRepo,description, sourceURL, lastUpdated, expirationDate) {
    this.list_category_rowid = list_category_rowid;
    this.list_accuracy_rowid = list_accuracy_rowid;
    this.sourceRepo = sourceRepo;
    this.description = description;
    this.sourceURL = sourceURL;
    this.lastUpdated = lastUpdated;
    this.expirationDate = expirationDate;
    this.listLoaded = false;
    this.rowid = null;
  }

  /*
   * retrieveLists()
   *
   * performs query to retrieve all list details from DB to download each
   *
   * @return {boolean}     retrievalSuccess      outcome of attempting retrieval
   */
  static async retrieveLists() {
    let lists = [];
    let getLists = {
      'operation': "SELECT",
      'query': "rowid, sourceURL FROM list_detail",
    };
    lists = await DynamicDao.agnosticQuery(getLists);
    let retrievalSuccess = false;
    try {
      if (lists.length) {
        for (var list of lists[0].values) {
          retrievalSuccess = await List.retrieveList(list[0], list[1]);
          if (!retrievalSuccess) {
            throw new Error("List - retrieveLists - error loading list", list[1]);
          }
        }
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return retrievalSuccess;
    }
  }

  /*
   * retrieveList()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     cookies      List of all cookies for site
   */
  static async retrieveList(listRowid, sourceURL) {
    try {
      let request = await fetch(sourceURL);
      let data = (await request.text()).split(/\r?\n/);
      for (var row of data) {
        let insertListValue = {
          'operation': "INSERT",
          'query': "INTO list_value (host, list_detail_rowid) VALUES (?, ?)",
          'values': [row, listRowid],
        };
        await DynamicDao.agnosticQuery(insertListValue);
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return true;
    }
  }

  /*
   * retrieveList()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     cookies      List of all cookies for site
   */
  static async retrieveOpenCookieDatabase(sourceURL) {
    //try {
      let request = await fetch(sourceURL);
      let data = (await request.text()).split(/,/);
      console.log(data);
    //   for (var row of data) {
    //     let insertListValue = {
    //       'operation': "INSERT",
    //       'query': "INTO list_value (host, list_detail_rowid) VALUES (?, ?)",
    //       'values': [row, listRowid],
    //     };
    //     await DynamicDao.agnosticQuery(insertListValue);
    //   }
    // } catch (e) {
    //   console.error(e);
    //   throw (e)
    // } finally {
    //   return true;
    // }
  }

  /*
   * removeLists()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     rowid      ids of cookies inserted
   */
   static async removeAllListsValues() {
     let removalSuccess = false;
     try {
       let removeRows = {
         'operation': "DELETE",
         'query': "FROM list_value",
       };
       await DynamicDao.agnosticQuery(removeRows);
       // let resetRowid = {
       //   'operation': "DELETE",
       //   'query': "FROM SQLITE_SEQUENCE WHERE name='list_value'",
       // };
       // await DynamicDao.agnosticQuery(resetRowid);
       removalSuccess = true;
     } catch (e) {
       console.error(e);
       throw (e)
     } finally {
       return removalSuccess;
     }
  }

  /*
   * removeLists()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     rowid      ids of cookies inserted
   */
   static async updateExpiredLists(now) {
     let expires = DynamicDao.createExpires(now);
     let updateSuccess = false;
     let expiredLists;
     try {
       let getExpiredLists = {
         'operation': "SELECT",
         'query': "rowid, sourceURL FROM list_detail WHERE expirationDate <= ?",
         'values': [now]
       };
       expiredLists = await DynamicDao.agnosticQuery(getExpiredLists);
       if(expiredLists.length){
         for (var list of expiredLists[0].values) {
           let removeRows = {
             'operation': "DELETE",
             'query': "FROM list_value WHERE list_detail_rowid = ?",
             'values': [list[0]]
           };
           await DynamicDao.agnosticQuery(removeRows);
           updateSuccess = await List.retrieveList(list[0], list[1]);
           if(updateSuccess) {
             let updateExpirationDate = {
               'operation': "UPDATE",
               'query': "list_detail SET lastUpdated = ?, expirationDate = ? WHERE rowid = ?",
               'values': [now, expires, list[0]]
             };
             expiredLists = await DynamicDao.agnosticQuery(getExpiredLists);
           } else{
             throw new Error("list - updateExpiredLists - could not retrieveList");
           }
         }
       }
     } catch (e) {
       console.error(e);
       throw (e)
     } finally {
       return updateSuccess;
     }
  }


  /*
   * addList()
   *
   * performs query to add lsit to details and retrieve record database to avoid re-caching
   *
   * @return {ArrayList}     cookies      List of all cookies for site
   */
  async addList() {
    let retrievalSuccess = false;
    try {
        let insertList = {
          'operation': "INSERT",
          'query': "INTO list_detail (list_category_rowid, list_accuracy_rowid, sourceRepo, description, sourceURL, lastUpdated, expirationDate) VALUES (?,?,?,?,?,?,?) RETURNING rowid",
          'values': [this.list_category_rowid, this.list_accuracy_rowid, this.sourceRepo, this.description, this.sourceURL, this.lastUpdated, this.expirationDate],
        };
        this.rowid = await DynamicDao.agnosticQuery(insertList);
        retrievalSuccess = await List.retrieveList(this.rowid, this.sourceURL);
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return retrievalSuccess;
    }
  }

  /*
   * removeList()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     rowid      ids of cookies inserted
   */
   async removeList() {
     let removalSuccess = false;
     try {
         let removeListValues = {
           'operation': "DELETE",
           'query': "FROM list_value WHERE list_detail_rowid = ?",
           'values': [this.rowid],
         };
         await DynamicDao.agnosticQuery(removeListValues);
         let removeListDetails = {
           'operation': "DELETE",
           'query': "FROM list_detail WHERE rowid = ?",
           'values': [this.rowid],
         };
         await DynamicDao.agnosticQuery(removeListDetails);
         removalSuccess = true;
     } catch (e) {
       console.error(e);
       throw (e)
     } finally {
       return removalSuccess;
     }
  }


}
