import { ComposerContentType, ContentType, SpecialArticleFormat, Stub } from "./stub";

const specialFormats: SpecialArticleFormat[] = [
    { label: 'Key Takeaways', value: 'keyTakeaways', iconId: 'keyTakeaways' },
    { label: 'Q&A Explainer', value: 'qAndA', iconId: 'qAndA' },
    { label: 'Timeline', value: 'timeline', iconId: 'timeline' },
    { label: 'Mini profiles', value: 'miniProfiles', iconId: 'miniProfiles' },
    { label: 'Multi-byline', value: 'multiByline', iconId: 'multiByline', hidden: true },
]

const setDisplayHintForFormat = (stub: Stub): Stub => {
    const maybeMatchingFormat = specialFormats.find(format => format.value === stub.contentType)
    if (maybeMatchingFormat) {
        stub.displayHint = maybeMatchingFormat.value
    }
    return stub
}

/**
 * return "Standard Article" for normal articles, the label for special article formats
 * or empty string for non-article stubs
 */
const getStubArticleFormat = (contentType:ContentType): string => {
    const maybeMatchingFormat = specialFormats.find(format => format.value === contentType)
    if (maybeMatchingFormat) {
        return maybeMatchingFormat.label
    }
    if (contentType === 'article') {
        return "Standard Article"
    }
    return ''
}

const getFormatFromLabel = (label: string): SpecialArticleFormat | undefined =>
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

export { specialFormats, setDisplayHintForFormat, getFormatFromLabel, contentTypeToComposerContentType, getStubArticleFormat }