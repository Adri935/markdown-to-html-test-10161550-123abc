// Helper functions
function parseDataUrl(url) {
  if (!url.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }
  
  const commaIndex = url.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URL format');
  }
  
  const header = url.substring(5, commaIndex); // Remove 'data:' prefix
  const payload = url.substring(commaIndex + 1);
  
  const parts = header.split(';');
  const mime = parts[0] || 'text/plain';
  const isBase64 = parts.includes('base64');
  
  return { mime, isBase64, payload };
}

function decodeBase64ToText(b64) {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (error) {
    throw new Error('Failed to decode base64 data');
  }
}

function urlDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch (error) {
    throw new Error('Failed to decode URL data');
  }
}

// Tab switching functionality
function setupTabs(markdownText) {
  const htmlTab = document.getElementById('tab-html');
  const sourceTab = document.getElementById('tab-source');
  const outputElement = document.getElementById('markdown-output');
  const sourceElement = document.getElementById('markdown-source');
  
  // Set the source content
  sourceElement.value = markdownText;
  
  htmlTab.addEventListener('click', () => {
    htmlTab.classList.add('active');
    sourceTab.classList.remove('active');
    outputElement.classList.remove('hidden');
    sourceElement.classList.add('hidden');
  });
  
  sourceTab.addEventListener('click', () => {
    sourceTab.classList.add('active');
    htmlTab.classList.remove('active');
    sourceElement.classList.remove('hidden');
    outputElement.classList.add('hidden');
  });
}

// Main application
async function loadMarkdownContent() {
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const outputElement = document.getElementById('markdown-output');
  const errorMessageElement = document.getElementById('error-message');
  
  // Show loading state
  loadingElement.classList.remove('hidden');
  errorElement.classList.add('hidden');
  outputElement.innerHTML = '';
  
  try {
    // Get the markdown file URL from attachments
    const attachments = [
      {
        "name": "input.md",
        "url": "data:text/markdown;base64,aGVsbG8KIyBUaXRsZQ=="
      }
    ];
    
    const markdownAttachment = attachments.find(att => att.name === 'input.md');
    
    if (!markdownAttachment) {
      throw new Error('Markdown file not found in attachments');
    }
    
    let markdownText = '';
    
    if (markdownAttachment.url.startsWith('data:')) {
      // Handle data URL
      const { mime, isBase64, payload } = parseDataUrl(markdownAttachment.url);
      
      if (!mime.startsWith('text/') && mime !== 'application/json' && !mime.includes('markdown')) {
        throw new Error('Invalid MIME type for Markdown content');
      }
      
      if (isBase64) {
        markdownText = decodeBase64ToText(payload);
      } else {
        markdownText = urlDecode(payload);
      }
    } else {
      // Handle regular URL
      const response = await fetch(markdownAttachment.url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Markdown file: ${response.status} ${response.statusText}`);
      }
      
      markdownText = await response.text();
    }
    
    // Convert Markdown to HTML
    if (typeof marked === 'undefined') {
      throw new Error('Marked library not loaded');
    }
    
    marked.setOptions({
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    });
    
    const htmlContent = marked.parse(markdownText);
    
    // Render HTML
    outputElement.innerHTML = htmlContent;
    
    // Highlight code blocks
    outputElement.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
    
    // Setup tabs
    setupTabs(markdownText);
    
  } catch (error) {
    console.error('Error processing Markdown:', error);
    errorMessageElement.textContent = error.message;
    errorElement.classList.remove('hidden');
  } finally {
    loadingElement.classList.add('hidden');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadMarkdownContent();
});