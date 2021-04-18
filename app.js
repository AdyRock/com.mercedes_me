'use strict';
if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}

const Homey = require('homey');
const { OAuth2App } = require('homey-oauth2app');
const MercedesMeOAuth2Client = require('./lib/MercedesMeOAuth2Client');

module.exports = class MercedesMeApp extends OAuth2App
{
    static OAUTH2_CLIENT = MercedesMeOAuth2Client; // Default: OAuth2Client
    static OAUTH2_DEBUG = true; // Default: false
    static OAUTH2_MULTI_SESSION = false; // Default: false
//    static OAUTH2_DRIVERS = ['car']; // Default: all drivers

    xyz()
    {

    }

    async onInit()
    {
        await super.onInit();

        let ClientID = this.homey.settings.get('ClientID');
        let ClientSecret = this.homey.settings.get('ClientSecret');
        let vin = this.homey.settings.get('vin');

        if (ClientID && ClientSecret)
        {
            this.setOAuth2Config({'clientId': ClientID, 'clientSecret': ClientSecret});
            await this.onOAuth2Init();
        }
        else
        {
            this.homey.settings.set('ClientID', '');
            this.homey.settings.set('ClientSecret', '');
        }

        if (!vin)
        {
            this.homey.settings.set('vin', '');
        }
        
        this.homey.settings.set('logEnabled', true);

        if (process.env.DEBUG === '1')
        {
            this.homey.settings.set('debugMode', true);
        }
        else
        {
            this.homey.settings.set('debugMode', false);
        }

        this.homey.settings.on('set', async (key) =>
        {
            let updateConfig = false;
            if (key === 'ClientSecret')
            {
                ClientSecret = this.homey.settings.get('ClientSecret');
                updateConfig = true;
            }
            else if (key === 'ClientID')
            {
                ClientID = this.homey.settings.get('ClientID');
                updateConfig = true;
            }

            if (updateConfig)
            {
                this.setOAuth2Config({'clientId': ClientID, 'clientSecret': ClientSecret});
                await this.onOAuth2Init();
            }
        });
    }

    async onOAuth2Init()
    {
        // Do App logic here
    }
};