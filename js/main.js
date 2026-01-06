// Dark Tech Theme - Main JavaScript

(function($) {
  'use strict';

  // ============================================
  // Code Copy Functionality
  // ============================================
  
  /**
   * Initialize code copy buttons for all code blocks
   */
  function initCodeCopy() {
    // Find all code blocks
    var $codeBlocks = $('figure.highlight');
    
    if ($codeBlocks.length === 0) {
      return;
    }
    
    $codeBlocks.each(function() {
      var $figure = $(this);
      
      // Skip if already has copy button
      if ($figure.find('.code-copy-btn').length > 0) {
        return;
      }
      
      // Add class to indicate copy button is present
      $figure.addClass('has-copy-btn');
      
      // Create copy button
      var $copyBtn = $('<button>', {
        'class': 'code-copy-btn',
        'type': 'button',
        'aria-label': 'Copy code to clipboard',
        'data-tooltip': 'Copy'
      }).html('<i class="fas fa-copy"></i>');
      
      // Append button to figure
      $figure.append($copyBtn);
      
      // Handle click event
      $copyBtn.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var $btn = $(this);
        var $code = $figure.find('.code pre');
        
        if ($code.length === 0) {
          return;
        }
        
        // Get the code text
        var codeText = getCodeText($code);
        
        // Copy to clipboard
        copyToClipboard(codeText, $btn);
      });
    });
  }
  
  /**
   * Extract clean code text from code block
   * @param {jQuery} $code - The code pre element
   * @returns {string} - Clean code text
   */
  function getCodeText($code) {
    // Clone the element to avoid modifying the original
    var $clone = $code.clone();
    
    // Remove any line number elements if they exist in the code
    $clone.find('.line-number, .gutter').remove();
    
    // Get text content, preserving line breaks
    var lines = [];
    $clone.find('.line').each(function() {
      lines.push($(this).text());
    });
    
    // If no .line elements found, get the raw text
    if (lines.length === 0) {
      return $clone.text();
    }
    
    return lines.join('\n');
  }
  
  /**
   * Copy text to clipboard with fallback for older browsers
   * @param {string} text - Text to copy
   * @param {jQuery} $btn - The copy button element
   */
  function copyToClipboard(text, $btn) {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(function() {
          showCopySuccess($btn);
        })
        .catch(function(err) {
          console.error('Failed to copy:', err);
          // Fallback to execCommand
          fallbackCopy(text, $btn);
        });
    } else {
      // Fallback for older browsers or non-secure contexts
      fallbackCopy(text, $btn);
    }
  }
  
  /**
   * Fallback copy method using execCommand
   * @param {string} text - Text to copy
   * @param {jQuery} $btn - The copy button element
   */
  function fallbackCopy(text, $btn) {
    // Create a temporary textarea
    var $textarea = $('<textarea>', {
      'class': 'sr-only',
      'aria-hidden': 'true',
      'style': 'position: fixed; top: -9999px; left: -9999px;'
    }).val(text);
    
    $('body').append($textarea);
    
    // Select and copy
    $textarea[0].select();
    $textarea[0].setSelectionRange(0, text.length);
    
    try {
      var successful = document.execCommand('copy');
      if (successful) {
        showCopySuccess($btn);
      } else {
        showCopyError($btn);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showCopyError($btn);
    }
    
    // Clean up
    $textarea.remove();
  }
  
  /**
   * Show success feedback on copy button
   * @param {jQuery} $btn - The copy button element
   */
  function showCopySuccess($btn) {
    var originalTooltip = $btn.attr('data-tooltip');
    
    // Update button state
    $btn
      .addClass('copied')
      .removeClass('copy-error')
      .attr('data-tooltip', 'Copied!')
      .html('<i class="fas fa-check"></i>');
    
    // Reset after delay
    setTimeout(function() {
      $btn
        .removeClass('copied')
        .attr('data-tooltip', originalTooltip)
        .html('<i class="fas fa-copy"></i>');
    }, 2000);
  }
  
  /**
   * Show error feedback on copy button
   * @param {jQuery} $btn - The copy button element
   */
  function showCopyError($btn) {
    var originalTooltip = $btn.attr('data-tooltip');
    
    // Update button state
    $btn
      .addClass('copy-error')
      .removeClass('copied')
      .attr('data-tooltip', 'Failed!')
      .html('<i class="fas fa-times"></i>');
    
    // Reset after delay
    setTimeout(function() {
      $btn
        .removeClass('copy-error')
        .attr('data-tooltip', originalTooltip)
        .html('<i class="fas fa-copy"></i>');
    }, 2000);
  }
  
  // Initialize code copy on document ready
  $(document).ready(function() {
    initCodeCopy();
  });

  // Mobile menu toggle
  var $mobileMenuToggle = $('#mobile-menu-toggle');
  var $mainNav = $('#main-nav');
  
  $mobileMenuToggle.on('click', function() {
    var isExpanded = $(this).attr('aria-expanded') === 'true';
    $(this).attr('aria-expanded', !isExpanded);
    $mainNav.toggleClass('is-open');
    
    // Prevent body scroll when menu is open
    if (!isExpanded) {
      $('body').css('overflow', 'hidden');
    } else {
      $('body').css('overflow', '');
    }
  });
  
  // Close mobile menu when clicking on a link
  $mainNav.find('.nav-link').on('click', function() {
    if (window.innerWidth < 768) {
      $mobileMenuToggle.attr('aria-expanded', 'false');
      $mainNav.removeClass('is-open');
      $('body').css('overflow', '');
    }
  });
  
  // Close mobile menu on window resize
  $(window).on('resize', function() {
    if (window.innerWidth >= 768) {
      $mobileMenuToggle.attr('aria-expanded', 'false');
      $mainNav.removeClass('is-open');
      $('body').css('overflow', '');
    }
  });

  // Search toggle
  var $searchToggle = $('#search-toggle');
  var $searchFormWrap = $('#search-form-wrap');
  var $searchInput = $('#search-input');
  var $searchClose = $('.search-close');
  
  $searchToggle.on('click', function(e) {
    e.stopPropagation();
    $searchFormWrap.toggleClass('is-open');
    if ($searchFormWrap.hasClass('is-open')) {
      $searchInput.focus();
    }
  });
  
  $searchClose.on('click', function() {
    $searchFormWrap.removeClass('is-open');
    $searchInput.val('');
    $('#search-results').empty();
  });
  
  // Close search when clicking outside
  $(document).on('click', function(e) {
    if (!$(e.target).closest('.header-search').length) {
      $searchFormWrap.removeClass('is-open');
    }
  });
  
  // Prevent search form wrap clicks from closing
  $searchFormWrap.on('click', function(e) {
    e.stopPropagation();
  });

  // Smooth scroll for anchor links
  $('a[href^="#"]').on('click', function(e) {
    var target = $(this.hash);
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({
        scrollTop: target.offset().top - 80 // Account for sticky header
      }, 500);
    }
  });
  
  // Add scroll class to header
  var $header = $('#header');
  var lastScrollTop = 0;
  
  $(window).on('scroll', function() {
    var scrollTop = $(this).scrollTop();
    
    if (scrollTop > 50) {
      $header.addClass('is-scrolled');
    } else {
      $header.removeClass('is-scrolled');
    }
    
    // Hide/show header on scroll direction
    if (scrollTop > lastScrollTop && scrollTop > 200) {
      $header.addClass('is-hidden');
    } else {
      $header.removeClass('is-hidden');
    }
    
    lastScrollTop = scrollTop;
  });

})(jQuery);


