import angular from 'angular';
import _ from 'lodash';

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

    // Specific atom parsers
    function parseCta(atom) {
        return {
            url: atom.url,
            backgroundImage: atom.backgroundImage,
            btnText: atom.btnText,
            label: atom.label
        }
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
            const atomData = {
                title: _.get(response.data.response[atomType], 'title')
            }
            const atom = _.get(response.data.response[atomType].data, atomType);
            if(atom) {
                return Object.assign({}, atomData, parseCta(atom));
            }
        }
        return emptyCapiAtomObject();
    }

    this.getCapiAtom = getCapiAtom;
    this.parseCapiAtomData = parseCapiAtomData;
    
}

