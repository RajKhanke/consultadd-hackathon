// Results page specific JavaScript

document.addEventListener("DOMContentLoaded", () => {
    displayUploadedFiles();
    initAnalysisButtons();
})
  
// Display uploaded files information
function displayUploadedFiles() {
    const fileInfo = JSON.parse(localStorage.getItem("uploadedFiles")) || { rfpNumber: "1" };
    const filesList = document.getElementById("uploadedFilesList");
    const timestamp = document.getElementById("uploadTimestamp");
  
    if (filesList) {
        filesList.innerHTML = "";
  
        // Display RFP file
        const rfpItem = document.createElement("div");
        rfpItem.className = "file-item";
        rfpItem.innerHTML = `
            <i class="fas fa-file-contract file-icon"></i>
            <div class="file-details">
                <div class="file-name">RFP Document: ${fileInfo.rfpFileName || "Selected via RFP Number"}</div>
                <div class="file-size">${fileInfo.rfpFileSize || ""}</div>
                <div class="file-size">RFP Number: ${fileInfo.rfpNumber || "1"}</div>
            </div>
        `;
        filesList.appendChild(rfpItem);
  
        // Display Company file if available
        if (fileInfo.companyFileName) {
            const companyItem = document.createElement("div");
            companyItem.className = "file-item";
            companyItem.innerHTML = `
                <i class="fas fa-building file-icon"></i>
                <div class="file-details">
                    <div class="file-name">Company Document: ${fileInfo.companyFileName}</div>
                    <div class="file-size">${fileInfo.companyFileSize || "N/A"}</div>
                </div>
            `;
            filesList.appendChild(companyItem);
        } else {
            const companyItem = document.createElement("div");
            companyItem.className = "file-item";
            companyItem.innerHTML = `
                <i class="fas fa-building file-icon"></i>
                <div class="file-details">
                    <div class="file-name">Company Document: Using default company data</div>
                </div>
            `;
            filesList.appendChild(companyItem);
        }
  
        // Display timestamp
        if (timestamp) {
            timestamp.textContent = `Analyzed on: ${fileInfo.timestamp || new Date().toLocaleString()}`;
        }
    }
}
  
