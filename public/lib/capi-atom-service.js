import angular from 'angular';
import _ from 'lodash';

angular.module('wfCapiAtomService', [])
.service('wfCapiAtomService', ['$http', '$q', 'config', 'wfCapiContentService', 'wfAtomService', wfCapiAtomService]);

function wfCapiAtomService($http, $q, config, wfCapiContentService, wfAtomService) {

    function emptyCapiAtomObject() {
        return {
            id: "",
            atomType: "",
            labels: [],
            contentChangeDetails: {
                created: {
                    date: ""
                },
                lastModified: {
                    date: ""
                }
            },
            revision: "",
            capiError: true
        }
    }

    function getUrl(id, atomType) {
        return `/capi/atom/${atomType}/${id}`;
    }
    
    function getCapiAtom(id, atomType) {
        return $http({
            method: 'GET',
            url: getUrl(id, atomType),
            params: {
                'show-tags': 'tracking'
            },
            withCredentials: true,
            timeout: 1000
        });
    }

    function getCapiAtomUsages(id, atomType) {
        return $http({
            method: 'GET',
            url: getUrl(id, atomType) + '/usage',
            withCredentials: true,
            timeout: 1000
        });
    }

    function parseUsage(usage) {
        return wfAtomService.parseAtomUsage(usage);
    }

    function getAtomUsages(id, atomType) {
        return getCapiAtomUsages(id, atomType).then(res => {
            const usagePaths = res.data.response.results;
            // the atom usage endpoint in capi only returns article paths,
            // lookup the articles in capi to get their fields
            return Promise.all(usagePaths.map(wfCapiContentService.getCapiContent)).then(capiResponse => {
                const usages = capiResponse.reduce((all, item) => {
                    let content = item.data.response.content;
                    all.push(parseUsage(content));
                    return all;
                }, []);
                return usages;
            });
        });
    }

    function parseCapiAtomData(response, atomType) {
        const atom = _.get(response.data.response[atomType].data, atomType);
        atom.defaultHtml = _.get(response.data.response[atomType], 'defaultHtml');
        atom.contentChangeDetails = _.get(response.data.response[atomType], 'contentChangeDetails');

        // The commissioningDesks field needs to be parsed as it looks like this:
        // ["tracking/commissioningdesk/uk-culture", "tracking/commissioningdesk/australia-culture"]
        // and in the end we want an array like this: ["uk-culture", "australia-culture"]
        atom.commissioningInfo = _.get(atom, 'commissioningDesks',[]).map(desk => {
            const segments = desk.split('/');
            return segments[segments.length - 1];
        });

        const atomId = _.get(response.data.response[atomType], 'id');
        if(atom) {
            return wfAtomService.parseAtom(atom, atomType, atomId);
        }
        return emptyCapiAtomObject();
    }

    this.getCapiAtom = getCapiAtom;
    this.getAtomUsages = getAtomUsages;
    this.parseCapiAtomData = parseCapiAtomData;
    this.emptyCapiAtomObject = emptyCapiAtomObject;
    
}

