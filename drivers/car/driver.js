'use strict';

const Homey = require('homey');
const { OAuth2Driver } = require('/lib/homey-oauth2app');

module.exports = class MercedesMeDriver extends OAuth2Driver
{

    async onOAuth2Init()
    {
        // Register Trigger Flow Cards.
        this.vehicleIsLocked = this.homey.flow.getDeviceTriggerCard('vehicle_locked');
        this.vehicleIsUnlocked = this.homey.flow.getDeviceTriggerCard('vehicle_unlocked');

        this.doorOpened = this.homey.flow.getDeviceTriggerCard('door_opened');
        this.doorClosed = this.homey.flow.getDeviceTriggerCard('door_closed');

        this.windowOpened = this.homey.flow.getDeviceTriggerCard('window_opened');
        this.windowClosed = this.homey.flow.getDeviceTriggerCard('window_closed');

        this.socGreater = this.homey.flow.getDeviceTriggerCard('soc_is_greater');
        this.socGreater.registerRunListener(async (args, state) =>
        {
            const soc = args.device.getCapabilityValue('soc');
            return ((soc > args.soc)); // true or false
        });

        this.socLess = this.homey.flow.getDeviceTriggerCard('soc_is_less');
        this.socLess.registerRunListener(async (args, state) =>
        {
            const soc = args.device.getCapabilityValue('soc');
            return ((soc < args.soc)); // true or false
        });

        this.tanklevelpercentGreater = this.homey.flow.getDeviceTriggerCard('tanklevelpercent_is_greater');
        this.tanklevelpercentGreater.registerRunListener(async (args, state) =>
        {
            const tanklevel = args.device.getCapabilityValue('tanklevelpercent');
            return ((tanklevel > args.tanklevelpercent)); // true or false
        });

        this.tanklevelpercentLess = this.homey.flow.getDeviceTriggerCard('tanklevelpercent_is_less');
        this.tanklevelpercentLess.registerRunListener(async (args, state) =>
        {
            const tanklevel = args.device.getCapabilityValue('tanklevelpercent');
            return ((tanklevel < args.tanklevelpercent)); // true or false
        });

        // Register Condition Flow Cards.
        let isLockedCondition = this.homey.flow.getConditionCard('is_locked');
        isLockedCondition.registerRunListener(async (args, state) =>
        {
            const lock_state = args.device.getCapabilityValue('doorlockstatusvehicle');
            return ((lock_state === this.homey.__('doorlockstatusvehicle.1')) || (lock_state === this.homey.__('doorlockstatusvehicle.2'))); // true or false
        });

        // Register Condition Flow Cards.
        let isOpenCondition = this.homey.flow.getConditionCard('is_open');
        isOpenCondition.registerRunListener(async (args, state) =>
        {
            const sunroof_state = args.device.getCapabilityValue('sunroofstatus');
            const window1_state = args.device.getCapabilityValue('windowstatusfrontleft');
            const window2_state = args.device.getCapabilityValue('windowstatusfrontright');
            const window3_state = args.device.getCapabilityValue('windowstatusrearleft');
            const window4_state = args.device.getCapabilityValue('windowstatusrearright');

            return ((sunroof_state !== this.homey.__('sunroofstatus.0')) || // Check for not closed
                (window1_state !== this.homey.__('windowstatus.2')) ||
                (window2_state !== this.homey.__('windowstatus.2')) ||
                (window3_state !== this.homey.__('windowstatus.2')) ||
                (window4_state !== this.homey.__('windowstatus.2'))); // Return true if anything is not closed
        });

        let isDoorOpenCondition = this.homey.flow.getConditionCard('is_door_open');
        isDoorOpenCondition.registerRunListener(async (args, state) =>
        {
            const decklid_state = args.device.getCapabilityValue('decklidstatus');
            const door1_state = args.device.getCapabilityValue('doorstatusfrontleft');
            const door2_state = args.device.getCapabilityValue('doorstatusfrontright');
            const door3_state = args.device.getCapabilityValue('doorstatusrearleft');
            const door4_state = args.device.getCapabilityValue('doorstatusrearright');

            return ((decklid_state !== this.homey.__('decklidstatus.false')) || // Check for not closed
                (door1_state !== this.homey.__('doorstatus.false')) ||
                (door2_state !== this.homey.__('doorstatus.false')) ||
                (door3_state !== this.homey.__('doorstatus.false')) ||
                (door4_state !== this.homey.__('doorstatus.false'))); // Return true if anything is not closed
        });
    }

    checkTrigger(device, key, oldValue, newValue)
    {
        if ((key === 'doorlockstatusvehicle') && (oldValue !== newValue))
        {
            if ((newValue === this.homey.__('doorlockstatusvehicle.0')) || (newValue === this.homey.__('doorlockstatusvehicle.3')))
            {
                this.vehicleIsUnlocked.trigger(device);
            }
            else
            {
                this.vehicleIsLocked.trigger(device);
            }
        }
        else if (((key === 'decklidstatus') || (key === 'doorstatusfrontleft') || (key === 'doorstatusfrontright') || (key === 'doorstatusrearleft') || (key === 'doorstatusrearright')) && (oldValue !== newValue))
        {
            const tokens = {
                door: key
            };
            if (newValue)
            {
                this.doorOpened.trigger(device, tokens);
            }
            else
            {
                this.doorClosed.trigger(device, tokens);
            }
        }
        else if (((key === 'sunroofstatus') || (key === 'windowstatusfrontleft') || (key === 'windowstatusfrontright') || (key === 'windowstatusrearleft') || (key === 'windowstatusrearright')) && (oldValue !== newValue))
        {
            const tokens = {
                window: key
            };
            if (newValue)
            {
                this.windowOpened.trigger(device, tokens);
            }
            else
            {
                this.windowClosed.trigger(device, tokens);
            }
        }
    }

    async onPairListDevices({ oAuth2Client })
    {
        let vehicleId = this.homey.settings.get('vin');
        this.homey.app.updateLog('OnPairListDevices: ' + (vehicleId ? "VIN Detected" : "Missing VIN"));
        if (!vehicleId)
        {
            throw new Error('Missing VIN. Please enter your VIN in the Configure app page.')
        }
        
        try
        {
            if (process.env.DEBUG === '0')
            {
                const things = await oAuth2Client.getThings(`vehicles/${vehicleId}/containers/payasyoudrive`);
            }
            return [
            {
                name: 'My Car',
                data:
                {
                    id: vehicleId,
                }
            }];
        }
        catch (err)
        {
            this.homey.app.updateLog(`Get devices error: ${this.homey.app.varToString(err)}`, 0);
            if (err.message == 'Forbidden')
            {
                throw new Error('Forbidden: Check the VIN number is entered correctly');
            }
            throw(err);
        }
    }

    async onPair(session)
    {
        let clientId = this.homey.settings.get('ClientID');
        let clientSecret = this.homey.settings.get('ClientSecret');
        let vin =  this.homey.settings.get('vin');

        session.setHandler('connection_setup', async () =>
        {
            // Initialise page with last used token and user name
            return { clientId, clientSecret, vin };
        });

        session.setHandler('api_save', async data =>
        {
            if (!data.clientId)
            {
                return { ok: false, err: this.homey.__('settings.missingClientId') };
            }
            if (!data.clientSecret)
            {
                return { ok: false, err: this.homey.__('settings.missingClientSecret') };
            }

            if (!data.vin)
            {
                return { ok: false, err: this.homey.__('settings.missingVin') };
            }

            try
            {
                // Get the current apiKey using the username and password
                this.homey.app.setOAuth2Config({'clientId': data.clientId, 'clientSecret': data.clientSecret});
                await this.homey.app.onOAuth2Init();
            }
            catch (err)
            {
                return { ok: false, err: this.homey.__('pair.failed') };
            }

            // Successful connection so save the credentials
            this.homey.settings.set('ClientID', data.clientId);
            this.homey.settings.set('ClientSecret', data.clientSecret);
            this.homey.settings.set('vin', data.vin);

            super.onPair(session);

            return { ok: true };
        });
    }
};