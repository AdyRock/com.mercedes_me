'use strict';

const Homey = require('homey');
const { OAuth2Driver } = require('homey-oauth2app');

module.exports = class MercedesMeDriver extends OAuth2Driver
{

    async onOAuth2Init()
    {
        // Register Flow Cards etc.
    }

    async onPairListDevices({ oAuth2Client })
    {
        const things = await oAuth2Client.getThings();
        return things.map(thing =>
        {
            return {
                name: thing.name,
                data:
                {
                    id: thing.id,
                }
            };
        });
    }
};
