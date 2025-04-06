// API functions for RFP Analysis 

// Base URL for API
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Get list of available collections
 * @returns {Promise} Promise with collections array and mappings
 */
async function getCollections() {
    try {
        const response = await fetch(`${API_BASE_URL}/collections`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Collections API response:", data);
        
        return data;
    } catch (error) {
        console.error('Error fetching collections:', error);
        throw error;
    }
}

/**
 * Get document summary from the backend
 * @param {string} rfpNumber - The RFP number to get summary for
 * @returns {Promise} Promise with summary data
 */
async function getSummary(rfpNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/summarize?rfpNumber=${encodeURIComponent(rfpNumber)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Summary API response:", data);
        
        return data;
    } catch (error) {
        console.error('Error fetching summary:', error);
        throw error;
    }
}

/**
 * Get eligibility criteria from the backend
 * @param {string} rfpNumber - The RFP number to get eligibility for
 * @returns {Promise} Promise with eligibility data
 */
async function getEligibility(rfpNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/eligibility?rfpNumber=${encodeURIComponent(rfpNumber)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Eligibility API response:", data);
        
        return data;
    } catch (error) {
        console.error('Error fetching eligibility criteria:', error);
        throw error;
    }
}

/**
 * Get submission checklist from the backend
 * @param {string} rfpNumber - The RFP number to get checklist for
 * @returns {Promise} Promise with checklist data
 */
async function getChecklist(rfpNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/checklist?rfpNumber=${encodeURIComponent(rfpNumber)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Checklist API response:", data);
        
        return data;
    } catch (error) {
        console.error('Error fetching submission checklist:', error);
        throw error;
    }
}

/**
 * Get contract risks from the backend
 * @param {string} rfpNumber - The RFP number to get risks for
 * @returns {Promise} Promise with risks data
 */
async function getRisks(rfpNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/risks?rfpNumber=${encodeURIComponent(rfpNumber)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Risks API response:", data);
        
        return data;
    } catch (error) {
        console.error('Error fetching contract risks:', error);
        throw error;
    }
}

/**
 * Get compliance check results from the backend
 * @param {string} rfpNumber - The RFP number to check compliance for
 * @param {string} companyDataFile - Path to the company data file (optional)
 * @returns {Promise} Promise with compliance data
 */
async function getCompliance(rfpNumber, companyDataFile) {
    try {
        const response = await fetch(`${API_BASE_URL}/compliance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rfpNumber: rfpNumber,
                companyDataFile: companyDataFile // If not provided, server will use default
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Compliance API response:", data);
        
        return data;
    } catch (error) {
        console.error('Error fetching compliance data:', error);
        throw error;
    }
}

/**
 * Get analysis results based on analysis type and RFP number
 * @param {string} analysisType - Type of analysis (summarize, eligibility, checklist, risks, compliance)
 * @param {string} rfpNumber - RFP number/collection name
 * @returns {Promise} Promise with analysis results
 */
async function getAnalysisResults(analysisType, rfpNumber) {
    // Different handling based on analysis type
    switch (analysisType) {
        case 'summarize':
            return getSummary(rfpNumber);
        case 'eligibility':
            return getEligibility(rfpNumber);
        case 'checklist':
            return getChecklist(rfpNumber);
        case 'risks':
            return getRisks(rfpNumber);
        case 'compliance': 
            // For compliance, we don't need to specify the company file path
            // The server will use the default path if not provided
            return getCompliance(rfpNumber);
        default:
            throw new Error(`Unknown analysis type: ${analysisType}`);
    }
}