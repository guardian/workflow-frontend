import angular from "angular";
import _ from 'lodash'

angular
  .module("wfTagApiService", [])
  .service("wfTagApiService", ["$http", "$q", tagApiService]);

const extractHyper = ({data})=>data

function stringify(obj) {
  //webpack won't let us use modules with es6 in them until we upgrade it
  return _.toPairs(obj).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}

function tagApiService($http, $q) {
  const url = `${_wfConfig.tagManagerUrl}/hyper/tags`;

  function tags(params) {
    const queryString = stringify(params);
    return $http({
      method: "GET",
      url: `${url}?${queryString}`,
    }).then(extractHyper);
  }

  function getTag(id) {
    return $http({
      method: "GET",
      url: `${url}/${id}`,
    }).then(extractHyper);
  }

  /***
   * We don't have a hyper media client in this project, 
   * and it's way too much for just tag queries. 
   * 
   * This function takes a tag from the tag service which 
   * has only a `uri` field and not a `data` field and 
   * then calls `getTag` with this tag.
   */
  function getHyperTag(hyperTag) {
    const {uri} = hyperTag
    const id = uri.split('/').pop()
    return getTag(id)
  }

  function getPublications() {
    return tags({
      type: "publication",
      limit: 50,
    })
  }

  function searchTags(query, types, subType) {
    if (query) {
      var wildcardQuery = query.replace(/^\\/, "*"); // using '\' as a wildcard character is a hangover from R2

      const params = {
        query: wildcardQuery,
        limit: 50,
      };

      if (types) {
        params.type = types;
      }

      if (subType) {
        params.subType = subType;
      }

      return tags(params);
    } else {
      return $q.resolve();
    }
  }

  this.getPublication = getPublications;
  this.searchTags = searchTags;
  this.getTag = getTag;
  this.getHyperTag = getHyperTag;
}
