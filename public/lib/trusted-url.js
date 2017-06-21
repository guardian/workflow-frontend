import angular from 'angular';

angular.module('wfTrustedUrl', [])
  .filter('wfTrustedUrl', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);