import { specialFormats, STANDARD_ARTICLE_FORMAT_LABEL } from './special-formats'
import { ContentType } from './stub'


const nonArticleFormats = {
    "liveblog": "Live blog",
    "gallery": "Gallery",
    "interactive": "Interactive",
    "picture": "Picture",
    "audio": "Audio",
    "atom": "Video/Atom"
}

const provideFormats = (featureSwitches?: Record<string, boolean>): Partial<Record<ContentType, string>> => {
    const articleFormats: Record<string, string> = {
        "article": "Article",
    }

    specialFormats.forEach(format => {
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

    specialFormats.forEach(format => {
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




export { provideFormats, provideArticleFormatsForDropDown }