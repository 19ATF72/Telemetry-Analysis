/**
 * Session - Micah Hobby - 17027531
 *
 * Handles recording of cookies / sites for the database.
 * TODO: Needs more fleshed out description
 **/
class Session {
  static activeSites = [];
  static expiredSites = [];

  /*
   * getActiveSites()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     activeSites      List of sites already crawled
   */
  static async getActiveSites(now) {
    let activeSites = {
      'operation': "SELECT",
      'query': "hostname FROM session WHERE expirationDate >= ?",
      'values': [now]
    };
    let activeSitesList = [];
    try {
      activeSites = await DynamicDao.agnosticQuery(activeSites);
      if (activeSites[0]) {
        activeSites[0].values.forEach((item, i) => {
          activeSitesList.push(item[0]);
        });
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return activeSitesList;
    }
  }

  /*
   * getExpiredSites()
   *
   * performs query to retrieve expired sites from database that need to be cached
   *
   * @return {ArrayList}     expiredSites      List of sites needing recache
   */
  static async getExpiredSites(now) {
    let expiredSites = {
      'operation': "SELECT",
      'query': "hostname, loggedDate, expirationDate FROM session WHERE expirationDate < ?",
      'values': [now]
    };
    let expiredSitesList = [];
    try {
      expiredSites = await DynamicDao.agnosticQuery(expiredSites);
      if (expiredSites[0]) {
        expiredSites[0].values.forEach((item, i) => {
          expiredSitesList.push(item[0]);
        });
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return expiredSitesList;
    }
  }

  /*
   * insertHost()
   *
   * Query to insert a new site with details regarding to it
   *
   * @return {Integer}     rowid      ID of record just inserted
   */
  static async insertHost(hostname, now) {
    let rowid;
    try {
      let expires = (now + 24 * 60 * 60 * 1000);
      let insertHost = {
        'operation': "INSERT",
        'query': "INTO session (hostname, loggedDate, expirationDate, visitCount) VALUES (?,?,?,?) RETURNING rowid",
        'values': [hostname, now, expires, 1],
      };
      rowid = await DynamicDao.agnosticQuery(insertHost);
    } catch (e) {
      console.error(e);
      throw (e);
    } finally {
      return rowid;
    }
  }

  /*
   * updateHost()
   *
   * performs query to retrieve expired sites from database that need to be cached
   *
   * @return {Integer}     rowid      id of host updated
   */
  static async updateHost(hostId, now) {
    let rowid;
    try {
      let expires = (now + 24 * 60 * 60 * 1000);
      let updateHost = {
        'operation': "UPDATE",
        'query': "session SET loggedDate = ?, expirationDate = ? WHERE rowid = ? RETURNING rowid",
        'values': [now, expires, hostId],
      };
      rowid = await DynamicDao.agnosticQuery(updateHost);
      //return rowid;
    } catch (e) {
      console.error(e);
      throw (e);
    } finally {
      return rowid;
    }
  }

  /*
   * getHostRowidByName()
   *
   * Query retrieves rowid of host that matches the name
   *
   * @return {ArrayList}     expiredSites      List of sites needing recache
   */
  static async getHostRowidByName(hostname) {
    let rowid;
    try {
      let getHost = {
        'operation': "SELECT",
        'query': "rowid FROM session WHERE hostname = ?",
        'values': [hostname],
      };
      rowid = await DynamicDao.agnosticQuery(getHost);
      rowid = rowid[0].values[0][0];
    } catch (e) {
      console.error(e);
      throw (e);
    } finally {
      return rowid;
    }
  }

}
