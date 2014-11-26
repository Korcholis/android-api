var sys = require('sys');
var exec = require('child_process').exec;

module.exports = {
  init : function() {
    exec("adb help", function(error, stdout, stderr) {
      if (error) {
        console.error("You need to first add adb and android commands to the path.");
        process.exit();
      }
    });
  },
  create : function(app_name, package_name, path, min_version, compile_version) {

  },
  update : function(path) {

  },
  compile : function(path, flags) {

  },
  install : function(apk, devices) {
    devices = this._devices_from_var(devices);

    for (var i = 0; i < devices.length; i++) {
      devices[i]
    }
  },
  get_main_device : function() {

  },
  get_all_devices : function() {

  },
  logcat : function(devices) {
    devices = this._devices_from_var(devices);
  },
  _devices_from_var(devices) {
    if ("undefined" === typeof devices) {
      devices = [this.get_main_device()];
    } else if (devices.constructor === Array) {
      // check all of them are available
    } else if (devices instanceof String) {
      if ("first" === devices || "1" == devices || "main" == devices) {
        devices = [this.get_main_device()];
      } else if ("all" === devices || "*" === devices) {
        devices = this.get_all_devices();
      } else {
        console.error("devices contains no valid items. It should include a list of device IDs, or any of the wildcards first, 1, main, all or *");
        process.exit();
      }
    }
    return devices;
  }
}
