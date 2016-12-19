/**
 * Configure CAS Authentication
 * When no cas_server_url presented, no CAS authentication applied.
 */


exports.configureCas = function (app, config) {

    if (!config.enable_cas_auth) {
        console.log('Warning: No CAS authentication presented');
        return;
    } else {
        console.log('Info: CAS Authentication applied');
    }

    app.use(function (req, res, next) {

        //if (req.url) {
        //    console.log('req.url', req.url);
        //console.log("req.url.indexOf", req.url.indexOf('/auth/cas/login'))
        //
        //console.log("session_username:", req.session.cas_user_name)

        if (req.url.indexOf('/auth/cas/login') === 0 || req.session.cas_user_name) {
            //console.log('ws come here req.session');
            return next();
        } else {

            //req.session.oldurl = req.url;
            var url =req.url;

            if (url.split('/').length > 2) {
                req.session.oldurl = req.url;
            }else {
                req.session.oldurl = req.url+'/';
            }

            console.log("req.session.oldurl:", req.session.oldurl);
            //console.log('req.session.oldurl', req.session.oldurl);
            //res.cookie('oldurl', req.url, {
            //    expires: new Date(Date.now() + 900000),
            //    httpOnly: true
            //});
            res.redirect('/auth/cas/login');
        }
        //}

    });

    config.cas_server_url = config.cas_server_url.replace(/\s+$/, '');

    app.get('/auth/cas/login', function (req, res) {
       // console.log('ws come here /auth/cas/login');
        var service_url = req.protocol + "://" + req.get('host') + req.url;

        var CAS = require('./cas');
        var cas = new CAS({base_url: config.cas_server_url, service: service_url});

        var cas_login_url = config.cas_server_url + "/login?service=" + service_url;
        console.log('cas_login_url', cas_login_url);
        var ticket = req.param('ticket');
        if (ticket) {
            cas.validate(ticket, function (err, status, username) {
                if (err || !status) {
                    // Handle the error
                    res.send(
                        "You may have logged in with invalid CAS ticket or permission denied.<br>" +
                        "<a href='" + cas_login_url + "'>Try again</a>"
                    );
                } else {
                    // Log the user in
                    //console.log('username', username);
                    if (username) {
                        req.session.cas_user_name = username['cas:username'][0];
                        req.session.cas_user_email = username['cas:email'][0];
                        req.session.cas_user_userId = username['cas:userId'][0];
                        req.session.cas_user_mobile = username['cas:mobile'][0];
                        req.session.cas_user_loginName = username['cas:loginName'][0];

                        //res.cookie('cas_user_name', username['cas:username'][0], {
                        //    expires: new Date(Date.now() + 900000),
                        //    httpOnly: true
                        //});
                        //res.cookie('cas_user_email', username['cas:email'][0], {
                        //    expires: new Date(Date.now() + 900000),
                        //    httpOnly: true
                        //});
                        //res.cookie('cas_user_userId', username['cas:userId'][0], {
                        //    expires: new Date(Date.now() + 900000),
                        //    httpOnly: true
                        //});
                        //res.cookie('cas_user_mobile', username['cas:mobile'][0], {
                        //    expires: new Date(Date.now() + 900000),
                        //    httpOnly: true
                        //});
                        //res.cookie('cas_user_loginName', username['cas:loginName'][0], {
                        //    expires: new Date(Date.now() + 900000),
                        //    httpOnly: true
                        //});

                    }
                    //console.log('res.cookiein', res.cookie);
                    //res.redirect("/auth/cas/login");
                    //console.log('req.session.oldurl', req.session.oldurl);
                    //console.log('req.cookie.oldurl', req.cookies);


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

};
