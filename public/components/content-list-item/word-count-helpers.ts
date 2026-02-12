type ContentLengthCategory = 'alert' | 'over' | 'near' | 'low' | 'none';

const getContentLengthCategory = function (
    commissionedLength: number | undefined | null,
    wordCount: number | undefined | null,
): ContentLengthCategory {
    if (typeof commissionedLength !== 'number' || typeof wordCount !== 'number') {
        return 'none';
    }
    const wordsLeft = commissionedLength - wordCount;
    if (wordsLeft > 50) {
        return 'low';
    }
    if (wordsLeft <= 50 && wordsLeft >= 0) {
        return 'near';
    }
    if (wordsLeft >= -50) {
        return 'over';
    }
    return 'alert';
};

function getCommissionedLengthTitle(
    commissionedLength: number | undefined | null,
    wordCount: number | undefined | null,
) {
    if (typeof commissionedLength !== 'number') {
        return `Commissioned word count(not defined)`
    }
    if (typeof wordCount !== 'number') {
        return `Commissioned word count`
    }
    
    const wordsLeft = commissionedLength - wordCount;
    if (wordsLeft <= 0) {
        return `Commissioned word count(${-wordsLeft.toString()} over web words)`
    }
    return `Commissioned word count(${wordsLeft.toString()} below web words)`
}

export { getContentLengthCategory, getCommissionedLengthTitle };
