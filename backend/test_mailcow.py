import requests
import json

MAILCOW_API_URL="http://mail.smk.baktinusantara666.sch.id"
MAILCOW_API_KEY="925B68-0FF6BB-36B760-F6C051-AAF343"

headers = {
    "X-API-Key": MAILCOW_API_KEY
}

try:
    response = requests.get(f"{MAILCOW_API_URL}/api/v1/get/mailbox/all", headers=headers)
    print("Status:", response.status_code)
    data = response.json()
    if isinstance(data, list) and len(data) > 0:
        print("First mailbox:", json.dumps(data[0], indent=2))
    else:
        print("Data:", data)
except Exception as e:
    print("Error:", e)
