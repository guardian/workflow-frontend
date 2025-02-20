import { ComposerContentType, ContentType, SpecialArticleFormat, Stub } from "./stub";

// eslint-disable-next-line no-undef -- Need to set up typescript-eslint
const specialFormats: Readonly<SpecialArticleFormat[]> = [
    { label: 'Key Takeaways', value: 'keyTakeaways' },
    { label: 'Q&A Explainer', value: 'qAndA' },
    { label: 'Timeline', value: 'timeline' },
    { label: 'Mini profiles', value: 'miniProfiles' },
    { label: 'Multi-byline', value: 'multiByline' },
]

const setDisplayHintForFormat = (stub: Stub): Stub => {
    const maybeMatchingFormat = specialFormats.find(format => format.value === stub.contentType)
    if (maybeMatchingFormat) {
        stub.displayHint = maybeMatchingFormat.value
    }
    return stub
}

const getSpecialFormatFromLabel = (label: string): SpecialArticleFormat | undefined =>
    specialFormats.find(format => format.label === label)

const contentTypeToComposerContentType = (type: ContentType): ComposerContentType => {
    switch (type) {
        case "article":
        case "liveblog":
        case "gallery":
        case "interactive":
        case "picture":
        case "video":
        case "audio":
            return type;
        default:
            return 'article'
    }
}

const getArticleFormat = (contentType: ComposerContentType, displayHint?: string): ContentType => {
    // 'interactive' content can have displayHints as well as 'article' content, but we are not currently
    // displaying those as "article formats"
    if (!displayHint || !['article'].includes(contentType)) {
        return contentType
    }
    return specialFormats.find(format => format.value === displayHint)?.value ?? contentType
}

function toTitleCase(str:string) {
    return str.replace(/\b\w/g, function (txt) { return txt.toUpperCase(); });
}

const getArticleFormatTitle = (contentType: ComposerContentType, displayHint?: string): string => {
    if (!displayHint || !['article'].includes(contentType)) {
        return toTitleCase(contentType)
    }
    return specialFormats.find(format => format.value === displayHint)?.label ?? toTitleCase(contentType)
}

export { 
    specialFormats, 
    setDisplayHintForFormat, 
    getSpecialFormatFromLabel, 
    contentTypeToComposerContentType, 
    getArticleFormat, 
    getArticleFormatTitle 
}