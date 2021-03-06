/**
 * Hosts the web server behind CASv2 Authentication or Google OAuth2 Authentication
 * with nodejs and express.
 * License: MIT
 * Author: Chris Song.
 * Project: https://github.com/fakechris/cas-proxy
 */

var express = require('express');
var https = require('https');
var http = require('http');
var url = require('url');
var httpProxy = require('http-proxy');
//var setCookie = require('set-cookie');
//var cookie = require('cookie-parser');
var config = require('./config');
var cas_auth = require('./lib/cas-auth.js');

console.log('Server starting...');


run();
function run() {
    for (i in config.proxy_settings) {
        var subconfig = config.proxy_settings[i];
        run_one(config, subconfig);
    }
}

function run_one(config, subconfig) {
    var app = express();
    app.use(express.cookieParser());
    //config.cookie_scope_domain!===

    var sessionoption = {secret: config.cookie_secret};


    if (config.cookie_scope_domain && config.cookie_scope_domain.length > 0) {
        console.log("config.cookie_scope_domain",config.cookie_scope_domain)
        sessionoption.cookie = {domain: '.' + config.cookie_scope_domain};
    } else {
        console.log("COOKIE_SCOPE_DOMAIN NOT specified or zero value.")
    }
    app.use(express.session(sessionoption));

    // Authentication
    cas_auth.configureCas(app, config);
    console.log('ws come here 从cas_auth出来了');

    var proxy = httpProxy.createProxyServer({
        target: subconfig.proxy_url
    });

    var proxied_hostname = url.parse(subconfig.proxy_url).hostname;

    app.use(function (req, res, next) {
        console.log('ws come here 进入use');
        // modify req host header
        //console.log('cas_user_name',req.session.cas_user_name);
        //res.cookie('resc', '设置到cookie里的值', { expires: new Date(Date.now() + 900000), httpOnly: true });
        //console.log('cas_session:',req.session);
        isReplaceHostname = (subconfig.replaceHostname === undefined) ? (config.replaceHostname || false) : subconfig.replaceHostname
        if (isReplaceHostname) {
            req['headers'].host = proxied_hostname;
        }
        //console.log('req.cookieout',req.cookies);
        req['headers'].http_x_forwarded_for = req.connection.remoteAddress;
        req['headers'].http_x_proxy_cas_username = req.session.cas_user_name;
        req['headers'].http_x_proxy_cas_email = req.session.cas_user_email
        req['headers'].http_x_proxy_cas_userid = req.session.cas_user_userId
        req['headers'].http_x_proxy_cas_mobile = req.session.cas_user_mobile
        req['headers'].http_x_proxy_cas_loginname = req.session.cas_user_loginName


        proxy.web(req, res, {target: subconfig.proxy_url}, function (e) {
            console.log('error ' + e);
        });

        proxyServer.on('upgrade', function (req, socket, head) {
            console.log('ws come here 进入proxyServer');
            proxy.ws(req, socket, head);
        });
    });


    if (subconfig.enable_ssl_port === true) {
        var options = {
            key: fs.readFileSync(subconfig.ssl_key_file),
            cert: fs.readFileSync(subconfig.ssl_cert_file),
        };
        https.createServer(options, app).listen(subconfig.listen_port_ssl);
        console.log('Server listening on ' + subconfig.listen_port_ssl + '(SSL)');
    }
    var proxyServer = http.createServer(app).listen(subconfig.listen_port);
    console.log('Server listening on ' + subconfig.listen_port + ' -> ' + subconfig.proxy_url);
}
