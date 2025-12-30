/**
 * Encryption Module for Dark Tech Theme
 * Handles password-protected article decryption
 * Works with hexo-blog-encrypt plugin
 */

(function($) {
  'use strict';

  // Encryption module namespace
  var Encryption = {
    // Configuration
    config: {
      storagePrefix: 'hexo_blog_encrypt_',
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      animationDuration: 300
    },

    /**
     * Initialize encryption module
     */
    init: function() {
      this.bindEvents();
      this.checkStoredPasswords();
      this.enhanceEncryptionUI();
    },

    /**
     * Bind event handlers
     */
    bindEvents: function() {
      var self = this;

      // Handle password form submission
      $(document).on('submit', '.hbe-form, #hexo-blog-encrypt', function(e) {
        var $form = $(this);
        var $input = $form.find('input[type="password"]');
        var $button = $form.find('button, input[type="submit"]');
        
        // Add loading state
        $button.addClass('is-loading').prop('disabled', true);
        
        // Store password on successful decryption (handled by plugin callback)
      });

      // Handle password input focus
      $(document).on('focus', '.hbe-input, .encrypt-password-input', function() {
        $(this).closest('.hbe-container, .encrypt-container').addClass('is-focused');
      });

      $(document).on('blur', '.hbe-input, .encrypt-password-input', function() {
        $(this).closest('.hbe-container, .encrypt-container').removeClass('is-focused');
      });

      // Handle Enter key in password input
      $(document).on('keypress', '.hbe-input, .encrypt-password-input', function(e) {
        if (e.which === 13) {
          e.preventDefault();
          $(this).closest('form').submit();
        }
      });

      // Clear error message on input
      $(document).on('input', '.hbe-input, .encrypt-password-input', function() {
        $(this).closest('.hbe-container, .encrypt-container')
          .find('.hbe-error, .encrypt-error')
          .fadeOut(self.config.animationDuration);
      });
    },

    /**
     * Check for stored passwords and auto-decrypt if valid
     */
    checkStoredPasswords: function() {
      var self = this;
      
      // Get current page identifier
      var pageId = this.getPageId();
      if (!pageId) return;

      // Check if password is stored for this page
      var storedData = this.getStoredPassword(pageId);
      if (storedData && storedData.password) {
        // Check if session is still valid
        if (Date.now() - storedData.timestamp < this.config.sessionDuration) {
          // Auto-fill password (plugin will handle decryption)
          var $input = $('.hbe-input, .encrypt-password-input').first();
          if ($input.length) {
            $input.val(storedData.password);
          }
        } else {
          // Session expired, remove stored password
          this.removeStoredPassword(pageId);
        }
      }
    },

    /**
     * Enhance the encryption UI with custom styling
     */
    enhanceEncryptionUI: function() {
      var self = this;

      // Wait for DOM to be ready
      setTimeout(function() {
        // Find encryption containers
        var $containers = $('#hexo-blog-encrypt, .hbe-container');
        
        $containers.each(function() {
          var $container = $(this);
          
          // Skip if already enhanced
          if ($container.hasClass('encrypt-enhanced')) return;
          
          $container.addClass('encrypt-enhanced');
          
          // Add custom wrapper if not present
          if (!$container.find('.encrypt-wrapper').length) {
            $container.wrapInner('<div class="encrypt-wrapper"></div>');
          }

          // Enhance input field
          var $input = $container.find('input[type="password"]');
          if ($input.length && !$input.hasClass('encrypt-password-input')) {
            $input.addClass('encrypt-password-input');
            $input.attr('placeholder', $input.attr('placeholder') || '请输入密码');
          }

          // Enhance submit button
          var $button = $container.find('button, input[type="submit"]');
          if ($button.length && !$button.hasClass('encrypt-submit-btn')) {
            $button.addClass('encrypt-submit-btn');
            
            // Add icon if not present
            if (!$button.find('i').length) {
              $button.prepend('<i class="fas fa-unlock"></i> ');
            }
          }

          // Add lock icon to header if not present
          var $header = $container.find('.hbe-header, h1, h2').first();
          if ($header.length && !$header.find('.fa-lock').length) {
            $header.prepend('<i class="fas fa-lock encrypt-lock-icon"></i> ');
          }
        });
      }, 100);
    },

    /**
     * Store password for a page
     * @param {string} pageId - Page identifier
     * @param {string} password - Password to store
     */
    storePassword: function(pageId, password) {
      if (!this.isStorageAvailable()) return;

      var data = {
        password: password,
        timestamp: Date.now()
      };

      try {
        sessionStorage.setItem(
          this.config.storagePrefix + pageId,
          JSON.stringify(data)
        );
      } catch (e) {
        console.warn('Failed to store password:', e);
      }
    },

    /**
     * Get stored password for a page
     * @param {string} pageId - Page identifier
     * @returns {object|null} Stored data or null
     */
    getStoredPassword: function(pageId) {
      if (!this.isStorageAvailable()) return null;

      try {
        var data = sessionStorage.getItem(this.config.storagePrefix + pageId);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.warn('Failed to retrieve password:', e);
        return null;
      }
    },

    /**
     * Remove stored password for a page
     * @param {string} pageId - Page identifier
     */
    removeStoredPassword: function(pageId) {
      if (!this.isStorageAvailable()) return;

      try {
        sessionStorage.removeItem(this.config.storagePrefix + pageId);
      } catch (e) {
        console.warn('Failed to remove password:', e);
      }
    },

    /**
     * Get current page identifier
     * @returns {string|null} Page ID or null
     */
    getPageId: function() {
      // Use pathname as page identifier
      var path = window.location.pathname;
      // Remove trailing slash and create a simple hash
      return path.replace(/\/$/, '').replace(/\//g, '_') || 'index';
    },

    /**
     * Check if sessionStorage is available
     * @returns {boolean} True if available
     */
    isStorageAvailable: function() {
      try {
        var test = '__storage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Show error message
     * @param {jQuery} $container - Container element
     * @param {string} message - Error message
     */
    showError: function($container, message) {
      var $error = $container.find('.hbe-error, .encrypt-error');
      
      if (!$error.length) {
        $error = $('<div class="encrypt-error"></div>');
        $container.find('form').append($error);
      }

      $error.text(message).fadeIn(this.config.animationDuration);
      
      // Shake animation
      $container.addClass('shake');
      setTimeout(function() {
        $container.removeClass('shake');
      }, 500);
    },

    /**
     * Handle successful decryption
     * @param {jQuery} $container - Container element
     */
    onDecryptSuccess: function($container) {
      var self = this;
      var pageId = this.getPageId();
      var password = $container.find('input[type="password"]').val();

      // Store password for session
      if (pageId && password) {
        this.storePassword(pageId, password);
      }

      // Add success animation
      $container.addClass('decrypt-success');
      
      setTimeout(function() {
        $container.fadeOut(self.config.animationDuration, function() {
          $(this).remove();
        });
      }, 500);
    }
  };

  // Initialize when DOM is ready
  $(document).ready(function() {
    Encryption.init();
  });

  // Expose to global scope for plugin callbacks
  window.DarkTechEncryption = Encryption;

})(jQuery);
