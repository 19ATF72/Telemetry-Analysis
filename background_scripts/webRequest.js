/**
 * Session - Micah Hobby - 17027531
 *
 * Handles recording of cookies / sites for the database.
 * TODO: Needs more fleshed out description
 **/
class WebRequest {
  static webRequestCategoriesMap = [];

  /*
   * insertRequest()
   *
   * Insert request received broken up into relevant tables
   *
   * @return {ArrayList}     all_rowid      ids of cookies inserted
   */
  static async insertRequest(requestDetails, requestUrl, hostRowid, webRequestCategories) {
    let insertRequestDetail;
    let insertRequestCategory;
    let insertHostSessionId;
    let web_request_detail_rowid;
    let web_request_detail_web_request_category_rowid;
    let web_request_detail_session_rowid;
    let documentUrl = requestDetails.documentUrl;
    try {
      if (!(requestDetails.documentUrl)) {
        documentUrl = requestDetails.url;
      }

      // console.log("ON COMPLETED Loading: " + requestDetails.url);
      // console.log(requestDetails);
      // console.log(requestUrl.hostname);

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
        'query': "INTO web_request_detail_web_request_category (web_request_detail_rowid, web_request_category_rowid) VALUES (?, ?) RETURNING rowid",
      };
      if (requestDetails.urlClassification.firstParty.length) {
        for (var classification of requestDetails.urlClassification.firstParty) {
          insertRequestCategory.values = [web_request_detail_rowid, webRequestCategories.get(classification)];
          web_request_detail_web_request_category_rowid = await DynamicDao.agnosticQuery(insertRequestCategory);
        }
      }
      if (requestDetails.urlClassification.thirdParty.length) {
        for (var classification of requestDetails.urlClassification.thirdParty) {
          insertRequestCategory.values = [web_request_detail_rowid, webRequestCategories.get(classification)],
          web_request_detail_web_request_category_rowid = await DynamicDao.agnosticQuery(insertRequestCategory);
        }
      }

      insertHostSessionId = {
        'operation': "INSERT",
        'query': `INTO web_request_detail_session
                  (session_rowid, web_request_detail_rowid)
                  VALUES (?, ?)
                  RETURNING rowid`,
        'values': [hostRowid, web_request_detail_rowid],
      };
      web_request_detail_session_rowid = await DynamicDao.agnosticQuery(insertHostSessionId);
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return web_request_detail_rowid;
    }
  }

  static async classifyRequestByHostname(web_request_detail_rowid, requestUrl, strippedUrl, webRequestCategories) {
    let classifyRequest;
    let list_detail_rowids;
    let insertClassication;
    let lastInsertedRowid = null;
    try {
      classifyRequest = {
        'operation': "SELECT",
        'query': `ld.rowid, lv.host
                  FROM list_value AS lv
                  INNER JOIN list_detail AS ld ON lv.list_detail_rowid = ld.rowid
                  WHERE lv.host = ? OR lv.host = ?`,
        'values': [requestUrl.hostname, strippedUrl.domain],
      };
      classifyRequest = await DynamicDao.agnosticQuery(classifyRequest);
      if (classifyRequest && classifyRequest.length) {
        list_detail_rowids = classifyRequest[0].values;
        // console.log(requestUrl.hostname);
        //DO INSERTING INTO RECORD TABLE HERE
        for (var row of list_detail_rowids) {
          if (lastInsertedRowid != row[0]) {
            insertClassication = {
              'operation': "INSERT",
              'query': `INTO web_request_detail_list_detail
                        (web_request_detail_rowid, list_detail_rowid) VALUES (?, ?)
                        RETURNING rowid`,
              'values': [web_request_detail_rowid, row[0]],
            };
            await DynamicDao.agnosticQuery(insertClassication);
            lastInsertedRowid = row[0];
          }
        }
      }
    } catch (e) {
      console.error(e);
      throw (e)
    } finally {
      return list_detail_rowids;
    }
  }

  /*
   * getWebRequestCategoriesMap()
   *
   * Query retrieves rowid of host that matches the name
   *
   * @return {ArrayList}     expiredSites      List of sites needing recache
   */
  static async getWebRequestCategoriesMap() {
    let webRequestCategories;
    let webRequestCategoriesMap;
    try {
      let getCategories = {
        'operation': "SELECT",
        'query': "name, rowid FROM web_request_category",
      };
      webRequestCategories = await DynamicDao.agnosticQuery(getCategories);
      webRequestCategoriesMap = new Map(webRequestCategories[0].values);
    } catch (e) {
      console.error(e);
      throw (e);
    } finally {
      return webRequestCategoriesMap;
    }
  }


}
