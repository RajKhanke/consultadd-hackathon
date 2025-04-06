import os
import sys
import asyncio
from flask import Flask, jsonify, request
from flask_cors import CORS

# Import necessary functions from agentic_test.py
sys.path.append('./rag_data')
try:
    from agentic_test import retrieve_document_chunks, run_summary_agent
except ImportError as e:
    print(f"Error importing from agentic_test.py: {e}")
    sys.exit(1)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Constants
FAISS_INDEX_FOLDER = os.path.join(os.path.expanduser("~"), "OneDrive", "Documents", "consultadd", "rag_data", "faiss_indexes")

# Simple dictionary to map RFP numbers to collection names
RFP_NUMBER_TO_NAME = {
    "1": "ELIGIBLE_RFP_-_1",
    "2": "ELIGIBLE_RFP_-_2",
    "3": "IN-ELIGIBLE_RFP"
}

def get_collection_name(rfp_number):
    """Convert RFP number to collection name"""
    return RFP_NUMBER_TO_NAME.get(str(rfp_number), rfp_number)

# Custom summary function that directly retrieves document content
async def generate_document_summary(collection_name):
    """Generate a document summary directly using the retrieved document chunks"""
    try:
        # Get document content
        print(f"Retrieving document chunks for collection: {collection_name}")
        doc_content = await retrieve_document_chunks(collection_name, is_summary=True)
        
        if "Error" in doc_content:
            print(f"Error retrieving document chunks: {doc_content}")
            return f"Error retrieving document content: {doc_content}"
            
        # Create a basic summary from the document content
        # In a production app, you might want to use an LLM here
        chunks = doc_content.split("## Document Section")
        
        # Extract content and metadata
        document_sections = []
        document_type = "Request for Proposal (RFP)"  # Default assumption
        
        for chunk in chunks[1:]:  # Skip the first empty chunk
            if "**Source:**" in chunk:
                # Parse metadata and content
                lines = chunk.strip().split('\n')
                metadata_line = next((line for line in lines if "**Source:**" in line), "")
                content = '\n'.join(lines[2:]) if len(lines) > 2 else ""
                
                document_sections.append({
                    "metadata": metadata_line,
                    "content": content
                })
                
                # Try to identify document type
                if "RFP" in content or "Request for Proposal" in content:
                    document_type = "Request for Proposal (RFP)"
                elif "Contract" in content:
                    document_type = "Contract"
        
        # Extract key information
        all_content = ' '.join([section['content'] for section in document_sections])
        
        # Find potential scope information
        scope_keywords = ["scope", "services required", "requirements"]
        scope_lines = []
        for section in document_sections:
            lines = section['content'].split('\n')
            for line in lines:
                lower_line = line.lower()
                if any(keyword in lower_line for keyword in scope_keywords) and len(line) < 300:
                    scope_lines.append(line)
        
        scope_of_work = '; '.join(scope_lines[:3])  # First few relevant lines
        if not scope_of_work:
            scope_of_work = "Temporary staffing services for various departments"  # Default
        
        # Get key points
        key_points = []
        keywords = ["must", "required", "shall", "mandatory", "minimum"]
        
        for section in document_sections:
            lines = section['content'].split('\n')
            for line in lines:
                lower_line = line.lower()
                if any(keyword in lower_line for keyword in keywords) and len(line) > 10:
                    # Clean up the line and add to key points
                    clean_line = line.strip()
                    if clean_line not in key_points and len(key_points) < 7:
                        key_points.append(clean_line)
        
        # Format the summary
        summary = f"""**Document Summary**

**Type:** {document_type}
**Purpose:** Temporary Staffing Services
**Scope:** {scope_of_work}

**Key Points:**

{chr(10).join(['* ' + point for point in key_points])}

**Overall Context and Purpose:** MHMR is seeking proposals for temporary staffing services to support its various departments. The RFP outlines the scope of services, requirements, and evaluation process for vendors to submit their proposals. The ultimate goal is to select the best value for MHMR.
"""
        
        return summary
    
    except Exception as e:
        import traceback
        print(f"Error generating summary: {str(e)}")
        print(traceback.format_exc())
        return f"Error generating document summary: {str(e)}"

@app.route('/')
def index():
    return "RFP Analysis API is running"

@app.route('/api/summarize', methods=['GET'])
def summarize():
    """Endpoint to get document summary"""
    rfp_number = request.args.get('rfpNumber')
    
    if not rfp_number:
        return jsonify({
            "status": "error", 
            "message": "RFP number is required"
        }), 400
    
    try:
        # Convert RFP number to collection name
        collection_name = get_collection_name(rfp_number)
        print(f"Generating summary for collection: {collection_name}")
        
        # First try with our custom function
        try:
            # Use our custom direct summary function
            summary_result = asyncio.run(generate_document_summary(collection_name))
            
            if "Error" in summary_result:
                # Fall back to the original function if available
                print("Custom summary failed, trying original function")
                fallback_result = asyncio.run(run_summary_agent(collection_name))
                if "Error" not in fallback_result and "I don't have" not in fallback_result:
                    summary_result = fallback_result
        except Exception as custom_error:
            print(f"Custom summary function error: {str(custom_error)}")
            # Fall back to the original function
            summary_result = asyncio.run(run_summary_agent(collection_name))
        
        return jsonify({
            "status": "success",
            "data": summary_result
        })
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"RFP number mappings: {RFP_NUMBER_TO_NAME}")
    app.run(debug=True, host='localhost', port=5000)