/**
 * Session - Micah Hobby - 17027531
 *
 * Handles recording of cookies / sites for the database.
 * TODO: Needs more fleshed out description
 **/
class WebRequest {
  static activeSites = [];
  static expiredSites = [];

  /*
   * insertCookie()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     all_rowid      ids of cookies inserted
   */
  static async insertRequest(requestDetails, requestUrl, listCategories) {
    let all_rowid = [];
    let list_detail_rowids;
    let insertRequestDetail;
    let insertRequestCategory;
    let web_request_detail_rowid;
    let web_request_detail_list_category_rowid;
    let list_category_rowid;
    let documentUrl = requestDetails.documentUrl;
    try {
      if (!(requestDetails.documentUrl)) {
        //Maybe better just to set null instead
        documentUrl = requestDetails.url;
      }

      // console.log("ON COMPLETED Loading: " + requestDetails.url);
      console.log(requestDetails);

      requestDetails.thirdParty === true ? 1 : 0;
      insertRequestDetail = {
        'operation': "INSERT",
        'query': `INTO web_request_detail
                  (frameId, ip, method, originUrl, statusLine,
                  thirdParty, timeStamp, resourceUrl)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(resourceUrl) DO UPDATE SET
                    timeStamp = ?, accessCount = accessCount + 1
                  RETURNING rowid`,
        'values': [requestDetails.frameId, requestDetails.ip, requestDetails.method, documentUrl, requestDetails.statusLine, requestDetails.thirdParty, requestDetails.timeStamp, requestUrl.hostname, requestDetails.timeStamp],
      };
      web_request_detail_rowid = await DynamicDao.agnosticQuery(insertRequestDetail);

      insertRequestCategory = {
        'operation': "INSERT",
        'query': "INTO web_request_detail_list_category (web_request_detail_rowid, list_category_rowid) VALUES (?, ?) RETURNING rowid",
      };
      if (requestDetails.urlClassification.firstParty.length) {
        for (var classification of requestDetails.urlClassification.firstParty) {
          insertRequestCategory.values = [web_request_detail_rowid, listCategories.get(classification)];
          web_request_detail_list_category_rowid = await DynamicDao.agnosticQuery(insertRequestCategory);
          // console.log(web_request_detail_list_category_rowid);
        }
      }
      if (requestDetails.urlClassification.thirdParty.length) {
        for (var classification of requestDetails.urlClassification.thirdParty) {
          insertRequestCategory.values = [web_request_detail_rowid, listCategories.get(classification)],
          web_request_detail_list_category_rowid = await DynamicDao.agnosticQuery(insertRequestCategory);
          // console.log(web_request_detail_list_category_rowid);
        }
      }

      // if(requestDetails.urlClassification.thirdParty.length) {
      //   for (var classification of requestDetails.urlClassification.firstParty) {
      //     console.log(classification);
      //
      //    let hostIndex = listCategories.indexOf(classification);
      //
      //    console.log(hostIndex);

      // insertRequestDetail = {
      //    'operation': "INSERT",
      //    'query': "INTO web_request_detail_list_category (web_request_detail_rowid, list_category_rowid) VALUES (?, ?) RETURNING rowid",
      //    'values': [web_request_detail_rowid, requestDetails.ip],
      //  };
      //  web_request_detail_rowid = await DynamicDao.agnosticQuery(insertRequestDetail);
      //}
      //}


      //   cookie.hostOnly === true ? 1 : 0;
      //   cookie.expirationDate = parseInt(cookie.expirationDate);
      //
      //   cookie_name_classification_rowid = await Site.classifyCookieByName(cookie);
      //
      //   let insertCookie = {
      //     'operation': "INSERT",
      //     'query': "INTO cookie (domain, expirationDate, hostOnly, name, value, session_rowid, cookie_name_classification_rowid) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING rowid",
      //     'values': [cookie.domain, cookie.expirationDate, cookie.hostOnly, cookie.name, cookie.value, hostId, cookie_name_classification_rowid],
      //   };
      //   cookie_rowid = await DynamicDao.agnosticQuery(insertCookie);
      //   all_rowid.push(cookie_rowid);
      //
      //   list_detail_rowids = await Site.classifyCookieByDomain(cookie);
      //   if (list_detail_rowids && list_detail_rowids.length) {
      //     for (var list_detail_rowid of list_detail_rowids) {
      //       let insertListDetail = {
      //         'operation': "INSERT",
      //         'query': "INTO cookie_list_detail (cookie_rowid, list_detail_rowid) VALUES (?, ?)",
      //         'values': [cookie_rowid, list_detail_rowid[0]],
      //       };
      //       await DynamicDao.agnosticQuery(insertListDetail);
      //     }
      //   }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return all_rowid;
    }
  }

  static async classifyRequestByHostname(requestUrl) {
    let strippedHostname;
    let classifyRequest;
    let list_detail_rowid;
    try {
      if(requestUrl.hostname.startsWith('.')) {
        strippedHostname = requestUrl.hostname.substring(1);
      }
      if(requestUrl.hostname.endsWith('.')) {
        strippedDomain = requestUrl.hostname.slice(0, -1);
      }
      console.log(requestUrl.hostname);
      console.log(requestUrl);
      if(strippedHostname) {
        classifyRequest = {
          'operation': "SELECT",
          'query': `ld.rowid
                    FROM list_value AS lv
                    INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
                    WHERE lv.host LIKE ? OR lv.host LIKE ?`,
          'values': [requestUrl.hostname, strippedDomain],
        };
      } else {
        classifyRequest = {
          'operation': "SELECT",
          'query': `ld.rowid
                    FROM list_value AS lv
                    INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
                    WHERE lv.host LIKE ?`,
          'values': [requestUrl.hostname],
        };
      }
      classifyRequest = await DynamicDao.agnosticQuery(classifyRequest);
      if(classifyRequest && classifyRequest.length) {
        list_detail_rowid = classifyRequest[0].values;
        console.log(list_detail_rowid);
        //DO INSERTING INTO RECORD TABLE HERE
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return list_detail_rowid;
    }
  }
}
