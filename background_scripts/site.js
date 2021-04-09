/**
 * Site - Micah Hobby - 17027531
 *
 * Handles recording of cookies / sites for the database.
 **/
class Site {

  /*
   * getCookies()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     activeSites      List of sites already crawled
   */
  static async getCookies(siteUrl) {
    let cookies = [];
    try {
      //Get cookies set
      // let details = {
      //   'url': siteUrl,
      // };
      let details = {
        'url': siteUrl,
      };
      cookies = await browser.cookies.getAll(details);
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return cookies;
    }
  }

  /*
   * insertCookieToSite()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     activeSites      List of sites already crawled
   */
  static async insertCookies(cookies, hostId) {
    let rowid = [];
    try {
      for (var cookie of cookies) {
        cookie.hostOnly === true ? 1 : 0;
        cookie.expirationDate = parseInt(cookie.expirationDate);
        let insertCookie = {
          'operation': "INSERT",
          'query': "INTO cookies (domain, expirationDate, hostOnly, name, value, session_rowid) VALUES (?, ?, ?, ?, ?, ?) RETURNING rowid",
          'values': [cookie.domain, cookie.expirationDate, cookie.hostOnly, cookie.name, cookie.value, hostId],
        };
        rowid.push(await DynamicDao.agnosticQuery(insertCookie));
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return rowid;
    }
  }

  /*
   * removeCookies()
   *
   * Updates cookie table with new cookie values for site by hostname
   *
   * @return {ArrayList}     activeSites      List of sites already crawled
   */
  static async removeCookies(hostId) {
    // let removeCookies = {
    //   'operation': "DELETE",
    //   'query': "FROM cookies WHERE session_rowid = ? RETURNING rowid",
    //   'values': [hostId],
    // };
    let rowid = [];
    let removeCookies = {
      'operation': "DELETE",
      'query': "FROM cookies WHERE session_rowid = ? RETURNING rowid",
      'values': [hostId],
    };
    try {
      rowid = await DynamicDao.agnosticQuery(removeCookies);
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return rowid;
    }
  }

  /*
   * increaseVisitCount() //TODO: Might be better to put in Session, as operates on session table
   *
   * performs update query that retrieves the site record and increases count +1
   *
   * @return {Integer}     newCount      new amount of times visited
   */
  static async increaseVisitCount(hostname) {
    let newCount;
    try {
        let updateCount = {
          'operation': "UPDATE",
          'query': "session SET visitCount = visitCount + 1 WHERE hostname = ? RETURNING visitCount",
          'values': [hostname]
        };
        newCount = await DynamicDao.agnosticQuery(updateCount);
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return newCount;
    }
  }

}
