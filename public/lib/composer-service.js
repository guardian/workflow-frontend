import angular from 'angular';

angular.module('wfComposerService', [])
    .service('wfComposerService', ['$http', '$q', 'config', 'wfHttpSessionService', wfComposerService]);

function wfComposerService($http, $q, config, wfHttpSessionService) {

    var request = wfHttpSessionService.request;

    var composerContentFetch = config.composerContentDetails;

    // budget composer url parser - just gets the portion after the last '/'
    function parseComposerId(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }


    function deepSearch(obj, path) {
        if (path.length === 0) return obj;
        var next = path[0];
        if (obj[next]) return deepSearch(obj[next], path.slice(1));
        else return null;
    }


    // Mapping of workflow content fields to transform functions on composer response
    var composerParseMap = {
        composerId: (d) => d.id,
        contentType: (d) => d.type,
        headline: (d) => deepSearch(d, ['preview', 'data', 'fields', 'headline', 'data']) || undefined,
        published: (d) => d.published,
        timePublished: (d) => new Date(deepSearch(d, ['contentChangeDetails', 'data', 'published', 'date']) || undefined),
        path: (d) => deepSearch(d, ['identifiers', 'path', 'data']),
        commentable: (d) => deepSearch(d, ['preview', 'data', 'settings', 'commentable', 'data']) === 'true',
        takenDown: (d) => false, // TODO: takenDown from composer feed
        activeInInCopy: (d) => deepSearch(d, ['toolSettings', 'activeInInCopy', 'data']) === 'true',
        composerProdOffice: (d) => deepSearch(d, ['preview', 'data', 'settings', 'productionOffice', 'data']) || undefined,
        commentable: (d) => deepSearch(d, ['preview', 'data', 'settings', 'commentable', 'data']) === 'true',
        optimisedForWeb: (d) => deepSearch(d, ['toolSettings', 'seoOptimised', 'data']) === 'true',
        optimisedForWebChanged: (d) => deepSearch(d, ['toolSettings', 'seoChanged', 'data']) === 'true',
        revision: (d) => deepSearch(d, ['contentChangeDetails', 'data', 'revision']),
        lastModified: (d) => new Date(deepSearch(d, ['contentChangeDetails', 'data', 'lastModified', 'date']) || undefined),
        lastModifiedBy: (d) => deepSearch(d, ['contentChangeDetails', 'data', 'lastModified', 'user', 'firstName']) + ' ' + deepSearch(d, ['contentChangeDetails', 'data', 'lastModified', 'user', 'lastName'])
    };


    function parseComposerData(response, target) {
        target = target || {};

        var data = response.data;

        Object.keys(composerParseMap).forEach((key) => {
            target[key] = composerParseMap[key](data);
        });

        return target;
    }


    function getComposerContent(url) {
        return $http({
            method: 'GET',
            url: composerContentFetch + parseComposerId(url),
            params: {'includePreview': 'true'},
            withCredentials: true
        });
    }


    this.getComposerContent = getComposerContent;

    this.parseComposerData = parseComposerData;


    this.create = function createInComposer(type, commissioningDesks) {
        return request({
            method: 'POST',
            url: config.composerNewContent,
            params: { 'type': type, 'tracking': commissioningDesks },
            withCredentials: true
        });
    };

}

