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
                  <div class="file-name">RFP Document: ${fileInfo.rfpFileName}</div>
                  <div class="file-size">${fileInfo.rfpFileSize}</div>
                  <div class="file-size">RFP Number: ${fileInfo.rfpNumber}</div>
              </div>
          `
      filesList.appendChild(rfpItem)
  
      // Display Company file
      const companyItem = document.createElement("div")
      companyItem.className = "file-item"
      companyItem.innerHTML = `
              <i class="fas fa-building file-icon"></i>
              <div class="file-details">
                  <div class="file-name">Company Document: ${fileInfo.companyFileName}</div>
                  <div class="file-size">${fileInfo.companyFileSize}</div>
              </div>
          `
      filesList.appendChild(companyItem)
  
      // Display timestamp
      if (timestamp) {
        timestamp.textContent = `Analyzed on: ${fileInfo.timestamp}`
      }
    } else if (filesList) {
      filesList.innerHTML = "<p>No upload information available. Please upload files from the dashboard.</p>"
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
  
          // Get file info from localStorage
          const fileInfo = JSON.parse(localStorage.getItem("uploadedFiles"))
  
          // Call API to get results
          getAnalysisResults(analysisType, fileInfo.rfpNumber)
            .then((results) => {
              displayResults(analysisType, results)
            })
            .catch((error) => {
              resultsDisplay.innerHTML = `
                              <div class="error-message">
                                  <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #EF4444; margin-bottom: 20px;"></i>
                                  <p>Error loading results: ${error.message}</p>
                              </div>
                          `
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
  
    resultsDisplay.innerHTML = `
          <div class="result-section">
              <h2 class="result-title"><i class="fas fa-chart-pie"></i> Summary Analysis</h2>
              <div class="result-summary">
                  <div class="summary-card">
                      <h3 class="summary-title">Compliance Score</h3>
                      <div class="summary-score">
                          <div class="score-value" style="color: #10B981;">87%</div>
                          <div class="score-bar">
                              <div class="score-fill high" style="width: 87%"></div>
                          </div>
                      </div>
                  </div>
                  <div class="summary-card">
                      <h3 class="summary-title">Risk Level</h3>
                      <div class="summary-score">
                          <div class="score-value" style="color: #F59E0B;">Medium</div>
                          <div class="score-bar">
                              <div class="score-fill medium" style="width: 65%"></div>
                          </div>
                      </div>
                  </div>
                  <div class="summary-card recommendations-card">
                      <h3 class="summary-title">Recommendations</h3>
                      <div class="recommendations">
                          <div class="recommendation-item">
                              <i class="fas fa-arrow-circle-right"></i>
                              <span>Obtain security clearance within 60 days</span>
                          </div>
                          <div class="recommendation-item">
                              <i class="fas fa-arrow-circle-right"></i>
                              <span>Negotiate payment terms to 30 days</span>
                          </div>
                          <div class="recommendation-item">
                              <i class="fas fa-arrow-circle-right"></i>
                              <span>Complete executive summary signatures</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `
  }
  
  // Display compliance results
  function displayComplianceResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
  
    resultsDisplay.innerHTML = `
          <div class="result-section">
              <h2 class="result-title"><i class="fas fa-check-circle"></i> Standard Compliance Checks</h2>
              <div class="result-item">
                  <i class="fas fa-check result-icon success"></i>
                  <div class="result-content">
                      <h3>ISO 9001 Certification</h3>
                      <p>Verified and up-to-date</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-check result-icon success"></i>
                  <div class="result-content">
                      <h3>Data Protection Compliance</h3>
                      <p>GDPR requirements fully met</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-exclamation-triangle result-icon warning"></i>
                  <div class="result-content">
                      <h3>Accessibility Standards</h3>
                      <p>WCAG 2.1 AA - 3 minor issues detected</p>
                  </div>
              </div>
          </div>
      `
  }
  
  // Display eligibility results
  function displayEligibilityResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
  
    resultsDisplay.innerHTML = `
          <div class="result-section">
              <h2 class="result-title"><i class="fas fa-clipboard-check"></i> Mandatory Eligibility Criteria</h2>
              <div class="result-item">
                  <i class="fas fa-check result-icon success"></i>
                  <div class="result-content">
                      <h3>Business Registration</h3>
                      <p>Properly documented in all required jurisdictions</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-check result-icon success"></i>
                  <div class="result-content">
                      <h3>Financial Stability</h3>
                      <p>Audited financials meet requirements</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-times result-icon error"></i>
                  <div class="result-content">
                      <h3>Security Clearance</h3>
                      <p>DoD Secret clearance not yet obtained</p>
                  </div>
              </div>
          </div>
      `
  }
  
  // Display checklist results
  function displayChecklistResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
  
    resultsDisplay.innerHTML = `
          <div class="result-section">
              <h2 class="result-title"><i class="fas fa-tasks"></i> Submission Checklist</h2>
              <div class="result-item">
                  <i class="fas fa-check result-icon success"></i>
                  <div class="result-content">
                      <h3>Technical Proposal</h3>
                      <p>Complete and properly formatted</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-check result-icon success"></i>
                  <div class="result-content">
                      <h3>Financial Proposal</h3>
                      <p>All cost elements included</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-exclamation-triangle result-icon warning"></i>
                  <div class="result-content">
                      <h3>Executive Summary</h3>
                      <p>Missing 2 required signatures</p>
                  </div>
              </div>
          </div>
      `
  }
  
  // Display risk results
  function displayRiskResults(results) {
    const resultsDisplay = document.getElementById("resultsDisplay")
  
    resultsDisplay.innerHTML = `
          <div class="result-section">
              <h2 class="result-title"><i class="fas fa-exclamation-triangle"></i> Contract Risks</h2>
              <div class="result-item">
                  <i class="fas fa-shield-alt result-icon success"></i>
                  <div class="result-content">
                      <h3>Liability Clauses</h3>
                      <p>Standard terms acceptable</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-exclamation result-icon warning"></i>
                  <div class="result-content">
                      <h3>Payment Terms</h3>
                      <p>60-day payment period may impact cash flow</p>
                  </div>
              </div>
              <div class="result-item">
                  <i class="fas fa-radiation result-icon error"></i>
                  <div class="result-content">
                      <h3>Termination Conditions</h3>
                      <p>Unilateral termination clause requires negotiation</p>
                  </div>
              </div>
          </div>
      `
  }
  
  // Mock function for getAnalysisResults (replace with actual API call)
  async function getAnalysisResults(analysisType, rfpNumber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults = {
          summarize: { complianceScore: 85, riskLevel: "Medium" },
          compliance: { status: "OK" },
          eligibility: { isEligible: true },
          checklist: { items: ["Completed", "Pending"] },
          risks: { highRisks: 2, mediumRisks: 1 },
        }
        resolve(mockResults[analysisType] || {})
      }, 500)
    })
  }
  
  