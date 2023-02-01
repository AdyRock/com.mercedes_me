'use strict';

const Homey = require('homey');
const { OAuth2Device } = require('/lib/homey-oauth2app');

module.exports = class MyBrandDevice extends OAuth2Device
{

    async onOAuth2Init()
    {
        if (!this.hasCapability('decklidstatus'))
        {
            this.addCapability('decklidstatus');
        }

        if (!this.hasCapability('locked'))
        {
            this.addCapability('locked');
            this.setClass('lock');
        }

        this.registerCapabilityListener('locked', this.onCapabilityLocked.bind(this));

        this.lastDetectionTime1 = this.getStoreValue('lastDetectionTime1');
        this.lastDetectionTime2 = this.getStoreValue('lastDetectionTime2');
        this.lastDetectionTime3 = this.getStoreValue('lastDetectionTime3');
        this.lastDetectionTime4 = this.getStoreValue('lastDetectionTime4');
        this.lastDetectionTime5 = this.getStoreValue('lastDetectionTime5');

        const settings = this.getSettings();
        if (!settings.vs_interval)
        {
            this.vs_interval_ms = 72 * 1000;
            this.vl_interval_ms = 72 * 1000;
            this.fs_interval_ms = 3600 * 1000;
            this.os_interval_ms = 3600 * 1000;
            this.ev_interval_ms = 120 * 1000;
        }
        else
        {
            this.vs_interval_ms = settings.vs_interval * 1000;
            this.vl_interval_ms = settings.vl_interval * 1000;
            this.fs_interval_ms = settings.fs_interval * 1000;
            this.os_interval_ms = settings.os_interval * 1000;
            this.ev_interval_ms = settings.ev_interval * 1000;
        }

        this.onDevicePoll = this.onDevicePoll.bind(this);
        this.onDevicePoll();
    }

    async onSettings({ oldSettings, newSettings, changedKeys })
    {
        if (changedKeys.indexOf("vs_interval") >= 0)
        {
            this.vs_interval_ms = newSettings.vs_interval * 1000;
        }
        if (changedKeys.indexOf("vl_interval") >= 0)
        {
            this.vl_interval_ms = newSettings.vl_interval * 1000;
        }
        if (changedKeys.indexOf("fs_interval") >= 0)
        {
            this.fs_interval_ms = newSettings.fs_interval * 1000;
        }
        if (changedKeys.indexOf("os_interval") >= 0)
        {
            this.os_interval_ms = newSettings.os_interval * 1000;
        }
        if (changedKeys.indexOf("ev_interval") >= 0)
        {
            this.ev_interval_ms = newSettings.ev_interval * 1000;
        }
    }

    async onCapabilityLocked(value, opts)
    {
        throw new Error("Not allowed to change the lock state");
    }

    async onDevicePoll()
    {
        this.homey.app.updateLog("Polling Data");
        
        await this.updateValues();
        // Check again in 10 seconds
        this.timerPollID = this.homey.setTimeout(this.onDevicePoll, (10000));
    }

    async updateValues()
    {
        let dd = this.getData();
        let vehicleId = dd.id;

        if (!this.lastDetectionTime1 || ((Date.now() - this.lastDetectionTime1) > this.vs_interval_ms))
        {
            try
            {
                this.homey.app.updateLog("Fetching VS");
                const vs = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/vehiclestatus`); // 50 calls per hour
                this.homey.app.updateLog("VS:" + this.homey.app.varToString(vs));
                if (vs)
                {
                    for (const iterator of vs)
                    {
                        //console.log(iterator);
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
                            const oldValue = this.getCapabilityValue(key);
                            const newValue = this.homey.__(stringValue);
                            await this.setCapabilityValue(key, this.homey.__(stringValue));
                            this.driver.checkTrigger(this, key, oldValue, newValue);
                        }
                        catch (err)
                        {
                            this.homey.app.updateLog("VS Error: " + this.homey.app.varToString(err), 0);
                        }
                    }
                }

                this.lastDetectionTime1 = Date.now();
                this.setStoreValue('lastDetectionTime1', this.lastDetectionTime1);
            }
            catch (err)
            {
                this.homey.app.updateLog("VS Error: " + this.homey.app.varToString(err), 0);
                if (err == 'Forbidden')
                {
                    this.lastDetectionTime1 = Date.now();
                    this.setStoreValue('lastDetectionTime1', this.lastDetectionTime1);
                }
            }
        }

        if (!this.lastDetectionTime5 || (Date.now() - this.lastDetectionTime5 > this.vl_interval_ms))
        {
            try
            {
                this.homey.app.updateLog("Fetching VL");
                const vl = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/vehiclelockstatus`); // 50 calls per hour
                this.homey.app.updateLog("VL:" + this.homey.app.varToString(vl));
                if (vl)
                {
                    this.unlocked = false;

                    for (const iterator of vl)
                    {
                        //console.log(iterator);
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
                                if ((key == 'doorlockstatusdecklid') || (key == 'doorlockstatusvehicle') || (key == 'doorlockstatusgas'))
                                {
                                    if ((value == 'true') || (value == '0') || (value == '3'))
                                    {
                                        this.unlocked = true;
                                    }
                                }
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

                    this.setCapabilityValue('locked', !this.unlocked);
                }

                this.lastDetectionTime5 = Date.now();
                this.setStoreValue('lastDetectionTime5', this.lastDetectionTime5);
            }
            catch (err)
            {
                this.homey.app.updateLog("VL Error: " + this.homey.app.varToString(err), 0);
                if (err == 'Forbidden')
                {
                    this.lastDetectionTime5 = Date.now();
                    this.setStoreValue('lastDetectionTime5', this.lastDetectionTime5);
                }
            }
        }
        else
        {
            this.homey.app.updateLog("VL: Limit 50/hour");
        }

        if (!this.lastDetectionTime2 || (Date.now() - this.lastDetectionTime2 > this.fs_interval_ms))
        {
            try
            {
                this.homey.app.updateLog("Fetching FS");
                const fs = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/fuelstatus`); // 1 calls per hour
                this.homey.app.updateLog("FS:" + this.homey.app.varToString(fs));

                if (fs)
                {
                    for (const iterator of fs)
                    {
                        //console.log(iterator);
                        const key = Object.keys(iterator)[0];
                        try
                        {
                            const value = iterator[key].value;
                            await this.setCapabilityValue(key, parseInt(value)).catch(this.error());
                        }
                        catch (err)
                        {
                            this.homey.app.updateLog("FS Error: " + this.homey.app.varToString(err), 0);
                        }
                    }
                }

                this.lastDetectionTime2 = Date.now();
                this.setStoreValue('lastDetectionTime2', this.lastDetectionTime2);
            }
            catch (err)
            {
                this.homey.app.updateLog("FS Error: " + this.homey.app.varToString(err), 0);
                if (err == 'Forbidden')
                {
                    this.lastDetectionTime2 = Date.now();
                    this.setStoreValue('lastDetectionTime2', this.lastDetectionTime2);
                }
            }
        }
        else
        {
            this.homey.app.updateLog("FS: Limit 1/hour");
        }

        if (!this.lastDetectionTime4 || (Date.now() - this.lastDetectionTime4 > this.os_interval_ms))
        {
            try
            {
                this.homey.app.updateLog("Fetching OS");
                const os = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/payasyoudrive`); // 1 calls per hour
                this.homey.app.updateLog("OS:" + this.homey.app.varToString(os));

                if (os)
                {
                    for (const iterator of os)
                    {
                        //console.log(iterator);
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

                this.lastDetectionTime4 = Date.now();
                this.setStoreValue('lastDetectionTime4', this.lastDetectionTime4);
            }
            catch (err)
            {
                this.homey.app.updateLog("OS Error: " + this.homey.app.varToString(err), 0);
                if (err == 'Forbidden')
                {
                    this.lastDetectionTime4 = Date.now();
                    this.setStoreValue('lastDetectionTime4', this.lastDetectionTime4);
                }
            }
        }
        else
        {
            this.homey.app.updateLog("OS: Limit 1/hour");
        }

        if (!this.lastDetectionTime3 || (Date.now() - this.lastDetectionTime3 > this.ev_interval_ms))
        {
            try
            {
                this.homey.app.updateLog("Fetching EV");
                const ev = await this.oAuth2Client.getThings(`vehicles/${vehicleId}/containers/electricvehicle`); // 30 calls per hour
                this.homey.app.updateLog("EV:" + this.homey.app.varToString(ev));

                if (ev)
                {
                    for (const iterator of ev)
                    {
                        //console.log(iterator);
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

                this.lastDetectionTime3 = Date.now();
                this.setStoreValue('lastDetectionTime3', this.lastDetectionTime3);
            }
            catch (err)
            {
                this.homey.app.updateLog("EV Error: " + this.homey.app.varToString(err), 0);
                if (err == 'Forbidden')
                {
                    this.lastDetectionTime3 = Date.now();
                    this.setStoreValue('lastDetectionTime3', this.lastDetectionTime3);
                }
            }
        }
        else
        {
            this.homey.app.updateLog("EV: Limit 30/hour");
        }
    }

    async onOAuth2Deleted()
    {
        // Clean up here
        this.homey.clearTimeout(this.timerPollID);
    }

};