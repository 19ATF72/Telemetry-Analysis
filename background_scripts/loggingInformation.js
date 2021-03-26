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

// NEEDS TO BE TURNED INTO CLASS
const session = {
  set current(site) {
    this.log.push(site);
  },
  log: []
}




  // Pseudocode for implementing no waste storing.
  // if (changeInfo.status === 'loading' && changeInfo.url != oldUrl) {
  //   //Do stuff
  //   console.log(tabInfo.url);
  //   console.log(changeInfo);
  //   console.log(tabInfo);
  // }
