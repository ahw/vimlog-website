var FileSystem = require('fs');
var HTTP = require('http');
var HTTPS = require('https');
var Express = require('express');

global._ = require('underscore');
sprintf = require('sprintf').sprintf;

var app = Express();
HTTP.createServer(app).listen(4400);
console.log('Starting server on port 4400');

var helpers = {

    states : {
        OPEN : 'open',
        CLOSED : 'closed',
        ERROR : 'error'
    },

    eventNames : {
        BufEnter : 'BufEnter',
        BufLeave : 'BufLeave',
        VimEnter : 'VimEnter',
        VimLeave : 'VimLeave'
    }
};

app.get('/', function(req, res) {
    res.send('This is the root');
});

app.get('/api/weekly', function(req, res) {

    var filenames = {};
    var logLineRegExp = /^(\d+)\s+([A-Z].+PDT)\s+([a-zA-Z]+)\s+([^\s].*)/;
    var emptyLineRegExp = /^$/;
    var matches = [];
    FileSystem.readFile('/tmp/vimlog.log', function(error, data) {
        if (error) throw error;

        logfile = data.toString();
        logfile.split('\n').forEach(function(line) {

            if (!emptyLineRegExp.test(line)) {
                matches = line.match(logLineRegExp);
            
                if (matches && matches.length == 5) {
                    var timestamp = matches[1];
                    var formattedDate = matches[2];
                    var eventName = matches[3];
                    var filename = matches[4];

                    if (_.isUndefined(filenames[filename])) {
                        filenames[filename] = {};
                        filenames[filename].count = 0;
                        filenames[filename].state = 'closed';
                        filenames[filename].filename = filename;
                        filenames[filename].lastTouched = {};
                        filenames[filename].timeElapsed = -1;
                    }

                    filenames[filename].count += 1;

                    switch (filenames[filename].state) {
                        case helpers.states.CLOSED:
                            if (eventName === helpers.eventNames.VimEnter) {
                                filenames[filename].state = helpers.states.OPEN;
                                filenames[filename].lastTouched.seconds = timestamp;
                                filenames[filename].lastTouched.formatted = formattedDate;
                            } else if (eventName === helpers.eventNames.BufEnter) {
                                filenames[filename].state = helpers.states.OPEN;
                                filenames[filename].lastTouched.seconds = timestamp;
                                filenames[filename].lastTouched.formatted = formattedDate;
                            } else if (eventName === helpers.eventNames.VimLeave) {
                                // Nothing.
                            } else if (eventName === helpers.eventNames.BufLeave) {
                                // Nothing.
                            } else {
                                throw new Error('Unknown event name ' + eventName + ' in state ' + helpers.states.CLOSED);
                            }
                            break;

                        case helpers.states.OPEN:
                            if (eventName === helpers.eventNames.VimEnter) {
                                // Nothing.
                            } else if (eventName === helpers.eventNames.BufEnter) {
                                // Nothing.
                            } else if (eventName === helpers.eventNames.VimLeave) {
                                filenames[filename].state = helpers.states.CLOSED;
                                var elapsedTime = timestamp - filenames[filename].lastTouched.seconds;
                                filenames[filename].timeElapsed = elapsedTime;
                            } else if (eventName === helpers.eventNames.BufLeave) {
                                filenames[filename].state = helpers.states.CLOSED;
                                var elapsedTime = timestamp - filenames[filename].lastTouched.seconds;
                                filenames[filename].timeElapsed = elapsedTime;
                            } else {
                                throw new Error('Unkonwn event name ' + eventName + ' in state ' + helpers.states.CLOSED);
                            }
                            break;

                        case helpers.states.ERROR:
                            break;
                    }

                } else {
                    console.error('Failed to process', line);
                }
            }
        });

        var sortedFilenames = [];
        _.keys(filenames).forEach(function(key) {
            sortedFilenames.push(filenames[key]);
        });

        sortedFilenames = _.sortBy(sortedFilenames, function(item) {
            return -1 * item.timeElapsed;
        });

        res.json(sortedFilenames);
    });
});
