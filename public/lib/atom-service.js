import angular from 'angular';
import moment from 'moment';

angular.module('wfAtomService', [])
.service('wfAtomService', ['config', wfAtomService]);

function wfAtomService(config) {
  function parseMediaAtom(atom) {
    const currentAsset = getCurrentAsset();
    const editorUrl = getUrl();
    const friendlyExpiryDate = moment(atom.metadata.expiryDate).format('dddd, MMMM Do YYYY');
    const mediaAtomFields = {
      friendlyExpiryDate: friendlyExpiryDate,
      editorUrl: editorUrl,
      youtubeUrl: currentAsset && `https://www.youtube.com/embed/${currentAsset.id}`
    }

    return Object.assign({}, atom, mediaAtomFields);


    function getCurrentAsset() {
      return atom.assets.filter(asset => asset.version === atom.activeVersion)[0];
    }

    function getUrl() {
        return `${config.mediaAtomMakerViewAtom}${atom.id}`;
    }
  }

  this.parseMediaAtom = parseMediaAtom;
}