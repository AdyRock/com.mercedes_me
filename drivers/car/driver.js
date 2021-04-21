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
        let wateringCondition = this.homey.flow.getConditionCard('is_locked');
        wateringCondition.registerRunListener(async (args, state) =>
        {
            const lock_state = args.device.getCapabilityValue('doorlockstatusvehicle');
            return ((lock_state === this.homey.__('doorlockstatusvehicle.1')) || (lock_state === this.homey.__('doorlockstatusvehicle.2'))); // true or false
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
