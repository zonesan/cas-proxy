module.exports =  {

    "enable_cas_auth": true,
    "cas_server_url": "http://10.1.235.245:14125/citic-uac",

    "cookie_secret": "REPLACE_WITH_A_RANDOM_STRING_PLEASE",

    replaceHostname: true,

    "rejectUnauthorized": false,

    proxy_settings : [
        {
            proxy_url: "http://127.0.0.1:8089",
            replaceHostname: false,
            "listen_port": 8090,
            "enable_ssl_port": false
        }
    ]
};
