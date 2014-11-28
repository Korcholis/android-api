android = require('./main.js');
android.init();

// Retrieve logcat for your main device

android.logcat("1", function(logcat_data) {
  console.log(logcat_data);
}, { output : 'json' });
