assert = require('chai').assert
apk_parser = require('../helpers/apk_parser.js');

aapt_output = "package: name='com.example.path' versionCode='202108' versionName='2.2.10' platformBuildVersionName='6.0-2704002'
sdkVersion:'16'
targetSdkVersion:'20'
uses-permission: name='android.permission.INTERNET'
uses-permission: name='android.permission.ACCESS_NETWORK_STATE'
uses-permission: name='android.permission.MODIFY_AUDIO_SETTINGS'
uses-permission: name='android.permission.READ_PHONE_STATE'
uses-permission: name='android.permission.WRITE_EXTERNAL_STORAGE'
uses-permission: name='android.permission.RECEIVE_BOOT_COMPLETED'
uses-permission: name='android.permission.WAKE_LOCK'
application-label:'An Example App'
application-label-de:'Eine Beispielanwendung'
application-label-es:'Una Aplicación de Ejemplo'
application-icon-120:'res/drawable-ldpi-v4/icon.png'
application-icon-160:'res/drawable-mdpi-v4/icon.png'
application-icon-213:'res/drawable-hdpi-v4/icon.png'
application-icon-240:'res/drawable-hdpi-v4/icon.png'
application-icon-320:'res/drawable-xhdpi-v4/icon.png'
application-icon-480:'res/drawable-xxhdpi-v4/icon.png'
application-icon-640:'res/drawable-xxxhdpi-v4/icon.png'
application: label='An Example App' icon='res/drawable-mdpi-v4/icon.png'
application-debuggable
launchable-activity: name='com.example.path.AnExampleApp'  label='An Example App' icon=''
uses-permission: name='android.permission.READ_EXTERNAL_STORAGE'
uses-implied-permission: name='android.permission.READ_EXTERNAL_STORAGE' reason='requested WRITE_EXTERNAL_STORAGE'
feature-group: label=''
uses-feature: name='android.hardware.touchscreen'
uses-implied-feature: name='android.hardware.touchscreen' reason='default feature for all apps'
main
other-activities
other-receivers
other-services
supports-screens: 'normal' 'large' 'xlarge'
supports-any-density: 'true'
requires-smallest-width:'320'
locales: '--_--' 'de' 'es'
densities: '120' '160' '213' '240' '320' '480' '640'"


describe 'ApkParser', ->
  describe 'parse', ->
    it 'should exist', ->
      assert.isNotNull apk_parser
    it 'should create an ApkData object', ->
      apk_parser.parse_aapt(aapt_output)
      .then (apk)->
        assert.isObject apk
        console.log apk
