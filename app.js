var FileSystem = require('fs');
var HTTP = require('http');
var HTTPS = require('https');
var Express = require('express');
var VimLogProcessor = require(__dirname + '/api/vim-log-processor');
global._ = require('underscore');
global.sprintf = require('sprintf').sprintf;
global.request = require('request');

var app = Express();

// View Configuration
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// Middleware
app.use(Express.static(__dirname + '/static'));
app.use(Express.bodyParser());
app.use(Express.cookieParser());

HTTP.createServer(app).listen(4400);
console.log('Starting server on port 4400');

app.get('/', function(req, res) {

    var options = {
        url : 'http://localhost:4400/api/weekly',
        qs : {
            blacklist : ['NO_FILE'].join(';')
        },
        json : true
    };
    request(options, function(error, response, data) {
        if (error) {
            console.error(error.stack);
            res.json(400, error);
            return;
        }

        res.render('index', { eventlist : data });
    });
});

app.get('/api/weekly', function(req, res) {

    var options = {};
    if (req.query.whitelist) {
        options.whitelist = req.query.whitelist.split(';');
    }
    if (req.query.blacklist) {
        options.blacklist = req.query.blacklist.split(';');
    }

    console.log('Processing log file with options:', options);
    VimLogProcessor.readVimLog('/tmp/vimlog.log', options, function(error, data) {
        if (error) {
            throw error;
            return;
        }
        res.json(data);
    });

});
