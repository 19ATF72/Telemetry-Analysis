// /**
//  * Ensure jQuery is loaded correctly.
//  */
//  window.onload = function() {
//      if (window.jQuery) {
//          // jQuery is loaded
//          console.log("jQuery is loaded");
//      } else {
//          // jQuery is not loaded
//          console.log("jQuery not loading");
//      }
//  }
//
// /**
//  * CSS to hide everything on the page,
//  * except for elements that have the "retrieve_cookies-image" class.
//  */
// const hidePage = `body > :not(.retrieve_cookies-image) {
//                     display: none;
//                   }`;
//
// /**
//  * Listen for clicks on the buttons, and send the appropriate message to
//  * the content script in the page.
//  */
// function listenForClicks() {
//   document.addEventListener("click", (e) => {
//
//     console.log(e.target.id);
//
//     /**
//      * Given the name of a beast, get the URL to the corresponding image.
//      */
//     function beastNameToURL(beastName) {
//       switch (beastName) {
//         case "Frog":
//           return browser.extension.getURL("beasts/frog.jpg");
//         case "Snake":
//           return browser.extension.getURL("beasts/snake.jpg");
//         case "Turtle":
//           return browser.extension.getURL("beasts/turtle.jpg");
//       }
//     }
//
//     /**
//      * Insert the page-hiding CSS into the active tab,
//      * then get the beast URL and
//      * send a "retrieve_cookies" message to the content script in the active tab.
//      */
//     function retrieve_cookies(tabs) {
//       browser.tabs.insertCSS({code: hidePage}).then(() => {
//         let url = beastNameToURL(e.target.textContent);
//         browser.tabs.sendMessage(tabs[0].id, {
//           command: "retrieve_cookies",
//           beastURL: url
//         });
//       });
//     }
//
//     /**
//      * Remove the page-hiding CSS from the active tab,
//      * send a "redirect" message to the content script in the active tab.
//      */
//     function redirect(tabs) {
//       browser.tabs.removeCSS({code: hidePage}).then(() => {
//         browser.tabs.sendMessage(tabs[0].id, {
//           command: "redirect",
//         });
//       });
//     }
//
//     /**
//      * Just log the error to the console.
//      */
//     function reportError(error) {
//       console.error(`Could not retrieve_cookies: ${error}`);
//     }
//
//     /**
//      * Get the active tab,
//      * then call "retrieve_cookies()" or "redirect()" as appropriate.
//      */
//     if (e.target.classList.contains("accordion-button")) {
//       browser.tabs.query({active: true, currentWindow: true})
//         .then(retrieve_cookies)
//         .catch(reportError);
//     }
//     else if (e.target.classList.contains("btn")) {
//       browser.tabs.query({active: true, currentWindow: true})
//         .then(redirect)
//         .catch(reportError);
//     }
//   });
// }
//
// /**
//  * There was an error executing the script.
//  * Display the popup's error message, and hide the normal UI.
//  */
// function reportExecuteScriptError(error) {
//   document.querySelector("#popup-content").classList.add("hidden");
//   document.querySelector("#error-content").classList.remove("hidden");
//   console.error(`Failed to execute retrieve_cookies content script: ${error.message}`);
// }
//
// /**
//  * When the popup loads, inject a content script into the active tab,
//  * and add a click handler.
//  * If we couldn't inject the script, handle the error.
//  */
// browser.tabs.executeScript({file: "/content_scripts/tracker_analysis_model.js"})
// .then(listenForClicks)
// .catch(reportExecuteScriptError);

function showCookiesForTab(tabs) {
  //get the first tab object in the array
  let tab = tabs.pop();

  //get all cookies in the domain
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
      let parentFirst = firstCookieList.parentNode;
      let parentThird = firstCookieList.parentNode;

      p.appendChild(content);
      parentFirst.appendChild(p);
      parentThird.appendChild(p);
    }
  });
}

//get active tab to run an callback function.
//it sends to our callback an array of tab objects
function getActiveTab() {
  return browser.tabs.query({currentWindow: true, active: true});
}

/**
 * Ensure jQuery is loaded correctly.
 */
 window.onload = function() {
     if (window.jQuery) {
         // jQuery is loaded
         console.log("jQuery is loaded");
     } else {
         // jQuery is not loaded
         console.log("jQuery not loading");
     }
 }

getActiveTab().then(showCookiesForTab);
