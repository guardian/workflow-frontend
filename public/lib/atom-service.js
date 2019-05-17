import angular from 'angular';
import moment from 'moment';

angular.module('wfAtomService', [])
.service('wfAtomService', ['config', wfAtomService]);

function wfAtomService(config) {

  const atomTypes = config.atomTypes;

  function parseAtom(atom, atomType, id) {
        switch(atomType) {
          case 'media':
              return parseMediaAtom(atom, atomType, id);
          default:
              return parseWorkshopAtom(atom, atomType, id);
      }
  }

  function parseWorkshopAtom(atom, atomType, id) {
    const url = `${config.atomWorkshopViewAtom}/${atomType.toUpperCase()}/${id}/edit`;
    return Object.assign({}, atom, {editorUrl: url});
  }

  function parseMediaAtom(atom, atomType, id) {
    const currentAsset = getCurrentAsset();
    const editorUrl = getUrl();
    const keywords = formatKeywords();
    const friendlyExpiryDate = moment(atom.metadata.expiryDate).format('dddd, MMMM Do YYYY');
    const friendlyCreationDate = moment(atom.contentChangeDetails.created.date).fromNow();
    const mediaAtomFields = {
      friendlyExpiryDate: friendlyExpiryDate,
      friendlyCreationDate: friendlyCreationDate,
      editorUrl: editorUrl,
      currentAsset: currentAsset,
      atomType: atomType,
      youtubeUrl: currentAsset && `https://www.youtube.com/embed/${currentAsset.id}`,
      keywords: keywords
    };

    return Object.assign({}, atom, mediaAtomFields);


    function getCurrentAsset() {
      return atom.assets.filter(asset => asset.version === atom.activeVersion)[0];
    }

    function getUrl() {
      if(atomType === 'media') {
        return `${config.mediaAtomMakerViewAtom}${id || atom.id}`;
      }
      return '';
    }

    function formatKeywords() {
      return atom.metadata.tags && atom.metadata.tags.length ? atom.metadata.tags.join(', ') : false;
    }
  }

  function parseAtomUsage(usage) {
    const usageFields = {
      composerUrl: config.composerViewContent + '/' + usage.fields.internalComposerCode,
      viewerUrl: config.viewerUrl + '/preview/' + usage.id,
      friendlyCreationDate: moment(usage.webPublicationDate).fromNow()
    };

    return Object.assign({}, usage, usageFields);
  }

  this.parseAtom = parseAtom;
  this.parseAtomUsage = parseAtomUsage;
}
