module.exports =  {

    "enable_cas_auth": true,
    "cas_server_url": process.env.CAS_SERVER,

    "cookie_secret": "abcd12341234",

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

