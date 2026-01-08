import asyncio
import os.path
import base64
import time
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Import your actual agent logic
from agents.email_agent import run_email_bot
from core.database import init_pool, close_pool

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']

def get_gmail_service():
    """Authenticates and returns the Gmail service."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("❌ Missing credentials.json! Please add it to the backend folder.")
                return None
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)

def get_message_body(payload):
    """Extracts plain text body from email payload."""
    body = ""
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body']['data']
                body = base64.urlsafe_b64decode(data).decode()
                break
    elif 'body' in payload:
        data = payload['body']['data']
        body = base64.urlsafe_b64decode(data).decode()
    return body

async def process_emails():
    """Main async loop to poll and process."""
    print("🚀 Starting Autonomous Email Agent (Real-Time Mode)...")
    
    # 1. Initialize Database Connection (Required for Product Search)
    await init_pool()
    
    service = get_gmail_service()
    if not service: return

    print("👀 Watching Inbox...")

    try:
        while True:
            # Poll Gmail
            # Note: Gmail API is sync, so we run it directly here. 
            # In high-load apps, run_in_executor is better, but this is fine for a poller.
            results = service.users().messages().list(userId='me', q='is:unread').execute()
            messages = results.get('messages', [])

            if messages:
                print(f"\n📨 Processing {len(messages)} new email(s)...")
                
                for msg in messages:
                    txt = service.users().messages().get(userId='me', id=msg['id']).execute()
                    payload = txt['payload']
                    headers = payload['headers']
                    
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
                    sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown")
                    body = get_message_body(payload)

                    print(f"   ▶ Received: '{subject}' from {sender}")

                    # --- DIRECT AGENT CALL ---
                    # This runs the LangGraph agent, creates the quote in DB, and drafts reply
                    result = await run_email_bot(subject, body, sender)
                    
                    print(f"   🤖 Intent: {result['intent']}")
                    if result.get('quotation_id'):
                        print(f"   ✅ Quotation #{result['quotation_id']} Created!")
                    
                    print(f"   📝 Draft Reply Generated")

                    # Mark as read
                    service.users().messages().modify(userId='me', id=msg['id'], body={'removeLabelIds': ['UNREAD']}).execute()
            
            else:
                print(".", end="", flush=True)

            # Wait 10 seconds before next poll
            await asyncio.sleep(10)

    except KeyboardInterrupt:
        print("\n🛑 Stopping Agent...")
    finally:
        await close_pool()

if __name__ == '__main__':
    asyncio.run(process_emails())