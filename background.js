// Check if URL matches any excluded pattern
function isUrlExcluded(url, patterns) {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some(pattern => {
    try {
      return new RegExp(pattern).test(url);
    } catch (e) {
      return false;
    }
  });
}

// Service Worker para CommandBar Pro
chrome.runtime.onInstalled.addListener((details) => {
  // Abrir página de opciones al instalar
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
  
  // CARGAR CACHE ULTRA al instalar
  loadUltraCache();
  
  // Verificar cache ULTRA cada 5 minutos para asegurar que siempre esté cargado y válido
  setInterval(async () => {
    if ((!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) && !ULTRA_CACHE.state.isLoading) {
      console.log('🔄 Verificación automática: Cache ULTRA no cargado o inválido, cargando...');
      await loadUltraCache();
    }
  }, 5 * 60 * 1000); // 5 minutos
});

// Cargar cache ULTRA al arrancar la extensión
chrome.runtime.onStartup.addListener(() => {
  console.log('CommandBar iniciado');
  
  // CARGAR CACHE ULTRA al arrancar
  loadUltraCache();
  
  // Verificar cache ULTRA cada 5 minutos para asegurar que siempre esté cargado y válido
  setInterval(async () => {
    if ((!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) && !ULTRA_CACHE.state.isLoading) {
      console.log('🔄 Verificación automática: Cache ULTRA no cargado o inválido, cargando...');
      await loadUltraCache();
    }
  }, 5 * 60 * 1000); // 5 minutos
});

// Auto-actualizar cache ULTRA cuando se visita una página
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    updateUltraCache(tab.url, tab.title || '');
  }
});

// Trackear uso de la página de opciones
async function trackOptionsPageOpened() {
  try {
    // Verificar si el usuario tiene habilitadas las estadísticas
    const { storeUsageStats } = await chrome.storage.sync.get(['storeUsageStats']);
    
    if (storeUsageStats === true) {
      const result = await chrome.storage.local.get(['usage_stats']);
      const stats = result.usage_stats || {};
      const today = new Date().toDateString();
      
      if (!stats[today]) {
        stats[today] = {};
      }
      
      stats[today]['options_page_opened'] = (stats[today]['options_page_opened'] || 0) + 1;
      
      await chrome.storage.local.set({ usage_stats: stats });
    }
  } catch (error) {
    console.error('Error tracking options page:', error);
  }
}

