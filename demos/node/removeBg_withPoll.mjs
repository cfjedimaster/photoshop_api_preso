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

async function makeBGJob(token, input, output) {
	let data = {
		"input": {
			"href": input,
			"storage": "external"
		},
		"options": {
			"optimize": "performance",
		},
		"output": {
			"href": output,
			"storage": "external",
			"overwrite": true,
			"color": {
				"space": "rgb"
			},
			"mask": {
				"format": "soft"
			}
		}
	};				

	let resp = await fetch('https://image.adobe.io/sensei/cutout', {
		headers: {
			'Authorization':`Bearer ${token}`,
			'x-api-key': CLIENT_ID,
			'Content-Type':'application/json'
		}, 
		method:'POST',
		body:JSON.stringify(data)
	});

	return await resp.json();
}

// Lame function to add a delay to my polling calls
async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

(async () => {

	let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);

	let inputURL = await getSignedDownloadUrl('input/dogs.jpg');
	let uploadURL = await getSignedUploadUrl('output/dogs_nobg.jpg');

	let job = await makeBGJob(token, inputURL, uploadURL);
	let jobUrl = job._links.self.href;

	let status = '';
	while(status !== 'succeeded' && status !== 'failed') {

		let resp = await fetch(jobUrl, {
			headers: {
				'Authorization':`Bearer ${token}`,
				'x-api-key': CLIENT_ID
			}
		});
		let data = await resp.json();
		status = data.status;
		console.log(`Current status: ${status}`);
		if(status !== 'succeeded' && status !== 'failed') await delay(1000);
	}

})()