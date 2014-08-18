
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

      constructor(paramsProvider) {
        this._paramsProvider = paramsProvider;

        this.init();
      }

      init() {
        function getHiddenProp(){
          var prefixes = ['webkit','moz','ms','o'];

          // if 'hidden' is natively supported just return it
          if ('hidden' in document) return 'hidden';

          // otherwise loop over all the known prefixes until we find one
          for (var i = 0; i < prefixes.length; i++){
              if ((prefixes[i] + 'Hidden') in document)
                  return prefixes[i] + 'Hidden';
          }

          // otherwise it's not supported
          return null;
        }

        function isHidden() {
          var prop = getHiddenProp();
          if (!prop) return false;

          return document[prop];
        }

        var visProp = getHiddenProp();
        var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
        document.addEventListener(evtname, (function() {
          if (isHidden()) {
            this.stopPolling();
          } else {
            this.startPolling();
          }
        }).bind(this));
      }


      onPoll(callback) {
        this._callback = callback;
      }

      /**
       * Start polling for updates.
       *
       * @param {function} paramsProvider used to retrieve filter params for the scope
       *                                  at the instant the next poll occurs. Necessary to
       *                                  cater for changes in filters.
       * @param {function} callback called on each successful polled reponse.
       */
      startPolling() {
        var tick = (function() {
          wfContentService.get(this._paramsProvider())
            .success(this._callback)
            .finally((function() {
              this._timer = $timeout(tick, POLLING_DELAY);
            }).bind(this));

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
