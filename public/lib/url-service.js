import angular from 'angular';

angular.module('urlService', []).factory('urlService', ['$location', function($location){

    class UrlService {

        constructor() {
            this.params = $location.search();
        }

        get(key) {
            return this.params[key];
        }

        set(key, value) {
            this.params[key] = value;
            $location.search(key, value);
        }
    }

    return new UrlService();

}]);