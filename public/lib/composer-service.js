import angular from 'angular';
import './telemetry-service';

angular.module('wfComposerService', ['wfTelemetryService'])
    .service('wfComposerService', ['$http', '$q', 'config', '$log', 'wfHttpSessionService', 'wfTelemetryService', wfComposerService]);

function wfComposerService($http, $q, config, $log, wfHttpSessionService, wfTelemetryService) {

    const request = wfHttpSessionService.request;

    const composerContentFetch = config.composerContentDetails;

    function composerUpdateFieldUrl(fieldName, contentId) {
        function liveOrPreview(isPreview) {
            return `${composerContentFetch}${contentId}/${isPreview ? "preview" : "live"}/fields/${fieldName}`
        }
        return {
            preview: liveOrPreview(true),
            live:    liveOrPreview(false)
        }
    }

    function composerUpdateSettingUrl(settingName, contentId) {
        function liveOrPreview(isPreview) {
            return `${composerContentFetch}${contentId}/${isPreview ? "preview" : "live"}/settings/${settingName}`
        }
        return {
            preview: liveOrPreview(true),
            live:    liveOrPreview(false)
        }
    }

    // budget composer url parser - just gets the portion after the last '/'
    function parseComposerId(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }

    function deepSearch(obj, path) {
        if (path.length === 0) return obj;
        const next = path[0];
        if (obj[next]) return deepSearch(obj[next], path.slice(1));
        else return null;
    }

    // Mapping of workflow content fields to transform functions on composer response
    const composerParseMap = {
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
        optimisedForWeb: (d) => deepSearch(d, ['toolSettings', 'seoOptimised', 'data']) === 'true',
        optimisedForWebChanged: (d) => deepSearch(d, ['toolSettings', 'seoChanged', 'data']) === 'true',
        revision: (d) => deepSearch(d, ['contentChangeDetails', 'data', 'revision']),
        lastModified: (d) => new Date(deepSearch(d, ['contentChangeDetails', 'data', 'lastModified', 'date']) || undefined),
        lastModifiedBy: (d) => deepSearch(d, ['contentChangeDetails', 'data', 'lastModified', 'user', 'firstName']) + ' ' + deepSearch(d, ['contentChangeDetails', 'data', 'lastModified', 'user', 'lastName']),
        commissionedLength: (d) => deepSearch(d, ['preview', 'data', 'fields', 'commissionedLength', 'data']) || undefined
    };


    function parseComposerData(response, target) {
        target = target || {};
        if (!response.data || !response.data.data || !response.data.data.id) {
            $log.error("Composer response missing id field. Response: " + JSON.stringify(response) + " \n Stub metadata: " + JSON.stringify(target))
            return Promise.reject({
                message: "composer response did not contain id, response: " + JSON.stringify(response)})
        } else {
            const data = response.data.data;

            Object.keys(composerParseMap).forEach((key) => {
                target[key] = composerParseMap[key](data);
            });

            return Promise.resolve(target);
        }
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

    const getDisplayHint = (articleFormat) => {
        switch (articleFormat){
            case "Key Takeaways":
                return "keyTakeaways"
            case "Q&A Explainer":
                return "qAndA"
            case "Timeline":
                return "timeline"
            case "Mini profiles":
                return "miniProfiles"
            default:
                return undefined
        }
    }
    
    const getType = (type) => {
        switch (type){
            case 'keyTakeaways':
                return 'article'
            case 'qAndA':
                return 'article'
            case "timeline":
                return "article"
            case "miniProfiles":
                return "article"
            default:
                return type
        }
    }

    this.create = function createInComposer(type, commissioningDesks, commissionedLength, prodOffice, template, articleFormat, priority, missingCommissionedLengthReason) {
        var selectedDisplayHint = getDisplayHint(articleFormat);
        
        var params = {
            'type': getType(type),
            'tracking': commissioningDesks,
            'productionOffice': prodOffice,
            'displayHint': selectedDisplayHint,
            'originatingSystem': 'workflow'
        };

        if(commissionedLength) params['initialCommissionedLength'] = commissionedLength;
        if(missingCommissionedLengthReason) params['missingCommissionedLengthReason'] = missingCommissionedLengthReason;

        if(template) {
            params['template'] = template.id;
        }

        const commissioningDeskExternalName = _wfConfig.commissioningDesks
            .find(desk  => desk.id.toString() === commissioningDesks)?.externalName;

        const getPriorityName = (priority) => {
            switch (priority){
                case 0:
                    return 'Normal'
                case 1:
                    return 'Urgent'
                case 2:
                    return 'Very Urgent'
                default:
                    return 'Unknown'
            }
        }

        const tags = {
            contentType: getType(type),
            productionOffice: prodOffice,
            priority: getPriorityName(priority),
        }
        if(selectedDisplayHint !== null && selectedDisplayHint !== undefined) tags.displayHint = selectedDisplayHint;
        if(commissionedLength !== null && commissionedLength !== undefined) tags.commissionedLength = commissionedLength.toString();
        if(commissioningDeskExternalName !== null && commissioningDeskExternalName !== undefined) tags.commissioningDesk = commissioningDeskExternalName;
        if(missingCommissionedLengthReason !== null && missingCommissionedLengthReason !== undefined) tags.missingCommissionedLengthReason = missingCommissionedLengthReason;
        wfTelemetryService.sendTelemetryEvent("WORKFLOW_CREATE_IN_COMPOSER_TRIGGERED", tags);

        return request({
            method: 'POST',
            url: config.composerNewContent,
            params: params,
            withCredentials: true
        });
    };

    this.loadTemplates = function() {
        return request({
            method: 'GET',
            url: config.composerTemplates,
            withCredentials: true
        }).then(({ data }) => {
            return data;
        });
    };

    this.updateField = function (composerId, fieldName, value, live = false) {
        let urls = composerUpdateFieldUrl(fieldName, composerId);
        let url = live ? urls.live : urls.preview;
        let req = {
            method: 'PUT',
            url: url,
            data: `"${value}"`,
            withCredentials: true
        };
        return request(req);
    };

    this.updateSetting = function (composerId, settingName, value, live = false) {
        let urls = composerUpdateSettingUrl(settingName, composerId);
        let url = live ? urls.live : urls.preview;
        let req = {
            method: 'PUT',
            url: url,
            data: `"${value}"`,
            withCredentials: true
        };
        return request(req);
    };

    this.deleteField = function (composerId, fieldName, live = false) {
        let urls = composerUpdateFieldUrl(fieldName, composerId);
        let url = live ? urls.live : urls.preview;
        let req = {
            method: 'DELETE',
            url: url,
            withCredentials: true
        };
        return request(req);
    };

    /**
     * Update rights information for the given piece.
     * @param {string} composerId
     * @param {{
     *     developerCommunity: boolean,
     *     subscriptionDatabases: boolean,
     *     syndicationAggregate: boolean
     * }} rightsData
     * @returns Promise<Response>
     */
    this.updateRights = function (
        composerId,
        rightsData
    ) {
        let req = {
          method: 'PUT',
          url: `${composerContentFetch}${composerId}/rights`,
          data: JSON.stringify(rightsData),
          withCredentials: true
        };

        return request(req);
    };
}
