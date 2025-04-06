// Common JavaScript functions for both pages

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", () => {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn")
    const closeMenuBtn = document.getElementById("closeMenuBtn")
    const mobileMenu = document.getElementById("mobileMenu")
  
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", () => {
        mobileMenu.classList.add("active")
      })
    }
  
    if (closeMenuBtn) {
      closeMenuBtn.addEventListener("click", () => {
        mobileMenu.classList.remove("active")
      })
    }
  
    // Custom cursor animation
    initCursor()
  })
  
  // Initialize custom cursor
  function initCursor() {
    // Check if it's a touch device
    if ("ontouchstart" in window) {
      document.querySelector(".cursor").style.display = "none"
      document.querySelector(".cursor-inner").style.display = "none"
      document.querySelector(".cursor-trail").style.display = "none"
      return
    }
  
    const cursor = document.querySelector(".cursor")
    const cursorInner = document.querySelector(".cursor-inner")
    const cursorTrail = document.querySelector(".cursor-trail")
  
    let mouseX = 0
    let mouseY = 0
    let trailX = 0
    let trailY = 0
    let scale = 1
  
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
  
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(${scale})`
      cursorInner.style.transform = `translate(${mouseX}px, ${mouseY}px)`
    })
  
    function animateCursor() {
      trailX += (mouseX - trailX) * 0.1
      trailY += (mouseY - trailY) * 0.1
  
      cursorTrail.style.transform = `translate(${trailX}px, ${trailY}px)`
  
      requestAnimationFrame(animateCursor)
    }
  
    animateCursor()
  
    // Cursor hover effects
    document.querySelectorAll("button, a, input, .upload-box, .analysis-btn").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.style.width = "60px"
        cursor.style.height = "60px"
        cursorInner.style.backgroundColor = "rgba(255, 255, 255, 1)"
        scale = 1.5
      })
  
      el.addEventListener("mouseleave", () => {
        cursor.style.width = "40px"
        cursor.style.height = "40px"
        cursorInner.style.backgroundColor = "rgba(255, 255, 255, 0.9)"
        scale = 1
      })
    })
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
  
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
  
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
  
  // Get current date and time formatted
  function getCurrentDateTime() {
    const now = new Date()
    return now.toLocaleString()
  }
  
  