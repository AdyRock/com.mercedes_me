'use strict';
if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}
const nodemailer = require("nodemailer");

const Homey = require('homey');
const { OAuth2App } = require('/lib/homey-oauth2app');
const MercedesMeOAuth2Client = require('./lib/MercedesMeOAuth2Client');

module.exports = class MercedesMeApp extends OAuth2App
{
    static OAUTH2_CLIENT = MercedesMeOAuth2Client; // Default: OAuth2Client
    static OAUTH2_DEBUG = true; // Default: false
    static OAUTH2_MULTI_SESSION = false; // Default: false
//    static OAUTH2_DRIVERS = ['car']; // Default: all drivers

    async onInit()
    {
        try
        {
            await super.onInit();
        }
        catch(err)
        {
            this.error(err);
            console.log(err);
        }

        let ClientID = this.homey.settings.get('ClientID');
        let ClientSecret = this.homey.settings.get('ClientSecret');
        let vin = this.homey.settings.get('vin');
        this.diagLog = '';

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

            if (updateConfig && ClientID && ClientSecret)
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
    varToString(source)
    {
        try
        {
            if (source === null)
            {
                return "null";
            }
            if (source === undefined)
            {
                return "undefined";
            }
            if (source instanceof Error)
            {
                let stack = source.stack.replace('/\\n/g', '\n');
                return source.message + '\n' + stack;
            }
            if (typeof(source) === "object")
            {
                const getCircularReplacer = () =>
                {
                    const seen = new WeakSet();
                    return (key, value) =>
                    {
                        if (typeof value === "object" && value !== null)
                        {
                            if (seen.has(value))
                            {
                                return;
                            }
                            seen.add(value);
                        }
                        return value;
                    };
                };

                return JSON.stringify(source, getCircularReplacer(), 2);
            }
            if (typeof(source) === "string")
            {
                return source;
            }
        }
        catch (err)
        {
            this.error(err);
            this.log("VarToString Error: ", err);
        }

        return source.toString();
    }

    updateLog(newMessage, errorLevel = 1)
    {
        if ((errorLevel == 0) || this.homey.settings.get('logEnabled'))
        {
            console.log(newMessage);
            if (errorLevel == 0)
            {
                this.error(newMessage);
            }

            const nowTime = new Date(Date.now());

            this.diagLog += nowTime.toJSON();
            this.diagLog += ": ";
            this.diagLog += "\r\n";

            this.diagLog += newMessage;
            this.diagLog += "\r\n";
            if (this.diagLog.length > 60000)
            {
                // Remove the first 1000 characters.
                this.diagLog = this.diagLog.substring(1000);
                let n = this.diagLog.indexOf("\n");
                if (n >= 0)
                {
                    // Remove up to and including the first \n so the log starts on a whole line
                    this.diagLog = this.diagLog.substring(n + 1);
                }
            }
            this.homey.api.realtime('com.mercedes_me.logupdated', { 'log': this.diagLog });
        }
    }

    async sendLog(body)
    {
        let tries = 5;

        let logData;
        if (body.logType == "diag")
        {
            logData = this.diagLog;
        }
        else
        {
            return "No data";
        }

        while (tries-- > 0)
        {
            try
            {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport(
                {
                    host: Homey.env.MAIL_HOST, //Homey.env.MAIL_HOST,
                    port: 465,
                    ignoreTLS: false,
                    secure: true, // true for 465, false for other ports
                    auth:
                    {
                        user: Homey.env.MAIL_USER, // generated ethereal user
                        pass: Homey.env.MAIL_SECRET // generated ethereal password
                    },
                    tls:
                    {
                        // do not fail on invalid certs
                        rejectUnauthorized: false
                    }
                });

                // send mail with defined transport object
                let info = await transporter.sendMail(
                {
                    from: '"Homey User" <' + Homey.env.MAIL_USER + '>', // sender address
                    to: Homey.env.MAIL_RECIPIENT, // list of receivers
                    subject: "Mercedes Me " + body.logType + " log (" + this.homey.manifest.version + ")", // Subject line
                    text: logData // plain text body
                });

                this.updateLog("Message sent: " + info.messageId);
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

                // Preview only available when sending through an Ethereal account
                console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
                return this.homey.__('settings.logSent');
            }
            catch (err)
            {
                this.updateLog("Send log error: " + err.stack, 0);
            }
        }

        return (this.homey.__('settings.logSendFailed'));
    }
};