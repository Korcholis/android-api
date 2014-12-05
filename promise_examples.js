android = require('./main.js');

var path = /* /root/path/to/project */;
var flags = {
  project_type :'ant',
  compile_type :'debug',
  clean_first : false
};

android.init() // ensure the adb service is available and started
  .then(function() {
    return android.compile(path, flags) // compile it
  })
  .then(function(apk) {
    console.log("Look, it's done! " + apk);
  })
  .catch(function(err) { // catch any error during the procedure
    console.error(err);
  })
  .done();
