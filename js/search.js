class SearchManager {
    constructor() {
        this.index = null;
        this.searchData = null;
        this.initialize();
    }

    async initialize() {
        await this.loadIndex();
        if (!this.index) {
            console.error('Search index failed to initialize');
            return;
        }
        this.initializeSearch();
    }

    async loadIndex() {
        try {
            const response = await fetch('/search.json');
            this.searchData = await response.json();
            
            const self = this;
            this.index = lunr(function() {
                this.ref('url');
                this.field('title', { boost: 10 });
                this.field('content', { boost: 1 });
                
                this.pipeline.remove(lunr.stemmer);
                this.searchPipeline.remove(lunr.stemmer);
                
                if (self.searchData) {
                    self.searchData.forEach(doc => {
                        this.add(doc);
                    });
                }
            });
        } catch (error) {
            console.error('Error loading search index:', error);
        }
    }

    initializeSearch() {
        const searchInput = document.getElementById('global-search');
        const resultsContainer = document.getElementById('search-results');

        // 设置输入框样式
        searchInput.style.outline = 'none';
        searchInput.style.boxShadow = 'none';
        searchInput.style.borderRadius = '20px';
        searchInput.style.width = '300px';
        searchInput.style.marginRight = '20px';  // 添加右侧间距
        
        // 搜索结果容器的定位和尺寸样式
        resultsContainer.style.position = 'absolute';
        resultsContainer.style.maxHeight = '300px'; // 添加最大高度限制
        resultsContainer.style.overflowY = 'auto';  // 启用垂直滚动
        resultsContainer.style.width = '300px';  // 让结果容器宽度与输入框一致
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                const results = this.search(query);
                this.displayResults(results);
            } else {
                resultsContainer.innerHTML = '';
                resultsContainer.classList.remove('show');
            }
        });
    }

    search(query) {
        if (!this.index) {
            console.warn('Search index not initialized');
            return [];
        }
        
        const terms = query.split(/\s+/)
                          .map(term => term + '*')
                          .join(' ');
        
        return this.index.search(terms).map(result => {
            const doc = this.searchData.find(d => d.url === result.ref);
            return doc ? { ...doc, score: result.score } : null;
        }).filter(Boolean);
    }

    displayResults(results) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = results
            .map(result => this.createResultItem(result))
            .join('');
        resultsContainer.classList.add('show');
    }

    createResultItem(result) {
        const excerpt = this.createExcerpt(result.content, 50);
        let finalUrl = result.url;
        if (!finalUrl.startsWith('/') && !finalUrl.startsWith('http')) {
            finalUrl = '/' + finalUrl;
        }
        return `
            <a class="dropdown-item" href="${finalUrl}">
                <div class="search-result-item">
                    <h6 style="font-size: 0.9rem; margin-bottom: 0.2rem;">${result.title}</h6>
                    <small class="text-muted" style="font-size: 0.8rem;">${excerpt}</small>
                </div>
            </a>
        `;
    }

    createExcerpt(text, maxLength) {
        const ellipsis = text.length > maxLength ? '...' : '';
        return text.substring(0, maxLength) + ellipsis;
    }
}

// 初始化搜索功能
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
}); 