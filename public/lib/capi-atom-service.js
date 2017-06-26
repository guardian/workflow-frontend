import angular from 'angular';
import _ from 'lodash';

angular.module('wfCapiAtomService', [])
.service('wfCapiAtomService', ['$http', '$q', 'config', 'wfCapiContentService', wfCapiAtomService]);

function wfCapiAtomService($http, $q, config, wfCapiContentService) {

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

    function getAtomUsages(id, atomType) {
        return getCapiAtomUsages(id, atomType).then(res => {
            const usagePaths = res.data.response.results;
            // the atom usage endpoint in capi only returns article paths,
            // lookup the articles in capi to get their fields
            return Promise.all(usagePaths.map(wfCapiContentService.getCapiContent)).then(capiResponse => {
                const usages = capiResponse.reduce((all, item) => {
                    let content = item.data.response.content;
                    content['composerUrl'] = config.composerViewContent + '/' + content.id.substr(content.id.lastIndexOf('/') + 1);
                    content['viewerUrl'] = config.viewerUrl + '/' + content.id;
                    all.push(content);
                    return all;
                }, []);
                return usages;
            });
        });
    }

    function parseCapiAtomData(response, atomType) {

        const allAtomTypes = [
            'explainer',
            'media',
            'cta',
            'recipe',
            'storyQuestions',
            'quiz'
        ];
        if(allAtomTypes.indexOf(atomType) !== -1) {
            const atom = _.get(response.data.response[atomType].data, atomType);
            const atomId = response.data.response[atomType].id;

            if(atom) {
                const capiUrl = getUrl(atomId, atomType);
                return Object.assign({}, atom, {capiUrl: capiUrl});
            }
        }
        return emptyCapiAtomObject();
    }

    this.getCapiAtom = getCapiAtom;
    this.getAtomUsages = getAtomUsages;
    this.parseCapiAtomData = parseCapiAtomData;
    this.emptyCapiAtomObject = emptyCapiAtomObject;
    
}

