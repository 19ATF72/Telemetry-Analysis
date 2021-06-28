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
      if (cookie.domain.startsWith('.')) {
        strippedDomain = cookie.domain.substring(1);
      }
      if (cookie.domain.endsWith('.')) {
        strippedDomain = cookie.domain.slice(0, -1);
      }
      if (strippedDomain) {
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
      if (classifyCookie && classifyCookie.length) {
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
      if (classifyCookieByName && classifyCookieByName.length) {
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
    let domainMapping;
    try {
      for (var cookie of cookies) {
        let matchedValue = {
          cookieName: cookie.name,
          cookieDomain: cookie.domain,
          cookieExpiration: cookie.expirationDate,
          cookieHostOnly: cookie.hostOnly
        };
        if (cookie.domain.startsWith('.')) {
          strippedDomain = cookie.domain.substring(1);
        }
        if (cookie.domain.endsWith('.')) {
          strippedDomain = cookie.domain.slice(0, -1);
        }
        if (strippedDomain) {
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

        if (classifyCookie && classifyCookie.length) {
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

        if (classifyCookieByName && classifyCookieByName.length) {
          matchedValue.nameClassification = classifyCookieByName[0].values[0];
        }

        if (strippedDomain) {
          domainMapping = {
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
          domainMapping = {
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
        domainMapping = await DynamicDao.externalAgnosticQuery(domainMapping);

        if (domainMapping && domainMapping.length) {
          //cookie_name_classification_rowid = classifyCookieByName[0].values[0][0];
          matchedValue.domainMapping = domainMapping[0].values[0];
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

  /*
   * createSiteMap()
   *
   * Takes all the classification information generated by the system to compile a site map
   *
   * @param {String}   url                                URL of the current user tab
   * @param {String}   title                              Title of the current user tab
   * @param {String}   cookieClassificationFufilled       Cookie classification retrieved
   * @param {String}   hostsWithSameCookieNameFufilled    Other host classification retrieved
   * @param {String}   webRequestClassificationFufilled   WebRequest classification retrieved
   *
   * @return {Object}     siteMap      Unstyled map elements for display
   */
  static async createSiteMap(url, title, cookieClassification, hostsWithSameCookieName, webRequestClassification) {
    let siteMap = {
      firstColumn: [url.hostname, title],
      secondColumn: [],
      thirdColumn: [],
      fourthColumn: [],
    };

    try {
      let addNodeSuccess;

      //WebRequest classification
      if (webRequestClassification && webRequestClassification.length) {
        for (var webRequest of webRequestClassification) {
          if (webRequest.listsMatched) {

            let parsedRequestDomain = psl.parse(webRequest.webRequestResourceUrl);
            let parsedParentDomain;

            //Initialize second column details
            let secondColumnNode = {
              domain: parsedRequestDomain.domain,
              count: 1,
              purposes: [],
            };
            let thirdColumnNode = {
              count: 1,
            }

            //Domain mapping information
            if (webRequest.domainMapping) {
              parsedParentDomain = new URL(webRequest.domainMapping[0][6]);
              parsedParentDomain = psl.parse(parsedParentDomain.hostname);

              secondColumnNode.title = webRequest.domainMapping[0][0];
              secondColumnNode.parentDomain = parsedParentDomain.domain;
              secondColumnNode.purposes = webRequest.domainMapping[0][1];
              secondColumnNode.count += 1;

              thirdColumnNode.title = webRequest.domainMapping[0][3],
              thirdColumnNode.description = webRequest.domainMapping[0][4],
              thirdColumnNode.privacyPolicy = webRequest.domainMapping[0][5],
              thirdColumnNode.domain = parsedParentDomain.domain,
              thirdColumnNode.country = webRequest.domainMapping[0][7],
              thirdColumnNode.count += 1;
            }
            //Name classification information
            else if (webRequest.listsMatched) {
              let purposeList = [];
              for (var list of webRequest.listsMatched) {
                if (purposeList.indexOf(list[4]) === -1) {
                  purposeList.push(list[4]);
                  secondColumnNode.count += 1;
                }
              }
              secondColumnNode.title = parsedRequestDomain.sld;
              secondColumnNode.purposes = purposeList.join(', ');
            }

            //Attempt to add if it exists
            if (thirdColumnNode.domain) {
              addNodeSuccess = await Site.addToArrayIfUnique(thirdColumnNode, ["domain"], siteMap.thirdColumn);
              if (addNodeSuccess) {
                secondColumnNode.parentIndex = siteMap.thirdColumn.length - 1;
              } else {
                secondColumnNode.parentIndex = siteMap.thirdColumn.findIndex(object => object["domain"] === secondColumnNode.parentDomain);
              }
            }
            if (secondColumnNode.domain) {
              addNodeSuccess = await Site.addToArrayIfUnique(secondColumnNode, ["domain", "parentDomain"], siteMap.secondColumn);
            }

          }
        }
      }

      //Cookie classification
      if (cookieClassification && cookieClassification.length) {
        for (var cookie of cookieClassification) {

          //Parsing domain to correct format
          let parsedCookieDomain = cookie.cookieDomain;
          if (cookie.cookieDomain.startsWith('.')) {
            parsedCookieDomain = cookie.cookieDomain.substring(1);
          }
          if (cookie.cookieDomain.endsWith('.')) {
            parsedCookieDomain = cookie.cookieDomain.slice(0, -1);
          }
          parsedCookieDomain = psl.parse(parsedCookieDomain);

          //Initialize second column details
          let secondColumnNode = {
            domain: parsedCookieDomain.domain,
            count: 1,
            purposes: [],
          };
          let thirdColumnNode = {
            count: 1,
          }
          let parsedParentDomain;

          //Domain mapping information
          if (cookie.domainMapping) {
            parsedParentDomain = new URL(cookie.domainMapping[6]);
            parsedParentDomain = psl.parse(parsedParentDomain.hostname);

            secondColumnNode.title = cookie.domainMapping[0];
            secondColumnNode.parentDomain = parsedParentDomain.domain;
            secondColumnNode.purposes = cookie.domainMapping[1];
            secondColumnNode.count += 1;

            thirdColumnNode.title = cookie.domainMapping[3],
              thirdColumnNode.description = cookie.domainMapping[4],
              thirdColumnNode.privacyPolicy = cookie.domainMapping[5],
              thirdColumnNode.domain = parsedParentDomain.domain,
              thirdColumnNode.country = cookie.domainMapping[7],
              thirdColumnNode.count += 1;
          }
          //Name classification information
          else if (cookie.nameClassification) {
            parsedParentDomain = new URL(cookie.nameClassification[8]);
            parsedParentDomain = psl.parse(parsedParentDomain.hostname);

            secondColumnNode.title = cookie.nameClassification[1];
            secondColumnNode.parentDomain = parsedParentDomain.domain;
            secondColumnNode.purposes = cookie.nameClassification[2];
            secondColumnNode.count += 1;

            thirdColumnNode.title = cookie.nameClassification[7],
              thirdColumnNode.description = 'Not available',
              thirdColumnNode.privacyPolicy = cookie.nameClassification[8],
              thirdColumnNode.domain = parsedParentDomain.domain,
              thirdColumnNode.country = 'NA',
              thirdColumnNode.count += 1;
          }

          //Attempt to add if it exists
          if (secondColumnNode.domain && secondColumnNode.parentDomain) {
            addNodeSuccess = await Site.addToArrayIfUnique(secondColumnNode, ["domain", "parentDomain"], siteMap.secondColumn);
          }
          if (thirdColumnNode.domain) {
            addNodeSuccess = await Site.addToArrayIfUnique(thirdColumnNode, ["domain"], siteMap.thirdColumn);
          }

        }
      }

      //Cookie name classification
      if (hostsWithSameCookieName && hostsWithSameCookieName.length) {
        for (var cookie of hostsWithSameCookieName) {
          for (var site of cookie.sitesMatched) {

            let parsedCookieDomain = site[0];
            if (site[0].startsWith('.')) {
              parsedCookieDomain = site[0].substring(1);
            }
            if (site[0].endsWith('.')) {
              parsedCookieDomain = site[0].slice(0, -1);
            }
            parsedCookieDomain = psl.parse(parsedCookieDomain);

            let fourthColumnNode = {
              title: parsedCookieDomain.sld,
              domain: parsedCookieDomain.domain,
              count: 1,
            };

            let foundClassification = cookieClassification.find(object => object.cookieName === cookie.cookieName);
            if (foundClassification.nameClassification) {
              let parsedParentDomain = new URL(foundClassification.nameClassification[8]);
              parsedParentDomain = psl.parse(parsedParentDomain.hostname);

              fourthColumnNode.parentDomain = parsedParentDomain.domain;
              fourthColumnNode.count += 1;
            } else if (foundClassification.domainMapping) {
              let parsedParentDomain = new URL(foundClassification.domainMapping[6]);
              parsedParentDomain = psl.parse(parsedParentDomain.hostname);

              fourthColumnNode.parentDomain = parsedParentDomain.domain;
              fourthColumnNode.count += 1;
            }
            fourthColumnNode.parentIndex = siteMap.thirdColumn.findIndex(object => object["domain"] === fourthColumnNode.parentDomain);

            if (fourthColumnNode.domain && fourthColumnNode.parentDomain) {
              addNodeSuccess = await Site.addToArrayIfUnique(fourthColumnNode, ["domain", "parentDomain"], siteMap.fourthColumn);
            }

          }

        }
      }

    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return siteMap;
    }
  }

  /*
   * addToArrayIfUnique()
   * https://stackoverflow.com/questions/22844560/check-if-object-value-exists-within-a-javascript-array-of-objects-and-if-not-add/22844712
   *
   * Takes an array of objects and attempts to add an object is the property specified is not matched
   *
   * @param {String}   objectToAdd         Object to add to the target array
   * @param {String}   propertyToMatch     Object property to compare
   * @param {String}   targetArray         Title of the current user tab
   *
   * @return {Boolean}     additionSuccess      If the object was added to array
   */
  static async addToArrayIfUnique(objectToAdd, propertiesToMatch, targetArray) {
    let additionSuccess;
    let objIndex = targetArray.findIndex(object => object[propertiesToMatch[0]] === objectToAdd[propertiesToMatch[0]]);
    //Add the parent domain as something to compare if it exists
    if (objIndex === -1) {
      targetArray.push(objectToAdd);
      additionSuccess = true;
    } else {
      if (propertiesToMatch.length > 1) {
        objIndex = targetArray.findIndex(object => object[propertiesToMatch[1]] === objectToAdd[propertiesToMatch[1]]);
        if (objIndex === -1) {
          targetArray.push(objectToAdd);
          additionSuccess = true;
        }
      } else {
        targetArray[objIndex].count += 1;
        additionSuccess = false;
      }
    }
    return additionSuccess;
  }

}
