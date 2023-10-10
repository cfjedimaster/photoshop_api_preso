import 'dotenv/config';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function getAccessToken(id,secret) {

	const params = new URLSearchParams();
	params.append('client_secret', secret);
	params.append('grant_type', 'client_credentials');
	params.append('scope', 'openid,AdobeID,read_organizations');

	let resp = await fetch(`https://ims-na1.adobelogin.com/ims/token/v2?client_id=${id}`, 
		{ 
			method: 'POST', 
			body: params
		}
	);

	let data = await resp.json();
	return data.access_token;

}

(async () => {

	let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);

	let resp = await fetch('https://image.adobe.io/pie/psdService/hello', {
		headers: {
			'Authorization':`Bearer ${token}`,
			'x-api-key': CLIENT_ID
		}
	});

	console.log(await resp.text());

})()