/**
 * Popup - Micah Hobby - 17027531
 *
 * Handles extension toolbar actions
 **/
class Popup {
  static activeSites = [];
  static expiredSites = [];

  /*
   * getActiveSites()
   *
   * performs query to retrieve active sites from database to avoid re-caching
   *
   * @return {ArrayList}     activeSites      List of sites already crawled
   */
   async showCookiesForTab(tabs) {
     //get the first tab object in the array
     let tab = tabs.pop();
     console.log(tab);

     //get all cookies in the domain
     console.log(tab.url);
     var gettingAllCookies = browser.cookies.getAll({url: tab.url});
     gettingAllCookies.then((cookies) => {

       //set the header of the panel
       var activeTabUrl = $('#current-website-url');
       activeTabUrl.html('<strong>' + tab.title + '</strong>' + ' - (' + tab.url + ')');

       var firstCookieList = $('#first-party-list .accordion-body');
       var thirdCookieList = $('#third-party-list .accordion-body');
       var firstCookieCount = $('#first-party-count');
       var thirdCookieCount = $('#third-party-count');
       var firstCookie = 0;
       var thirdCookie = 0;

       console.log(firstCookieList);
       console.log(thirdCookieList);

       if (cookies.length > 0) {
         //add an <li> item with the name and value of the cookie to the list
         for (let cookie of cookies) {

           let li = document.createElement("li");
           let content = document.createTextNode(cookie.name + ": "+ cookie.value);
           li.appendChild(content);

           if (cookie.hostOnly) {
             firstCookieList.append(li);
             firstCookie++;

           } else{
             thirdCookieList.append(li);
             thirdCookie++;
           }
         }
         console.log(firstCookie);
         console.log(thirdCookie);
         firstCookieCount.html(firstCookie);
         thirdCookieCount.html(thirdCookie);
       } else {
         let p = document.createElement("p");
         let content = document.createTextNode("No cookies in this tab.");

         p.appendChild(content);
       }
     });
   }

   //get active tab to run an callback function.
   //it sends to our callback an array of tab objects
   async getActiveTab() {
     return browser.tabs.query({currentWindow: true, active: true});
   }

   //getSiteInformation

   //getSiteCookieInformation

   //get all the information needed row by row, that way the display process is a
   //easy as get and show these

 }
