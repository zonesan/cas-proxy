/**
 * Configure CAS Authentication
 * When no cas_server_url presented, no CAS authentication applied.
 */


exports.configureCas = function(app, config) {

  if (!config.enable_cas_auth) {
    console.log('Warning: No CAS authentication presented');
    return;
  } else {
    console.log('Info: CAS Authentication applied');
  }

  app.use(function(req, res, next) {
    if (req.url.indexOf('/auth/cas/login') === 0 || req.session.cas_user_name) {
        return next();
    } else {
      //console.log("testtesttt:",req.url);
      req.session.oldurl=req.url;
      res.redirect('/auth/cas/login');
    }
  });

  config.cas_server_url = config.cas_server_url.replace(/\s+$/,'');

  app.get('/auth/cas/login', function (req, res) {
    var service_url  = req.protocol + "://" + req.get('host') + req.url;

    var CAS = require('./cas');
    var cas = new CAS({base_url: config.cas_server_url, service: service_url});

    var cas_login_url = config.cas_server_url + "/login?service=" + service_url;
     // console.log('cas_login_url', cas_login_url);
      var ticket = req.param('ticket');
    if (ticket) {
      cas.validate(ticket, function(err, status, username) {
        if (err || !status) {
          // Handle the error
          res.send(
            "You may have logged in with invalid CAS ticket or permission denied.<br>" +
              "<a href='" + cas_login_url + "'>Try again</a>"
          );
        } else {
          // Log the user in

    if(username){
          req.session.cas_user_name = username['cas:username'][0];
          req.session.cas_user_email = username['cas:email'][0];
          req.session.cas_user_userId = username['cas:userId'][0];
          req.session.cas_user_mobile = username['cas:mobile'][0];
          req.session.cas_user_loginName = username['cas:loginName'][0];
        }
        //res.redirect("/auth/cas/login");
        res.redirect(req.session.oldurl);
        }
      }, config.rejectUnauthorized);
    } else {
      if (!req.session.cas_user_name) {
          //console.log('cas_login_url2', cas_login_url);
        res.redirect(cas_login_url);
      } else {
        //res.redirect("/auth/cas/login");
        res.redirect(req.session.oldurl);
      }
    }
  });

};
