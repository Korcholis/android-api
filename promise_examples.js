android = require('./android_api.js');

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
  .then(function() {
    android.logcat(
      "1",
      { output : 'json' }
    )
      .progress(function(logcat_data) {
        console.log(logcat_data);
      })
      .catch(function(err) {
        console.log('logcat error ' + err);
      });

    setTimeout(function() {
      android.shutdown_logcat("1");
    }, 5000);
  })
  .catch(function(err) { // catch any error during the procedure
    console.error(err);
  })
  .done();
