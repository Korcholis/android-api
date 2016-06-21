var fs = require('fs');
var q = require('q');
var exec = require('child_process').exec;

apk_parser = module.exports = (function() {
  var ApkData = function() {
    this.uses_permissions = [];
    this.name = '';
    this.names = {};
    this.icons = {};
  };

  ApkData.prototype.set_basic_data = function(package_name, version_code, version_name, platform_build_version_name, sdk_version, target_sdk_version) {
    this.package_name = package_name;
    this.version_code = parseInt(version_code);
    this.version_name = version_name;
    this.platform_build_version_name = platform_build_version_name;
    this.sdk_version = parseInt(sdk_version);
    this.target_sdk_version = parseInt(target_sdk_version);
  };

  ApkData.prototype.add_permission = function(permission) {
    if (this.uses_permissions.indexOf(permission) == -1) {
      this.uses_permissions.push(permission);
    }
  }

  ApkData.prototype.add_name = function(lang, name) {
    if (typeof lang === "undefined") {
      this.name = name;
    } else if (!this.names.hasOwnProperty(lang)) {
      this.names[lang] = name;
    }
  }

  ApkData.prototype.add_icon = function(size, icon) {
    if (!this.icons.hasOwnProperty(size)) {
      this.icons[size] = icon;
    }
  }

  return {
    aapt_regexes : {
      basic : /package:\s*name='([\d\w\.\-]+)'\s*versionCode='(\d+)'\s*versionName='([^']+)'\s*platformBuildVersionName='([^']+)'\s*sdkVersion:'(\d+)'\s*targetSdkVersion:'(\d+)'/g,
      permissions : /uses-permission: name='([\w\d\._]+)'/g,
      names : /application-label(\-([\w\-]+))?:'([^']*)'/g,
      icons : /application-icon-(\d+):'([^']+)'/g
    },

    fetch_data : function(apk_file_path) {
      var deferred = q.defer();
      exec('aapt dump badging ' + apk_file_path, deferred.resolve, deferred.reject);
      return deferred.promise;
    },

    parse_aapt : function(aapt_output) {
      var deferred = q.defer();
      
      setTimeout(function() {
        var apk = new ApkData();

        var basic_data = apk_parser.aapt_regexes.basic.exec(aapt_output);
        apk.set_basic_data(basic_data[1], basic_data[2], basic_data[3], basic_data[4], basic_data[5], basic_data[6]);


        var permissions_data, names_data, icons_data;

        while( (permissions_data = apk_parser.aapt_regexes.permissions.exec(aapt_output)) != null ) {
          apk.add_permission(permissions_data[1]);
        }
        while( (names_data = apk_parser.aapt_regexes.names.exec(aapt_output)) != null ) {
          apk.add_name(names_data[2], names_data[3]);
        }
        while( (icons_data = apk_parser.aapt_regexes.icons.exec(aapt_output)) != null ) {
          apk.add_icon(icons_data[1], icons_data[2]);
        }

        deferred.resolve(apk);
      }, 1);

      return deferred.promise;
    },

    read : function(apk_file_path) {
      var deferred = q.defer();
      fs.readFile(apk_file_path, deferred.resolve, deferred.reject);
      return deferred.promise;
    }
  }
})();