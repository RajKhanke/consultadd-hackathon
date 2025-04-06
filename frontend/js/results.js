// Results page specific JavaScript

document.addEventListener("DOMContentLoaded", () => {
    displayUploadedFiles()
    initAnalysisButtons()
})
  
// Display uploaded files information
function displayUploadedFiles() {
    const fileInfo = JSON.parse(localStorage.getItem("uploadedFiles"))
    const filesList = document.getElementById("uploadedFilesList")
    const timestamp = document.getElementById("uploadTimestamp")
  
    if (fileInfo && filesList) {
        filesList.innerHTML = ""
  
        // Display RFP file
        const rfpItem = document.createElement("div")
        rfpItem.className = "file-item"
        rfpItem.innerHTML = `
            <i class="fas fa-file-contract file-icon"></i>
            <div class="file-details">
                <div class="file-name">RFP Document: ${fileInfo.rfpFileName || "Unknown"}</div>
                <div class="file-size">${fileInfo.rfpFileSize || "N/A"}</div>
                <div class="file-size">RFP Number: ${fileInfo.rfpNumber || "1"}</div>
            </div>
        `
        filesList.appendChild(rfpItem)
  
        // Display Company file if available
        if (fileInfo.companyFileName) {
            const companyItem = document.createElement("div")
            companyItem.className = "file-item"
            companyItem.innerHTML = `
                <i class="fas fa-building file-icon"></i>
                <div class="file-details">
                    <div class="file-name">Company Document: ${fileInfo.companyFileName}</div>
                    <div class="file-size">${fileInfo.companyFileSize || "N/A"}</div>
                </div>
            `
            filesList.appendChild(companyItem)
        }
  
        // Display timestamp
        if (timestamp && fileInfo.timestamp) {
            timestamp.textContent = `Analyzed on: ${fileInfo.timestamp}`
        } else if (timestamp) {
            timestamp.textContent = `Analyzed on: ${new Date().toLocaleString()}`
        }
    } else if (filesList) {
        filesList.innerHTML = "<p>No upload information available. Using default RFP Number: 1</p>"
        
        // Create a default file info if none exists
        localStorage.setItem("uploadedFiles", JSON.stringify({
            rfpNumber: "1",
            timestamp: new Date().toLocaleString()
        }));
    }
}
  
// Initialize analysis buttons
function initAnalysisButtons() {
    const analysisButtons = document.querySelectorAll(".analysis-btn")
    const resultsDisplay = document.getElementById("resultsDisplay")
    const buttonsContainer = document.getElementById("analysisButtons")
  
    if (analysisButtons.length && resultsDisplay) {
        analysisButtons.forEach((button) => {
            button.addEventListener("click", function () {
                // Remove active class from all buttons
                analysisButtons.forEach((btn) => btn.classList.remove("active"))
  
                // Add active class to clicked button
                this.classList.add("active")
  
                // Shift buttons up
                buttonsContainer.classList.add("shifted")
  
                // Show loading state
                resultsDisplay.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading analysis results...</p>
                    </div>
                `
                resultsDisplay.classList.add("active")
  
                // Get analysis type
                const analysisType = this.getAttribute("data-type")
  
                // Get file info from localStorage, default to RFP number 1 if not set
                const fileInfo = JSON.parse(localStorage.getItem("uploadedFiles")) || { rfpNumber: "1" }
                const rfpNumber = fileInfo.rfpNumber || "1"
  
                console.log(`Getting ${analysisType} analysis for RFP number: ${rfpNumber}`);
                
                // Call API to get results
                getAnalysisResults(analysisType, rfpNumber)
                    .then((results) => {
                        displayResults(analysisType, results)
                    })
                    .catch((error) => {
                        resultsDisplay.innerHTML = `
                            <div class="error-message">
                                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #EF4444; margin-bottom: 20px;"></i>
                                <p>Error loading results: ${error.message}</p>
                                <button class="retry-btn">Try Again</button>
                            </div>
                        `
                        
                        // Add retry button functionality
                        const retryBtn = resultsDisplay.querySelector(".retry-btn")
                        if (retryBtn) {
                            retryBtn.addEventListener("click", () => {
                                this.click() // Simulate clicking the analysis button again
                            })
                        }
                    })
            })
        })
    }
}
  
// Display results based on analysis type
function displayResults(type, results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
  
    if (!resultsDisplay) return
  
    // Different display templates based on analysis type
    switch (type) {
        case "summarize":
            displaySummaryResults(results)
            break
        case "compliance":
            displayComplianceResults(results)
            break
        case "eligibility":
            displayEligibilityResults(results)
            break
        case "checklist":
            displayChecklistResults(results)
            break
        case "risks":
            displayRiskResults(results)
            break
        default:
            resultsDisplay.innerHTML = "<p>Unknown analysis type.</p>"
    }
}
  
// Display summary results
function displaySummaryResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
    
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
  
// Display eligibility results (placeholder)
function displayEligibilityResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
    
    resultsDisplay.innerHTML = `
        <div class="result-section">
            <h2 class="result-title"><i class="fas fa-clipboard-check"></i> Mandatory Eligibility Criteria</h2>
            <div class="placeholder-content">
                <p>${results.data || "Eligibility criteria endpoint not yet implemented."}</p>
            </div>
        </div>
    `;
}
  
// Display checklist results (placeholder)
function displayChecklistResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
    
    resultsDisplay.innerHTML = `
        <div class="result-section">
            <h2 class="result-title"><i class="fas fa-tasks"></i> Submission Checklist</h2>
            <div class="placeholder-content">
                <p>${results.data || "Checklist endpoint not yet implemented."}</p>
            </div>
        </div>
    `;
}
  
// Display risk results (placeholder)
function displayRiskResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
    
    resultsDisplay.innerHTML = `
        <div class="result-section">
            <h2 class="result-title"><i class="fas fa-exclamation-triangle"></i> Contract Risks</h2>
            <div class="placeholder-content">
                <p>${results.data || "Risk analysis endpoint not yet implemented."}</p>
            </div>
        </div>
    `;
}

// Display compliance results (placeholder)
function displayComplianceResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
    
    resultsDisplay.innerHTML = `
        <div class="result-section">
            <h2 class="result-title"><i class="fas fa-check-circle"></i> Standard Compliance Checks</h2>
            <div class="placeholder-content">
                <p>${results.data || "Compliance check endpoint not yet implemented."}</p>
            </div>
        </div>
    `;
}

// Format markdown to HTML
function formatMarkdown(text) {
    if (!text) return '';
    
    // Replace headers
    let html = text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        
        // Replace bold and italic
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        
        // Replace bullet lists
        .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
        
        // Replace numbered lists
        .replace(/^\d\. (.*$)/gim, '<ol><li>$1</li></ol>')
        
        // Replace new lines
        .replace(/\n/gim, '<br>');
        
    // Remove duplicate list tags
    html = html
        .replace(/<\/ul><ul>/gim, '')
        .replace(/<\/ol><ol>/gim, '');
        
    return html;
}