var sys = require('sys');
var exec = require('child_process').exec;

exports.init = function() {
  exec("adb help", function(error, stdout, stderr) {
    if (error) {
      console.error("ADB is not accessible via command!");
      process.exit();
    }
  });
}

exports.create = function(app_name, package_name, path, min_version, compile_version) {

}

exports.update = function(path) {

}

exports.compile = function(path, flags) {

}

exports.install = function(apk, devices) {
  if ("undefined" === typeof devices) {
    devices = [exports.get_main_device()];
  } else if (devices.constructor === Array) {
    // check all of them are available
  } else if (devices instanceof String) {
    if ("first" === devices || "1" == devices || "main" == devices) {
      devices = [exports.get_main_device()];
    } else if ("all" === devices || "*" === devices) {
      devices = exports.get_all_devices();
    } else {
      console.error("devices contains no valid items. It should include a list of device IDs, or any of the wildcards first, 1, main, all or *");
      process.exit();
    }
  }

  for (var i = 0; i < devices.length; i++) {
    devices[i]
  }
}

exports.get_main_device = function() {

}

export.get_all_devices = function() {

}
