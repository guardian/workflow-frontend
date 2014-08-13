import angular from 'angular';

angular.module('urlService', []).factory('urlService', ['$location', '$rootScope', 'formatService', function($location, $rootScope, formatService){

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
            console.log('calling init');
            this.attachListeners()
        }
        constructor() {
            this.params = $location.search();
        }

        get(key) {
            return this.params[key];
        }

        set(key, value) {
            var strValue = formatService.objToStr(value);
            this.params[key] = strValue;
            $location.search(key, strValue);
        }
    }

    return new UrlService();

}]).run(['urlService', function(urlService) {

    urlService.init();

}]);