import angular from 'angular';

angular.module('wfComposerService', [])
    .service('wfComposerService', ['$http', '$q', 'config', 'wfHttpSessionService', wfComposerService]);

function wfComposerService($http, $q, config, wfHttpSessionService) {

    var request = wfHttpSessionService.request;

    var composerContentFetch = config['composerContentDetails'];

    // budget composer url parser - just gets the portion after the last '/'
    function parseComposerId(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }

    function deepSearch(obj, path) {
        if(path.length == 0) return obj;
        var next = path[0];
        if(obj[next]) return deepSearch(obj[next], path.slice(1));
        else return null;
    }

    function activeInInCopy(content) {
        /* any of these values may be missing, which should
         * automatically result in false */
        return deepSearch(
            content, ["toolSettings", "activeInInCopy", "data"]) === "true";
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
                        headline: headline,
                        activeInInCopy: activeInInCopy(data)
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


    this.create = function createInComposer(type) {
        return request({
            method: 'POST',
            url: config.composerNewContent,
            params: { 'type': type },
            withCredentials: true
        });
    };

}

