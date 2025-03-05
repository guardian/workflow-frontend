import { listElementArticleFormats, nonListElementDisplayHintsFormats } from './special-formats'
import { ContentType } from './stub'

const STANDARD_ARTICLE_FORMAT_LABEL = "Standard Article";
const STANDARD_ARTICLE_FORMAT_SHORT_LABEL = "Article";

const nonArticleFormats = {
    "liveblog": "Live blog",
    "gallery": "Gallery",
    "interactive": "Interactive",
    "picture": "Picture",
    "audio": "Audio",
    "atom": "Video/Atom"
}

/**
 * Returns an object mapping ContentType to user facings labels, excluding any
 * list elements formats that that behind a feature switch in the 'off' state.
 */
const provideFormats = (featureSwitches?: Record<string, boolean>): Partial<Record<ContentType, string>> => {
    const articleFormats: Record<string, string> = {
        "article": STANDARD_ARTICLE_FORMAT_SHORT_LABEL,
    }

    listElementArticleFormats.forEach(format => {
        if (format.behindFeatureSwitch) {
            if (featureSwitches?.[format.behindFeatureSwitch]) {
                articleFormats[format.value] = format.label
            }
        } else {
            articleFormats[format.value] = format.label
        }
    })


    // Assembling the object this way preserves the existing order in the UI
    return { ...articleFormats, ...nonArticleFormats };
}

/**
 * Returns a list of objects describing the available article formats 
 * that can be used to as a model for a select input in an angular template
 */
const provideArticleFormatsForDropDown = (featureSwitches?: Record<string, boolean>): { name: string; value: string }[] => {

    const list = [STANDARD_ARTICLE_FORMAT_LABEL]

    listElementArticleFormats.forEach(format => {
        if (format.behindFeatureSwitch) {
            if (featureSwitches && featureSwitches[format.behindFeatureSwitch]) {
                list.push(format.label)
            }
        } else {
            list.push(format.label)
        }
    })

    return list.map(label => ({ name: label, value: label }))
}

/**
 * returns "Standard Article" for normal articles, the label for list element article formats
 * or empty string for non-article content types
 */
const getArticleFormatLabel = (contentType: ContentType): string => {
    const maybeMatchingFormat = listElementArticleFormats.find(format => format.value === contentType)
    if (maybeMatchingFormat) {
        return maybeMatchingFormat.label
    }
    if (contentType === 'article') {
        return STANDARD_ARTICLE_FORMAT_LABEL
    }
    return ''
}

/**
 * true if the value is the label of a list element format or the "Standard Article" label
 */
const isFormatLabel = (value: string): boolean => {
    return value === STANDARD_ARTICLE_FORMAT_LABEL || listElementArticleFormats.some(format => format.label === value)
}

const provideListElementFormatsForFilterList = (featureSwitches?: Record<string, boolean>) => {
    return listElementArticleFormats.filter(format => !format.behindFeatureSwitch || featureSwitches?.[format.behindFeatureSwitch] === true)
        .map(format => ({
            caption: format.label,
            value: format.value,
            icon: format.value
        }))
}

const provideNonListElementDisplayHintFormatsForFilterList = () => {
    return nonListElementDisplayHintsFormats
        .map(format => ({
            caption: format.label,
            value: format.value,
            icon: format.value
        }))
}

export { provideFormats, provideArticleFormatsForDropDown, getArticleFormatLabel, isFormatLabel, provideListElementFormatsForFilterList, provideNonListElementDisplayHintFormatsForFilterList }