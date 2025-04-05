# Requirements:
# pip install PyPDF2 python-docx pandas tabulate google-genai

import PyPDF2
import docx
import pandas as pd
from tabulate import tabulate
from google import genai

# ——— CONFIG ———
API_KEY = "GEMINI_API_KEY"
MODEL   = "gemini-2.0-flash"

# Initialize Gemini client
client = genai.Client(api_key=API_KEY)

# Global storage for extracted text and the final explanations
GLOBAL_TEXT = ""
GLOBAL_EXPLANATIONS = pd.DataFrame(columns=["term", "company_value", "explanation"])

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file."""
    text = ""
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extract all text from a DOCX file."""
    doc = docx.Document(file_path)
    return "\n".join(para.text for para in doc.paragraphs)

def extract_text_from_txt(file_path: str) -> str:
    """Extract all text from a plain TXT file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def extract_text(file_path: str) -> str:
    """
    Determine file type by extension and extract text accordingly.
    Supports .pdf, .docx, and .txt.
    """
    ext = file_path.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_path)
    if ext == "docx":
        return extract_text_from_docx(file_path)
    if ext == "txt":
        return extract_text_from_txt(file_path)
    raise ValueError(f"Unsupported file format: .{ext}")

def parse_term_values(raw_text: str):
    """
    Parse lines formatted as alternating "Term" then "Value" into a list of (term, value) pairs.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    pairs, i = [], 0
    while i < len(lines) - 1:
        term, val = lines[i], lines[i+1]
        if term.lower() != val.lower():
            pairs.append((term, val))
            i += 2
        else:
            i += 1
    return pairs

def build_prompt(pairs):
    """
    Build a concise prompt for Gemini:
    - Explains each term and its company-specific value.
    - Requests JSON output.
    """
    prompt_lines = [
        "You are a helpful assistant.",
        "For each COMPANY DATA term and its value below, provide a brief explanation",
        "of what the term means and what the specific value represents for the company.",
        "Respond with a JSON array of objects, each with keys: 'term', 'value', 'explanation'.",
        "",
        "DATA:"
    ]
    prompt_lines += [f"- {term}: {val}" for term, val in pairs]
    return "\n".join(prompt_lines)

def explain_terms(pairs):
    """
    Send the prompt to Gemini and parse the JSON response into a DataFrame.
    Renames 'value' → 'company_value'.
    """
    resp = client.models.generate_content(
        model=MODEL,
        contents=build_prompt(pairs)
    )
    try:
        df = pd.read_json(resp.text.strip())
        df = df.rename(columns={"value": "company_value"})
        return df[["term", "company_value", "explanation"]]
    except Exception:
        raise RuntimeError(f"Failed to parse LLM response as JSON:\n{resp.text}")

def process_and_explain(raw_text: str):
    """
    Full pipeline:
    1. Parse term/value pairs
    2. Get explanations from Gemini
    3. Store into GLOBAL_EXPLANATIONS
    """
    global GLOBAL_EXPLANATIONS
    pairs = parse_term_values(raw_text)
    GLOBAL_EXPLANATIONS = explain_terms(pairs)
    return GLOBAL_EXPLANATIONS

if __name__ == "__main__":
    # === Change this to your actual file path: .pdf, .docx, or .txt ===
    file_path = "consultadd-hackathon\Company Data.docx"

    # 1. Extract raw text
    GLOBAL_TEXT = extract_text(file_path)

    # 2. Process & explain
    result_df = process_and_explain(GLOBAL_TEXT)

    # 3. Print the global explanations table
    final_var=tabulate(result_df, headers="keys", tablefmt="github", showindex=False)
    
    print(final_var)
