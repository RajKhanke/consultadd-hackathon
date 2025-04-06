// API functions for RFP Analysis 

// Base URL for API
const API_BASE_URL = 'http://localhost:5000/api';

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
 * Get analysis results based on analysis type and RFP number
 * @param {string} analysisType - Type of analysis (summarize, eligibility, checklist, risks, compliance)
 * @param {string} rfpNumber - RFP number/collection name
 * @returns {Promise} Promise with analysis results
 */
async function getAnalysisResults(analysisType, rfpNumber) {
    // For now, we only have the summary endpoint implemented
    if (analysisType === 'summarize') {
        return getSummary(rfpNumber);
    } else {
        // Mock data for other analysis types for testing
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    status: "success",
                    data: `This is a mock result for ${analysisType}. Real API endpoint not yet implemented.`
                });
            }, 500);
        });
    }
}