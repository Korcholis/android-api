android = require('./android_api.js');

//var path = /* /root/path/to/project */;
var flags = {
  project_type :'ant',
  compile_type :'debug',
  clean_first : false
};

android.init() // ensure the adb service is available and started
  .then(function() {
    //return android.compile(path, flags) // compile it
  })
  .then(function(apk) {
    console.log("Look, it's done! " + apk);
  })
  .then(function() {
    var promise = android.logcat(
      "1",
      { output : 'json' },
      function(logcat_data) {
        console.log(logcat_data);
      });

    setTimeout(function() {
      android.shutdown_logcat("1")
        .then(function(device_id) {
          console.log('shutdown of ' + device_id);
        });
    }, 5000);
    return promise;
  })
  .catch(function(err) { // catch any error during the procedure
    console.error(err);
  })
  .done();
