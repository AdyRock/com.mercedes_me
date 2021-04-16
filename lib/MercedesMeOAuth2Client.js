
const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');
const MyOAuth2Token = require('./MercedesMeOAuth2Token');

module.exports = class MercedesMeOAuth2Client extends OAuth2Client
{

    // Required:
    static API_URL = 'https://id.mercedes-benz.com/as';
    static TOKEN_URL = 'https://id.mercedes-benz.com/as/token.oauth2';
    static AUTHORIZATION_URL = 'https://id.mercedes-benz.com/as/authorization.oauth2';
    static SCOPES = ['mb:vehicle:status:general', 'mb:user:pool:reader', 'offline_access'];

    // Optional:
    static TOKEN = MyOAuth2Token; // Default: OAuth2Token
    static REDIRECT_URL = 'https://callback.athom.com/oauth2/callback'; // Default: 'https://callback.athom.com/oauth2/callback'

    // Overload what needs to be overloaded here

    async onHandleNotOK({ body })
    {
        throw new OAuth2Error(body.error);
    }

    async getThings({ color })
    {
        return this.get(
        {
            path: '/things',
            query: { color },
        });
    }

    async updateThing({ id, thing })
    {
        return this.put(
        {
            path: `/thing/${id}`,
            json: { thing },
        });
    }

}