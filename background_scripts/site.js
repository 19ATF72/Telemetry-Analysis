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
   * @param {String}         siteUrl     URL of user tab to retrieve cookies for
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
   * @param {ArrayList}         cookies    All cookies to be inserted
   * @param {Integer}           hostId     ID of host cookies belong to
   *
   * @return {ArrayList}     all_rowid      ids of cookies inserted
   */
  static async insertCookies(cookies, hostId) {
    let all_rowid = [];
    let list_detail_rowids;
    let cookie_rowid;
    let cookie_name_classification_rowid;
    try {
      for (var cookie of cookies) {
        cookie.hostOnly === true ? 1 : 0;
        cookie.expirationDate = parseInt(cookie.expirationDate);

        cookie_name_classification_rowid = await Site.classifyCookieByName(cookie);

        let insertCookie = {
          'operation': "INSERT",
          'query': "INTO cookie (domain, expirationDate, hostOnly, name, value, session_rowid, cookie_name_classification_rowid) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING rowid",
          'values': [cookie.domain, cookie.expirationDate, cookie.hostOnly, cookie.name, "cookie.value", hostId, cookie_name_classification_rowid],
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
   * @param {Integer}        hostId     ID of host cookies belong to
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
   * @param {Object}        cookie     Details of cookie to classify
   *
   * @return {ArrayList}     list_detail_rowid      ID of list matched for cookie
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
   * @param {Object}       cookie     Details of cookie to classify
   *
   * @return {Integer}     cookie_name_classification_rowid      ID of openCookieDatabase record matched
   */
  static async classifyCookieByName(cookie) {
    let cookie_name_classification_rowid;
    try {
      let classifyCookieByName = {
        'operation': "SELECT",
        'query': `rowid
                  FROM cookie_name_classification
                  WHERE name = ?`,
        'values': [cookie.name],
      };
      classifyCookieByName = await DynamicDao.agnosticQuery(classifyCookieByName);
      if(classifyCookieByName && classifyCookieByName.length) {
        cookie_name_classification_rowid = classifyCookieByName[0].values[0][0];
      } else {
        cookie_name_classification_rowid = null
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return cookie_name_classification_rowid;
    }
  }

  /*
   * getCookieClassification()
   *
   * Selects all matching records in list_value
   *
   * @param {ArrayList}         cookies    All cookies to be classified
   *
   * @return {ArrayList}     matchedValue      All classification details for cookies
   */
  static async getCookieClassification(cookies) {
    let strippedDomain;
    let classifyCookie;
    let matchedValues = [];
    let dommainMapping;
    try {
      for (var cookie of cookies) {
        let matchedValue = {cookieName: cookie.name,
                            cookieDomain: cookie.domain,
                            cookieExpiration: cookie.expirationDate,
                            cookieHostOnly: cookie.hostOnly};
        if(cookie.domain.startsWith('.')) {
          strippedDomain = cookie.domain.substring(1);
        }
        if(cookie.domain.endsWith('.')) {
          strippedDomain = cookie.domain.slice(0, -1);
        }
        if(strippedDomain) {
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
        classifyCookie = await DynamicDao.agnosticQuery(classifyCookie);

        if(classifyCookie && classifyCookie.length) {
          matchedValue.sitesMatched = classifyCookie[0].values;
        }

        let classifyCookieByName = {
          'operation': "SELECT",
          'query': `rowid, platform, category, name, domain, description, retention_period, data_controller, gdpr_portal
                    FROM cookie_name_classification
                    WHERE name = ?`,
          'values': [cookie.name],
        };
        classifyCookieByName = await DynamicDao.agnosticQuery(classifyCookieByName);

        if(classifyCookieByName && classifyCookieByName.length) {
          matchedValue.nameClassification = classifyCookieByName[0].values[0];
        }

        if (strippedDomain) {
          dommainMapping = {
            'operation': "SELECT",
            'query': `t.name, ca.name, t.website_url, co.name, co.description, co.privacy_url, co.website_url, co.country, co.privacy_contact
                      FROM tracker_domains AS td
                      INNER JOIN trackers AS t ON td.tracker = t.id
                      INNER JOIN companies AS co ON t.company_id = co.id
                      INNER JOIN categories AS ca ON t.category_id = ca.id
                      WHERE td.domain = ?`,
            'values': [strippedDomain],
          };
        } else {
          dommainMapping = {
            'operation': "SELECT",
            'query': `t.name, ca.name, t.website_url, co.name, co.description, co.privacy_url, co.website_url, co.country, co.privacy_contact
                      FROM tracker_domains AS td
                      INNER JOIN trackers AS t ON td.tracker = t.id
                      INNER JOIN companies AS co ON t.company_id = co.id
                      INNER JOIN categories AS ca ON t.category_id = ca.id
                      WHERE td.domain = ?`,
            'values': [cookie.domain],
          };
        }
        dommainMapping = await DynamicDao.externalAgnosticQuery(dommainMapping);

        if(dommainMapping && dommainMapping.length) {
          //cookie_name_classification_rowid = classifyCookieByName[0].values[0][0];
          matchedValue.dommainMapping = dommainMapping[0].values[0];
        }

        matchedValues.push(matchedValue);
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return matchedValues;
    }
  }

  /*
   * increaseVisitCount()
   *
   * performs update query that retrieves the site record and increases count +1
   *
   * @param {String}         hostname    ID for host to increase
   *
   * @return {Integer}       newCount      new amount of times visited
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

  /*
   * getVisitCountById()
   *
   * Retrueves number of visits to a site by ID
   *
   * @param {Integer}     hostId      ID of host to retrieve count
   *
   * @return {Integer}     count      number of visits to site
   */
  static async getVisitCountById(hostId) {
    let getCount;
    try {
        getCount = {
          'operation': "SELECT",
          'query': "visitCount FROM session WHERE rowid = ?",
          'values': [hostId]
        };
        getCount = await DynamicDao.agnosticQuery(getCount);
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return getCount[0].values[0][0];
    }
  }

}
