import angular from 'angular';

angular.module('wfComposerService', [])
    .service('wfComposerService', ['$http', '$q', 'config', wfComposerService]);

function wfComposerService($http, $q, config) {

    var composerContentFetch = config['composerContentDetails'];

    // budget composer url parser - just gets the portion after the last '/'
    function parseComposerId(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }

    function getComposerContent(url) {
        if (url) {
            return $http({
                method: 'GET',
                url: composerContentFetch + parseComposerId(url),
                params: {'includePreview': 'true'},
                withCredentials: true
            }).then(
                function (resp, status) {
                    var data = resp.data.data;
                    var contentId = data.id;
                    var contentType = data.type;
                    var headline = data.preview.data.fields.headline && data.preview.data.fields.headline.data;

                    return {
                        id: contentId,
                        type: contentType,
                        headline: headline
                    };
                }, function (data, status) {
                    return null;
                });
        } else {
            var deferred = $q.defer();
            deferred.resolve(null);
            return deferred.promise;
        }
    };


    this.getComposerContent = getComposerContent;

}

