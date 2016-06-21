assert = require('chai').assert
android = require('../android_api.js');

describe 'Android', ->
  describe 'basics', ->
    it 'should exist', ->
      assert.isNotNull android
    it 'should init', ->
      android.init()
      .then ->
        
