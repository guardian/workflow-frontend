import angular from 'angular';
import _ from 'lodash';

angular.module('wfCapiContentService', [])
.service('wfCapiContentService', ['$http', '$q', wfCapiContentService]);

function wfCapiContentService($http, $q) {
    

    function getSize(asset) {
        if (asset.typeData) {
            const w = parseInt(asset.typeData.width);
            const h = parseInt(asset.typeData.height);
            return h && w ? h * w : null;
        } else return null;
    }
    
    
    function getSmallestAsset(assets) {
        return assets.reduceRight(function(l,r) {
            return getSize(l) < getSize(r) ? l : r;
        });
    }
    
    function getMainMedia(elements) {
        const mainElements = elements.filter((e) => e.relation === "main");
        
        if (mainElements.length && mainElements[0] && mainElements[0].assets) {
            const smallest = getSmallestAsset(mainElements[0].assets);
            if (smallest) {
                return {
                    url: smallest.file,
                    caption: smallest.typeData.caption,
                    altText: smallest.typeData.altText
                };
            }
        }
        return null;
    }

    function getContentAtomBlocks(blocks) {
        return blocks.filter(block => block.type === 'contentatom');
    }

    function getAtomUsages(id, atomType) {
        return getCapiAtomUsages(id, atomType).then(res => {
            const usagePaths = res.data.response.results;
            // the atom usage endpoint in capi only returns article paths,
            // lookup the articles in capi to get their fields
            return Promise.all(usagePaths.map(wfCapiContentService.getCapiContent)).then(capiResponse => {
                const usages = capiResponse.reduce((all, item) => {
                    let content = item.data.response.content;
                    all.push(parseUsage(content));
                    return all;
                }, []);
                return usages;
            });
        });
    }
    
    function getTagTitles(tags) {
        return tags.map((t) => t.webTitle);
    }

    function emptyCapiContentObject() {
        return {
            headline: "Unknown",
            standfirst: "Unknown",
            mainMediaUrl: "",
            mainMediaCaption: "Unknown",
            mainMediaAltText: "Unknown",
            trailImageUrl: "",
            trailText : "Unknown",
            commentsTitle: "Unknown",
            wordCount: "Unknown",
            commissioningDesks: "",
            firstPublishedDate: "",
            capiError: true,
            atomUsages: []
        }
    }

    function parseCapiContentData(response) {
        const content = _.get(response, 'data.response.content');
        if (content) {
            const fields = _.get(content, 'fields', {});
            const elements = _.get(content, 'elements');
            const tags = _.get(content, 'tags');
            const atomUsages = getContentAtomBlocks(_.get(content, 'blocks.body[0].elements'));
            const mainMedia = elements ? getMainMedia(elements): null;
            return Promise.resolve({
                headline: fields.headline ? fields.headline : "",
                standfirst: fields.standfirst ? fields.standfirst : "",
                mainMediaUrl: mainMedia ? mainMedia.url : "",
                mainMediaCaption: mainMedia ? mainMedia.caption : "",
                mainMediaAltText: mainMedia ? mainMedia.altText : "",
                trailImageUrl: fields.thumbnail ? fields.thumbnail : "",
                trailText : fields.trailText ? fields.trailText : "",
                commentsTitle: fields.commentable ? (fields.commentable === "true" ? "on" : "off") : "off",
                wordCount: fields.wordcount ? fields.wordcount : "",
                commissioningDesks: tags ? getTagTitles(tags) : "",
                firstPublishedDate: fields.firstPublicationDate ? fields.firstPublicationDate : "",
                atomUsages: atomUsages
            });
        }
        return emptyCapiContentObject();
    }   
    
    function getCapiContent(path) {
        return $http({
            method: 'GET',
            url: "/capi/"+path,
            params: {
                'show-fields': 'headline,standfirst,thumbnail,trailText,firstPublicationDate,wordcount,commentable',
                'show-elements': 'all',
                'show-blocks': 'body',
                'show-tags': 'tracking'
            },
            withCredentials: true,
            timeout: 1000
        });
    }

    this.getCapiContent = getCapiContent;
    this.parseCapiContentData = parseCapiContentData;
    this.emptyCapiContentObject = emptyCapiContentObject;
}

