
import angular from 'angular';

angular.module('wfContentService', [])
  .factory('wfContentService', ['$http', '$timeout', '$rootScope', function($http, $timeout, $rootScope) {

    class ContentService {

      /**
       * Async retrieves content from service.
       *
       * @param {Object} params
       * @returns {Promise}
       */
      get(params) {
        var deferred = $http({
          method: 'GET',
          url: '/api/content',
          params: params
        });

        deferred.catch(function(err) {
          $rootScope.$broadcast('getContent.failed', { error: err });
        });

        return deferred;
      }

    }

    return new ContentService();

  }])

  /**
   * Content polling service.
   */
  .factory('wfContentPollingService', ['$http', '$timeout', 'wfContentService', function($http, $timeout, wfContentService) {

    var POLLING_DELAY = 5000;

    class ContentPollingService {

      /**
       * Start polling for updates.
       *
       * @param {function} paramsProvider used to retrieve filter params for the scope
       *                                  at the instant the next poll occurs. Necessary to
       *                                  cater for changes in filters.
       * @param {function} callback called on each successful polled reponse.
       */
      startPolling(paramsProvider, callback) {
        var tick = (function() {
          wfContentService.get(paramsProvider())
            .success(function(data) {
              callback(data);
            })
            .finally(function() {
              this._timer = $timeout(tick, POLLING_DELAY);
            });

        }).bind(this);

        tick();
      }

      stopPolling() {
        if (this._timer) {
          $timeout.cancel(this._timer);
          this._timer = false;
        }
      }
    }

    return ContentPollingService;

  }]);
