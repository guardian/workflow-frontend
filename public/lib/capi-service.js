import angular from 'angular';

angular.module('wfCapiService', [])
    .service('wfCapiService', ['$http', '$q', 'config', 'wfHttpSessionService', wfCapiService]);

function wfCapiService($http, $q, config, wfHttpSessionService) {

    function parseCapiData(response, target) {
        target = target || {};

        var data = response.data;
        console.log(data);
        var usefulFields = {
            headline: data.response.content.fields.headline,
            standfirst: data.response.content.fields.standfirst
        }

        return usefulFields;
    }


    function getCapiContent(path) {
        return $http({
            method: 'GET',
            url: "/capi/"+path,
            params: {'show-fields': 'headline,standfirst'},
            withCredentials: true
        });
    }


    this.getCapiContent = getCapiContent;

    this.parseCapiData = parseCapiData;


}

