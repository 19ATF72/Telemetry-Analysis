// // DAO connection to database here
console.log("DAO loaded");
//
// function logCookie(c) {
//   console.log(c);
// }
//
// function logError(e) {
//   console.error(e);
// }
//
// var setCookie = browser.cookies.set({ url: "https://developer.mozilla.org/" });
// setCookie.then(logCookie, logError);

config = {
  locateFile: filename => `../node_modules/sql.js/dist/${filename}`
}

// The `initSqlJs` function is globally provided by all of the main dist files if loaded in the browser.
// We must specify this locateFile function if we are loading a wasm file from anywhere other than the current html page's folder.
initSqlJs(config).then(function(SQL){

  async function run(db) {

    //Create the database
    var db = new SQL.Database();
    // Run a query without reading the results
    db.run("CREATE TABLE test (col1, col2);");
    // Insert two rows: (1,111) and (2,222)
    db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

    // Prepare a statement
    var stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
    stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

    // Bind new values
    stmt.bind({$start:1, $end:2});
    while(stmt.step()) { //
      var row = stmt.getAsObject();
      console.log('Here is a row: ' + JSON.stringify(row));
    }

    localforage.config({
      //driver      : localforage.WEBSQL, // Force WebSQL; same as using setDriver()
      name        : 'myApp',
      version     : 1.0,
      size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
      storeName   : 'keyvaluepairs', // Should be alphanumeric, with underscores.
      description : 'some description'
    });

    // save
    await window.localforage.setItem("mydata", toBinString(db.export()));
    // restore
    var db = new SQL.Database(toBinArray(await window.localforage.getItem("mydata")));
  }

  function toBinString(arr) {
  			var uarr = new Uint8Array(arr);
  			var strings = [], chunksize = 0xffff;
  			// There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
  			for (var i = 0; i * chunksize < uarr.length; i++) {
  				strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
  			}
        return strings.join('');
  }

  function toBinArray (str) {
  	var l = str.length,
  			arr = new Uint8Array(l);
  	for (var i=0; i<l; i++) arr[i] = str.charCodeAt(i);
  	return arr;
  }

  run();

});
