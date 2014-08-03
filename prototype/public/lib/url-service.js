import angular from 'angular';

angular.module('urlService', []).factory('urlService', ['$location', 'formatService', function($location, formatService){

    class UrlService {
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

}]);