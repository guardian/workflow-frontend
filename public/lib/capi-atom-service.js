import angular from 'angular';
import _ from 'lodash';

angular.module('wfCapiAtomService', [])
.service('wfCapiAtomService', ['$http', '$q', wfCapiAtomService]);

function wfCapiAtomService($http, $q) {

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
            const atomId = _.get(response.data.response[atomType]);
            if(atom) {
                const capiUrl = getUrl(atomId, atomType);
                const atomWithUrl = Object.assign({}, atom, {capiUrl: capiUrl});
                return atomWithUrl;
            }
        }
        return emptyCapiAtomObject();
    }

    this.getCapiAtom = getCapiAtom;
    this.parseCapiAtomData = parseCapiAtomData;
    this.emptyCapiAtomObject = emptyCapiAtomObject;
    
}

