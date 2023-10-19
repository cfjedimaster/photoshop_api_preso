import os 
import requests 
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
import time 

CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
BUCKET = 'psapitestrkc'
REGION = 'us-east-1'

def getAccessToken(id, secret):

	response = requests.post(f"https://ims-na1.adobelogin.com/ims/token/v2?client_id={id}&client_secret={secret}&grant_type=client_credentials&scope=openid,AdobeID")
	return response.json()


def create_removebg_job(id, token, inputURL, uploadURL):
           
	data = {
		"input": {
			"href": inputURL,
			"storage": "external"
		},
		"options": {
			"optimize": "performance",
		},
		"output": {
			"href": uploadURL,
			"storage": "external",
			"overwrite": True,
			"color": {
				"space": "rgb"
			},
			"mask": {
				"format": "soft"
			}
		}
	}			

	response = requests.post(f"https://image.adobe.io/sensei/cutout", headers = {"Authorization": f"Bearer {token}", "x-api-key": id }, json=data)
	return response.json()


# Credit: https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/storage-app/aws-s3/example.py
def get_presigned_url(bucket, key, operation, expires_in, region):
    s3 = boto3.client('s3', config=Config(signature_version='s3v4'), region_name=region)
    url = s3.generate_presigned_url(operation, Params={'Bucket': bucket, 'Key': key}, ExpiresIn=expires_in)
    return url        

token = getAccessToken(CLIENT_ID, CLIENT_SECRET)['access_token']

inputURL = get_presigned_url(BUCKET, 'input/dogs.jpg', 'get_object', 3600, REGION)
uploadURL = get_presigned_url(BUCKET, 'output/dogs_nobg_python.jpg', 'put_object', 3600, REGION)

job = create_removebg_job(CLIENT_ID, token, inputURL, uploadURL)
print(job)