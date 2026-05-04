// JavaScript for the CommandBar Pro new tab page

function createParticles() {
  const container = document.getElementById('particles');

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    container.appendChild(particle);
  }
}

function openFullCommandBar() {
  let attempts = 0;
  const maxAttempts = 15;

  function tryOpenCommandBar() {
    attempts++;

    if (typeof showCommandBar === 'function' && typeof i18n !== 'undefined') {
      try {
        showCommandBar();
        return true;
      } catch (error) {
        console.error('Error calling showCommandBar:', error);
      }
    }

    if (attempts < maxAttempts) {
      setTimeout(tryOpenCommandBar, 200);
    } else {
      createCommandBarDirectly();
    }
  }

  tryOpenCommandBar();
}

function createCommandBarDirectly() {
  if (document.getElementById('commandbar-container')) {
    return;
  }

  const commandBar = document.createElement('div');
  commandBar.id = 'commandbar-container';
  commandBar.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        border-radius: 16px;
        box-shadow: 0 32px 64px rgba(0,0,0,0.12);
        width: 90%;
        max-width: 640px;
        overflow: hidden;
        border: 1px solid rgba(0,0,0,0.1);
      ">
        <div style="
          padding: 24px;
          border-bottom: 1px solid #f0f0f0;
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        ">
          <input type="text"
                 id="basic-commandbar-input"
                 placeholder="Type command, search or URL..."
                 style="
                   width: 100%;
                   border: none;
                   outline: none;
                   font-size: 20px;
                   padding: 0;
                   background: transparent;
                   color: #1a1a1a;
                 ">
        </div>
        <div style="
          padding: 20px;
          color: #666;
          font-size: 14px;
          background: white;
        ">
          <div style="margin-bottom: 12px; font-weight: 600; color: #3b82f6;">⚡ CommandBar in new tab</div>
          <div style="margin-bottom: 12px; font-weight: 600;">📝 Available actions:</div>
          <div style="display: grid; gap: 6px;">
            <div>🌐 <strong>URLs:</strong> google.com, youtube.com, github.com</div>
            <div>🔍 <strong>Searches:</strong> pasta recipes, technology news</div>
            <div>⌨️ <strong>Commands:</strong> /new, /bookmarks, /history, /settings</div>
          </div>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #888;">
            Press <kbd style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Escape</kbd> to close
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(commandBar);

  const input = document.getElementById('basic-commandbar-input');
  if (input) {
    input.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      commandBar.remove();
      document.removeEventListener('keydown', handleKeyDown);
    } else if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        handleQuery(query);
        commandBar.remove();
        document.removeEventListener('keydown', handleKeyDown);
      }
    }
  }

  document.addEventListener('keydown', handleKeyDown);

  commandBar.addEventListener('click', (e) => {
    if (e.target === commandBar) {
      commandBar.remove();
      document.removeEventListener('keydown', handleKeyDown);
    }
  });
}

function handleQuery(query) {

  if (query.includes('.') && !query.includes(' ')) {
    const url = query.startsWith('http') ? query : 'https://' + query;
    window.location.href = url;
  } else if (query.startsWith('/')) {
    handleCommand(query);
  } else {
    const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    window.location.href = searchUrl;
  }
}

function handleCommand(command) {
  const cmd = command.toLowerCase();

  switch (cmd) {
    case '/new':
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'create_tab', url: 'chrome://newtab/' });
      }
      break;
    case '/bookmarks':
      window.location.href = 'chrome://bookmarks/';
      break;
    case '/history':
      window.location.href = 'chrome://history/';
      break;
    default:
      const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(command);
      window.location.href = searchUrl;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  createParticles();

  setTimeout(() => {
    openFullCommandBar();
  }, 1000);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggle_commandbar') {
    openFullCommandBar();
  }
  sendResponse({ success: true });
});
