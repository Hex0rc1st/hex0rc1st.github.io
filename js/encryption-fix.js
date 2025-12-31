/**
 * Encryption UI Fix
 * Convert label text to placeholder for cleaner design
 * Also fix lazy-loaded images after decryption
 */

(function() {
  'use strict';
  
  // Wait for DOM to be ready
  function init() {
    const input = document.querySelector('.hbe-input-field-default');
    const label = document.querySelector('.hbe-input-label-content-default');
    
    if (input && label) {
      // Get the label text and set it as placeholder
      const placeholderText = label.textContent.trim();
      input.setAttribute('placeholder', placeholderText);
      
      // Hide the label (already hidden in CSS, but make sure)
      if (label.parentElement) {
        label.parentElement.style.display = 'none';
      }
    }
  }
  
  // Fix images after decryption
  function fixDecryptedImages() {
    const container = document.getElementById('hexo-blog-encrypt');
    if (!container) return;
    
    // Force reload all images by removing and re-adding loading attribute
    container.querySelectorAll('img').forEach(function(img) {
      // Remove lazy loading to force immediate load
      img.removeAttribute('loading');
      
      // If image has data-src, copy to src
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
      }
      
      // Force reload by temporarily clearing and restoring src
      if (img.src) {
        var originalSrc = img.src;
        img.src = '';
        img.src = originalSrc;
      }
    });
  }
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Listen for hexo-blog-decrypt event (fired after successful decryption)
  window.addEventListener('hexo-blog-decrypt', function() {
    // Small delay to ensure DOM is updated
    setTimeout(fixDecryptedImages, 100);
  });
})();
