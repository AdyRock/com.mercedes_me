const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');
//const MyOAuth2Token = require('./MercedesMeOAuth2Token');
//const { OAuth2Token } = require('homey-oauth2app');

module.exports = class MercedesMeOAuth2Client extends OAuth2Client
{

    // Required:
    static API_URL = 'https://api.mercedes-benz.com/vehicledata/v2/';
    static TOKEN_URL = 'https://id.mercedes-benz.com/as/token.oauth2';
    static AUTHORIZATION_URL = 'https://id.mercedes-benz.com/as/authorization.oauth2';
    static SCOPES = ['mb:vehicle:mbdata:vehiclestatus', 'mb:vehicle:status:general', 'mb:user:pool:reader', 'offline_access', 'mb:vehicle:mbdata:evstatus', 'mb:vehicle:mbdata:fuelstatus', 'mb:vehicle:mbdata:payasyoudrive', 'mb:vehicle:mbdata:vehiclelock'];

    // Optional:
    //    static TOKEN = OAuth2Token; // Default: OAuth2Token
    //    static REDIRECT_URL = 'https://callback.athom.com/oauth2/callback'; // Default: 'https://callback.athom.com/oauth2/callback'

    // Overload what needs to be overloaded here

    async onHandleNotOK({ body })
    {
        throw new OAuth2Error(body.error);
    }

    async getThings(item)
    {
        return this.get(
        {
            path: item
        });
    }

    async updateThing({ id, thing })
    {
        // return this.put(
        // {
        //     path: `/thing/${id}`,
        //     json: { thing },
        // });
    }

}