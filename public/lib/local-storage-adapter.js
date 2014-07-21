
import angular from 'angular';

angular.module('wfLocalStorageAdapter', [])
  .factory('wfLocalStorageAdapter', [function() {

    var DEFAULT_PREFIX = 'wf_';

    var adapter = {
      get: function(key, prefix = DEFAULT_PREFIX) {
        return window.localStorage.getItem(prefix + key);
      },

      getObject: function(key, prefix) {
        return JSON.parse(adapter.get(key, prefix));
      },

      set: function(key, value, prefix = DEFAULT_PREFIX) {
        if (typeof(value) == 'object') {
          value = JSON.stringify(value);
        }

        window.localStorage.setItem(prefix + key, value);
      }
    };

    return adapter;

  }]);
