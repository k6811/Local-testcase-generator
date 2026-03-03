import urllib.request
import json
import sys

OLLAMA_URL = "http://localhost:11434/api/tags"
TARGET_MODEL = "llama3.2"

def verify_ollama():
    print(f"Testing connection to Ollama at {OLLAMA_URL}...")
    try:
        req = urllib.request.Request(OLLAMA_URL)
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                models = [model['name'] for model in data.get('models', [])]
                print("✅ Successfully connected to Ollama!")
                
                # Check if target model is available
                # Note: model name might contain tags like llama3.2:latest
                target_found = any(TARGET_MODEL in model for model in models)
                
                if target_found:
                    print(f"✅ Target model '{TARGET_MODEL}' is available.")
                    print("Available models:", models)
                    sys.exit(0)
                else:
                    print(f"❌ Target model '{TARGET_MODEL}' is NOT found.")
                    print("Available models:", models)
                    sys.exit(1)
            else:
                print(f"❌ Failed to connect. HTTP Status Code: {response.status}")
                sys.exit(1)
    except urllib.error.URLError as e:
        print(f"❌ Connection failed: {e.reason}")
        print("Please ensure the Ollama app is running locally on port 11434.")
        sys.exit(1)

if __name__ == "__main__":
    verify_ollama()