// Initialize analysis buttons
function initAnalysisButtons() {
    const analysisButtons = document.querySelectorAll(".analysis-btn");
    const resultsDisplay = document.getElementById("resultsDisplay");
    const buttonsContainer = document.getElementById("analysisButtons");
  
    if (analysisButtons.length && resultsDisplay) {
        analysisButtons.forEach((button) => {
            button.addEventListener("click", function () {
                // Remove active class from all buttons
                analysisButtons.forEach((btn) => btn.classList.remove("active"));
  
                // Add active class to clicked button
                this.classList.add("active");
  
                // Shift buttons up
                buttonsContainer.classList.add("shifted");
  
                // Show loading state
                resultsDisplay.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading analysis results...</p>
                    </div>
                `;
                resultsDisplay.classList.add("active");
  
                // Get analysis type
                const analysisType = this.getAttribute("data-type");
  
                // Get file info from localStorage, default to RFP number 1 if not set
                const fileInfo = JSON.parse(localStorage.getItem("uploadedFiles")) || { rfpNumber: "1" };
                const rfpNumber = fileInfo.rfpNumber || "1";
  
                console.log(`Getting ${analysisType} analysis for RFP number: ${rfpNumber}`);
                
                // Call API to get results
                getAnalysisResults(analysisType, rfpNumber)
                    .then((results) => {
                        displayResults(analysisType, results);
                    })
                    .catch((error) => {
                        resultsDisplay.innerHTML = `
                            <div class="error-message">
                                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #EF4444; margin-bottom: 20px;"></i>
                                <p>Error loading results: ${error.message}</p>
                                <button class="retry-btn">Try Again</button>
                            </div>
                        `;
                        
                        // Add retry button functionality
                        const retryBtn = resultsDisplay.querySelector(".retry-btn");
                        if (retryBtn) {
                            retryBtn.addEventListener("click", () => {
                                this.click(); // Simulate clicking the analysis button again
                            });
                        }
                    });
            });
        });
    }
}
  
// Display results based on analysis type
function displayResults(type, results) {
    const resultsDisplay = document.getElementById("resultsDisplay");
  
    if (!resultsDisplay) return;
  
    // Different display templates based on analysis type
    switch (type) {
        case "summarize":
            displaySummaryResults(results);
            break;
        case "eligibility":
            displayEligibilityResults(results);
            break;
        case "compliance":
            displayComplianceResults(results);
            break;
        case "checklist":
            displayChecklistResults(results);
            break;
        case "risks":
            displayRiskResults(results);
            break;
        default:
            resultsDisplay.innerHTML = "<p>Unknown analysis type.</p>";
    }
}
  
// Display summary results
function displaySummaryResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay");
    
    // Check if we have valid data
    if (results && results.status === "success") {
        const summaryData = results.data;
        
        // Convert markdown text to HTML
        let formattedContent = formatMarkdown(summaryData);
        
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-chart-pie"></i> Document Summary</h2>
                <div class="summary-content">
                    ${formattedContent}
                </div>
            </div>
        `;
    } else {
        // Handle error or invalid data
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-chart-pie"></i> Document Summary</h2>
                <div class="error-message">
                    <p>Could not load summary data. Please try again.</p>
                </div>
            </div>
        `;
    }
}
  
// Display eligibility results
function displayEligibilityResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay");
    
    // Check if we have valid data
    if (results && results.status === "success") {
        const eligibilityData = results.data;
        
        // Convert markdown text to HTML
        let formattedContent = formatMarkdown(eligibilityData);
        
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-clipboard-check"></i> Mandatory Eligibility Criteria</h2>
                <div class="eligibility-content">
                    ${formattedContent}
                </div>
            </div>
        `;
    } else {
        // Handle error or invalid data
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-clipboard-check"></i> Mandatory Eligibility Criteria</h2>
                <div class="error-message">
                    <p>Could not load eligibility criteria. Please try again.</p>
                </div>
            </div>
        `;
    }
}
  
// Display checklist results
function displayChecklistResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay");
    
    // Check if we have valid data
    if (results && results.status === "success") {
        const checklistData = results.data;
        
        // Convert markdown text to HTML
        let formattedContent = formatMarkdown(checklistData);
        
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-tasks"></i> Submission Checklist</h2>
                <div class="checklist-content">
                    ${formattedContent}
                </div>
            </div>
        `;
    } else {
        // Handle error or invalid data
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-tasks"></i> Submission Checklist</h2>
                <div class="error-message">
                    <p>Could not load submission checklist. Please try again.</p>
                </div>
            </div>
        `;
    }
}

// Display risk results
function displayRiskResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay");
    
    // Check if we have valid data
    if (results && results.status === "success") {
        const risksData = results.data;
        
        // Convert markdown text to HTML
        let formattedContent = formatMarkdown(risksData);
        
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-exclamation-triangle"></i> Contract Risks</h2>
                <div class="risks-content">
                    ${formattedContent}
                </div>
            </div>
        `;
    } else {
        // Handle error or invalid data
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-exclamation-triangle"></i> Contract Risks</h2>
                <div class="error-message">
                    <p>Could not load risk analysis. Please try again.</p>
                </div>
            </div>
        `;
    }
}

// Display compliance results
function displayComplianceResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay");
    
    // Check if we have valid data and if it's structured JSON
    if (results && results.status === "success") {
        const complianceData = results.data;
        
        if (typeof complianceData === 'object' && complianceData.overall_score !== undefined) {
            // Convert decimal scores to percentages (0.8 -> 80%)
            const convertToPercent = (score) => Math.round(score * 100);
            
            // Format scores for display
            const overallScore = convertToPercent(complianceData.overall_score);
            const eligibilityScore = convertToPercent(complianceData.eligibility_score || 0);
            const domainScore = convertToPercent(complianceData.domain_match_score || 0);
            const certScore = convertToPercent(complianceData.certifications_score || 0);
            const expScore = convertToPercent(complianceData.experience_score || 0);
            
            // Determine score class
            const scoreClass = (score) => {
                if (score >= 80) return "high";
                if (score >= 60) return "medium";
                return "low";
            };
            
            // Generate HTML for scores
            resultsDisplay.innerHTML = `
                <div class="result-section">
                    <h2 class="result-title"><i class="fas fa-check-circle"></i> Compliance Check Results</h2>
                    
                    <div class="summary-card">
                        <h3 class="summary-title">Overall Compliance Score</h3>
                        <div class="summary-score">
                            <div class="score-value score-${scoreClass(overallScore)}">${overallScore}%</div>
                            <div class="score-bar">
                                <div class="score-fill ${scoreClass(overallScore)}" style="width: ${overallScore}%;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="compliance-scores">
                        <div class="score-card">
                            <h3>Legal Eligibility</h3>
                            <div class="score-value score-${scoreClass(eligibilityScore)}">${eligibilityScore}%</div>
                            <div class="score-bar">
                                <div class="score-fill ${scoreClass(eligibilityScore)}" style="width: ${eligibilityScore}%;"></div>
                            </div>
                        </div>
                        
                        <div class="score-card">
                            <h3>Domain Match</h3>
                            <div class="score-value score-${scoreClass(domainScore)}">${domainScore}%</div>
                            <div class="score-bar">
                                <div class="score-fill ${scoreClass(domainScore)}" style="width: ${domainScore}%;"></div>
                            </div>
                        </div>
                        
                        <div class="score-card">
                            <h3>Certifications</h3>
                            <div class="score-value score-${scoreClass(certScore)}">${certScore}%</div>
                            <div class="score-bar">
                                <div class="score-fill ${scoreClass(certScore)}" style="width: ${certScore}%;"></div>
                            </div>
                        </div>
                        
                        <div class="score-card">
                            <h3>Experience</h3>
                            <div class="score-value score-${scoreClass(expScore)}">${expScore}%</div>
                            <div class="score-bar">
                                <div class="score-fill ${scoreClass(expScore)}" style="width: ${expScore}%;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="criteria-details">
                        <h3 class="section-heading">Deal Breakers</h3>
                        <ul class="requirements-list">
                            ${complianceData.deal_breakers && complianceData.deal_breakers.length > 0
                              ? complianceData.deal_breakers.map(item => 
                                `<li class="requirement unmet">
                                  <i class="fas fa-times-circle"></i>
                                  <span>${item}</span>
                                </li>`).join('')
                              : `<li class="requirement met">
                                  <i class="fas fa-check-circle"></i>
                                  <span>No deal breakers identified</span>
                                </li>`}
                        </ul>
                        
                        <h3 class="section-heading">Recommendations</h3>
                        <ul class="requirements-list">
                            ${complianceData.recommendations && complianceData.recommendations.length > 0
                              ? complianceData.recommendations.map(item => 
                                `<li class="requirement warning">
                                  <i class="fas fa-lightbulb"></i>
                                  <span>${item}</span>
                                </li>`).join('')
                              : `<li class="requirement">
                                  <i class="fas fa-info-circle"></i>
                                  <span>No specific recommendations provided</span>
                                </li>`}
                        </ul>
                        
                        ${complianceData.categories && complianceData.categories.length > 0 ? `
                        <h3 class="section-heading">Detailed Category Assessment</h3>
                        <div class="category-details">
                            ${complianceData.categories.map(category => `
                                <div class="category-card">
                                    <h4>${category.name} <span class="category-score score-${scoreClass(category.score*100)}">${convertToPercent(category.score)}%</span></h4>
                                    
                                    <h5>RFP Requirements:</h5>
                                    <ul>
                                        ${category.rfp_requirements.map(req => `<li>${req}</li>`).join('')}
                                    </ul>
                                    
                                    <h5>Company Capabilities:</h5>
                                    <ul>
                                        ${category.company_capabilities.map(cap => `<li>${cap}</li>`).join('')}
                                    </ul>
                                    
                                    <p class="justification"><strong>Justification:</strong> ${category.justification}</p>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            // Handle unstructured data - display as formatted text
            let formattedContent = typeof complianceData === 'string' 
                ? formatMarkdown(complianceData)
                : formatMarkdown(JSON.stringify(complianceData, null, 2));
                
            resultsDisplay.innerHTML = `
                <div class="result-section">
                    <h2 class="result-title"><i class="fas fa-check-circle"></i> Compliance Check Results</h2>
                    <div class="compliance-content">
                        ${formattedContent}
                    </div>
                </div>
            `;
        }
    } else {
        // Handle error or invalid data
        resultsDisplay.innerHTML = `
            <div class="result-section">
                <h2 class="result-title"><i class="fas fa-check-circle"></i> Compliance Check Results</h2>
                <div class="error-message">
                    <p>Could not load compliance check results. Please try again.</p>
                </div>
            </div>
        `;
    }
}

// Format markdown to HTML
function formatMarkdown(text) {
    if (!text) return '';
    
    // First, escape any HTML
    const escapeHtml = (unsafe) => {
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    
    let escaped = typeof text === 'string' ? escapeHtml(text) : escapeHtml(JSON.stringify(text, null, 2));
    
    // Replace headers
    let html = escaped
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        
        // Replace bold and italic
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        
        // Replace bullet lists - match multiline bullet points
        .replace(/^\* (.*?)(?=\n\* |\n\n|$)/gims, '<ul><li>$1</li></ul>')
        
        // Replace numbered lists
        .replace(/^\d\. (.*?)(?=\n\d\. |\n\n|$)/gims, '<ol><li>$1</li></ol>')
        
        // Replace new lines
        .replace(/\n/gim, '<br>');
        
    // Remove duplicate list tags
    html = html
        .replace(/<\/ul><br><ul>/gim, '<br>')
        .replace(/<\/ol><br><ol>/gim, '<br>');
        
    return html;
}