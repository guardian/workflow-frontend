import angular from 'angular';

angular.module('urlService', []).factory('urlService', ['$location', '$rootScope', 'wfDateParser',
    function($location, $rootScope, wfDateParser){

    class UrlService {

        attachListeners() {
            var self = this;
            $rootScope.$on('filtersChanged.prodOffice', function(event, data) {
                self.set('prodOffice', data);
            });
            $rootScope.$on('filtersChanged.content-type', function(event, data) {
                self.set('content-type', data);
            });
            $rootScope.$on('filtersChanged.section', function(event, data) {
                self.set('section', data);
            });
            $rootScope.$on('filtersChanged.state', function(event, data) {
                self.set('state', data);
            });
            $rootScope.$on('filtersChanged.status', function(event, data) {
                self.set('status', data);
            });
            $rootScope.$on('filtersChanged.flags', function(event, data) {
                self.set('flags', data);
            });
            $rootScope.$on('filtersChanged.selectedDate', function(event, data) {
                self.set('selectedDate', data);
            });
        }

        init() {
            this.attachListeners()
        }
        constructor() {
            this.params = $location.search();
        }

        get(key) {
            return this.params[key];
        }

        set(key, value) {
            if(key === 'selectedDate')  {
                var dateStr = wfDateParser.setQueryString(value);
                this.params[key] = dateStr;
                $location.search(key, dateStr);
            }
            else {
                this.params[key] = value;
                $location.search(key, value);
            }
        }
    }

    return new UrlService();

}]).run(['urlService', function(urlService) {

    urlService.init();

}]);