global._ = require('underscore');
global.sprintf = require('sprintf').sprintf;
global.request = require('request');
global.moment = require('moment');
global.CONFIG = require(__dirname + '/config');

var FileSystem = require('fs');
var HTTP = require('http');
var HTTPS = require('https');
var Assets = require(__dirname + '/middleware/assets');
var Express = require('express');
var VimLogProcessor = require(__dirname + '/api/vim-log-processor');

var app = Express();

// View Configuration
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// Middleware
var STATIC_DIR = __dirname + '/static';
app.use(Express.static(STATIC_DIR));
app.use(Express.bodyParser());
app.use(Express.cookieParser());
app.use(Assets);

HTTP.createServer(app).listen(4400);
console.log('Starting server on port 4400');

app.get('/api/:division?', function(req, res) {

    var options = {};
    if (req.query.whitelist) {
        options.whitelist = req.query.whitelist.split(';');
    }
    if (req.query.blacklist) {
        options.blacklist = req.query.blacklist.split(';');
    }

    options.division = req.params.division;

    console.log('Processing log file with options:', options);
    VimLogProcessor.readVimLog('/tmp/vimlog.log', options, function(error, data) {
        if (error) {
            throw error;
            return;
        }
        res.json(data);
    });
});

app.get('/favicon.ico', function(req, res) {
    res.send(404, 'Not found');
});

app.get('/:division?', function(req, res) {

    var division = req.params.division || "";
    var options = {
        url : 'http://localhost:4400/api/' + division, 
        qs : {
            blacklist : ['NO_FILE', 'NERD_tree_1', 'NERD_tree_2', 'NERD_tree_3'].join(';')
        },
        json : true
    };
    request(options, function(error, response, data) {
        if (error) {
            console.error(error.stack);
            res.json(400, error);
            return;
        }

        console.log("Rendering index");
        res.render('index', { eventlist : data });
    });
});
