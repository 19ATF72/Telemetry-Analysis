/**
 * WebRequest - Micah Hobby - 17027531
 *
 * Handles recording and classification of all webRequest made on the system
 **/

window.webRequestCategoriesMap = [];

class WebRequest {

  /*
   * insertRequest()
   *
   * Insert request received broken up into relevant tables
   *
   * @param {Object}      requestDetails        Contains webRequest info given by system
   * @param {String}      requestUrl            resource request tried to access
   * @param {Integer}     hostRowid             host webRequest was made for
   * @param {ArrayMap}    webRequestCategories  Map of categories and IDs
   *
   * @return {ArrayList}     web_request_detail_rowid      ids of webRequests inserted
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

  /*
   * classifyRequestByHostname()
   *
   * Insert request received broken up into relevant tables
   *
   * @param {Object}      web_request_detail_rowid    ID of request being classified
   * @param {String}      requestUrl                  Resource request tried to access
   * @param {Integer}     strippedUrl                 Modified version of URL
   * @param {ArrayMap}    webRequestCategories        Map of categories and IDs
   *
   * @return {ArrayList}     list_detail_rowids      ids of lists matched by request
   */
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
   * @return {ArrayList}     webRequestCategoriesMap     Map of categories and Ids
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

  /*
   * getWebRequestClassification()
   *
   * Query retrieves rowid of host that matches the name
   *
   * @param {Integer}        hostRowid        ID of host to get all webRequests for
   *
   * @return {ArrayList}     matchedValues    Classification details found
   */
  static async getWebRequestClassification(hostRowid) {
    let classifyWebRequest;
    let matchedValues = [];
    let domainMapping;
    try {

      let webRequestsForHostId = {
        'operation': "SELECT",
        'query': `wrd.rowid, wrd.*
                  FROM web_request_detail AS wrd
                  INNER JOIN web_request_detail_session AS wrds ON wrd.rowid = wrds.web_request_detail_rowid
                  INNER JOIN session AS s ON wrds.session_rowid = s.rowid
                  WHERE s.rowid = ?`,
        'values': [hostRowid],
      };
      webRequestsForHostId = await DynamicDao.agnosticQuery(webRequestsForHostId);
      for (var webRequest of webRequestsForHostId[0].values) {
        let matchedValue = {webRequestRowid: webRequest[0],
                            webRequestFrameId: webRequest[1],
                            webRequestIp: webRequest[2],
                            webRequestMethod: webRequest[3],
                            webRequestOriginUrl: webRequest[4],
                            webRequestStatusLine: webRequest[5],
                            webRequestThirdParty: webRequest[6],
                            webRequestTimeStamp: webRequest[7],
                            webRequestResourceUrl: webRequest[8],
                            webRequestAccessCount: webRequest[9]};
        let url = psl.parse(matchedValue.webRequestResourceUrl);

        domainMapping = {
          'operation': "SELECT",
          'query': `t.name, ca.name, t.website_url, co.name, co.description, co.privacy_url, co.website_url, co.country, co.privacy_contact
                    FROM tracker_domains AS td
                    INNER JOIN trackers AS t ON td.tracker = t.id
                    INNER JOIN companies AS co ON t.company_id = co.id
                    INNER JOIN categories AS ca ON t.category_id = ca.id
                    WHERE td.domain = ?`,
          'values': [url.domain],
        };
        domainMapping = await DynamicDao.externalAgnosticQuery(domainMapping);

        if(domainMapping && domainMapping.length) {
          matchedValue.domainMapping = domainMapping[0].values;
        }


        classifyWebRequest = {
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
          'values': [url.domain],
        };

        classifyWebRequest = await DynamicDao.agnosticQuery(classifyWebRequest);

        if(classifyWebRequest && classifyWebRequest.length) {
          matchedValue.listsMatched = classifyWebRequest[0].values;
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

  // WhoTracksMe RELATED CODE
  // testInsert = {
  //   'operation': "SELECT",
  //   'query': "rowid, * FROM categories",
  // };
  // result = await DynamicDao.externalAgnosticQuery(testInsert);
  // console.log(result);
  //
  // //CONTAINS THE INFORMATION ABOUT THE TOP LEVEL ORGANISATION THAT CONTROLS
  // //THE SUBORGANISATIONS, GET TO IT VIA "company_id" in trackers table
  // testInsert = {
  //   'operation': "SELECT",
  //   'query': "rowid, * FROM companies",
  // };
  // result = await DynamicDao.externalAgnosticQuery(testInsert);
  // console.log(result);
  //
  // //CONTAINS THE ACTUAL URL THAT WOULD MATCH A SUBORGANISATIONS
  // //USE THIS TO MATCH THE ONCOMPLETE VALUE WITH THE WHOLE DATABASE
  // //USE strippedDomain.domain, WILL PROVIDE LINK TO TRACKERS
  // testInsert = {
  //   'operation': "SELECT",
  //   'query': "* FROM tracker_domains",
  // };
  // result = await DynamicDao.externalAgnosticQuery(testInsert);
  // console.log(result);
  //
  // //TRACKERS IS THE SUBORGANISATIONS THAT LINK TO COMPANIES VIA ID
  // //CONTAINS DETAILS ABOUT THE SUBORGANISATIONS
  // //GET TO IT VIA TRACKER_DOMAINS -> ID IDENTIFIER
  // //CONTAINS VERY USEFUL FIELD [5] "company_id" THAT LINKS SUBORGS TO MAIN ORG
  // testInsert = {
  //   'operation': "SELECT",
  //   'query': "* FROM trackers",
  // };
  // result = await DynamicDao.externalAgnosticQuery(testInsert);
  // console.log(result);
  //
  // //MAKE SUPER QUERY THAT RETRIEVES TRACKER_DOMAINS BASED ON strippedDomain
  // //JOIN WITH OTHER TABLES ON tracker id & company ID to retrieve info for
  // //display

}
