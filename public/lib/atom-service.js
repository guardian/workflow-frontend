import angular from 'angular';

angular.module('wfAtomService', [])
.service('wfAtomService', wfAtomService);

function wfAtomService() {
  function parseMediaAtom(atom) {
    const mediaAtomFields = {
      currentAsset: getCurrentAsset()
    }

    return Object.assign({}, atom, mediaAtomFields);


    function getCurrentAsset() {
      // return atom.assets.filter(asset => asset.version === atom.activeVersion)[0];
      return {
        id: 'WpH_t0u5Ybg'
      }
    }
  }

  this.parseMediaAtom = parseMediaAtom;
}