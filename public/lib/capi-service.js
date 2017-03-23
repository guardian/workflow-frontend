import angular from 'angular';

angular.module('wfCapiService', [])
    .service('wfCapiService', ['$http', '$q', 'config', 'wfHttpSessionService', wfCapiService]);

function wfCapiService($http, $q, config, wfHttpSessionService) {

    function getSize(asset) {
        if (asset.typeData) {
            const w = parseInt(asset.typeData.width);
            const h = parseInt(asset.typeData.height);
            return h && w ? h * w : null;
        } else null;
    }


    function getSmallestAsset(assets) {
        return assets.reduceRight(function(l,r) {
            return getSize(l) < getSize(r) ? l : r;
        });
    }

    function getMainMedia(elements) {
        const mainElement = elements.filter((e) => e.relation === "main")[0];
        const smallest = getSmallestAsset(mainElement.assets);

        return {
            url: smallest.file,
            caption: smallest.typeData.caption,
            altText: smallest.typeData.altText
        };

    }

    function getTagTitles(tags) {
        return tags.map((t) => t.webTitle);
    }

    function parseCapiData(response) {

        if (response.data) {
            const resp = response.data.response;
            if (resp) {
                const content = resp.content;
                if (content) {
                    const fields = content.fields;
                    const elements = content.elements;
                    const tags = content.tags;

                    const mainMedia = elements ? getMainMedia(elements): null;

                    console.log(fields)


                    return {
                        headline: fields ? fields.headline : "",
                        standfirst: fields ? fields.standfirst : "",
                        mainMediaUrl: mainMedia ? mainMedia.url : "",
                        mainMediaCaption: mainMedia ? mainMedia.caption : "",
                        mainMediaAltText: mainMedia ? mainMedia.altText : "",
                        trailImageUrl: fields ? fields.thumbnail : "",
                        trailText : fields ? fields.trailText : "",
                        commentsTitle: fields ? fields.commentable ? "on" : "off" : "on",
                        wordCount: fields ? fields.wordCount ? fields.wordCount : "" : "",
                        commissioningDesks: tags ? getTagTitles(tags) : "",
                        firstPublishedDate: fields.firstPublicationDate ? fields.firstPublicationDate : ""
                    }
                }
            }
        } else {
            // need to fail gracefully when capi unavailable
            return {};
        }
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
            withCredentials: true
        });
    }


    this.getCapiContent = getCapiContent;

    this.parseCapiData = parseCapiData;


}

