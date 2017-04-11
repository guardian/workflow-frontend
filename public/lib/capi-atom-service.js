import angular from 'angular';

angular.module('wfCapiAtomService', [])
.service('wfCapiAtomService', ['$http', '$q', wfCapiAtomService]);

function wfCapiAtomService($http, $q) {

    function emptyCapiAtomObject() {
        return {
            empty: true
        }
    }
    
    function getCapiAtom(path) {
        return $http({
            method: 'GET',
            url: '/capi/'+path,
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
            // Improvement - include lodash _.get from 4.17.4
            if (response.data) {
                const resp = response.data.response;
                if (resp) {
                    const atom = resp[atomType].data[atomType];
                    if (atom) {
                        console.log(atom);
                        return {
                            title: atom.title
                        }
                    }
                }
            }
        }
        return emptyCapiAtomObject();
    }

    this.getCapiAtom = getCapiAtom;
    this.parseCapiAtomData = parseCapiAtomData;
    
}

