import 'dotenv/config';

import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: 'us-east-1' });
const bucket = 'psapitestrkc';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function getSignedDownloadUrl(path) {
	let command = new GetObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function getSignedUploadUrl(path) {
	let command = new PutObjectCommand({ Bucket: bucket, Key:path });
	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

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

// Lame function to add a delay to my polling calls
async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function pollJob(token, u) {
	let status = '';
	let data;
	while(status !== 'succeeded' && status !== 'failed') {

		let resp = await fetch(u, {
			headers: {
				'Authorization':`Bearer ${token}`,
				'x-api-key': CLIENT_ID
			}
		});
		data = await resp.json();
		status = data.outputs[0].status;
		if(status !== 'succeeded' && status !== 'failed') await delay(1000);
	}
	return data;
}

async function makeTextEditJob(token, input, output, text) {
	let data = {
		"inputs": [{
			"href": input,
			"storage": "external"
		}],
		"options": {
			"layers":[
				{
					"name":"Ad Copy",
					"text":{
						"content":text
					}
				}
			]
		},
		"outputs": [{
			"href": output,
			"storage": "external",
			"overwrite": true,
			"type":"image/jpeg"
		}]
	};				

	let resp = await fetch('https://image.adobe.io/pie/psdService/text', {
		headers: {
			'Authorization':`Bearer ${token}`,
			'x-api-key': CLIENT_ID
		}, 
		method:'POST',
		body:JSON.stringify(data)
	});

	return await resp.json();
}

(async () => {

	let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);

	let inputURL = await getSignedDownloadUrl('input/test3.psd');

	let outputs = [
		{
			file:'output/test_text_en.jpg', 
			text:'New Sale - 50% Off!'
		},
		{
			file:'output/test_text_de.jpg', 
			text:'Sonderangebot -50%!'
		},
		{
			file:'output/test_text_es.jpg', 
			text:'¡Rebaja -50%'
		}
	];


	// Single threading this for simplicity for now
	for(let i=0; i<outputs.length; i++) {

		let uploadURL = await getSignedUploadUrl(outputs[i].file);

		let job = await makeTextEditJob(token, inputURL, uploadURL, outputs[i].text);
		let jobUrl = job._links.self.href;

		let result = await pollJob(token,jobUrl);
		console.log(JSON.stringify(result,null,'\t'));

	}

})()