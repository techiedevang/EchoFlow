from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

try:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env")
        exit()

    # Initialize the new Client
    client = genai.Client(api_key=api_key)

    print("--- Available Models for Generation ---")
    
    # Iterate through the model list 
    for m in client.models.list():
        # Check if the model is one of the Gemini models
        if m.name.startswith("models/gemini"):
            # Check the display name or print the full name
            print(f"Model ID: {m.name}")
            print(f"   - Display Name: {m.display_name}")
            
    # List one reliable default model as a suggestion
    print("\n--- Suggested Model ---")
    print("Use the full name, e.g., 'models/gemini-1.5-flash'")


except Exception as e:
    # If the list method itself is still failing, print the error
    print(f"Error checking models: {e}")