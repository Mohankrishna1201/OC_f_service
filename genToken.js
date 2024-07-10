const { google } = require('googleapis');

function getAccessToken() {
    return new Promise(function (resolve, reject) {
        const key = require('./credentials_f.json');
        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            ['https://www.googleapis.com/auth/firebase.messaging'],
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens.access_token);
        });
    });
}

getAccessToken().then(token => {
    console.log('Access token:', token);
}).catch(err => {
    console.error('Error:', err);
});
