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
