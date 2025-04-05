import os
import PyPDF2
import docx

# Global variable to store the extracted text
GLOBAL_TEXT = ""

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file."""
    text = ""
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_docx(file_path):
    """Extract text from a DOCX file."""
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text

def extract_text_from_txt(file_path):
    """Extract text from a TXT file."""
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    return text

def extract_text(file_path):
    """Determine file type and extract text accordingly."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError("Unsupported file format: {}".format(ext))

def process_file(file_path):
    """Extract text from the file and store it in the global variable."""
    global GLOBAL_TEXT
    GLOBAL_TEXT = extract_text(file_path)
    return GLOBAL_TEXT

# Example usage:
if __name__ == '__main__':
  
    file_path = 'consultadd-hackathon\doc.txt'  
    try:
        extracted_text = process_file(file_path)
        print("Extracted Text:")
        print(extracted_text)
    except Exception as e:
        print("Error:", e)
