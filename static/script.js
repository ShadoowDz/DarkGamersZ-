// FBX to CS 1.6 MDL Converter - Client-side JavaScript

class FBXConverter {
    constructor() {
        this.currentFile = null;
        this.currentSessionId = null;
        this.pollInterval = null;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // File upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.removeFile = document.getElementById('removeFile');
        
        // Conversion elements
        this.convertBtn = document.getElementById('convertBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Result elements
        this.resultSection = document.getElementById('resultSection');
        this.resultSuccess = document.getElementById('resultSuccess');
        this.resultError = document.getElementById('resultError');
        this.conversionStats = document.getElementById('conversionStats');
        this.warnings = document.getElementById('warnings');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');
    }
    
    bindEvents() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFile.addEventListener('click', () => this.clearFile());
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // Conversion events
        this.convertBtn.addEventListener('click', () => this.startConversion());
        this.retryBtn.addEventListener('click', () => this.resetConverter());
        
        // Browse text click
        document.querySelector('.browse-text').addEventListener('click', () => this.fileInput.click());
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        this.processFile(file);
    }
    
    handleFileDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }
    
    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }
    
    processFile(file) {
        if (!file) return;
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.fbx')) {
            this.showError('Please select a valid FBX file.');
            return;
        }
        
        // Validate file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
            this.showError('File size too large. Please select a file smaller than 100MB.');
            return;
        }
        
        this.currentFile = file;
        this.displayFileInfo(file);
        this.enableConversion();
    }
    
    displayFileInfo(file) {
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        
        this.uploadArea.style.display = 'none';
        this.fileInfo.style.display = 'block';
        this.fileInfo.classList.add('fade-in');
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    enableConversion() {
        this.convertBtn.disabled = false;
        this.convertBtn.classList.add('pulse');
    }
    
    clearFile() {
        this.currentFile = null;
        this.fileInput.value = '';
        
        this.uploadArea.style.display = 'block';
        this.fileInfo.style.display = 'none';
        this.convertBtn.disabled = true;
        this.convertBtn.classList.remove('pulse');
        
        this.hideResults();
    }
    
    async startConversion() {
        if (!this.currentFile) {
            this.showError('Please select an FBX file first.');
            return;
        }
        
        try {
            this.showProgress();
            this.updateProgress(10, 'Uploading file...');
            
            // Create form data
            const formData = new FormData();
            formData.append('file', this.currentFile);
            
            // Upload file and start conversion
            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.currentSessionId = result.session_id;
            
            this.updateProgress(30, 'Processing file...');
            this.startPolling();
            
        } catch (error) {
            this.showError(`Conversion failed: ${error.message}`);
        }
    }
    
    startPolling() {
        this.pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/status/${this.currentSessionId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const status = await response.json();
                this.handleStatusUpdate(status);
                
            } catch (error) {
                this.stopPolling();
                this.showError(`Status check failed: ${error.message}`);
            }
        }, 1000);
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    handleStatusUpdate(status) {
        switch (status.status) {
            case 'processing':
                this.updateProgress(60, 'Converting FBX to MDL...');
                break;
                
            case 'completed':
                this.stopPolling();
                this.updateProgress(100, 'Conversion completed!');
                setTimeout(() => this.showSuccess(status.result), 500);
                break;
                
            case 'failed':
                this.stopPolling();
                this.showError(status.error || 'Conversion failed');
                break;
        }
    }
    
    showProgress() {
        this.hideResults();
        this.progressSection.style.display = 'block';
        this.progressSection.classList.add('fade-in');
        this.convertBtn.disabled = true;
    }
    
    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }
    
    showSuccess(result) {
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'block';
        this.resultSuccess.style.display = 'block';
        this.resultError.style.display = 'none';
        this.resultSection.classList.add('fade-in');
        
        // Display conversion statistics
        this.displayStats(result);
        
        // Display warnings if any
        if (result.warnings && result.warnings.length > 0) {
            this.displayWarnings(result.warnings);
        }
        
        // Setup download button
        this.downloadBtn.onclick = () => this.downloadFile();
        
        this.convertBtn.disabled = false;
    }
    
    displayStats(result) {
        const stats = [
            { label: 'Vertices', value: result.vertices || 0 },
            { label: 'Triangles', value: result.triangles || 0 },
            { label: 'Bones', value: result.bones || 0 },
            { label: 'Animations', value: result.animations || 0 },
            { label: 'Textures', value: result.textures || 0 },
            { label: 'File Size', value: this.formatFileSize(result.file_size || 0) }
        ];
        
        let statsHtml = '<h4>Conversion Statistics</h4>';
        stats.forEach(stat => {
            statsHtml += `
                <div class="stat-item">
                    <span>${stat.label}:</span>
                    <strong>${stat.value}</strong>
                </div>
            `;
        });
        
        this.conversionStats.innerHTML = statsHtml;
    }
    
    displayWarnings(warnings) {
        let warningsHtml = '<h4>Conversion Warnings</h4><ul>';
        warnings.forEach(warning => {
            warningsHtml += `<li>${warning}</li>`;
        });
        warningsHtml += '</ul>';
        
        this.warnings.innerHTML = warningsHtml;
        this.warnings.style.display = 'block';
    }
    
    async downloadFile() {
        try {
            const response = await fetch(`/download/${this.currentSessionId}`);
            
            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }
            
            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'converted.mdl';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            this.showError(`Download failed: ${error.message}`);
        }
    }
    
    showError(message) {
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'block';
        this.resultSuccess.style.display = 'none';
        this.resultError.style.display = 'block';
        this.resultSection.classList.add('fade-in');
        
        this.errorMessage.textContent = message;
        this.convertBtn.disabled = false;
        
        this.stopPolling();
    }
    
    hideResults() {
        this.resultSection.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.warnings.style.display = 'none';
    }
    
    resetConverter() {
        this.hideResults();
        this.clearFile();
        this.currentSessionId = null;
        this.stopPolling();
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-in');
    }, 100);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Initialize converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fbxConverter = new FBXConverter();
    
    // Add some helpful tooltips
    addTooltips();
});

function addTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = event.target.getAttribute('data-tooltip');
    
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    
    event.target._tooltip = tooltip;
}

function hideTooltip(event) {
    if (event.target._tooltip) {
        event.target._tooltip.remove();
        delete event.target._tooltip;
    }
}

// Add notification styles
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
}

.notification.fade-in {
    transform: translateX(0);
}

.notification-info {
    background: #3498db;
}

.notification-success {
    background: #27ae60;
}

.notification-warning {
    background: #f39c12;
}

.notification-error {
    background: #e74c3c;
}

.tooltip {
    position: absolute;
    background: #2c3e50;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.9rem;
    z-index: 1000;
    pointer-events: none;
}

.tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #2c3e50 transparent transparent transparent;
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);