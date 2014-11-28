android = require('./main.js');
android.init();

// Retrieve logcat for your main device
/* Notice the "1". It could be an array of ids instead, but it will always take
the first one available. If you need to keep the flow for more than once logcat,
issue the command multiple times. */
android.logcat("1", function(logcat_data) {
  console.log(logcat_data);
}, { output : 'json' });
