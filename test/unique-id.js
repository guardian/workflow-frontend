var uniqueId = process.env.BUILD_NUMBER || ('DEV-' + process.env.USER);
module.exports = 'workflow-' + uniqueId;
