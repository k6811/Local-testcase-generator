# Gemini Constitution

## Project Constitution

### Data Schemas
**Input Payload (UI to Backend):**
```json
{
  "user_input": "string"
}
```

**Output Payload (Backend to UI):**
```json
{
  "test_cases": "string (Markdown format containing the generated testcases)"
}
```

### Behavioral Rules
- Use local Ollama for the testcase generation to maintain data privacy.
- Do not make assumptions on business logic.
- User enters an input, based on the input we will give the output by using Local LLM in Ollama (llama3.2).
- The prompt template must be stored securely in the codebase and used as a wrapper around the user input.

### Architectural Invariants
- All generation logic should rely on local models.
- The UI chat component and the Ollama API communication must be clearly separated.
