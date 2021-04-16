'use strict';

const Homey = require('homey');
const { OAuth2Device } = require('homey-oauth2app');

module.exports = class MyBrandDevice extends OAuth2Device
{

    async onOAuth2Init()
    {
        await this.oAuth2Client.getThingState()
            .then(async state =>
            {
                await this.setCapabilityValue('onoff', !!state.on);
            });
    }

    async onOAuth2Deleted()
    {
        // Clean up here
    }
};