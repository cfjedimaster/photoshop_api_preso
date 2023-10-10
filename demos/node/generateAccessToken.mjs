import 'dotenv/config';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

(async () => {

	const params = new URLSearchParams();
	params.append('client_secret', CLIENT_SECRET);
	params.append('grant_type', 'client_credentials');
	params.append('scope', 'openid,AdobeID,read_organizations');

	let resp = await fetch(`https://ims-na1.adobelogin.com/ims/token/v2?client_id=${CLIENT_ID}`, 
		{ 
			method: 'POST', 
			body: params
		}
	);
	let data = await resp.json();
	console.log(data);

})()