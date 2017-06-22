import angular from 'angular';

angular.module('wfAtomService', [])
.service('wfAtomService', wfAtomService);

function wfAtomService() {
  function parseMediaAtom(atom) {
    const currentAsset = getCurrentAsset();
    const mediaAtomFields = {
      youtubeUrl: currentAsset && `https://www.youtube.com/embed/${currentAsset.id}?showinfo=0`
    }

    return Object.assign({}, atom, mediaAtomFields);


    function getCurrentAsset() {
      return atom.assets.filter(asset => asset.version === atom.activeVersion)[0];
    }
  }

  this.parseMediaAtom = parseMediaAtom;
}