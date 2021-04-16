'use strict';
if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', false);
}

const Homey = require('homey');
const { OAuth2App } = require('homey-oauth2app');
const MercedesMeOAuth2Client = require('./lib/MercedesMeOAuth2Client');

module.exports = class MercedesMeApp extends OAuth2App
{
    static OAUTH2_CLIENT = MercedesMeOAuth2Client; // Default: OAuth2Client
    static OAUTH2_DEBUG = true; // Default: false
    static OAUTH2_MULTI_SESSION = false; // Default: false
    static OAUTH2_DRIVERS = ['car']; // Default: all drivers

    async onOAuth2Init()
    {
        // Do App logic here
    }
}