// ============================================
// Image Lightbox - 图片点击放大
// ============================================

(function() {
  'use strict';
  
  // 创建 lightbox 容器
  var lightbox = document.createElement('div');
  lightbox.className = 'img-lightbox';
  lightbox.innerHTML = `
    <img src="" alt="放大图片">
    <div class="img-lightbox-toolbar">
      <a class="img-lightbox-btn" id="lightbox-open-new" href="" target="_blank">在新标签页打开原图</a>
      <button class="img-lightbox-btn" id="lightbox-close">关闭 (ESC)</button>
    </div>
    <div class="img-lightbox-info" id="lightbox-info"></div>
  `;
  document.body.appendChild(lightbox);
  
  var lightboxImg = lightbox.querySelector('img');
  var openNewBtn = document.getElementById('lightbox-open-new');
  var closeBtn = document.getElementById('lightbox-close');
  var infoDiv = document.getElementById('lightbox-info');
  
  // 关闭 lightbox 函数
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // 点击文章中的图片放大
  document.addEventListener('click', function(e) {
    var target = e.target;
    
    // 检查是否点击了文章中的图片
    if (target.tagName === 'IMG' && target.closest('.article-entry')) {
      e.preventDefault();
      e.stopPropagation();
      
      var imgSrc = target.src;
      lightboxImg.src = imgSrc;
      openNewBtn.href = imgSrc;
      
      // 获取图片原始尺寸
      var tempImg = new Image();
      tempImg.onload = function() {
        var w = tempImg.naturalWidth;
        var h = tempImg.naturalHeight;
        infoDiv.textContent = '原始尺寸: ' + w + ' × ' + h + ' 像素';
        
        // 如果图片分辨率较低，显示提示
        if (w < 1000) {
          infoDiv.textContent += ' (提示: 图片分辨率较低，可能在高清屏幕上显示模糊)';
        }
      };
      tempImg.src = imgSrc;
      
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
  
  // 点击 lightbox 背景关闭（但不包括工具栏）
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox || e.target === lightboxImg) {
      closeLightbox();
    }
  });
  
  // 关闭按钮
  closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeLightbox();
  });
  
  // 阻止工具栏点击冒泡
  openNewBtn.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // ESC 键关闭
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
})();
