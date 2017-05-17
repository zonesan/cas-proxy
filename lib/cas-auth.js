/**
 * Configure CAS Authentication
 * When no cas_server_url presented, no CAS authentication applied.
 */
var httpProxy = require('http-proxy');
var xml = require('xml2js');
var express = require('express');
var bodyParser = require('body-parser');
var sessionStore = require('express-session');


exports.configureCas = function (app, config) {

    if (!config.enable_cas_auth) {
        console.log('Warning: No CAS authentication presented');
        return;
    } else {
        console.log('Info: CAS Authentication applied');
    }

    app.use(function (req, res, next) {
        if (req.url) {
            if (req.url.indexOf('/auth/cas/login') === 0 || req.session.cas_user_name) {
                //console.log('ws come here req.session');
                return next();
            } else {
                req.session.oldurl = req.url;
                res.redirect('/auth/cas/login');
            }
        } else {
            req.session.oldurl = req.url;
            res.redirect('/auth/cas/login');
        }

    });

    config.cas_server_url = config.cas_server_url.replace(/\s+$/, '');

    app.get('/auth/cas/login', function (req, res) {
        // console.log('ws come here /auth/cas/login');
        var service_url = req.protocol + "://" + req.get('host') + req.url;

        var CAS = require('./cas');
        var cas = new CAS({ base_url: config.cas_server_url, service: service_url });

        var cas_login_url = config.cas_server_url + "/login?service=" + service_url;
        //console.log('cas_login_url', cas_login_url);
        var ticket = req.param('ticket');
        if (ticket) {
            cas.validate(ticket, function (err, status, username) {
                if (err || !status) {
                    console.log('cas validate error,', err, status);
                    res.send(
                        "You may have logged in with invalid CAS ticket or permission denied.<br>" +
                        "<a href='" + cas_login_url + "'>Try again</a>"
                    );
                } else {
                    if (username) {
                        req.session.cas_user_name = username['cas:username'][0];
                        req.session.cas_user_email = username['cas:email'][0];
                        req.session.cas_user_userId = username['cas:userId'][0];
                        req.session.cas_user_mobile = username['cas:mobile'][0];
                        req.session.cas_user_loginName = username['cas:loginName'][0];
                        req.session.cas_ticket = ticket;
                        console.log("user", req.session.cas_user_loginName, "login");
                    }
                    if (!req.session.oldurl) {
                        req.session.oldurl = "/auth/cas/login";
                    }
                    res.redirect(req.session.oldurl);

                }
            }, config.rejectUnauthorized);
        } else {
            if (!req.session.cas_user_name) {
                // console.log('cas_login_url', cas_login_url);
                res.redirect(cas_login_url);
            } else {
                //res.redirect("/auth/cas/login");
                res.redirect(req.session.oldurl);
            }
        }
    });

    var rawParser = bodyParser.urlencoded({ extended: false });

    app.post('/auth/cas/login', rawParser, function (req, res) {

        var logoutTicket = null;
        xml.parseString(req.body.logoutRequest, function (err, logoutRequestt) {
            if (!err) {
                if (logoutRequestt['samlp:LogoutRequest'] &&
                    logoutRequestt['samlp:LogoutRequest']['samlp:SessionIndex'] &&
                    logoutRequestt['samlp:LogoutRequest']['samlp:SessionIndex'].length) {
                    logoutTicket = logoutRequestt['samlp:LogoutRequest']['samlp:SessionIndex'][0];
                    console.log('logoutTicket:', logoutTicket);

                    req.sessionStore.all(function (err, sessions) {
                        if (err) {
                            console.log(err);
                        } else {
                            // console.log("sessions:", sessions);
                            for (var sid in sessions) {
                                if (sessions[sid].cas_ticket && sessions[sid].cas_ticket === logoutTicket) {
                                    console.log("user", sessions[sid].cas_user_loginName, "logout");
                                    req.sessionStore.destroy(sid, function (err) {
                                        if (err) {
                                            console.log("destroy session error:", err);
                                        }
                                    });
                                    break;
                                }
                            }
                            console.log("can't locate logoutTicket", logoutTicket, " in sessions.");
                        }
                    });
                } else {
                    console.log("can't parse logoutTicket Object.");
                }
            } else {
                console.log("xml parse logoutRequest error,", err);
            }
        });

        res.end();
    });

};
