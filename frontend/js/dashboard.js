// Dashboard page specific JavaScript

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
  
  // Helper function to get current date and time
  function getCurrentDateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    initFileUploads()
    initForm()
  })
  
  // Modify the initFileUploads function in dashboard.js
  function initFileUploads() {
    const rfpFile = document.getElementById("rfpFile");
    const companyFile = document.getElementById("companyFile");
    const rfpFileName = document.getElementById("rfpFileName");
    const companyFileName = document.getElementById("companyFileName");
    const rfpUpload = document.getElementById("rfpUpload");
    const companyUpload = document.getElementById("companyUpload");
    const rfpSelect = document.getElementById("rfpSelect");
    
    // RFP file upload
    if (rfpFile) {
        rfpFile.addEventListener("change", function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                rfpFileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
                rfpFileName.classList.add("active");
                rfpUpload.style.borderColor = "#3B82F6";
                rfpUpload.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
            }
        });
        
        // Only attach click event to specific elements inside the upload box
        const browseLabel = rfpUpload.querySelector(".upload-label");
        if (browseLabel) {
            browseLabel.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                rfpFile.click();
            });
        }
        
        // Attach click handler to specific elements, not the entire box
        rfpUpload.querySelector(".upload-title")?.addEventListener("click", () => rfpFile.click());
        rfpUpload.querySelector(".upload-or")?.addEventListener("click", () => rfpFile.click());
        rfpUpload.querySelector(".fas.fa-file-contract")?.addEventListener("click", () => rfpFile.click());
        
        // Drag and drop for RFP
        rfpUpload.addEventListener("dragover", function(e) {
            e.preventDefault();
            this.style.borderColor = "#3B82F6";
            this.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        });
        
        rfpUpload.addEventListener("dragleave", function() {
            if (!rfpFile.files.length) {
                this.style.borderColor = "rgba(59, 130, 246, 0.5)";
                this.style.backgroundColor = "transparent";
            }
        });
        
        rfpUpload.addEventListener("drop", (e) => {
            e.preventDefault();
            
            if (e.dataTransfer.files.length > 0) {
                rfpFile.files = e.dataTransfer.files;
                const file = e.dataTransfer.files[0];
                rfpFileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
                rfpFileName.classList.add("active");
            }
        });
    }

    // Similar approach for company file upload
    if (companyFile) {
        companyFile.addEventListener("change", function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                companyFileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
                companyFileName.classList.add("active");
                companyUpload.style.borderColor = "#3B82F6";
                companyUpload.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
            }
        });
        
        // Only attach click event to specific elements inside the upload box
        const browseLabel = companyUpload.querySelector(".upload-label");
        if (browseLabel) {
            browseLabel.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                companyFile.click();
            });
        }
        
        // Attach click handler to specific elements, not the entire box
        companyUpload.querySelector(".upload-title")?.addEventListener("click", () => companyFile.click());
        companyUpload.querySelector(".upload-or")?.addEventListener("click", () => companyFile.click());
        companyUpload.querySelector(".fas.fa-building")?.addEventListener("click", () => companyFile.click());
        
        // Drag and drop for Company
        companyUpload.addEventListener("dragover", function(e) {
            e.preventDefault();
            this.style.borderColor = "#3B82F6";
            this.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        });
        
        companyUpload.addEventListener("dragleave", function() {
            if (!companyFile.files.length) {
                this.style.borderColor = "rgba(59, 130, 246, 0.5)";
                this.style.backgroundColor = "transparent";
            }
        });
        
        companyUpload.addEventListener("drop", (e) => {
            e.preventDefault();
            
            if (e.dataTransfer.files.length > 0) {
                companyFile.files = e.dataTransfer.files;
                const file = e.dataTransfer.files[0];
                companyFileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
                companyFileName.classList.add("active");
            }
        });
    }
}
  
  // Initialize form submission
  function initForm() {
    const uploadForm = document.getElementById("uploadForm")
  
    if (uploadForm) {
      uploadForm.addEventListener("submit", (e) => {
        e.preventDefault()
  
        const rfpFile = document.getElementById("rfpFile")
        const companyFile = document.getElementById("companyFile")
        const rfpSelect = document.getElementById("rfpSelect")
  
        // Validate form
        if (!rfpFile.files.length || !companyFile.files.length) {
          alert("Please upload both RFP and Company documents.")
          return
        }
  
        // Store file information in localStorage
        const fileInfo = {
          rfpFileName: rfpFile.files[0].name,
          rfpFileSize: formatFileSize(rfpFile.files[0].size),
          companyFileName: companyFile.files[0].name,
          companyFileSize: formatFileSize(companyFile.files[0].size),
          rfpNumber: rfpSelect.value,
          timestamp: getCurrentDateTime(),
        }
  
        localStorage.setItem("uploadedFiles", JSON.stringify(fileInfo))
  
        // Redirect to results page
        window.location.href = "results.html"
      })
    }
  }
  
  