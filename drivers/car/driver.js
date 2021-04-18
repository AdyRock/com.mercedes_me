'use strict';

const Homey = require('homey');
const { OAuth2Driver } = require('/lib/homey-oauth2app');

module.exports = class MercedesMeDriver extends OAuth2Driver
{

    async onOAuth2Init()
    {
        // Register Flow Cards etc.
    }

    async onPairListDevices({ oAuth2Client })
    {
        let vehicleId = this.homey.settings.get('vin');
        const things = await oAuth2Client.getThings(`/vehicles/${vehicleId}/containers/payasyoudrive/`);
        return [{
            name: 'My Car',
            data:
            {
                id: vehicleId,
            }
        }];
    }
};