// Función genérica para tracking de uso
async function trackUsage(action, details = {}) {
  try {
    // Verificar si el usuario tiene habilitadas las estadísticas
    const { storeUsageStats } = await chrome.storage.sync.get(['storeUsageStats']);
    
    if (storeUsageStats === true) {
      const result = await chrome.storage.local.get(['usage_stats']);
      const stats = result.usage_stats || {};
      const today = new Date().toDateString();
      
      if (!stats[today]) {
        stats[today] = {};
      }
      
      // Incrementar contador de la acción
      stats[today][action] = (stats[today][action] || 0) + 1;
      
      // Agregar detalles específicos si se proporcionan
      if (Object.keys(details).length > 0) {
        const detailsKey = `${action}_details`;
        if (!stats[today][detailsKey]) {
          stats[today][detailsKey] = {};
        }
        
        Object.entries(details).forEach(([key, value]) => {
          stats[today][detailsKey][key] = (stats[today][detailsKey][key] || 0) + 1;
        });
      }
      
      await chrome.storage.local.set({ usage_stats: stats });
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

// Función para inyección forzada en sitios problemáticos
async function forceInjectCommandBar(tabId, action = 'toggle_commandbar', currentUrl = null) {
  try {
    
    // Verificar que la pestaña sea accesible
    const tab = await chrome.tabs.get(tabId);
    
    // Check if URL is in excluded websites list
    const { excludedWebsites } = await chrome.storage.sync.get(['excludedWebsites']);
    if (tab.url && isUrlExcluded(tab.url, excludedWebsites)) {
      return false;
    }

    // NUEVA LÓGICA: Permitir inyección en nuestras páginas de extensión
    const isOurExtensionPage = tab.url?.includes(chrome.runtime.id) && tab.url?.includes('new_tab.html');
    
    // Si es nuestra página, no necesita inyección - es auto-suficiente
    if (isOurExtensionPage) {
      return true; // Reportar éxito ya que la página se maneja sola
    }
    
    // No intentar inyectar en páginas internas de Chrome (EXCEPTO las nuestras)
    if ((tab.url?.startsWith('chrome://') || 
         tab.url?.startsWith('chrome-extension://') || 
         tab.url?.startsWith('edge://') ||
         tab.url?.startsWith('devtools://')) && !isOurExtensionPage) {
      return false;
    }
    
    
    // PASO 1: Inyectar i18n.js primero
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['i18n.js']
      });
    } catch (error) {
      console.error('Error inyectando i18n.js:', error.message);
    }
    
    // PASO 2: Inyectar styles.css
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['styles.css']
      });
    } catch (error) {
      console.error('Error inyectando styles.css:', error.message);
    }
    
    // PASO 3: Inyectar content.js completo
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    } catch (error) {
      console.error('Error inyectando content.js:', error.message);
    }
    
    // PASO 4: Esperar un momento y activar CommandBar
    setTimeout(async () => {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: function(action, currentUrl) {
            
            // Verificar que las funciones del CommandBar estén disponibles
            if (typeof showCommandBar === 'function') {
              
              if (action === 'edit_current_url' && currentUrl) {
                // Limpiar URL para modo edición
                const cleanUrl = currentUrl.replace(/^https?:\/\/(www\.)?/, '').split('?')[0];
                showCommandBar(cleanUrl);
              } else {
                showCommandBar();
              }
              
            } else if (typeof toggleCommandBar === 'function') {
              toggleCommandBar();
            } else {
              
              // Fallback: crear versión básica mejorada solo si no hay otra opción
              
              // Verificar si ya existe CommandBar
              const existingBar = document.getElementById('commandbar-container') || document.getElementById('perplexity-commandbar');
              if (existingBar) {
                existingBar.remove();
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
                  padding-top: 10vh;
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
                             id="commandbar-input" 
                             placeholder="${action === 'edit_current_url' ? 'Editar URL actual...' : 'Escribe comando, búsqueda o URL...'}" 
                             value="${action === 'edit_current_url' && currentUrl ? currentUrl.replace(/^https?:\/\/(www\.)?/, '').split('?')[0] : ''}"
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
                      <div style="margin-bottom: 12px; font-weight: 600; color: #f59e0b;">⚠️ Modo de compatibilidad básico</div>
                      <div style="margin-bottom: 12px; font-weight: 600;">⚡ Acciones disponibles:</div>
                      <div style="display: grid; gap: 6px;">
                        <div>🌐 <strong>URLs:</strong> google.com, youtube.com, github.com</div>
                        <div>🔍 <strong>Búsquedas:</strong> recetas de pasta, noticias tecnología</div>
                        <div>⌨️ <strong>Comandos:</strong> /nueva, /marcadores, /historial, /configuracion</div>
                      </div>
                      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #888;">
                        Presiona <kbd style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Escape</kbd> para cerrar
                      </div>
                    </div>
                  </div>
                </div>
              `;
              
              document.body.appendChild(commandBar);
              
              // Enfocar el input
              const input = document.getElementById('commandbar-input');
              if (input) {
                input.focus();
                if (action === 'edit_current_url') {
                  input.select();
                }
              }
              
              // Manejar eventos básicos
              function handleKeyDown(e) {
                if (e.key === 'Escape') {
                  commandBar.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                } else if (e.key === 'Enter') {
                  const query = input.value.trim();
                  if (query) {
                    handleQuery(query, action === 'edit_current_url');
                    commandBar.remove();
                    document.removeEventListener('keydown', handleKeyDown);
                  }
                }
              }
              
              function handleQuery(query, editMode = false) {
                let url;
                
                // Detectar si es URL
                if (query.includes('.') && !query.includes(' ')) {
                  url = query.startsWith('http') ? query : 'https://' + query;
                } else if (query.startsWith('/')) {
                  // Comandos básicos
                  switch (query.toLowerCase()) {
                    case '/nueva':
                    case '/new':
                      url = 'chrome://newtab/';
                      break;
                    case '/marcadores':
                    case '/bookmarks':
                      url = 'chrome://bookmarks/';
                      break;
                    case '/historial':
                    case '/history':
                      url = 'chrome://history/';
                      break;
                    case '/configuracion':
                    case '/settings':
                      url = 'chrome://settings/';
                      break;
                    default:
                      url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                  }
                } else {
                  // Búsqueda web
                  url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                }
                
                if (editMode) {
                  window.location.href = url;
                } else {
                  window.open(url, '_blank');
                }
              }
              
              document.addEventListener('keydown', handleKeyDown);
              
              // Cerrar al hacer clic fuera
              commandBar.addEventListener('click', (e) => {
                if (e.target === commandBar) {
                  commandBar.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                }
              });
            }
          },
          args: [action, currentUrl]
        });
        
      } catch (activationError) {
        console.error('Error activando CommandBar tras inyección:', activationError);
      }
    }, 300); // Dar tiempo para que los scripts se inicialicen
    
    return true;
    
  } catch (error) {
    console.error('Error en inyección forzada:', error);
    return false;
  }
}

// Manejar mensajes desde content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'track_usage':
      trackUsage(message.usage_action, message.usage_details);
      sendResponse({ success: true });
      return true;
      
    case 'search_tabs':
      searchTabs(message.query, sendResponse);
      return true;
    
    case 'search_bookmarks':
      searchBookmarks(message.query, sendResponse);
      return true;
    
    case 'search_history':
      searchHistory(message.query, sendResponse);
      return true;
    
    case 'create_tab':
      createTab(message.url, message.active, sendResponse, message.fromCommandBar);
      return true;
    
    case 'create_window':
      createWindow(message.url, sendResponse);
      return true;
    
    case 'create_incognito_window':
      createIncognitoWindow(message.url, sendResponse);
      return true;
    
    case 'reload_tab':
      reloadTab(message.tabId, sendResponse);
      return true;
    
    case 'toggle_devtools':
      toggleDevTools(sendResponse);
      return true;
    
    case 'get_current_tab':
      getCurrentTab(sendResponse);
      return true;
    
    case 'switch_tab':
      switchToTab(message.tabId, sendResponse);
      return true;
    
    case 'close_tab':
      closeTab(message.tabId, sendResponse);
      return true;
    
    case 'pin_tab':
      pinTab(message.tabId, sendResponse);
      return true;
    
    case 'duplicate_tab':
      duplicateTab(message.tabId, sendResponse);
      return true;
    
    case 'get_all_tabs':
      getAllTabs(sendResponse);
      return true;
    
    case 'search_history_autocomplete':
      // Usar Cache ULTRA si está disponible, sino fallback a legacy
      if (ULTRA_CACHE.state.isLoaded) {
        searchUltraCache(message.query, sendResponse);
      } else {
        searchHistoryForAutocomplete(message.query, sendResponse);
      }
      return true;
      
    case 'load_ultra_cache':
      loadUltraCache(message.forceRebuild || false, (progress) => {
        // Enviar progreso al content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: 'ultra_cache_progress', 
              progress: progress 
            }).catch(() => {}); // Ignorar errores si la pestaña no está disponible
          }
        });
      }).then(sendResponse);
      return true;
      
    case 'get_ultra_cache_info':
      // Validar integridad antes de enviar información
      const integrity = validateUltraCacheIntegrity();
      
      // Debug: mostrar información detallada en consola
      console.log('🔍 Debug Cache ULTRA Info:', {
        state: ULTRA_CACHE.state,
        memory: {
          historySize: ULTRA_CACHE.memory.history.size,
          domainsSize: ULTRA_CACHE.memory.domains.size,
          wordsSize: ULTRA_CACHE.memory.words.size,
          faviconsSize: ULTRA_CACHE.memory.favicons.size
        },
        integrity: integrity,
        config: ULTRA_CACHE.config
      });
      
      sendResponse({ 
        success: true, 
        cacheInfo: {
          ...ULTRA_CACHE.state,
          integrityValid: integrity.valid,
          loadQuality: ULTRA_CACHE.state.loadQuality,
          integrityDetails: integrity
        },
        config: ULTRA_CACHE.config
      });
      return true;
      
    case 'clear_ultra_cache':
      ULTRA_CACHE.memory.history.clear();
      ULTRA_CACHE.memory.favicons.clear();
      ULTRA_CACHE.memory.domains.clear();
      ULTRA_CACHE.memory.words.clear();
      ULTRA_CACHE.state.isLoaded = false;
      ULTRA_CACHE.state.totalUrls = 0;
      ULTRA_CACHE.state.totalDomains = 0;
      ULTRA_CACHE.state.totalFavicons = 0;
      chrome.storage.local.remove([
        'ultra_cache_history',
        'ultra_cache_favicons',
        'ultra_cache_state',
        'ultra_cache_config'
      ]).then(() => {
        sendResponse({ success: true, message: 'Cache ULTRA limpiado' });
      });
      return true;
      
    case 'rebuild_global_cache':
      // Esta función legacy ya no se usa, redirigir a cache ULTRA
      loadUltraCache(true, (progress) => {
        // Enviar progreso al content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: 'cache_progress', 
              progress: progress 
            }).catch(() => {}); // Ignorar errores si la pestaña no está disponible
          }
        });
      }).then(sendResponse);
      return true;
      
    case 'get_cache_info':
      getGlobalCacheInfo().then(sendResponse);
      return true;
      
    case 'get_top_domains':
      getTopDomains(message.limit || 20).then(sendResponse);
      return true;
      
    case 'clear_global_cache':
      clearGlobalCache().then(sendResponse);
      return true;
      
    case 'request_commandbar_open':
      // Solicitud directa desde nuestra página de extensión
      if (sender.tab?.id) {
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(sender.tab.id, { action: 'toggle_commandbar' });
          } catch (error) {
            await forceInjectCommandBar(sender.tab.id, 'toggle_commandbar');
          }
        }, 100);
      }
      sendResponse({ success: true });
      return true;
  }
});

// Buscar en pestañas
async function searchTabs(query, sendResponse) {
  try {
    const tabs = await chrome.tabs.query({});
    const filteredTabs = tabs.filter(tab => 
      tab.title.toLowerCase().includes(query.toLowerCase()) ||
      tab.url.toLowerCase().includes(query.toLowerCase())
    );
    sendResponse({ success: true, tabs: filteredTabs });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Buscar en bookmarks
async function searchBookmarks(query, sendResponse) {
  try {
    const bookmarks = await chrome.bookmarks.search(query);
    sendResponse({ success: true, bookmarks });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Buscar en historial
async function searchHistory(query, sendResponse) {
  try {
    const history = await chrome.history.search({
      text: query,
      maxResults: 20
    });
    const historyWithFavicons = await Promise.all(history.map(async item => {
      const faviconUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(item.url)}&size=32`;
      try {
        const response = await fetch(faviconUrl);
        const blob = await response.blob();
        const dataUrl = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        return { ...item, favicon: dataUrl };
      } catch {
        return { ...item, favicon: '' };
      }
    }));
    sendResponse({ success: true, history: historyWithFavicons });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Crear nueva pestaña
async function createTab(url, active = true, sendResponse, fromCommandBar = false) {
  try {
    const tab = await chrome.tabs.create({ url, active });
    
    // Si la pestaña fue creada desde CommandBar, marcarla para evitar auto-open
    if (fromCommandBar) {
      commandBarCreatedTabs.add(tab.id);
      
      // Limpiar marca después de 10 segundos (tiempo suficiente para que la pestaña cargue)
      setTimeout(() => {
        commandBarCreatedTabs.delete(tab.id);
      }, 10000);
    }
    
    sendResponse({ success: true, tab });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Crear nueva ventana
async function createWindow(url, sendResponse) {
  try {
    const window = await chrome.windows.create({ url });
    sendResponse({ success: true, window });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Crear nueva ventana de incognito
async function createIncognitoWindow(url, sendResponse) {
  try {
    const window = await chrome.windows.create({ 
      url, 
      incognito: true 
    });
    sendResponse({ success: true, window });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Recargar pestaña
async function reloadTab(tabId, sendResponse) {
  try {
    await chrome.tabs.reload(tabId);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Alternar herramientas de desarrollador
async function toggleDevTools(sendResponse) {
  try {
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab[0]) {
      await chrome.tabs.sendMessage(currentTab[0].id, { action: 'toggle_devtools' });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No active tab found' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Obtener pestaña actual
async function getCurrentTab(sendResponse) {
  try {
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab[0]) {
      sendResponse({ success: true, tabId: currentTab[0].id });
    } else {
      sendResponse({ success: false, error: 'No active tab found' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Cambiar a pestaña
async function switchToTab(tabId, sendResponse) {
  try {
    await chrome.tabs.update(tabId, { active: true });
    const tab = await chrome.tabs.get(tabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Cerrar pestaña
async function closeTab(tabId, sendResponse) {
  try {
    await chrome.tabs.remove(tabId);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Pinear/despinear pestaña
async function pinTab(tabId, sendResponse) {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { pinned: !tab.pinned });
    sendResponse({ success: true, pinned: !tab.pinned });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Duplicar pestaña
async function duplicateTab(tabId, sendResponse) {
  try {
    const tab = await chrome.tabs.duplicate(tabId);
    sendResponse({ success: true, tab });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Obtener todas las pestañas
async function getAllTabs(sendResponse) {
  try {
    const tabs = await chrome.tabs.query({});
    sendResponse({ success: true, tabs });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// CACHE ULTRA - Sistema de cache permanente y completo
const ULTRA_CACHE = {
  // Cache en memoria para acceso rápido
  memory: {
    history: new Map(),
    favicons: new Map(),
    domains: new Map(),
    words: new Map()
  },
  
  // Estado del cache
  state: {
    isLoaded: false,
    isLoading: false,
    lastUpdate: 0,
    totalUrls: 0,
    totalDomains: 0,
    totalFavicons: 0,
    memoryUsage: 0,
    integrityValid: false,     // Nueva: validación de integridad
    loadQuality: 'none'        // Nueva: calidad de carga (none, partial, full)
  },
  
  // Configuración
  config: {
    maxHistoryResults: 100000, // 100,000 URLs máximo
    faviconCacheSize: 1000,    // 1,000 favicons máximo
    autoUpdate: true,          // Auto-actualización
    persistent: true,          // Cache persistente
    minUrlsForValidCache: 100,  // Reducido: mínimo de URLs para cache válido (más flexible)
    maxStorageSize: 50 * 1024 * 1024 // Nueva: 50MB límite de storage
  }
};

// Constantes para compatibilidad (ya no se usan, pero mantener por si acaso)
const MAX_HISTORY_RESULTS = 1000; // Máximo de entradas del historial a consultar

// Función para validar integridad del cache ULTRA
function validateUltraCacheIntegrity() {
  try {
    const historySize = ULTRA_CACHE.memory.history.size;
    const domainsSize = ULTRA_CACHE.memory.domains.size;
    const wordsSize = ULTRA_CACHE.memory.words.size;
    const faviconsSize = ULTRA_CACHE.memory.favicons.size;
    
    // Verificar cantidad mínima de URLs (más flexible)
    const hasMinUrls = historySize >= Math.min(ULTRA_CACHE.config.minUrlsForValidCache, 100); // Mínimo 100 URLs
    
    // Verificar que los índices estén construidos (más flexible)
    const hasIndexes = domainsSize > 0; // Solo requiere dominios, no palabras
    
    // Verificar que no haya datos corruptos (más flexible)
    const hasValidData = historySize > 0; // Solo requiere que haya datos
    
    // Determinar calidad de carga
    let loadQuality = 'none';
    if (historySize >= ULTRA_CACHE.config.maxHistoryResults * 0.8) {
      loadQuality = 'full';
    } else if (historySize >= ULTRA_CACHE.config.minUrlsForValidCache) {
      loadQuality = 'partial';
    } else if (historySize >= 100) {
      loadQuality = 'minimal'; // Nueva categoría para caches pequeños pero válidos
    }
    
    // Validación más flexible: aceptar caches con al menos 100 URLs y dominios indexados
    const integrityValid = hasMinUrls && hasIndexes && hasValidData;
    
    // Actualizar estado
    ULTRA_CACHE.state.integrityValid = integrityValid;
    ULTRA_CACHE.state.loadQuality = loadQuality;
    
    console.log(`🔍 Validación de integridad ULTRA:`, {
      historySize,
      domainsSize,
      wordsSize,
      faviconsSize,
      hasMinUrls: `${hasMinUrls} (${historySize} >= ${Math.min(ULTRA_CACHE.config.minUrlsForValidCache, 100)})`,
      hasIndexes: `${hasIndexes} (domains: ${domainsSize}, words: ${wordsSize})`,
      hasValidData: `${hasValidData} (history > 0)`,
      integrityValid,
      loadQuality,
      stateTotalUrls: ULTRA_CACHE.state.totalUrls,
      stateTotalDomains: ULTRA_CACHE.state.totalDomains
    });
    
    return {
      valid: integrityValid,
      quality: loadQuality,
      stats: {
        historySize,
        domainsSize,
        wordsSize,
        faviconsSize
      },
      details: {
        hasMinUrls,
        hasIndexes,
        hasValidData,
        minRequired: Math.min(ULTRA_CACHE.config.minUrlsForValidCache, 100)
      }
    };
    
  } catch (error) {
    console.error('❌ Error validando integridad del cache ULTRA:', error);
    ULTRA_CACHE.state.integrityValid = false;
    ULTRA_CACHE.state.loadQuality = 'none';
    return { valid: false, quality: 'none', error: error.message };
  }
}

// CARGAR CACHE ULTRA desde storage persistente
async function loadUltraCacheFromStorage() {
  try {
    console.log('🔄 Cargando cache ULTRA desde storage...');
    
    const result = await chrome.storage.local.get([
      'ultra_cache_history',
      'ultra_cache_favicons', 
      'ultra_cache_state',
      'ultra_cache_config'
    ]);
    
    // Cargar configuración
    if (result.ultra_cache_config) {
      Object.assign(ULTRA_CACHE.config, result.ultra_cache_config);
    }
    
    // Cargar estado
    if (result.ultra_cache_state) {
      Object.assign(ULTRA_CACHE.state, result.ultra_cache_state);
    }
    
    // Cargar historial
    if (result.ultra_cache_history) {
      ULTRA_CACHE.memory.history = new Map(result.ultra_cache_history);
      console.log(`📊 Cache ULTRA cargado: ${ULTRA_CACHE.memory.history.size} URLs`);
    }
    
    // Cargar favicons
    if (result.ultra_cache_favicons) {
      ULTRA_CACHE.memory.favicons = new Map(result.ultra_cache_favicons);
      console.log(`🎨 Favicons cargados: ${ULTRA_CACHE.memory.favicons.size}`);
    }
    
    // Reconstruir índices
    rebuildUltraCacheIndexes();
    
    // VALIDAR INTEGRIDAD del cache cargado
    const integrity = validateUltraCacheIntegrity();
    
    if (integrity.valid) {
      ULTRA_CACHE.state.isLoaded = true;
      console.log(`✅ Cache ULTRA cargado desde storage (${integrity.quality} quality)`);
      return true;
    } else {
      console.warn(`⚠️ Cache ULTRA cargado pero integridad inválida:`, integrity);
      ULTRA_CACHE.state.isLoaded = false;
      ULTRA_CACHE.state.integrityValid = false;
      return false; // Forzar recarga completa
    }
    
  } catch (error) {
    console.error('❌ Error cargando cache ULTRA:', error);
    ULTRA_CACHE.state.isLoaded = false;
    ULTRA_CACHE.state.integrityValid = false;
    return false;
  }
}

// GUARDAR CACHE ULTRA en storage persistente
async function saveUltraCacheToStorage() {
  try {
    const data = {
      ultra_cache_history: Array.from(ULTRA_CACHE.memory.history.entries()),
      ultra_cache_favicons: Array.from(ULTRA_CACHE.memory.favicons.entries()),
      ultra_cache_state: ULTRA_CACHE.state,
      ultra_cache_config: ULTRA_CACHE.config
    };
    
    await chrome.storage.local.set(data);
    console.log('💾 Cache ULTRA guardado en storage');
    
  } catch (error) {
    console.error('❌ Error guardando cache ULTRA:', error);
  }
}

// CACHEAR FAVICON de un dominio
async function cacheFavicon(domain) {
  try {
    // Verificar si ya está cacheado
    if (ULTRA_CACHE.memory.favicons.has(domain)) {
      return ULTRA_CACHE.memory.favicons.get(domain);
    }
    
    // Limpiar cache de favicons si es muy grande
    if (ULTRA_CACHE.memory.favicons.size >= ULTRA_CACHE.config.faviconCacheSize) {
      const entries = Array.from(ULTRA_CACHE.memory.favicons.entries());
      const oldestEntries = entries.slice(0, 100); // Eliminar 100 más antiguos
      oldestEntries.forEach(([key]) => ULTRA_CACHE.memory.favicons.delete(key));
    }
    
    // URL del favicon
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    
    // Descargar favicon
    const response = await fetch(faviconUrl);
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result;
          
          // Guardar en cache
          ULTRA_CACHE.memory.favicons.set(domain, {
            url: faviconUrl,
            data: base64,
            timestamp: Date.now()
          });
          
          ULTRA_CACHE.state.totalFavicons = ULTRA_CACHE.memory.favicons.size;
          
          // Guardar en storage (async)
          saveUltraCacheToStorage();
          
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }
    
    return null;
    
  } catch (error) {
    console.warn(`Error cacheando favicon para ${domain}:`, error);
    return null;
  }
}

// OBTENER FAVICON cacheado
function getCachedFavicon(domain) {
  const cached = ULTRA_CACHE.memory.favicons.get(domain);
  if (cached) {
    return cached.data;
  }
  
  // Si no está cacheado, iniciar cacheo en background
  cacheFavicon(domain);
  return null;
}

// RECONSTRUIR ÍNDICES del cache ULTRA
function rebuildUltraCacheIndexes() {
  ULTRA_CACHE.memory.domains.clear();
  ULTRA_CACHE.memory.words.clear();
  
  let domainCount = 0;
  let wordCount = 0;
  
  for (const [url, item] of ULTRA_CACHE.memory.history) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Indexar por dominio
      if (!ULTRA_CACHE.memory.domains.has(domain)) {
        ULTRA_CACHE.memory.domains.set(domain, []);
        domainCount++;
      }
      ULTRA_CACHE.memory.domains.get(domain).push(item);
      
      // Indexar por palabras del título
      const titleWords = item.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 2 && word.length < 20) {
          if (!ULTRA_CACHE.memory.words.has(word)) {
            ULTRA_CACHE.memory.words.set(word, []);
            wordCount++;
          }
          ULTRA_CACHE.memory.words.get(word).push(item);
        }
      });
      
    } catch (e) {
      // Ignorar URLs malformadas
    }
  }
  
  ULTRA_CACHE.state.totalDomains = domainCount;
  console.log(`🔍 Índices reconstruidos: ${domainCount} dominios, ${wordCount} palabras`);
  
  // Validar integridad después de reconstruir índices
  validateUltraCacheIntegrity();
}

// CARGAR CACHE ULTRA - Función principal
async function loadUltraCache(forceRebuild = false, progressCallback = null) {
  // SIEMPRE intentar cargar si no está cargado, incluso si está cargando
  if (ULTRA_CACHE.state.isLoaded && !forceRebuild) {
    return { success: true, message: 'Cache ULTRA ya cargado' };
  }
  
  // Si está cargando, esperar un poco y verificar de nuevo
  if (ULTRA_CACHE.state.isLoading) {
    console.log('⏳ Cache ULTRA ya está cargando, esperando...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar si ya se cargó mientras esperábamos
    if (ULTRA_CACHE.state.isLoaded) {
      return { success: true, message: 'Cache ULTRA cargado mientras esperaba' };
    }
  }
  
  ULTRA_CACHE.state.isLoading = true;
  
  try {
    if (progressCallback) progressCallback('🔄 Iniciando carga del cache ULTRA...');
    console.log('🔄 Cargando cache ULTRA...');
    
    // Intentar cargar desde storage primero
    if (!forceRebuild) {
      const loaded = await loadUltraCacheFromStorage();
      if (loaded && ULTRA_CACHE.state.integrityValid) {
        const quality = ULTRA_CACHE.state.loadQuality;
        const message = quality === 'full' ? 'Cache ULTRA cargado desde storage (completo)' : 
                       quality === 'partial' ? 'Cache ULTRA cargado desde storage (parcial)' :
                       'Cache ULTRA cargado desde storage';
        
        if (progressCallback) progressCallback(`✅ ${message}`);
        ULTRA_CACHE.state.isLoading = false;
        return { success: true, message, quality };
      } else if (loaded && !ULTRA_CACHE.state.integrityValid) {
        console.log('🔄 Cache cargado pero integridad inválida, reconstruyendo...');
        if (progressCallback) progressCallback('🔄 Cache corrupto, reconstruyendo...');
      }
    }
    
    // Limpiar cache si es rebuild forzado
    if (forceRebuild) {
      ULTRA_CACHE.memory.history.clear();
      ULTRA_CACHE.memory.favicons.clear();
      ULTRA_CACHE.state.isLoaded = false;
      if (progressCallback) progressCallback('🧹 Cache limpiado, comenzando reconstrucción...');
    }
    
    // Cargar TODO el historial disponible
    if (progressCallback) progressCallback('📚 Consultando historial completo de Chrome...');
    const history = await chrome.history.search({
      text: '', // Buscar todo
      maxResults: ULTRA_CACHE.config.maxHistoryResults // 100,000 URLs
    });
    
    if (progressCallback) progressCallback(`📊 Encontradas ${history.length} URLs en el historial`);
    console.log(`📊 Cache ULTRA: ${history.length} URLs encontradas`);
    
    let processedCount = 0;
    let faviconCount = 0;
    
    // Procesar cada URL del historial
    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      
      try {
        const url = item.url;
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        // Guardar en cache de historial
        ULTRA_CACHE.memory.history.set(url, {
          url: url,
          title: item.title,
          lastVisitTime: item.lastVisitTime,
          visitCount: item.visitCount,
          domain: domain
        });
        
        // Cachear favicon en background
        if (!ULTRA_CACHE.memory.favicons.has(domain)) {
          cacheFavicon(domain).then(() => {
            faviconCount++;
          });
        }
        
        processedCount++;
        
        // Reportar progreso cada 1000 items
        if (i % 1000 === 0 && progressCallback) {
          progressCallback(`⚡ Procesando... ${processedCount}/${history.length} URLs`);
        }
        
      } catch (e) {
        console.warn('URL malformada ignorada:', item.url);
      }
    }
    
    // Reconstruir índices
    if (progressCallback) progressCallback('🔍 Reconstruyendo índices...');
    rebuildUltraCacheIndexes();
    
    // Actualizar estado
    ULTRA_CACHE.state.lastUpdate = Date.now();
    ULTRA_CACHE.state.totalUrls = processedCount;
    ULTRA_CACHE.state.memoryUsage = ULTRA_CACHE.memory.history.size * 0.001; // Estimación en MB
    
    // VALIDAR INTEGRIDAD antes de marcar como cargado
    const integrity = validateUltraCacheIntegrity();
    
    if (integrity.valid) {
      ULTRA_CACHE.state.isLoaded = true;
      
      // Guardar en storage
      if (progressCallback) progressCallback('💾 Guardando cache en storage...');
      await saveUltraCacheToStorage();
      
      const quality = ULTRA_CACHE.state.loadQuality;
      const qualityText = quality === 'full' ? ' (completo)' : quality === 'partial' ? ' (parcial)' : '';
      
      if (progressCallback) {
        progressCallback(`✅ Cache ULTRA cargado exitosamente${qualityText}!\n📊 ${processedCount} URLs procesadas\n🌐 ${ULTRA_CACHE.state.totalDomains} dominios únicos\n🎨 Favicons cacheados: ${ULTRA_CACHE.memory.favicons.size}`);
      }
      
      console.log(`✅ Cache ULTRA cargado exitosamente (${quality})`, ULTRA_CACHE.state);
      
      return { success: true, stats: ULTRA_CACHE.state, quality };
    } else {
      console.error('❌ Cache ULTRA cargado pero integridad inválida:', integrity);
      ULTRA_CACHE.state.isLoaded = false;
      ULTRA_CACHE.state.integrityValid = false;
      
      const errorDetails = `Integridad inválida: URLs=${integrity.stats.historySize}, Dominios=${integrity.stats.domainsSize}, Mínimo requerido=${integrity.details.minRequired}`;
      
      if (progressCallback) {
        progressCallback(`❌ Error: Cache cargado pero integridad inválida\n📊 ${processedCount} URLs procesadas\n🔍 ${errorDetails}`);
      }
      
      return { success: false, error: errorDetails, stats: ULTRA_CACHE.state, integrity };
    }
    
  } catch (error) {
    console.error('❌ Error cargando cache ULTRA:', error);
    if (progressCallback) progressCallback(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    ULTRA_CACHE.state.isLoading = false;
  }
}

// Función legacy eliminada - ahora se usa exclusivamente Cache ULTRA

// ACTUALIZAR CACHE ULTRA cuando se visita una nueva página
async function updateUltraCache(url, title) {
  if (!ULTRA_CACHE.state.isLoaded) {
    return; // No actualizar si no está cargado
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Verificar si ya existe en el cache
    const existingItem = ULTRA_CACHE.memory.history.get(url);
    
    if (existingItem) {
      // Actualizar item existente
      existingItem.lastVisitTime = Date.now();
      existingItem.visitCount = (existingItem.visitCount || 0) + 1;
      existingItem.title = title;
    } else {
      // Agregar nueva entrada al cache
      const newItem = {
        url: url,
        title: title,
        lastVisitTime: Date.now(),
        visitCount: 1,
        domain: domain
      };
      
      ULTRA_CACHE.memory.history.set(url, newItem);
      
      // Actualizar índices
      if (!ULTRA_CACHE.memory.domains.has(domain)) {
        ULTRA_CACHE.memory.domains.set(domain, []);
        ULTRA_CACHE.state.totalDomains++;
      }
      ULTRA_CACHE.memory.domains.get(domain).push(newItem);
      
      // Indexar por palabras clave del título
      const titleWords = title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 2 && word.length < 20) {
          if (!ULTRA_CACHE.memory.words.has(word)) {
            ULTRA_CACHE.memory.words.set(word, []);
          }
          ULTRA_CACHE.memory.words.get(word).push(newItem);
        }
      });
      
      // Cachear favicon en background
      if (!ULTRA_CACHE.memory.favicons.has(domain)) {
        cacheFavicon(domain);
      }
      
      ULTRA_CACHE.state.totalUrls++;
      ULTRA_CACHE.state.lastUpdate = Date.now();
      
      // Validar integridad después de actualizar
      validateUltraCacheIntegrity();
      
      console.log(`📝 Cache ULTRA actualizado: ${domain}`);
    }
    
    // Guardar en storage cada 10 actualizaciones
    if (ULTRA_CACHE.state.totalUrls % 10 === 0) {
      saveUltraCacheToStorage();
    }
    
  } catch (error) {
    console.error('Error actualizando cache ULTRA:', error);
  }
}

// ACTUALIZAR CACHE GLOBAL cuando se visita una nueva página (LEGACY)
async function updateGlobalHistoryCache(url, title) {
  if (!isGlobalCacheLoaded) {
    return; // No actualizar si no está cargado
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Buscar si ya existe en el cache
    const existingItems = globalHistoryCache.get(domain) || [];
    const existingUrl = existingItems.find(item => item.url === url);
    
    if (!existingUrl) {
      // Agregar nueva entrada al cache
      const newItem = {
        url: url,
        title: title,
        lastVisitTime: Date.now(),
        visitCount: 1
      };
      
      existingItems.push(newItem);
      globalHistoryCache.set(domain, existingItems);
      
      // También indexar por palabras clave del título
      const titleWords = title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 2) {
          if (!globalHistoryCache.has(word)) {
            globalHistoryCache.set(word, []);
          }
          globalHistoryCache.get(word).push(newItem);
        }
      });
      
      console.log(`📝 Cache global actualizado: ${domain}`);
    }
  } catch (error) {
    console.error('Error actualizando cache global:', error);
  }
}

// OBTENER INFORMACIÓN DEL CACHE GLOBAL
async function getGlobalCacheInfo() {
  try {
    const stats = await chrome.storage.local.get(['globalCacheStats', 'globalCacheLoaded', 'globalCacheTimestamp']);
    
    const cacheInfo = {
      isLoaded: isGlobalCacheLoaded,
      isLoading: globalCacheLoading,
      cacheSize: globalHistoryCache.size,
      stats: stats.globalCacheStats || null,
      lastLoaded: stats.globalCacheTimestamp || null,
      memoryUsage: globalHistoryCache.size * 0.001 // Estimación aproximada en MB
    };
    
    return { success: true, cacheInfo };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// OBTENER DOMINIOS MÁS FRECUENTES
async function getTopDomains(limit = 20) {
  try {
    const domains = [];
    
    for (const [domain, items] of globalHistoryCache.entries()) {
      if (domain.includes('.') && !domain.includes(' ')) { // Solo dominios reales
        domains.push({
          domain: domain,
          count: items.length,
          lastVisit: Math.max(...items.map(item => item.lastVisitTime || 0))
        });
      }
    }
    
    // Ordenar por frecuencia y recencia
    domains.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return b.lastVisit - a.lastVisit;
    });
    
    return { success: true, domains: domains.slice(0, limit) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// LIMPIAR CACHE GLOBAL
async function clearGlobalCache() {
  try {
    globalHistoryCache.clear();
    isGlobalCacheLoaded = false;
    
    await chrome.storage.local.remove(['globalCacheStats', 'globalCacheLoaded', 'globalCacheTimestamp']);
    
    return { success: true, message: 'Cache global limpiada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// BÚSQUEDA ULTRA - Función principal de búsqueda
async function searchUltraCache(query, sendResponse) {
  try {
    // Cargar cache ULTRA si no está cargado o si la integridad es inválida
    if (!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) {
      console.log('🔄 Cache ULTRA no cargado o integridad inválida, cargando automáticamente...');
      await loadUltraCache();
      
      // Verificar de nuevo después de cargar
      if (!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) {
        const integrity = validateUltraCacheIntegrity();
        const errorMsg = `Cache ULTRA no disponible: URLs=${integrity.stats.historySize}, Dominios=${integrity.stats.domainsSize}, Válido=${integrity.valid}`;
        console.error('❌ Cache ULTRA no se pudo cargar o validar:', errorMsg);
        sendResponse({ success: false, error: errorMsg, integrity });
        return;
      }
    }
    
    const queryLower = query.toLowerCase();
    let relevantUrls = [];
    
    // Búsqueda mejorada para queries cortas (1-2 caracteres)
    if (query.length <= 2) {
      // Para queries cortas, buscar más ampliamente
      
      // 1. Buscar por dominio exacto
      if (ULTRA_CACHE.memory.domains.has(queryLower)) {
        relevantUrls.push(...ULTRA_CACHE.memory.domains.get(queryLower));
      }
      
      // 2. Buscar por dominios que empiecen con la query (prioridad alta)
      for (const [domain, items] of ULTRA_CACHE.memory.domains.entries()) {
        if (domain.startsWith(queryLower) && domain !== queryLower) {
          relevantUrls.push(...items);
        }
      }
      
      // 3. Buscar por dominios que contengan la query (para queries de 2 caracteres)
      if (query.length === 2) {
        for (const [domain, items] of ULTRA_CACHE.memory.domains.entries()) {
          if (domain.includes(queryLower) && !domain.startsWith(queryLower)) {
            relevantUrls.push(...items);
          }
        }
      }
      
      // 4. Buscar por palabras clave del título (solo palabras de 2+ caracteres)
      for (const [word, items] of ULTRA_CACHE.memory.words.entries()) {
        if (word.startsWith(queryLower) && word.length >= 2) {
          relevantUrls.push(...items);
        }
      }
      
    } else {
      // Para queries más largas, usar lógica normal
      
      // Buscar por dominio exacto
      if (ULTRA_CACHE.memory.domains.has(queryLower)) {
        relevantUrls.push(...ULTRA_CACHE.memory.domains.get(queryLower));
      }
      
      // Buscar por dominios que empiecen con la query
      for (const [domain, items] of ULTRA_CACHE.memory.domains.entries()) {
        if (domain.startsWith(queryLower) && domain !== queryLower) {
          relevantUrls.push(...items);
        }
      }
      
      // Buscar por palabras clave del título
      for (const [word, items] of ULTRA_CACHE.memory.words.entries()) {
        if (word.startsWith(queryLower) && word.length > 2) {
          relevantUrls.push(...items);
        }
      }
    }
    
    // Eliminar duplicados
    const seen = new Set();
    relevantUrls = relevantUrls.filter(item => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
    
    // Ordenar por relevancia con algoritmo mejorado para queries cortas
    relevantUrls.sort((a, b) => {
      const queryLower = query.toLowerCase();
      
      // Prioridad máxima: coincidencia exacta en dominio
      const domainA = a.domain || '';
      const domainB = b.domain || '';
      const exactMatchA = domainA.startsWith(queryLower);
      const exactMatchB = domainB.startsWith(queryLower);
      
      if (exactMatchA && !exactMatchB) return -1;
      if (!exactMatchA && exactMatchB) return 1;
      
      // Para queries cortas, priorizar recencia sobre frecuencia
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      const recencyScoreA = Math.max(0, 1 - ((now - a.lastVisitTime) / (30 * dayInMs)));
      const recencyScoreB = Math.max(0, 1 - ((now - b.lastVisitTime) / (30 * dayInMs)));
      
      const freqScoreA = Math.log(a.visitCount + 1);
      const freqScoreB = Math.log(b.visitCount + 1);
      
      let scoreA, scoreB;
      
      if (query.length <= 2) {
        // Para queries cortas: 60% recencia, 40% frecuencia
        scoreA = (recencyScoreA * 0.6) + (freqScoreA * 0.4);
        scoreB = (recencyScoreB * 0.6) + (freqScoreB * 0.4);
      } else {
        // Para queries largas: 30% recencia, 70% frecuencia
        scoreA = (freqScoreA * 0.7) + (recencyScoreA * 0.3);
        scoreB = (freqScoreB * 0.7) + (recencyScoreB * 0.3);
      }
      
      return scoreB - scoreA;
    });
    
    if (relevantUrls.length > 0) {
      const bestMatch = relevantUrls[0];
      let suggestion = '';
      
      // Determinar la mejor sugerencia
      const domain = bestMatch.domain || '';
      const queryLower = query.toLowerCase();
      
      if (domain.startsWith(queryLower)) {
        suggestion = domain;
      } else {
        suggestion = domain;
      }
      
      // Obtener favicon cacheado
      const favicon = getCachedFavicon(domain);
      
      const response = { 
        success: true, 
        suggestion: suggestion,
        visitCount: bestMatch.visitCount,
        lastVisit: bestMatch.lastVisitTime,
        title: bestMatch.title,
        favicon: favicon,
        cacheSource: 'ULTRA'
      };
      
      console.log(`🔍 Cache ULTRA: ${relevantUrls.length} resultados para "${query}"`);
      sendResponse(response);
    } else {
      sendResponse({ success: true, suggestion: null, cacheSource: 'ULTRA' });
    }
    
  } catch (error) {
    console.error('Error en búsqueda ULTRA:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Buscar en historial para autocompletado inteligente (CON CACHE GLOBAL) - LEGACY
async function searchHistoryForAutocomplete(query, sendResponse) {
  try {
    // USAR EXCLUSIVAMENTE CACHE ULTRA - SIEMPRE CARGADO Y PERMANENTE
    if (!ULTRA_CACHE.state.isLoaded || !ULTRA_CACHE.state.integrityValid) {
      console.log('🔄 Cache ULTRA no cargado o integridad inválida, cargando automáticamente...');
      await loadUltraCache();
    }
    
    // Usar la función searchUltraCache que ya está optimizada
    await searchUltraCache(query, sendResponse);
    return;
    
    // La función searchUltraCache ya maneja toda la lógica de búsqueda y respuesta
    // No necesitamos código adicional aquí
  } catch (error) {
    console.error('Error en autocompletado:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Set para trackear pestañas creadas por nosotros (evitar bucles)
let extensionCreatedTabs = new Set();

// Set para trackear pestañas creadas por CommandBar para navegación (evitar auto-open innecesario)
let commandBarCreatedTabs = new Set();

// Función para verificar si es una pestaña nueva vacía válida
function isValidNewTab(tab) {
  
  // URLs que consideramos "nuevas pestañas vacías"
  const newTabUrls = [
    'chrome://newtab/',
    'chrome://new-tab-page/',
    'about:blank',
    'chrome://welcome/',
    'edge://newtab/'
  ];
  
  // NUEVA LÓGICA: También considerar nuestras páginas de extensión como válidas
  const isOurExtensionPage = tab.url?.includes(chrome.runtime.id) && tab.url?.includes('new_tab.html');
  
  // Verificar si es una URL válida de nueva pestaña
  const isNewTabUrl = newTabUrls.some(url => tab.url?.startsWith(url)) || !tab.url || tab.url === '' || isOurExtensionPage;
  
  // Verificar que no sea una pestaña especial (EXCEPTO nuestras páginas)
  const isSpecialTab = tab.url?.startsWith('chrome://') && 
                      !tab.url.includes('newtab') && 
                      !tab.url.includes('new-tab-page') &&
                      !tab.url.includes('welcome');
  
  // Las páginas de extensión son válidas SOLO si son nuestras
  const isExtensionTab = tab.url?.startsWith('chrome-extension://') && !isOurExtensionPage;
  
  const isDevToolsTab = tab.url?.startsWith('devtools://');
  
  const result = isNewTabUrl && !isSpecialTab && !isExtensionTab && !isDevToolsTab;
  
  return result;
}

// Función para auto-abrir CommandBar en nueva pestaña
async function autoOpenCommandBarInNewTab(tabId, delay = 100) {
  try {
    
    // Verificar que la pestaña aún existe y está activa
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.active) {
      return; // No abrir si la pestaña ya no está activa
    }
    
    // Verificar que sigue siendo una pestaña nueva válida
    if (!isValidNewTab(tab)) {
      return; // El usuario ya navegó a algún lugar
    }
    
    
    // Esperar el delay configurado
    setTimeout(async () => {
      try {
        
        // Verificar nuevamente que la pestaña sigue válida
        const currentTab = await chrome.tabs.get(tabId);
        if (!currentTab || !currentTab.active || !isValidNewTab(currentTab)) {
          return;
        }
        
        
        // OPTIMIZACIÓN: Si es nuestra página de extensión, usar lógica simplificada
        const isOurExtensionPage = currentTab.url?.includes(chrome.runtime.id) && currentTab.url?.includes('new_tab.html');
        
        if (isOurExtensionPage) {
          return; // No hacer nada, la página se maneja a sí misma
        }
        
        // Verificar si es una página chrome:// que no admite content scripts
        const isChromeInternalPage = currentTab.url?.startsWith('chrome://') || 
                                   currentTab.url?.startsWith('chrome-extension://') ||
                                   currentTab.url?.startsWith('edge://');
        
        if (isChromeInternalPage) {
          
          // MÉTODO ALTERNATIVO: Crear nueva pestaña con página de la extensión
          try {
            // Usar página HTML de la extensión en lugar de about:blank
            const extensionUrl = chrome.runtime.getURL('new_tab.html');
            const newTab = await chrome.tabs.create({ 
              url: extensionUrl, 
              active: true 
            });
            
            // IMPORTANTE: Marcar esta pestaña como creada por nosotros para evitar bucle
            extensionCreatedTabs.add(newTab.id);
            
            // Cerrar la pestaña chrome:// original
            await chrome.tabs.remove(tabId);
            
            // Esperar un momento para que la página de extensión cargue
            setTimeout(async () => {
              try {
                await chrome.tabs.sendMessage(newTab.id, { action: 'toggle_commandbar' });
              } catch (error) {
                console.error('❌ Content script aún no disponible, intentando inyección...');
                const injected = await forceInjectCommandBar(newTab.id, 'toggle_commandbar');
                if (injected) {
                  // Éxito silencioso
                } else {
                  console.error('❌ Inyección también falló en página de extensión - Esto es muy raro, reintentando...');
                  
                  // Último recurso: Esperar más tiempo y reintentar
                  setTimeout(async () => {
                    try {
                      const finalInjected = await forceInjectCommandBar(newTab.id, 'toggle_commandbar');
                      if (finalInjected) {
                        // Éxito silencioso en reintento
                      } else {
                        console.error('❌ Todos los intentos fallaron para página de extensión');
                      }
                    } catch (finalError) {
                      console.error('❌ Error en reintento final:', finalError);
                    }
                  }, 1000);
                }
                
                // Limpiar marca después de un tiempo
                setTimeout(() => {
                  extensionCreatedTabs.delete(newTab.id);
                }, 5000);
              }
            }, 50); // Tiempo reducido para transición más rápida
            
          } catch (error) {
            console.error('❌ Error creando pestaña de extensión alternativa:', error);
          }
          
        } else {
          // Método normal para páginas regulares
          try {
            await chrome.tabs.sendMessage(tabId, { action: 'toggle_commandbar' });
          } catch (error) {
            // Si falla el content script, intentar inyección forzada
            console.error('❌ Content script falló, intentando inyección forzada:', error.message);
            const injected = await forceInjectCommandBar(tabId, 'toggle_commandbar');
            if (injected) {
              // Éxito silencioso
            } else {
              console.error('❌ Inyección forzada también falló');
            }
          }
        }
        
      } catch (error) {
        // La pestaña ya no existe o hubo otro error
        console.error('❌ Error durante la ejecución post-delay:', error);
      }
    }, delay);
    
  } catch (error) {
    console.error('❌ Error verificando nueva pestaña:', error);
  }
}

// Listener para nuevas pestañas creadas
chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    
    // PREVENIR BUCLE: Si esta pestaña fue creada por nosotros, saltear auto-open
    if (extensionCreatedTabs.has(tab.id)) {
      return;
    }
    
    // PREVENIR AUTO-OPEN INNECESARIO: Si esta pestaña fue creada por CommandBar para navegación, saltear auto-open
    if (commandBarCreatedTabs.has(tab.id)) {
      return;
    }
    
    // Verificar si la función experimental está habilitada
    let { autoOpenNewTab, autoOpenDelay } = await chrome.storage.sync.get(['autoOpenNewTab', 'autoOpenDelay']);
    
    // SOLUCIÓN: Si los valores son undefined, usar defaults y guardar
    if (autoOpenNewTab === undefined || autoOpenDelay === undefined) {
      
      // Establecer valores por defecto
      autoOpenNewTab = autoOpenNewTab !== undefined ? autoOpenNewTab : false;
      autoOpenDelay = autoOpenDelay !== undefined ? autoOpenDelay : 100;
      
      // Guardar en storage para futuras referencias
      await chrome.storage.sync.set({ autoOpenNewTab, autoOpenDelay });
    }
    
    if (!autoOpenNewTab) {
      return; // Función desactivada
    }
    
    // Verificar si es una pestaña nueva válida
    const isValid = isValidNewTab(tab);
    
    if (!isValid) {
      return; // No es una pestaña nueva vacía
    }
    
    // Solo abrir si la pestaña está activa (es la pestaña actual)
    if (!tab.active) {
      return; // No interferir con pestañas en background
    }
    
    // Auto-abrir CommandBar con el delay configurado
    const delay = autoOpenDelay || 100;
    await autoOpenCommandBarInNewTab(tab.id, delay);
    
  } catch (error) {
    console.error('❌ Error en auto-apertura de nueva pestaña:', error);
  }
});

// Trackear uso de la página de opciones (ejecutar al cargar)
trackOptionsPageOpened(); 