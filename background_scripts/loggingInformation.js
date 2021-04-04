/**
 * LoggingInformation - Micah Hobby - 17027531
 *
 * Handles recording of cookies / sites for the database.
 **/

/*
 * Hooks
 *
 * Contains hooks to events in the browser lifecycle with extension actions
 */
class Session {
  constructor(activeSites, expiredSites) {
    if(activeSites) {
      this.activeSites = activeSites;
    } else {
      this.activeSites = [];
    }

    if(expiredSites) {
      this.expiredSites = expiredSites;
    } else {
      this.expiredSites= [];
    }
  }

  set activeHostname(site) {
    this.activeSites.push(site);
  }

  set expiredHostname(site) {
    this.expiredSites.push(site);
  }

}

  // Pseudocode for implementing no waste storing.
  // if (changeInfo.status === 'loading' && changeInfo.url != oldUrl) {
  //   //Do stuff
  //   console.log(tabInfo.url);
  //   console.log(changeInfo);
  //   console.log(tabInfo);
  // }
