
import angular from 'angular';
import 'lib/visibility-service';

angular.module('wfContentService', ['wfVisibilityService', 'wfDateService', 'wfFiltersService'])
  .factory('wfContentService', ['$http', '$timeout', '$rootScope', 'wfDateParser', 'wfFormatDateTimeFilter','wfFiltersService',
        function($http, $timeout, $rootScope, wfDateParser, wfFormatDateTimeFilter, wfFiltersService) {

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


      /**
      * Formats model params into params to send to server.
      *
      * @param {Object} params
      * @returns {Object}
      */

      getServerParams(){
        var modelParams = wfFiltersService.getAll();

        var selectedDate = modelParams['selectedDate'];

        var dateRange = wfDateParser.parseRangeFromString(selectedDate);

        var params = {
            'status': modelParams['status'],
            'state': modelParams['state'],
            'section': modelParams['section'],
            'content-type': modelParams["content-type"],
            'flags': modelParams['flags'],
            'prodOffice': modelParams['prodOffice'],
            'due.from': wfFormatDateTimeFilter(dateRange['from'], "YYYY-MM-DDTHH:mm:ssZ"),
            'due.until': wfFormatDateTimeFilter(dateRange['until'], "YYYY-MM-DDTHH:mm:ssZ")
        };

        return params;

      }

    }

    return new ContentService();

  }])

  /**
   * Content polling service.
   */
  .factory('wfContentPollingService', ['$http', '$timeout', '$rootScope', 'wfContentService', function($http, $timeout, $rootScope, wfContentService) {

    var POLLING_DELAY = 5000;

    class ContentPollingService {

      constructor(paramsProvider) {
        this._paramsProvider = paramsProvider;

        this.init();
      }

      init() {
        // event provided by visibility service
        $rootScope.$on('visibility.changed', (function(event, data) {
          if (data.visibility) {
            this.startPolling();
          } else {
            this.stopPolling();
          }
        }).bind(this));
      }

      // single callback only required so far...
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
