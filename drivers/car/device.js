'use strict';

const Homey = require('homey');
const { OAuth2Device } = require('/lib/homey-oauth2app');

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
                this.homey.app.updateLog("VS:" + this.homey.app.varToString(vs));
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
                            stringPrefix = stringPrefix.replace('lamp', 'lights');
                            stringPrefix = stringPrefix.replace('reading', 'interior');
                            const stringValue = `${stringPrefix}.${value}`;
                            await this.setCapabilityValue(key, this.homey.__(stringValue));
                        }
                        catch (err)
                        {
                            this.homey.app.updateLog("VS Error: " + this.homey.app.varToString(err), 0);
                        }
                    }
                }
            }
            catch (err)
            {
                this.homey.app.updateLog("VS Error: " + this.homey.app.varToString(err), 0);
            }

            try
            {
                const vl = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/vehiclelockstatus`); // 50 calls per hour
                this.homey.app.updateLog("VL:" + this.homey.app.varToString(vl));
                if (vl)
                {
                    for (const iterator of vl)
                    {
                        console.log(iterator);
                        const key = Object.keys(iterator)[0];
                        try
                        {
                            const value = iterator[key].value;
                            if (key === "positionHeading")
                            {
                                await this.setCapabilityValue(key, Number(value));
                            }
                            else
                            {
                                const value = iterator[key].value;
                                let stringPrefix = key.toLowerCase();
                                const stringValue = `${stringPrefix}.${value}`;
                                const oldValue = this.getCapabilityValue(key);
                                const newValue = this.homey.__(stringValue);
                                await this.setCapabilityValue(key, newValue);
                                this.driver.checkTrigger(this, key, oldValue, newValue);
                            }
                        }
                        catch (err)
                        {
                            this.homey.app.updateLog("VL Error: " + this.homey.app.varToString(err), 0);
                        }
                    }
                }
            }
            catch (err)
            {
                this.homey.app.updateLog("VL Error: " + this.homey.app.varToString(err), 0);
            }

            this.lastDetectionTime1 = Date.now();
        }

        if (!this.lastDetectionTime2 || (Date.now() - this.lastDetectionTime2 > (1000 * 60 * 60)))
        {
            try
            {
                const fs = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/fuelstatus`); // 1 calls per hour
                this.homey.app.updateLog("FS:" + this.homey.app.varToString(fs));

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
                            this.homey.app.updateLog("FS Error: " + this.homey.app.varToString(err), 0);
                        }
                    }
                }
            }
            catch (err)
            {
                this.homey.app.updateLog("FS Error: " + this.homey.app.varToString(err), 0);
            }

            try
            {
                const os = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/payasyoudrive`); // 1 calls per hour
                this.homey.app.updateLog("VS:" + this.homey.app.varToString(os));

                if (os)
                {
                    for (const iterator of os)
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
                            this.homey.app.updateLog("OS Error: " + this.homey.app.varToString(err), 0);
                        }
                    }
                }
            }
            catch (err)
            {
                this.homey.app.updateLog("OS Error: " + this.homey.app.varToString(err), 0);
            }

            try
            {
                const ev = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/electricvehicle`); // 2 calls per hour
                this.homey.app.updateLog("VS:" + this.homey.app.varToString(ev));

                if (ev)
                {
                    for (const iterator of ev)
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
                            this.homey.app.updateLog("EV Error: " + this.homey.app.varToString(err), 0);
                        }
                    }
                }
            }
            catch (err)
            {
                this.homey.app.updateLog("EV Error: " + this.homey.app.varToString(err), 0);
            }

            this.lastDetectionTime2 = Date.now();
        }
    }

    async onOAuth2Deleted()
    {
        // Clean up here
        this.homey.clearTimeout( this.timerPollID );
    }

};