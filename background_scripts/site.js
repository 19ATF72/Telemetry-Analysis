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
   * @return {ArrayList}     cookies      List of all cookies for site
   */
  static async getCookies(siteUrl) {
    let cookies = [];
    try {
      let details = {
        'url': siteUrl,
      };
      //Get cookies set
      cookies = await browser.cookies.getAll(details);
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return cookies;
    }
  }

  /*
   * insertCookie()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     all_rowid      ids of cookies inserted
   */
  static async insertCookies(cookies, hostId) {
    let all_rowid = [];
    let list_detail_rowids;
    let cookie_rowid;
    try {
      for (var cookie of cookies) {
        cookie.hostOnly === true ? 1 : 0;
        cookie.expirationDate = parseInt(cookie.expirationDate);
        let insertCookie = {
          'operation': "INSERT",
          'query': "INTO cookie (domain, expirationDate, hostOnly, name, value, session_rowid) VALUES (?, ?, ?, ?, ?, ?) RETURNING rowid",
          'values': [cookie.domain, cookie.expirationDate, cookie.hostOnly, cookie.name, cookie.value, hostId],
        };
        cookie_rowid = await DynamicDao.agnosticQuery(insertCookie);
        all_rowid.push(cookie_rowid);

        list_detail_rowids = await Site.classifyCookieByDomain(cookie);
        if (list_detail_rowids && list_detail_rowids.length) {
          for (var list_detail_rowid of list_detail_rowids) {
            let insertListDetail = {
              'operation': "INSERT",
              'query': "INTO cookie_list_detail (cookie_rowid, list_detail_rowid) VALUES (?, ?)",
              'values': [cookie_rowid, list_detail_rowid[0]],
            };
            await DynamicDao.agnosticQuery(insertListDetail);
          }
        }

        cookie_name_category_rowid = await Site.classifyCookieByName(cookie);
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return all_rowid;
    }
  }

  /*
   * removeCookies()
   *
   * Updates cookie table with new cookie values for site by hostname
   *
   * @return {ArrayList}     rowid      ids of cookies removed
   */
  static async removeCookies(hostId) {
    let rowid = [];
    let removeCookies = {
      'operation': "DELETE",
      'query': "FROM cookie WHERE session_rowid = ? RETURNING rowid",
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
   * classifyCookiesByDomain()
   *
   * Selects all matching records in list_value
   *
   * @return {ArrayList}     matchedValue      values from list_value
   */
  static async classifyCookieByDomain(cookie) {
    let strippedDomain;
    let classifyCookie;
    let list_detail_rowid;
    try {
      if(cookie.domain.startsWith('.')) {
        strippedDomain = cookie.domain.substring(1);
      }
      if(cookie.domain.endsWith('.')) {
        strippedDomain = cookie.domain.slice(0, -1);
      }
      if(strippedDomain) {
        classifyCookie = {
          'operation': "SELECT",
          'query': `ld.rowid
                    FROM list_value AS lv
                    INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
                    WHERE lv.host LIKE ? OR lv.host LIKE ?`,
          'values': [cookie.domain, strippedDomain],
        };
      } else {
        classifyCookie = {
          'operation': "SELECT",
          'query': `ld.rowid
                    FROM list_value AS lv
                    INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
                    WHERE lv.host LIKE ?`,
          'values': [cookie.domain],
        };
      }
      classifyCookie = await DynamicDao.agnosticQuery(classifyCookie);
      if(classifyCookie && classifyCookie.length) {
        list_detail_rowid = classifyCookie[0].values;
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return list_detail_rowid;
    }
  }

  /*
   * classifyCookieByName()
   *
   * Retrieves rowid of matching name in categorization table
   *
   * @return {ArrayList}     matchedValue      values from list_value
   */
  static async classifyCookieByName(cookie) {
    console.log(cookie.name);
    // let strippedDomain;
    // let classifyCookie;
    // let list_detail_rowid;
    // try {
    //   if(cookie.domain.startsWith('.')) {
    //     strippedDomain = cookie.domain.substring(1);
    //   }
    //   if(cookie.domain.endsWith('.')) {
    //     strippedDomain = cookie.domain.slice(0, -1);
    //   }
    //   if(strippedDomain) {
    //     classifyCookie = {
    //       'operation': "SELECT",
    //       'query': `ld.rowid
    //                 FROM list_value AS lv
    //                 INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
    //                 WHERE lv.host LIKE ? OR lv.host LIKE ?`,
    //       'values': [cookie.domain, strippedDomain],
    //     };
    //   } else {
    //     classifyCookie = {
    //       'operation': "SELECT",
    //       'query': `ld.rowid
    //                 FROM list_value AS lv
    //                 INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
    //                 WHERE lv.host LIKE ?`,
    //       'values': [cookie.domain],
    //     };
    //   }
    //   classifyCookie = await DynamicDao.agnosticQuery(classifyCookie);
    //   if(classifyCookie && classifyCookie.length) {
    //     list_detail_rowid = classifyCookie[0].values;
    //   }
    // } catch (e) {
    //   console.error(e);
    //   throw (e)
    // } finally {
    //   return list_detail_rowid;
    // }
  }

  /*
   * getCookieClassification()
   *
   * Selects all matching records in list_value
   *
   * @return {ArrayList}     matchedValue      values from list_value
   */
         //SEPARATE QUERY THAT RETRIEVES THE MATCHES & DETAILS FOR DISPLAY
  static async getCookieClassification(cookies) {
    let strippedDomain;
    let classifyCookie;
    let matchedValues = [];
    try {
      for (var cookie of cookies) {
        if(cookie.domain.startsWith('.')) {
          strippedDomain = cookie.domain.substring(1);
        }
        if(cookie.domain.endsWith('.')) {
          strippedDomain = cookie.domain.slice(0, -1);
        }
        if(strippedDomain) {
          classifyCookie = {
            'operation': "SELECT",
            'query': "rowid, * FROM list_value WHERE host LIKE ? OR host LIKE ?",
            'values': [cookie.domain, strippedDomain],
          };
          classifyCookie = {
            'operation': "SELECT",
            'query': `ld.rowid, ld.sourceRepo, ld.description,
                      lv.dns,
                      lc.name,
                      la.name
                      FROM list_value AS lv
                      INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
                      INNER JOIN list_category AS lc ON ld.list_category_rowid = lc.rowid
                      INNER JOIN list_accuracy AS la ON ld.list_accuracy_rowid = la.rowid
                      WHERE host LIKE ? OR host LIKE ?`,
            'values': [cookie.domain, strippedDomain],
          };
        } else {
          classifyCookie = {
            'operation': "SELECT",
            'query': `ld.rowid, ld.sourceRepo, ld.description,
                      lv.dns,
                      lc.name,
                      la.name
                      FROM list_value AS lv
                      INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
                      INNER JOIN list_category AS lc ON ld.list_category_rowid = lc.rowid
                      INNER JOIN list_accuracy AS la ON ld.list_accuracy_rowid = la.rowid
                      WHERE host LIKE ?`,
            'values': [cookie.domain],
          };
        }
        //MAYBE HAVE THIS CLASIFY ONLY JOIN WITH THE DETAIL ASPECT
        //LINK IT TO COOKIES THAT WAY
        //SEPARATE QUERY THAT RETRIEVES THE MATCHES & DETAILS FOR DISPLAY
        classifyCookie = await DynamicDao.agnosticQuery(classifyCookie);
        if(classifyCookie && classifyCookie.length) {
          let matchedValue = {cookieName: cookie.name, sitesMatched: classifyCookie[0].values};
          matchedValues.push(matchedValue);
        }
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return matchedValues;
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
