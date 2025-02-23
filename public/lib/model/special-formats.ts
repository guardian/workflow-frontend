import { ComposerContentType, ContentType, SpecialArticleFormat, Stub } from "./stub";

const specialFormats: SpecialArticleFormat[] = [
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

export { specialFormats, setDisplayHintForFormat, getSpecialFormatFromLabel, contentTypeToComposerContentType }