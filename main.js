/**
 * Copyright (c) 2014, Sergi Juanola <korcholis@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted, provided that the above copyright notice
 * and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
 * OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
 * THIS SOFTWARE.
*/

var sys = require('sys');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

module.exports = {

  /**
   * Take this regular expression to parse Logcat output in _long_ format.
   */
  logcat_regex : /\[\s+(\d{1,2}\-\d{1,2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s*:\s*(\d+)\s+([VDIWEFS])\/(.*)\s+\]\s+(.*)/g,

  /**
   * A list of the currently spawned logcats. Remember to finish them some time
   * in the future, or they'll end up eating all the memory!
   */
  logcat_spawns : {},

  /**
   * Call this function once at start, to make sure you're having an ADB
   * instance accessible and started.
   *
   * Here you also have a chance to set any configuration for the module.
   *
   * @param {object} config - Include a config to this module.
   *                          The default for this config is { gentle : true }.
   *                          The currently available parameters to config are:
   *                            - {boolean} gentle. Exit the process on error if
   *                              false, or pass the error to the callback on
   *                              true
   * @param {callback} callback - Pass on a callback to know when the adb server
   *                              is started, or if it had an error. It takes
   *                              one parameter, containing an {Error} error or
   *                              null, if no error occured.
   */
  init : function(callback, config) {
    config = config || { gentle : true };
    exec("adb start-server", function(error, stdout, stderr) {
      if (true !== config.gentle && error instanceof Error) {
        throw error;
      }
      if (callback) {
        callback(error);
      }
    });
  },

  /**
   * Call this function if you want to clear any old reference to spawned
   * children that may end up consumig a lot of memory.
   */
  reset : function() {
    for(var device_id in this.logcat_spawns) {
      this.logcat_spawns[device_id].kill();
      delete this.logcat_spawns[device_id];
    }
  },

  create : function(app_name, package_name, path,
                    min_version, compile_version, options) {

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

  /**
   * Get the main device currently connected to ADB. It states device, but it
   * may actually be an emulator already running.
   *
   * @param {callback} callback - The callback returning the main device
   *                              connected, if any. The callback takes one
   *                              parameter, being a {array} device, with one
   *                              single {string} device_id, or none, if no
   *                              devices or emulators attached.
   */
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

  /**
   * Retrieve the list of all the devices connected to ADB. It states devices,
   * but they may actually be emulators already running.
   *
   * @param {callback} callback - The callback returning the devices connected
   *                              if any. The callback takes one parameter,
   *                              being {array} devices, which contains a list
   *                              of {string} device_ids, or none, if no
   *                              devices or emulators attached.
   */
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

  /**
   * Take a device and return a stream of its logcat output.
   *
   * **Note**: Notice that you can only call logcat on a single device each
   * time. This is done to prevent a huge memory consumption of the module,
   * since all logcats are different child processes running at the same time.
   *
   * @param {array | string} device - An array with a single device name or a
   *                                  wildcard to fetch devices. In case it is
   *                                  a wildcard, the main device will be taken
   *                                  anyway.
   * @param {callback} on_receive_cb - Callback which is called when a new
   *                                   logcat message is outputted. This
   *                                   callback takes one parameter, a
   *                                   {string | object} logcat message.
   * @param {callback} on_end_cb - Callback called when the logcat is cancelled.
   *                               It takes no parameters.
   * @param {object} options - An object with configurations for logcat. Its
   *                           properties are:
   *                           - {string} output. The kind of output format you
   *                             want for your logcat. The current options are
   *                             the ones provided by Android Documentation at
   *                             http://developer.android.com/tools/debugging/debugging-log.html#outputFormat
   *                             plus `'json'`, which converts the output
   *                             messages into objects.
   *                           - {array} filters. Any filter you want to apply
   *                             To this logcat output.
   */
  logcat : function(device, on_receive_cb, on_end_cb, options) {
    options = options || { output : 'long', filters : []};
    var android = this;
    this._devices_from_var(device, function(device) {
      device = device[0];
      var turn_json = false;
      if ('json' == options.output) {
        options.output = 'long';
        turn_json = true;
      }
      var logcat_input = spawn("adb", [
                                        "-s",
                                        device,
                                        "logcat",
                                        "-v",
                                        options.output
                                      ], {});

      android.logcat_spawns[device] = logcat_input;

      logcat_input.stdout.on('data', function(data) {
        if (turn_json) {
          var json_content = android._convert_to_json(data);
          if (json_content) {
            on_receive_cb(json_content);
          }
        } else {
          on_receive_cb(""+data);
        }
      });

      logcat_input.stderr.on('data', function(data) {
        throw new Error(""+data);
      });

      logcat_input.on('end', function(data) {
        if (on_end_cb) {
          on_end_cb();
        }
      });
    });
  },

  /**
   * Take a logcat process and kill it.
   *
   * @param {array | string} device - An array with a single device name or a
   *                                  wildcard to fetch devices. In case it is
   *                                  a wildcard, the main device will be taken
   *                                  anyway.
   */
  shutdown_logcat : function(device) {
    var android = this;
    this._devices_from_var(device, function(device) {
      device = device[0];
      if (android.logcat_spawns[device]) {
        android.logcat_spawns[device].kill();
        delete android.logcat_spawns[device];
      }
    });
  },

  /**
   * Take a text or array and convert it to a list of device ids matching the
   * desired wildcards.
   * @param {string | array} devices_to_use - Either an array or a wildcard. If
   *                                          it contains an array, it should
   *                                          have a list of device ids to parse
   *                                          rom the adb devices command. You
   *                                          don't need to have all of them
   *                                          connected, only, since this call
   *                                          will take out the ones not
   *                                          connected, and return a list of
   *                                          all the available devices. If you
   *                                          pass a wildcard, it will translate
   *                                          into a list of ids that match the
   *                                          wildcard. These are:
   *                                          - "first", "main" or "1": return
   *                                            the first device available,
   *                                            which turns to be named "main"
   *                                            by the Android SDK.
   *                                          - "all" or "*": return a list of
   *                                            all the devices connected at the
   *                                            time.
   * @param {callback} callback - The function that will be called when the
   *                              process has been done. It takes one parameter,
   *                              {array} devices_found, which can be empty if
   *                              no device matches the list or wildcard, or a
   *                              list of devices (even one) that meet the
   *                              criteria. Notice that even if you are asking
   *                              for the main device, a list is returned.
   */
  _devices_from_var : function(devices_to_use, callback) {
    if ("undefined" === typeof devices_to_use) {
      this.get_main_device(function(device_found) {
        callback(device_found);
      });
    } else if ("string" === typeof devices_to_use) {
      if (["first", "1", "main"].indexOf(devices_to_use) !== -1) {
        this.get_main_device(function(device_found) {
          callback(device_found);
        });
      } else if (["all", "*"].indexOf(devices_to_use) !== -1) {
          callback(devices_found);
        });
      } else {
        console.error("devices contains no valid items. It should include a list of device IDs, or any of the wildcards first, 1, main, all or *");
        process.exit();
      }
    } else if (Array === devices_to_use.constructor) {
      this.get_all_devices(function(devices_found) {

        for(var i = devices_to_use.length - 1; i >= 0; i--) {
          if(devices_found.indexOf(devices_to_use[i]) == -1) {
            devices_to_use.splice(i, 1);
          }
        }
        callback(devices_to_use);
      });
    }
  },

  /**
   * Take a logcat long data row and convert it into a JSON. This is useful to
   * avoid having to parse it manually.
   * @param {string} data - A line of logcat data
   * @return {object} - A parsed JSON object, or null if not parseable.
   */
  _convert_to_json : function(data) {
    data = "" + data;
    var results = this.logcat_regex.exec(data);
    if (!results) {
      return null;
    }
    return {
      date : results[1],
      timestamp : results[2],
      pid : results[3],
      tid : results[4],
      level : results[5],
      tag : results[6],
      message : results[7]
    };
  }
}
