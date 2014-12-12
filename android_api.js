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

/**
 * A module to connect to the ADB server and Android command line
 * @module android-api
 */

var sys = require('sys');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path_utils = require('path');
var fs = require('fs');
var q = require('q');

android_api = module.exports = (function() {


  /**
  * Take a text or array and convert it to a list of device ids matching the
  * desired wildcards. Upon resolve, the promise takes one parameter,
  * <code>array</code> devices_found, which can be empty if no device matches
  * the list or wildcard, or a list of devices (even one) that meet the
  * criteria. Notice that even if you are asking for the main device, a list is
  * returned.
  *
  * @param {string | array} devices_to_use - Either an array or a wildcard. If
  * it contains an array, it should have a list of device ids to parse rom the
  * adb devices command. You don't need to have all of them connected, only,
  * since this call will take out the ones not connected, and return a list of
  * all the available devices. If you pass a wildcard, it will translate into a
  * list of ids that match the wildcard. These are:
  *  <ul><li>"first", "main" or "1": return the first device available, which
  *  turns to be named "main" by the Android SDK.</li>
  *  <li><code>'all'</code> or <code>'*'</code>: return a list of all the
  *  devices connected at the time.</li></ul>
  *
  * @return {promise} A promise for this method
  */
  function devices_from_var(devices_to_use) {
    var deferred = q.defer();
    if ("undefined" === typeof devices_to_use) {
      android_api.get_main_device()
        .then(function(device_found) {
          deferred.resolve(device_found);
        });
    } else if ("string" === typeof devices_to_use) {
      if (["first", "1", "main"].indexOf(devices_to_use) !== -1) {
        android_api.get_main_device()
          .then(function(device_found) {
            deferred.resolve(device_found);
          });
      } else if (["all", "*"].indexOf(devices_to_use) !== -1) {
        android_api.get_all_devices()
          .then(function(device_found) {
            deferred.resolve(device_found);
          });
      } else {
        deferred.reject(new Error("devices array contains no valid items. It should include a list of device IDs, or any of the wildcards first, 1, main, all or *"));
      }
    } else if (Array === devices_to_use.constructor) {
      android_api.get_all_devices().then(function(devices_found) {

        for(var i = devices_to_use.length - 1; i >= 0; i--) {
          if(devices_found.indexOf(devices_to_use[i]) == -1) {
            devices_to_use.splice(i, 1);
          }
        }
        deferred.resolve(devices_to_use);
      });
    }
    return deferred.promise;
  }

  /**
  * Take a logcat long data row and convert it into a JSON. This is useful to
  * avoid having to parse it manually.
  *
  * @param {string} data - A line of logcat data
  * @return {object} A parsed JSON object, or null if not parseable.
  */
  function convert_to_json(data) {
    data = "" + data;
    var results = android_api.logcat_regex.exec(data);
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

  function compile_gradle(path, flags) {

  }

  /**
  * Compile a project based on the ant system. The params are the same as
  * <code>compile</code>
  *
  * @param {string} path - See <code>compile</code>
  * @param {object} flags - See <code>compile</code>
  *
  * @return {promise} A promise for this method
  */
  function compile_ant(path, flags) {
    var deferred = q.defer();
    if (['debug', 'release', 'instrument'].indexOf(flags.compile_type) !== -1) {
      if (true === flags.clean_first) {
        exec("ant clean", { cwd : path }, function(error, stdout, stderr) {
          if (error instanceof Error) {
            deferred.reject(error);
          } else {
            exec("ant " + flags.compile_type, { cwd : path }, function(error, stdout, stderr) {
              if (error instanceof Error) {
                deferred.reject(error);
              } else {
                deferred.resolve(return_apk(path));
              }
            });
          }
        });
      } else {
        exec("ant " + flags.compile_type, { cwd : path }, function(error, stdout, stderr) {
          if (error instanceof Error) {
            deferred.reject(error);
          } else {
            deferred.resolve(return_apk(path));
          }
        });
      }
    }
    return deferred.promise;
  }

  /**
  * Get the apk filename and path for the current project.
  *
  * @param {string} path - The root directory of the project
  *
  * @return {string} The full path and name to the apk file, or
  * <code>null</code> if not found.
  */
  function return_apk(path) {
    var bin_path = path_utils.join(path, 'bin');
    var files = fs.readdirSync(bin_path);
    var regex = /^(?:(?!\-unaligned).)*\.apk$/gm;
    for (var i = 0; i < files.length; i++) {
      if (regex.test(files[i])) {
        return path_utils.join(bin_path, files[i]);
      }
    }
    return null;
  }

return {
  /**
  * Take this regular expression to parse Logcat output in <code>long</code>
  * format.
  */
  logcat_regex : /\[\s+(\d{1,2}\-\d{1,2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s*:\s*(\d+)\s+([VDIWEFS])\/(.*)\s+\]\s+(.*)/g,

  /**
   * Unfinished regex to parse the targets your Android SDK is able to understand
   */
  target_regex : /\s+id: (\d+) or \"([\d\w\-\(\)\:\. ]+)\"\s+Name: ([\w\d \.\(\)]+)\s+Type: ([\w\-]+)\s+(API level: ([\d|L]+)\s+)?(Vendor: ([\d\w\.\- ]+)\s+)?Revision: (\d+)(Description: (.+)\s+)?/gm,

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
  * @param {object} config - Include a config to this module. The currently
  * available parameters to config are none.
  *
  * @return {promise} A promise for this method
  */
  init : function(config) {
    config = config || { gentle : true };
    var deferred = q.defer();
    exec("adb start-server", function(error, stdout, stderr) {
      if (error instanceof Error) {
        deferred.reject(error);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  },

  /**
  * Call this function if you want to clear any old reference to spawned logcat
  * children that may end up consumig a lot of memory.
  */
  reset : function() {
    for(var device_id in this.logcat_spawns) {
      this.logcat_spawns[device_id].kill();
      delete this.logcat_spawns[device_id];
    }
  },

  create : function(app_name, package_name, path,
    min_version, compile_version, flags) {

  },

  update : function(path) {

  },

  /**
  * Take a project and compile it with some specific configurations. When the
  * promise is fullfilled, it takes one parameter, <code>string</code> apk,
  * which contains the path to the compiled apk, or null if it wasn't found.
  *
  * @param {string} path - The root directory of the project
  * @param {object} flags - Optional list of flags to determine what to do in
  * this compilation. The params are:
  *  <ul><li><code>string</code> project_type. What kind of project we have to
  *  compile. Options are <code>'gradle'</code> and <code>'ant'</code>. There's
  *  also <code>'eclipse'</code>, which is an alias of 'ant'. The default is
  *  <code>'gradle'</code>.</li>
  *  <li><code>string</code> compile_type. Any of the possible values available
  *  to compile to. It depends on what project_type you selected. For command
  *  line projects, these are:
  *    <ul><li><code>debug</code>. Creates a debug package. It enables you to
  *    test it.</li>
  *    <li><code>release</code>. Create a release package. It's as an apk
  *    should work when installed on a device.</li>
  *    <li><code>instrument</code>. Create an instrumented debug
  *    package.</li></ul>
  *  The default value is <code>debug</code>. More info from ant here:
  *  http://developer.android.com/tools/building/building-cmdline.html</li>
  *  <li>{boolean} clean_first. Set this to true to clean. The project before
  *  compiling. This ensures there are no old resources left. Defaults to
  *  false.</li></ul>
  *
  * @return {promise} A promise for this method
  */
  compile : function(path, flags) {
    flags = flags || {
      project_type : 'gradle',
      compile_type : 'debug',
      clean_first : false
    };

    if ('gradle' == flags.project_type) {
      return compile_gradle(path, flags);
    } else if(['ant', 'eclipse'].indexOf(flags.project_type) !== -1) {
      return compile_ant(path, flags);
    } else {
      throw new Error('Project type "' + flags.project_type + '" doesn\'t exist. Try "ant" or "gradle".');
    }
    return promise;
  },

  install : function(apk, devices_to_use) {
    devices_from_var(devices_to_use, function(devices) {
      for (var i = 0; i < devices.length; i++) {
        exec("adb -s " + devices[i] + " install -rtd " + apk);
      }
    });
  },

  /**
  * Get the main device currently connected to ADB. It states device, but it
  * may actually be an emulator already running. When the device is found or
  * not and the promise resolves, it returns the main device connected, if
  * any. The callback takes one parameter, being an <code>array</code> device,
  * with one single <code>string</code> device_id, or none, if no devices or
  * emulators attached.
  *
  * @return {promise} A promise for this method
  */
  get_main_device : function() {
    var deferred = q.defer();

    exec("adb devices", function(error, stdout, stderr) {
      if (error instanceof Error) {
        deferred.reject(error);
      } else {
        var findDeviceId = /\n([\d\w\.\:]+)\s+/m;
        var match = findDeviceId.exec(stdout);
        if (match !== null) {
          deferred.resolve([match[1]]);
        } else {
          deferred.resolve([]);
        }
      }
    });
    return deferred.promise;
  },

  /**
  * Retrieve the list of all the devices connected to ADB. It states devices,
  * but they may actually be emulators already running. When the promise is
  * fullfilled or rejected, itreturns the devices connected if any. The
  * callback takes one parameter, being <code>array</code> devices, which
  * contains a list of <code>string</code> device_ids, or none, if no devices
  * or emulators attached.
  *
  * @return {promise} A promise for this method
  */
  get_all_devices : function(callback) {
    var deferred = q.defer();
    exec("adb devices", function(error, stdout, stderr) {
      if (error instanceof Error) {
        deferred.reject(error);
      } else {
        var findDeviceId = /\n([\d\w\.\:]+)\s+/gm;
        var match = findDeviceId.exec(stdout);
        if (match !== null) {
          match.shift();
          delete match.index;
          delete match.input;
          deferred.resolve(match);
        } else {
          deferred.resolve([]);
        }
      }
    });

    return deferred.promise;
  },

  /**
  * Take a device and return a stream of its logcat output. It returns a
  * promise the developer can check for any new logcat message. In this case a
  * resolved promise doesn't contain the logcat output, since it's an ongoing
  * process. Instead, look at the <code>on_log</code> method to receive new
  * logcat outputs for this device. The <code>then</code> method is
  * <b>only</b> called on logcat termination.
  *
  * <br><b>Note:</b> Notice that you can only call logcat on a single device
  * each time. This is done to prevent a huge memory consumption of the
  * module, since all logcats are different child processes running at the
  * same time.
  *
  * @param {array | string} device - An array with a single device name or a
  * wildcard to fetch devices. In case it is a wildcard, the main device will
  * be taken anyway.
  * @param {callback} on_log - Callback which is called when a new logcat
  * message is outputted. This callback takes one parameter, a
  * <code>string | object</code> logcat message.
  * @param {object} options - An object with configurations for logcat. Its
  * properties are:
  *  <ul><li><code>string</code> output. The kind of output format you want for
  *  your logcat. The current options are the ones provided by Android
  *  Documentation at http://developer.android.com/tools/debugging/debugging-log.html#outputFormat
  *  plus <code>'json'</code>, which converts the output messages into
  *  objects.</li>
  *  <li><code>array</code> filters. Any filter you want to apply to this
  *  logcat output.</li></ul>
  */
  logcat : function(device, options, on_log) {
    var deferred = q.defer();

    options = options || { output : 'long', filters : []};
    devices_from_var(device)
      .then(function(device) {
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

        android_api.logcat_spawns[device] = logcat_input;

        logcat_input.stdout.on('data', function(data) {
          if (turn_json) {
            var json_content = convert_to_json(data);
            if (json_content) {
              on_log(json_content);
            }
          } else {
            on_log(""+data);
          }
        });

        logcat_input.stderr.on('data', function(data) {
          deferred.reject(new Error(data));
        });

        logcat_input.on('end', function(data) {
          deferred.resolve();
        });
      });

    return deferred.promise;
  },

  /**
  * Take a logcat process and kill it.
  *
  * @param {array | string} device - An array with a single device name or a
  * wildcard to fetch devices. In case it is a wildcard, the main device will
  * be taken anyway.
  */
  shutdown_logcat : function(device) {
    var deferred = q.defer();
    devices_from_var(device)
      .then(function(device) {
        device = device[0];
        if (android_api.logcat_spawns[device]) {
          android_api.logcat_spawns[device].kill();
          delete android_api.logcat_spawns[device];
          deferred.resolve(device);
        }
      });
    return deferred.promise;
  }
};
})();
