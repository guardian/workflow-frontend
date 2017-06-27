import angular from 'angular';
import moment from 'moment';

angular.module('wfAtomService', [])
.service('wfAtomService', ['config', wfAtomService]);

function wfAtomService(config) {
  function parseMediaAtom(atom, id) {
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
        return `${config.mediaAtomMakerViewAtom}${id || atom.id}`;
    }
  }

  function parseAtomUsage(usage) {
    const usageFields = {
      composerUrl: config.composerViewContent + '/' + usage.id.substr(usage.id.lastIndexOf('/') + 1),
      viewerUrl: config.viewerUrl + '/' + usage.id,
    }
    return Object.assign({}, usage, usageFields);
  }

  this.parseMediaAtom = parseMediaAtom;
  this.parseAtomUsage = parseAtomUsage;
}
