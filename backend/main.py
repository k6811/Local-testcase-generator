"""
Layer 2: Navigation (Decision Making)
FastAPI router – routes data between the SOP (Architecture) and the Ollama Tool (Layer 3).
This layer validates input, loads the template, calls the tool, and returns the result.
It does NOT contain any complex logic itself.
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Add project root to path so we can import from tools/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from tools.ollama_client import generate_with_ollama

# Load environment variables from .env
load_dotenv(PROJECT_ROOT / ".env")

app = FastAPI(
    title="Local Testcase Generator",
    description="Layer 2 Navigation: Routes user input through the prompt template to Ollama.",
    version="1.0.0"
)

# CORS – allows the local Vanilla frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Layer 1: Load Prompt Template at startup (read-only, never mutated at runtime) ---
TEMPLATE_PATH = Path(__file__).resolve().parent / "prompt_template.txt"

def load_prompt_template() -> str:
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Prompt template not found at: {TEMPLATE_PATH}")
    return TEMPLATE_PATH.read_text(encoding="utf-8")

PROMPT_TEMPLATE = load_prompt_template()


# --- Data Models (from gemini.md Data Schema) ---
class TestcaseRequest(BaseModel):
    user_input: str

class TestcaseResponse(BaseModel):
    test_cases: str


# --- API Health Check ---
@app.get("/health")
def health_check():
    return {"status": "ok", "model": os.getenv("OLLAMA_MODEL", "llama3.2")}


# --- Main Route: Layer 2 Navigation ---
@app.post("/api/generate_testcases", response_model=TestcaseResponse)
def generate_testcases(request: TestcaseRequest):
    # Step 1: Validate (deterministic gate)
    if not request.user_input.strip():
        raise HTTPException(status_code=400, detail="User input cannot be empty.")

    # Step 2: Inject user input into template (Layer 1 SOP)
    final_prompt = PROMPT_TEMPLATE.format(user_input=request.user_input)

    # Step 3: Call Layer 3 Tool (atomic & testable)
    try:
        result = generate_with_ollama(final_prompt)
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Step 4: Return structured output (per gemini.md schema)
    return TestcaseResponse(test_cases=result)
