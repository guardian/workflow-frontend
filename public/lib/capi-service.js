import angular from 'angular';

angular.module('wfCapiService', [])
    .service('wfCapiService', ['$http', '$q', wfCapiService]);

function wfCapiService($http, $q) {

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

    function getTagTitles(tags) {
        return tags.map((t) => t.webTitle);
    }

    function emptyCapiObject() {
        return {
            headline: "unknown",
            standfirst: "unknown",
            mainMediaUrl: "",
            mainMediaCaption: "unknown",
            mainMediaAltText: "unknown",
            trailImageUrl: "",
            trailText : "unknown",
            commentsTitle: "unknown",
            wordCount: "unknown",
            commissioningDesks: "",
            firstPublishedDate: "",
            capiError: true
        }
    }

    function parseCapiData(response) {

        if (response.data) {
            const resp = response.data.response;
            if (resp) {
                const content = resp.content;
                if (content) {
                    const fields = content.fields ? content.fields : {};
                    const elements = content.elements;
                    const tags = content.tags;

                    const mainMedia = elements ? getMainMedia(elements): null;

                    return {
                        headline: fields.headline ? fields.headline : "",
                        standfirst: fields.standfirst ? fields.standfirst : "",
                        mainMediaUrl: mainMedia ? mainMedia.url : "",
                        mainMediaCaption: mainMedia ? mainMedia.caption : "",
                        mainMediaAltText: mainMedia ? mainMedia.altText : "",
                        trailImageUrl: fields.thumbnail ? fields.thumbnail : "",
                        trailText : fields.trailText ? fields.trailText : "",
                        commentsTitle: fields.commentable ? fields.commentable ? "on" : "off" : "on",
                        wordCount: fields.wordcount ? fields.wordcount : "",
                        commissioningDesks: tags ? getTagTitles(tags) : "",
                        firstPublishedDate: fields.firstPublicationDate ? fields.firstPublicationDate : ""
                    }
                }
            }
        }
        return emptyCapiObject();
    }


    function getCapiContent(path) {
        return $http({
            method: 'GET',
            url: "/capi/"+path,
            params: {
                'show-fields': 'headline,standfirst,thumbnail,trailText,firstPublicationDate',
                'show-elements': 'all',
                'show-tags': 'tracking'
            },
            withCredentials: true,
            timeout: 1000
        });
    }


    this.getCapiContent = getCapiContent;
    this.parseCapiData = parseCapiData;
    this.emptyCapiObject = emptyCapiObject;


}

