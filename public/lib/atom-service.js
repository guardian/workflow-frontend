import angular from 'angular';
import moment from 'moment';

angular.module('wfAtomService', [])
.service('wfAtomService', ['config', wfAtomService]);

function wfAtomService(config) {
  function parseMediaAtom(atom, id) {
    const currentAsset = getCurrentAsset();
    const editorUrl = getUrl();
    const keywords = formatKeywords();
    const friendlyExpiryDate = moment(atom.metadata.expiryDate).format('dddd, MMMM Do YYYY');
    const mediaAtomFields = {
      friendlyExpiryDate: friendlyExpiryDate,
      editorUrl: editorUrl,
      youtubeUrl: currentAsset && `https://www.youtube.com/embed/${currentAsset.id}`,
      keywords: keywords,
    }

    return Object.assign({}, atom, mediaAtomFields);


    function getCurrentAsset() {
      return atom.assets.filter(asset => asset.version === atom.activeVersion)[0];
    }

    function getUrl() {
        return `${config.mediaAtomMakerViewAtom}${id || atom.id}`;
    }

    function formatKeywords() {
      return atom.metadata.tags.length ? atom.metadata.tags.join(', ') : false;
    }
  }

  function parseAtomUsage(usage) {
    const usageFields = {
      composerUrl: config.composerViewContent + '/' + usage.id.substr(usage.id.lastIndexOf('/') + 1),
      viewerUrl: config.viewerUrl + '/' + usage.id,
      friendlyCreationDate: moment(usage.webPublicationDate).fromNow()
    }
    return Object.assign({}, usage, usageFields);
  }

  this.parseMediaAtom = parseMediaAtom;
  this.parseAtomUsage = parseAtomUsage;
}
