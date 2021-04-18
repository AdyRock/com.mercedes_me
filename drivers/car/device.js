'use strict';

const Homey = require('homey');
const { OAuth2Device } = require('homey-oauth2app');

module.exports = class MyBrandDevice extends OAuth2Device
{

    async onOAuth2Init()
    {
        this.onDevicePoll = this.onDevicePoll.bind(this);
        this.onDevicePoll();
    }

    async onDevicePoll()
    {
        await this.updateValues();
        this.timerPollID = this.homey.setTimeout(this.onDevicePoll, (10000));
    }

    async updateValues()
    {
        let dd = this.getData();
        let vehicleId = dd.id;

        if (!this.lastDetectionTime1 || (Date.now() - this.lastDetectionTime1 > (1000 * 60 * (60 / 50))))
        {
            try
            {
                const vs = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/vehiclestatus`); // 50 calls per hour
                if (vs)
                {
                    for (const iterator of vs)
                    {
                        console.log(iterator);
                        const key = Object.keys(iterator)[0];
                        try
                        {
                            const value = iterator[key].value;
                            let stringPrefix = key.toLowerCase();
                            stringPrefix = stringPrefix.replace('front', '');
                            stringPrefix = stringPrefix.replace('rear', '');
                            stringPrefix = stringPrefix.replace('left', '');
                            stringPrefix = stringPrefix.replace('right', '');
                            const stringValue = `${stringPrefix}.${value}`;
                            await this.setCapabilityValue(key, this.homey.__(stringValue));
                        }
                        catch (err)
                        {
                            console.log(err);
                        }
                    }
                }
            }
            catch (err)
            {
                console.log(err);
            }

            try
            {
                const vl = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/vehiclelockstatus`); // 50 calls per hour
                if (vl)
                {
                    for (const iterator of vl)
                    {
                        console.log(iterator);
                        const key = Object.keys(iterator)[0];
                        try
                        {
                            const value = iterator[key].value;
                            let stringPrefix = key.toLowerCase();
                            const stringValue = `${stringPrefix}.${value}`;
                            await this.setCapabilityValue(key, this.homey.__(stringValue));
                        }
                        catch (err)
                        {
                            console.log(err);
                        }
                    }
                }
            }
            catch (err)
            {
                console.log(err);
            }

            this.lastDetectionTime1 = Date.now();
        }

        if (!this.lastDetectionTime2 || (Date.now() - this.lastDetectionTime2 > (1000 * 60 * 60)))
        {
            try
            {
                const fs = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/fuelstatus`); // 1 calls per hour
                // const os = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/payasyoudrive`); // 1 calls per hour
                // const ev = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/electricvehicle`); // 2 calls per hour

                if (fs)
                {
                    for (const iterator of fs)
                    {
                        console.log(iterator);
                        const key = Object.keys(iterator)[0];
                        try
                        {
                            const value = iterator[key].value;
                            await this.setCapabilityValue(key, parseInt(value));
                        }
                        catch (err)
                        {
                            console.log(err);
                        }
                    }
                }
            }
            catch (err)
            {
                console.log(err);
            }

            this.lastDetectionTime2 = Date.now();
        }
    }

    async onOAuth2Deleted()
    {
        // Clean up here
    }
};