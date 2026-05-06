import requests
import json
import imaplib
import os

MAIL_HOST = "mail.smk.baktinusantara666.sch.id"
MAILCOW_API_URL = "http://mail.smk.baktinusantara666.sch.id"
MAILCOW_API_KEY = "925B68-0FF6BB-36B760-F6C051-AAF343"

def test_auth(username, password):
    if "@" not in username:
        username = f"{username}@smk.baktinusantara666.sch.id"
    
    print(f"Testing auth for: {username}")
    
    try:
        # 1. Test IMAP
        print("Connecting to IMAP...")
        mail = imaplib.IMAP4_SSL(MAIL_HOST, 993)
        mail.login(username, password)
        print("IMAP Login Success!")
        mail.logout()
        
        # 2. Test API
        headers = {"X-API-Key": MAILCOW_API_KEY}
        print(f"Fetching mailbox data from API: {MAILCOW_API_URL}/api/v1/get/mailbox/{username}")
        resp = requests.get(f"{MAILCOW_API_URL}/api/v1/get/mailbox/{username}", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            print("API Response received.")
            
            mailbox_data = None
            if isinstance(data, list) and len(data) > 0:
                mailbox_data = data[0]
            elif isinstance(data, dict):
                mailbox_data = data
            
            if mailbox_data:
                tags = [t.lower() for t in mailbox_data.get("tags", [])]
                print(f"Tags found: {tags}")
                
                role = "siswa"
                if "admin" in tags:
                    role = "admin"
                elif "guru" in tags:
                    role = "guru"
                elif "tu" in tags:
                    role = "tu"
                elif "siswa" in tags:
                    role = "siswa"
                
                print(f"Detected Role: {role}")
            else:
                print("No mailbox data found in response.")
        else:
            print(f"API Error: {resp.status_code}")
            print(resp.text)
            
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python test_mailcow.py <username> <password>")
    else:
        test_auth(sys.argv[1], sys.argv[2])
