var ConnectAssets = require('connect-assets');
var STATIC_DIR = __dirname + '/../static';

ConnectAssets.cssCompilers.less.compress = (CONFIG.ENV === CONFIG.DOMAINS.PROD);

module.exports = ConnectAssets({
    src : STATIC_DIR,
    buildDir : false,
    build : (CONFIG.ENV === CONFIG.DOMAINS.PROD),
    minifyBuilds : (CONFIG.ENV === CONFIG.DOMAINS.PROD)
});
