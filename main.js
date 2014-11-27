var sys = require('sys');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var pass = require('stream').PassThrough;

module.exports = {

  project_path : '',

  init : function(config) {
    config = config || {};
    exec("adb start-server", function(error, stdout, stderr) {
      if (error instanceof Error) {
        throw error;
      } else {
        console.log(stdout);
      }
    });
  },

  create : function(app_name, package_name, path, min_version, compile_version) {

  },

  update : function(path) {

  },

  compile : function(path, flags) {

  },

  install : function(apk, devices_to_use) {
    this._devices_from_var(devices_to_use, function(devices) {
      for (var i = 0; i < devices.length; i++) {
        console.log('Installing apk ' + apk + ' in device ' + devices[i]);
        exec("adb -s " + devices[i] + " install -rtd " + apk);
      }
    });
  },

  get_main_device : function(callback) {
    exec("adb devices", function(error, stdout, stderr) {
      if (error instanceof Error) {
        throw error;
      }
      var findDeviceId = /\n([\d\w\.\:]+)\s+/m;
      var match = findDeviceId.exec(stdout);
      if (match != null) {
        callback([match[1]]);
      } else {
        callback([]);
      }
    });
  },

  get_all_devices : function(callback) {
    exec("adb devices", function(error, stdout, stderr) {
      if (error instanceof Error) {
        throw error;
      }
      var findDeviceId = /\n([\d\w\.\:]+)\s+/m;
      var match = findDeviceId.exec(stdout);
      if (match != null) {
        match.shift();
        callback(match);
      } else {
        callback([]);
      }
    });
  },

  logcat : function() {
    var logcat_output = new pass;
    this._devices_from_var(function(device) {
      device = device[0];
      var logcat_input = spawn("adb", ["-s " + device + " logcat -v long"])
      logcat_input.stdout.pipe(logcat_output);
    });
    return logcat_output;
  },

  _devices_from_var : function(devices_to_use, callback) {
    if ("undefined" === typeof devices_to_use) {
      this.get_main_device(function(device_found) {
        callback(device_found);
      });
    } else if ("string" === typeof devices_to_use) {
      if ("first" === devices_to_use || "1" == devices_to_use || "main" == devices_to_use) {
        this.get_main_device(function(device_found) {
          callback(device_found);
        });
      } else if ("all" === devices_to_use || "*" === devices_to_use) {
        this.get_all_devices(function(devices_found) {
          callback(devices_found);
        });
      } else {
        console.error("devices contains no valid items. It should include a list of device IDs, or any of the wildcards first, 1, main, all or *");
        process.exit();
      }
    } else if (Array === devices_to_use.constructor) {
      this.get_all_devices(function(devices_found) {

        for(var i = devices_to_use.length-1; i >= 0; i--) {
          if(devices_found.indexOf(devices_to_use[i]) == -1) {
            devices_to_use.splice(i, 1);
          }
        }
        callback(devices_to_use);
      });
    }
  }
}
