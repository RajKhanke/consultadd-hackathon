import os
import shutil
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from llama_parse import LlamaParse
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from typing import List

# Load environment variables
load_dotenv()

# Constants
DATA_FOLDER = os.path.join(os.path.expanduser("~"), "OneDrive", "Documents", "consultadd", "rag_data", "data")
OUTPUT_FOLDER = os.path.join(os.path.dirname(DATA_FOLDER), "parsed_docs")
FAISS_INDEX_FOLDER = os.path.join(os.path.dirname(DATA_FOLDER), "faiss_indexes")

# Create necessary directories
for folder in [OUTPUT_FOLDER, FAISS_INDEX_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# Initialize LlamaParse
llama_cloud_api_key = os.environ.get("LLAMA_CLOUD_API_KEY")
if not llama_cloud_api_key:
    raise ValueError("LLAMA_CLOUD_API_KEY not found in environment variables")

parser = LlamaParse(
    api_key=llama_cloud_api_key,
    api_result_type="markdown",
    use_vendor_multimodal_model=True,
    vendor_multimodal_model_name="anthropic-sonnet-3.5",
    num_workers=4,
    verbose=True,
    language="en"
)

# Initialize embedding model
def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )

# FAISS operations
class FAISSOperations:
    @staticmethod
    def clear_index(collection_name: str) -> None:
        index_path = os.path.join(FAISS_INDEX_FOLDER, collection_name)
        if os.path.exists(index_path):
            shutil.rmtree(index_path)
            print(f"Cleared FAISS index for collection: {collection_name}")

    @staticmethod
    def create_index(documents: List[Document], collection_name: str) -> FAISS:
        embeddings = get_embeddings()
        texts = [doc.page_content for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        vectorstore = FAISS.from_texts(texts, embeddings, metadatas=metadatas)

        index_path = os.path.join(FAISS_INDEX_FOLDER, collection_name)
        os.makedirs(index_path, exist_ok=True)
        vectorstore.save_local(index_path)

        print(f"Created new FAISS index for collection: {collection_name}")
        return vectorstore

# Document Processing
def parse_and_chunk_document(file_path: str, output_name: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> str:
    """Process a PDF document, parse it, chunk it, and create FAISS index"""
    
    # Clear any existing index
    FAISSOperations.clear_index(output_name)

    # Parse document with LlamaParse
    print(f"Parsing document: {file_path}")
    result = parser.load_data(file_path)
    
    # Save the raw parsed content
    output_path = os.path.join(OUTPUT_FOLDER, f"{output_name}.md")
    full_text = ""
    with open(output_path, 'w', encoding='utf-8') as f:
        for page in result:
            page_text = page.text
            f.write(page_text)
            f.write("\n\n---\n\n")
            full_text += page_text + "\n\n"
    
    print(f"Saved parsed content to {output_path}")
    
    # Create a text splitter for more granular chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )
    
    # Split the text into chunks
    print("Chunking document...")
    chunks = text_splitter.split_text(full_text)
    print(f"Created {len(chunks)} chunks")
    
    # Create Document objects with metadata
    documents = [
        Document(page_content=chunk, metadata={"source": output_name, "chunk_id": i})
        for i, chunk in enumerate(chunks)
    ]
    
    # Create FAISS index
    print("Creating FAISS index...")
    FAISSOperations.create_index(documents, output_name)
    return f"Successfully processed {output_name} into {len(documents)} chunks"

def main():
    # Process all PDFs in the data directory
    pdf_files = [
        "ELIGIBLE RFP - 1.pdf",
        "ELIGIBLE RFP - 2.pdf",
        "IN-ELIGIBLE_RFP.pdf"
    ]
    
    for pdf_file in pdf_files:
        file_path = os.path.join(DATA_FOLDER, pdf_file)
        # Use filename without extension as the collection name
        output_name = os.path.splitext(pdf_file)[0].replace(" ", "_")
        
        try:
            print(f"\nProcessing {pdf_file}...")
            result = parse_and_chunk_document(file_path, output_name)
            print(result)
        except Exception as e:
            print(f"Error processing {pdf_file}: {str(e)}")

if __name__ == "__main__":
    main()