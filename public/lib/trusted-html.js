import angular from 'angular';

angular.module('wfTrustedHtml', [])
  .filter('wfTrustedHtml', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsHtml(url);
    };
}]);