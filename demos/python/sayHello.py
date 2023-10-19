import os 
import requests 

CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')

def getAccessToken(id, secret):

	response = requests.post(f"https://ims-na1.adobelogin.com/ims/token/v2?client_id={id}&client_secret={secret}&grant_type=client_credentials&scope=openid,AdobeID")
	return response.json()

def sayHello(id, token):
	response = requests.get(f"https://image.adobe.io/pie/psdService/hello", headers = {"Authorization": f"Bearer {token}", "x-api-key": id })
	return response.text

token = getAccessToken(CLIENT_ID, CLIENT_SECRET)['access_token']

response = sayHello(CLIENT_ID, token)
print(f"Response from hello endpoint: {response}")

