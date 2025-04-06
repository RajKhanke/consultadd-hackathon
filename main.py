import os
import sys
import asyncio
from flask import Flask, jsonify, request
from flask_cors import CORS

# Import necessary functions from agentic_test.py
sys.path.append('./rag_data')
try:
    from agentic_test import (
        run_summary_agent, 
        run_eligibility_agent, 
        run_submission_checklist_agent, 
        run_contract_risk_agent,
        run_compliance_agent,
        list_available_collections
    )
except ImportError as e:
    print(f"Error importing from agentic_test.py: {e}")
    sys.exit(1)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple dictionary to map RFP numbers to collection names
RFP_NUMBER_TO_NAME = {
    "1": "ELIGIBLE_RFP_-_1",
    "2": "ELIGIBLE_RFP_-_2",
    "3": "IN-ELIGIBLE_RFP"
}

# Constants
COMPANY_DATA_FILE = os.path.join(os.path.expanduser("~"), "OneDrive", "Documents", "consultadd", "rag_data", "company_data.json")

def get_collection_name(rfp_number):
    """Convert RFP number to collection name"""
    # First check if it's a key in our dictionary
    collection_name = RFP_NUMBER_TO_NAME.get(str(rfp_number))
    if collection_name:
        return collection_name
    # If not, return the original value (may be a direct collection name)
    return rfp_number

@app.route('/')
def index():
    return "RFP Analysis API is running"

@app.route('/api/collections', methods=['GET'])
def collections():
    """Endpoint to list available collections"""
    try:
        available_collections = asyncio.run(list_available_collections())
        return jsonify({
            "status": "success",
            "collections": available_collections,
            "mappings": RFP_NUMBER_TO_NAME
        })
    except Exception as e:
        print(f"Error listing collections: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/api/summarize', methods=['GET'])
def summarize():
    """Endpoint to get document summary using run_summary_agent from agentic_test.py"""
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
        
        # Call run_summary_agent directly
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

@app.route('/api/eligibility', methods=['GET'])
def eligibility():
    """Endpoint to get eligibility criteria using run_eligibility_agent from agentic_test.py"""
    rfp_number = request.args.get('rfpNumber')
    
    if not rfp_number:
        return jsonify({
            "status": "error", 
            "message": "RFP number is required"
        }), 400
    
    try:
        # Convert RFP number to collection name
        collection_name = get_collection_name(rfp_number)
        print(f"Extracting eligibility criteria for collection: {collection_name}")
        
        # Call run_eligibility_agent directly
        eligibility_result = asyncio.run(run_eligibility_agent(collection_name))
        
        return jsonify({
            "status": "success",
            "data": eligibility_result
        })
    except Exception as e:
        print(f"Error extracting eligibility criteria: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/api/checklist', methods=['GET'])
def checklist():
    """Endpoint to get submission checklist using run_submission_checklist_agent from agentic_test.py"""
    rfp_number = request.args.get('rfpNumber')
    
    if not rfp_number:
        return jsonify({
            "status": "error", 
            "message": "RFP number is required"
        }), 400
    
    try:
        # Convert RFP number to collection name
        collection_name = get_collection_name(rfp_number)
        print(f"Generating submission checklist for collection: {collection_name}")
        
        # Call run_submission_checklist_agent directly
        checklist_result = asyncio.run(run_submission_checklist_agent(collection_name))
        
        return jsonify({
            "status": "success",
            "data": checklist_result
        })
    except Exception as e:
        print(f"Error generating submission checklist: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/api/risks', methods=['GET'])
def risks():
    """Endpoint to get contract risk analysis using run_contract_risk_agent from agentic_test.py"""
    rfp_number = request.args.get('rfpNumber')
    
    if not rfp_number:
        return jsonify({
            "status": "error", 
            "message": "RFP number is required"
        }), 400
    
    try:
        # Convert RFP number to collection name
        collection_name = get_collection_name(rfp_number)
        print(f"Analyzing contract risks for collection: {collection_name}")
        
        # Call run_contract_risk_agent directly
        risks_result = asyncio.run(run_contract_risk_agent(collection_name))
        
        return jsonify({
            "status": "success",
            "data": risks_result
        })
    except Exception as e:
        print(f"Error analyzing contract risks: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/api/compliance', methods=['POST'])
def compliance():
    """Endpoint to get compliance check results using run_compliance_agent from agentic_test.py"""
    data = request.json
    if not data:
        return jsonify({
            "status": "error", 
            "message": "Request body is required"
        }), 400
    
    rfp_number = data.get('rfpNumber')

    # Hardcoded company data file path
    company_data_file = r"C:\Users\hrite\OneDrive\Documents\consultadd\rag_data\data\Company Data.docx"
    
    if not rfp_number:
        return jsonify({
            "status": "error", 
            "message": "RFP number is required"
        }), 400
    
    if not os.path.exists(company_data_file):
        return jsonify({
            "status": "error", 
            "message": f"Company data file not found: {company_data_file}"
        }), 404
    
    try:
        # Convert RFP number to collection name
        collection_name = get_collection_name(rfp_number)
        print(f"Running compliance check for collection: {collection_name} with company data: {company_data_file}")
        
        # Call run_compliance_agent directly
        compliance_result = asyncio.run(run_compliance_agent(collection_name, company_data_file))
        
        # Check if the result is already JSON
        try:
            import json
            # Try to parse as JSON
            json_data = json.loads(compliance_result)
            return jsonify({
                "status": "success",
                "data": json_data
            })
        except json.JSONDecodeError:
            # If not valid JSON, return as string
            return jsonify({
                "status": "success",
                "data": compliance_result
            })
        
    except Exception as e:
        print(f"Error running compliance check: {str(e)}")
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