var FileSystem = require('fs');

var states = {
    OPEN : 'open',
    CLOSED : 'closed',
    ERROR : 'error'
};

var eventNames = {
    BufEnter : 'BufEnter',
    BufLeave : 'BufLeave',
    VimEnter : 'VimEnter',
    VimLeave : 'VimLeave'
};

var isWhitelisted = function(member, whitelist) {
    if (_.isUndefined(whitelist)) {
        return true;
    } else {
        return _.indexOf(whitelist, member) >= 0;
    }
};

var isBlacklisted = function(member, blacklist) {
    if (_.isUndefined(blacklist)) {
        return false;
    } else {
        return _.indexOf(blacklist, member) >= 0;
    }
};

var getStartTimestamp = function(division) {
};

var getEndTimestamp = function(division) {
};

var readVimLog = function(pathToLogFile, options, callback) {

    switch (arguments.length) {
        case 1:
            console.log('Only path to log file provided, using no options and no callback');
            options = {};
            callback = function() {};
            break;
        case 2:
            console.log('Assuming that arguments only include path to log file and callback function (no options)');
            callback = options;
            options = {};
            break;
        default:
            console.log('Assuming that arguments include path to log file, options, and callback function');
            // Nothing.
    }

    console.log('Called readVimLog for', pathToLogFile);
    var filenames = {};
    var logLineRegExp = /^(\d+)\s+([A-Z].+PDT)\s+([a-zA-Z]+)\s+([^\s].*)/;
    var emptyLineRegExp = /^$/;
    var matches = [];
    FileSystem.readFile(pathToLogFile, function(error, data) {
        if (error) {
            callback(error);
        }

        logfile = data.toString();
        logfile.split('\n').forEach(function(line) {

            if (emptyLineRegExp.test(line)) {
                return;
            }

            matches = line.match(logLineRegExp);
            if (matches && matches.length == 5) {
                var timestamp = matches[1];
                var humanDate = matches[2];
                var eventName = matches[3];
                var filename = matches[4];

                if (!isWhitelisted(filename, options.whitelist)) {
                    // console.log('Filename ' + filename + ' is not whitelisted; ignoring');
                    return;
                }

                if (isBlacklisted(filename, options.blacklist)) {
                    // console.log('Filename ' + filename + ' is blacklisted; ignoring');
                    return;
                }

                if (_.isUndefined(filenames[filename])) {
                    filenames[filename] = {};
                    filenames[filename].count = 0;
                    filenames[filename].state = 'closed';
                    filenames[filename].filename = filename;
                    filenames[filename].lastTouched = {};
                    filenames[filename].duration = {};
                }

                filenames[filename].count += 1;

                switch (filenames[filename].state) {
                    case states.CLOSED:
                        if (eventName === eventNames.VimEnter) {
                            filenames[filename].state = states.OPEN;
                            filenames[filename].lastTouched.seconds = timestamp;
                            filenames[filename].lastTouched.human = humanDate;
                        } else if (eventName === eventNames.BufEnter) {
                            filenames[filename].state = states.OPEN;
                            filenames[filename].lastTouched.seconds = timestamp;
                            filenames[filename].lastTouched.human = humanDate;
                        } else if (eventName === eventNames.VimLeave) {
                            // Nothing.
                        } else if (eventName === eventNames.BufLeave) {
                            // Nothing.
                        } else {
                            callback(new Error('Unknown event name ' + eventName + ' in state ' + states.CLOSED));
                        }
                        break;

                    case states.OPEN:
                        if (eventName === eventNames.VimEnter) {
                            // Nothing.
                        } else if (eventName === eventNames.BufEnter) {
                            // Nothing.
                        } else if (eventName === eventNames.VimLeave) {
                            filenames[filename].state = states.CLOSED;
                            var seconds = timestamp - filenames[filename].lastTouched.seconds;
                            filenames[filename].duration.seconds = seconds;
                            filenames[filename].duration.human = moment.duration(seconds, 'seconds').humanize();
                        } else if (eventName === eventNames.BufLeave) {
                            filenames[filename].state = states.CLOSED;
                            var seconds = timestamp - filenames[filename].lastTouched.seconds;
                            filenames[filename].duration.seconds = seconds;
                            filenames[filename].duration.human = moment.duration(seconds, 'seconds').humanize();
                        } else {
                            callback(new Error('Unknown event name ' + eventName + ' in state ' + states.CLOSED));
                        }
                        break;

                    case states.ERROR:
                        break;
                }

            } else {
                console.error('Failed to process', line);
            }
        });

        var sortedFilenames = [];
        _.keys(filenames).forEach(function(key) {
            sortedFilenames.push(filenames[key]);
        });

        sortedFilenames = _.sortBy(sortedFilenames, function(item) {
            return -1 * item.duration.seconds;
        });

        console.log('Making callback with sorted filenames');
        // Make callback with null error parameter
        callback(null, sortedFilenames);
    });
};

module.exports = {
    readVimLog : readVimLog
};
