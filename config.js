module.exports =  {

    "enable_cas_auth": true,
    "cas_server_url": process.env.CAS_SERVER,

    "cookie_scope_domain": process.env.COOKIE_SCOPE_DOMAIN,

    "cookie_secret": "'GC~[YW'K46NT'dhs>3'/1UKP=Vy>RBv?Rw5LOA[@9~93(E;23Q",

    replaceHostname: true,

    "rejectUnauthorized": false,

    proxy_settings : [
        {
            proxy_url: process.env.PROXY_URL,
            replaceHostname: false,
            "listen_port": process.env.PROXY_PORT,
            "enable_ssl_port": false
        }
    ]
};

