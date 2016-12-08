/*!
 * node-casv2
 * Copyright(c) 2011 Chris Song <fakechris@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var http = require('http');
var https = require('https');
var url = require('url');
var xml = require('xml2js');

/**
 * Initialize CAS with the given `options`.
 *
 * @param {Object} options
 * @api public
 */
var CAS = function (options) {
    options = options || {};

    if (!options.base_url) {
        throw new Error('Required CAS option `base_url` missing.');
    }

    if (!options.service) {
        throw new Error('Required CAS option `service` missing.');
    }

    var cas_url = url.parse(options.base_url);

    this.zxurl = url.parse(options.base_url).protocol;

    //console.log('this.zxurl', this.zxurl);

    if (cas_url.protocol != 'http:' && cas_url.protocol != 'https:') {
        throw new Error('Only http CAS servers are supported.');
    } else if (!cas_url.hostname) {
        throw new Error('Option `base_url` must be a valid url like: http://example.com/cas');
    } else if(cas_url.protocol === 'http:'){
        this.hostname = cas_url.host;
        this.port = cas_url.port || 80;
        this.base_path = cas_url.pathname;
    } else if(cas_url.protocol === 'https:'){
        this.hostname = cas_url.host;
        this.port = cas_url.port || 443;
        this.base_path = cas_url.pathname;
    }


    this.service = options.service;
};

/**
 * Library version.
 */

CAS.version = '0.1.0';

/**
 * Attempt to validate a given ticket with the CAS server.
 * `callback` is called with (err, auth_status, username)
 *
 * @param {String} ticket
 * @param {Function} callback
 * @param {rejectUnauthorized} rejectUnauthorized
 * @api public
 */

CAS.prototype.validate = function (ticket, callback, rejectUnauthorized) {

    //console.log('ticket', ticket);
    //console.log('rejectUnauthorized',rejectUnauthorized);
    if (typeof rejectUnauthorized === 'undefined') {
        rejectUnauthorized = true;
    }
    if (this.zxurl === 'http:') {
        //if (typeof rejectUnauthorized === 'undefined') {
        //    rejectUnauthorized = true;
        //}
        var hostname = this.hostname;

        if (hostname.split(':').length > 1) {
            this.hostname = this.hostname.split(':')[0]
        }

        //console.log('CAS', this);
        var spath = url.format({
            pathname: this.base_path + '/serviceValidate',
            query: {ticket: ticket, service: this.service.split("?")[0]}
        })

        var req = http.get({
            host: this.hostname,
            port: this.port,
            //rejectUnauthorized: rejectUnauthorized,
            path: spath
        }, function (res) {
            // Handle server errors
            //'http'
            console.log('http');
            res.on('error', function (e) {
                callback(e);
            });

            // Read result
            res.setEncoding('utf8');
            var response = '';
            res.on('data', function (chunk) {
                response += chunk;
            });

            res.on('end', function () {
                //console.log('res', res);
                //console.log(response);
                xml.parseString(response, function (err, result) {
                    if (!err) {
                        if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
                            //console.log("cas_response:", result['cas:serviceResponse']['cas:authenticationSuccess'][0]);
                            //console.log("cas_response:",result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attributes'][0]);
                            // callback(undefined, true, result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0]);
                            callback(undefined, true, result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attributes'][0]);
                            return;
                        } else if (result['cas:serviceResponse']['cas:authenticationFailure']) {
                            callback(undefined, false);
                            return;
                        }
                    }
                });
                // Format was not correct, error
                //callback({message: 'Bad response format.'});
            });
        });


    } else if (this.zxurl === 'https:') {

        var spath = url.format({
            pathname: this.base_path + '/serviceValidate',
            query: {ticket: ticket, service: this.service.split("?")[0]}
        })

        console.log('host', this.hostname);
        console.log('port', this.port);
        console.log('rejectUnauthorized', rejectUnauthorized;
        console.log('path', spath);

        var req = https.get({
            host: this.hostname,
            port: this.port,
            rejectUnauthorized: rejectUnauthorized,
            path: spath
        }, function (res) {
            console.log('https');
            // Handle server errors
            res.on('error', function (e) {
                callback(e);
            });
            // Read result
            res.setEncoding('utf8');
            var response = '';
            res.on('data', function (chunk) {
                response += chunk;
            });

            res.on('end', function () {
                //console.log('response--------', response);
                xml.parseString(response, function (err, result) {
                    if (!err) {
                        if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
                            //console.log("cas_response:", result['cas:serviceResponse']['cas:authenticationSuccess'][0]);
                            //callback(undefined, true, result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0]);
                            callback(undefined, true, result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:attributes'][0]);
                            return;
                        } else if (result['cas:serviceResponse']['cas:authenticationFailure']) {
                            callback(undefined, false);
                            return;
                        }
                    }
                });

                // Format was not correct, error
                //callback({message: 'Bad response format.'});

            })

        })
    }
}
        module.exports = CAS;
