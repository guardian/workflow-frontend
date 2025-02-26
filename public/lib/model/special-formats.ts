import { ComposerContentType, ContentType, DisplayHintArticleFormat, ListElementArticleFormat, ListElementContentType, Stub, NonListElementDisplayHint } from "./stub";

// eslint-disable-next-line no-undef -- Need to set up typescript-eslint
const listElementArticleFormats: Readonly<ListElementArticleFormat[]> = [
    { label: 'Key Takeaways', value: 'keyTakeaways' },
    { label: 'Q&A Explainer', value: 'qAndA' },
    { label: 'Timeline', value: 'timeline' },
    { label: 'Mini profiles', value: 'miniProfiles' },
    { label: 'Multi-byline', value: 'multiByline' },
]

// In addition to the below, the following are valid display hints:
// - 'column'. Deprecated: https://github.com/guardian/flexible-content/pull/3821)
// - 'splash'. Deprecated: https://github.com/guardian/flexible-content/pull/3369)

// eslint-disable-next-line no-undef -- Need to set up typescript-eslint
const nonListElementDisplayHintsFormats: Readonly<DisplayHintArticleFormat[]> = [
    {
        value: 'immersive',
        label: 'Immersive',
    },
    {
        value: 'photoEssay',
        label: 'Photo essay',
    },
    {
        value: 'numberedList',
        label: 'Numbered list',
    },
];

const setDisplayHintForFormat = (stub: Stub): Stub => {
    const maybeMatchingFormat = listElementArticleFormats.find(format => format.value === stub.contentType)
    if (maybeMatchingFormat) {
        stub.displayHint = maybeMatchingFormat.value
    }
    return stub
}

const getListElementFormatFromLabel = (label: string): ListElementArticleFormat | undefined =>
    listElementArticleFormats.find(format => format.label === label)

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

const findFormatByByDisplayHint = (displayHint: string): ListElementArticleFormat | DisplayHintArticleFormat | undefined => {
    return [...nonListElementDisplayHintsFormats, ...listElementArticleFormats]
        .find(format => format.value === displayHint)
}

const getArticleFormat = (contentType: ComposerContentType, displayHint?: string): ComposerContentType | ListElementContentType | NonListElementDisplayHint => {
    if (!displayHint || !['article', 'interactive'].includes(contentType)) {
        return contentType
    }
    return findFormatByByDisplayHint(displayHint)?.value ?? contentType
}

function toTitleCase(str: string) {
    return str.replace(/\b\w/g, function (txt) { return txt.toUpperCase(); });
}

const getArticleFormatTitle = (contentType: ComposerContentType, displayHint?: string): string => {
    if (!displayHint || !['article', 'interactive'].includes(contentType)) {
        return toTitleCase(contentType)
    }

    return findFormatByByDisplayHint(displayHint)?.label ?? toTitleCase(contentType)
}

export {
    listElementArticleFormats,
    nonListElementDisplayHintsFormats,
    setDisplayHintForFormat,
    getListElementFormatFromLabel,
    contentTypeToComposerContentType,
    getArticleFormat,
    getArticleFormatTitle
}