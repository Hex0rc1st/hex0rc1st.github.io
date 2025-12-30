/**
 * Local Search Functionality
 * Implements real-time search with keyword highlighting
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

(function($) {
  'use strict';

  /**
   * SearchEngine class - handles local search functionality
   */
  class SearchEngine {
    constructor(options) {
      this.options = Object.assign({
        searchPath: '/search.json',
        searchInput: '#search-input',
        searchResults: '#search-results',
        searchToggle: '#search-toggle',
        searchFormWrap: '#search-form-wrap',
        searchClose: '.search-close',
        highlightClass: 'search-highlight',
        noResultsText: 'No results found',
        loadingText: 'Loading...',
        minChars: 2
      }, options);

      this.searchData = null;
      this.isLoading = false;
      this.isOpen = false;

      this.init();
    }

    /**
     * Initialize search functionality
     */
    init() {
      this.$searchInput = $(this.options.searchInput);
      this.$searchResults = $(this.options.searchResults);
      this.$searchToggle = $(this.options.searchToggle);
      this.$searchFormWrap = $(this.options.searchFormWrap);
      this.$searchClose = $(this.options.searchClose);

      if (!this.$searchInput.length) {
        return;
      }

      this.bindEvents();
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
      // Toggle search form
      this.$searchToggle.on('click', (e) => {
        e.preventDefault();
        this.toggleSearch();
      });

      // Close search
      this.$searchClose.on('click', (e) => {
        e.preventDefault();
        this.closeSearch();
      });

      // Handle input changes with debounce
      let debounceTimer;
      this.$searchInput.on('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 200);
      });

      // Prevent form submission
      this.$searchInput.closest('form').on('submit', (e) => {
        e.preventDefault();
      });

      // Close on escape key
      $(document).on('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeSearch();
        }
      });

      // Close when clicking outside
      $(document).on('click', (e) => {
        if (this.isOpen && 
            !$(e.target).closest('.header-search').length) {
          this.closeSearch();
        }
      });
    }

    /**
     * Toggle search form visibility
     */
    toggleSearch() {
      if (this.isOpen) {
        this.closeSearch();
      } else {
        this.openSearch();
      }
    }

    /**
     * Open search form
     */
    openSearch() {
      this.isOpen = true;
      this.$searchFormWrap.addClass('is-open');
      this.$searchInput.focus();
      
      // Load search data if not already loaded
      if (!this.searchData && !this.isLoading) {
        this.loadSearchData();
      }
    }

    /**
     * Close search form and clear results
     * Requirement 4.5: Clear search and restore original state
     */
    closeSearch() {
      this.isOpen = false;
      this.$searchFormWrap.removeClass('is-open');
      this.$searchInput.val('');
      this.$searchResults.empty();
    }

    /**
     * Load search index data
     */
    async loadSearchData() {
      this.isLoading = true;
      this.$searchResults.html(`<div class="search-loading">${this.options.loadingText}</div>`);

      try {
        const response = await fetch(this.options.searchPath);
        if (!response.ok) {
          throw new Error('Failed to load search data');
        }
        const data = await response.json();
        this.searchData = this.processSearchData(data);
        this.$searchResults.empty();
        
        // If there's already input, perform search
        const currentValue = this.$searchInput.val();
        if (currentValue && currentValue.length >= this.options.minChars) {
          this.handleSearch(currentValue);
        }
      } catch (error) {
        console.error('Search data load error:', error);
        this.$searchResults.html('<div class="search-error">Failed to load search data</div>');
      } finally {
        this.isLoading = false;
      }
    }

    /**
     * Process raw search data into searchable format
     */
    processSearchData(data) {
      // Handle different data formats from hexo-generator-search
      const posts = Array.isArray(data) ? data : (data.posts || []);
      
      return posts.map(post => ({
        title: post.title || '',
        url: post.url || post.path || '',
        content: this.stripHtml(post.content || ''),
        tags: this.extractTags(post.tags),
        categories: this.extractCategories(post.categories)
      }));
    }

    /**
     * Strip HTML tags from content
     */
    stripHtml(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }

    /**
     * Extract tag names from tags data
     */
    extractTags(tags) {
      if (!tags) return [];
      if (Array.isArray(tags)) {
        return tags.map(tag => typeof tag === 'string' ? tag : (tag.name || ''));
      }
      return [];
    }

    /**
     * Extract category names from categories data
     */
    extractCategories(categories) {
      if (!categories) return [];
      if (Array.isArray(categories)) {
        return categories.map(cat => typeof cat === 'string' ? cat : (cat.name || ''));
      }
      return [];
    }

    /**
     * Handle search input
     * Requirement 4.1: Real-time search as user types
     */
    handleSearch(keyword) {
      keyword = keyword.trim();

      // Clear results if keyword is too short
      if (keyword.length < this.options.minChars) {
        this.$searchResults.empty();
        return;
      }

      // Wait for data to load
      if (!this.searchData) {
        if (!this.isLoading) {
          this.loadSearchData();
        }
        return;
      }

      const results = this.search(keyword);
      this.renderResults(results, keyword);
    }

    /**
     * Search through posts
     * Requirement 4.2: Search in title, content, and tags
     */
    search(keyword) {
      const keywordLower = keyword.toLowerCase();
      const results = [];

      for (const post of this.searchData) {
        const titleMatch = post.title.toLowerCase().includes(keywordLower);
        const contentMatch = post.content.toLowerCase().includes(keywordLower);
        const tagMatch = post.tags.some(tag => 
          tag.toLowerCase().includes(keywordLower)
        );
        const categoryMatch = post.categories.some(cat => 
          cat.toLowerCase().includes(keywordLower)
        );

        if (titleMatch || contentMatch || tagMatch || categoryMatch) {
          // Calculate relevance score
          let score = 0;
          if (titleMatch) score += 10;
          if (tagMatch) score += 5;
          if (categoryMatch) score += 3;
          if (contentMatch) score += 1;

          results.push({
            ...post,
            score,
            matchedIn: {
              title: titleMatch,
              content: contentMatch,
              tags: tagMatch,
              categories: categoryMatch
            }
          });
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score);

      return results;
    }

    /**
     * Render search results
     * Requirement 4.3: Highlight matching keywords
     * Requirement 4.4: Show friendly message when no results
     */
    renderResults(results, keyword) {
      if (results.length === 0) {
        this.$searchResults.html(
          `<div class="search-no-results">
            <i class="fas fa-search"></i>
            <p>${this.options.noResultsText}</p>
            <p class="search-suggestion">Try different keywords</p>
          </div>`
        );
        return;
      }

      const html = results.map(result => {
        const highlightedTitle = this.highlight(result.title, keyword);
        const excerpt = this.getExcerpt(result.content, keyword);
        const highlightedExcerpt = this.highlight(excerpt, keyword);
        
        // Build tags HTML if matched
        let tagsHtml = '';
        if (result.tags.length > 0) {
          const highlightedTags = result.tags
            .slice(0, 3)
            .map(tag => `<span class="search-result-tag">${this.highlight(tag, keyword)}</span>`)
            .join('');
          tagsHtml = `<div class="search-result-tags">${highlightedTags}</div>`;
        }

        return `
          <a href="${result.url}" class="search-result-item">
            <div class="search-result-title">${highlightedTitle}</div>
            <div class="search-result-excerpt">${highlightedExcerpt}</div>
            ${tagsHtml}
          </a>
        `;
      }).join('');

      this.$searchResults.html(html);
    }

    /**
     * Highlight keyword in text
     * Requirement 4.3: Highlight matching keywords
     */
    highlight(text, keyword) {
      if (!text || !keyword) return text;
      
      // Escape special regex characters in keyword
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedKeyword})`, 'gi');
      
      return text.replace(regex, `<mark class="${this.options.highlightClass}">$1</mark>`);
    }

    /**
     * Get excerpt around keyword match
     */
    getExcerpt(content, keyword, maxLength = 150) {
      if (!content) return '';
      
      const keywordLower = keyword.toLowerCase();
      const contentLower = content.toLowerCase();
      const index = contentLower.indexOf(keywordLower);

      if (index === -1) {
        // No match in content, return beginning
        return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
      }

      // Calculate excerpt boundaries
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + keyword.length + 100);
      
      let excerpt = content.substring(start, end);
      
      // Add ellipsis if needed
      if (start > 0) excerpt = '...' + excerpt;
      if (end < content.length) excerpt = excerpt + '...';

      return excerpt;
    }
  }

  // Initialize search when DOM is ready
  $(document).ready(function() {
    // Get search path from theme config or use default
    const searchPath = window.searchConfig?.path || '/search.json';
    
    new SearchEngine({
      searchPath: searchPath
    });
  });

})(jQuery);
