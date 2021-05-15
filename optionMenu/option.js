/**
 * On window first being loaded.
 */
window.onload = async function() {
  if (window.jQuery) {
    let request = browser.runtime.sendMessage({
      operation: 'optionPageAccessed',
      activeTab: false
    });
    request.then(handleResponse, handleError);
  } else {
    console.log("jQuery not loading");
  }
}

/**
 * On add list being clicked
 */
$("#addList").on("click", function() {
    let name = $('#name').val();
    let sourceRepo = $('#repo').val();
    let filterLocation = $('#location').val();
    let accuracy = $('#accuracy').val();
    let classification = $('#classification').val();

    let newList = {name: name, sourceRepo: sourceRepo, filterLocation: filterLocation, accuracy: accuracy, classification: classification};

    let request = browser.runtime.sendMessage({
      operation: 'addList',
      newList: newList
    });
    request.then(handleResponse, handleError);
});

/**
 * On remove list being clicked
 */
function removeList(rowid) {
  let request = browser.runtime.sendMessage({
    operation: 'deleteList',
    rowid: rowid
  });
  request.then(handleResponse, handleError);
  location.reload(false);
}

/**
 * Message managing related functions
 */

/*
 * handleResponse()
 *
 * Sends messsage to Dynamic_Dao to retrieve information
 *
 * @param (object)      message     contains message from the background script
 *
 * @return {boolean}     retrievalSuccess      outcome of attempting retrieval
 */
function handleResponse(message) {
  var filterList = $('#filterItems');
  if (message.length > 0) {
    for (let [index, row] of message.entries()) {
      let removeId = row.listRowid;
      card = $([
        "<p><b>ID: "+row.listRowid+". "+row.listDescription+" ("+row.listAccuracy+" accuracy "+row.listCategory+" filter) -</b> "+row.listCount+" Items <br/><b> Source repository: </b>"+row.listRepo+"<br/><b> List: </b>"+row.listSource+"</p>",
        "<button class='removeList' value="+row.listRowid+" id='"+removeId+"' type='submit'>Remove</button>",
      ].join("\n"));
      filterList.append(card);
      $('#'+removeId).on("click", removeList.bind(this, removeId));
    }
  }
}

/*
 * handleError()
 *
 * Handles any error in sending / receiving message
 *
 * @param (object)      error     contains any errors produced
 */
function handleError(error) {
  console.log(`Error: ${error}`);
}
