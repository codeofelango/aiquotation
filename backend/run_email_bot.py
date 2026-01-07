import asyncio
import os
import sys

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.email_agent import run_email_bot
from core.database import init_pool, close_pool

async def main():
    print("🚀 Starting Email Agent Simulation...")
    
    # 1. Initialize DB (needed for product search)
    await init_pool()
    
    # 2. Simulate an incoming email
    sender = "architect@design-studio.com"
    subject = "RFP: Lobby Lighting Requirements"
    body = """
    Hi team,
    
    Please provide a quotation for the following:
    
    1. 50x Downlight 12W 3000K IP44
    2. 20x Linear Grazer 24W 4000K IP67
    
    Thanks,
    John
    """
    
    print(f"\n📧 Incoming Email from {sender}:")
    print(f"Subject: {subject}")
    print("-" * 40)
    print(body)
    print("-" * 40)
    
    # 3. Run the Agent
    print("\n🤖 Agent Processing...")
    result = await run_email_bot(subject, body, sender)
    
    # 4. Output Result
    print("\n✅ Agent Finished!")
    print(f"Intent Detected: {result['intent']}")
    print("-" * 40)
    print("📝 Draft Reply:\n")
    print(result['draft_reply'])
    print("-" * 40)
    
    await close_pool()

if __name__ == "__main__":
    asyncio.run(main())