// Sistema de internacionalización para CommandBar Pro
class I18n {
  constructor() {
    this.currentLanguage = 'es'; // Por defecto español
    this.translations = {
      es: {
        // Interfaz principal
        appName: 'CommandBar Pro',
        appDescription: 'Command Bar avanzada para Chrome inspirada en Arc Browser',
        
        // Placeholders y textos del input
        searchPlaceholder: 'Escribe una búsqueda/URL o activa comandos con / ...',
        editUrlPlaceholder: 'Editar URL actual',
        
        // Comandos
        commands: {
          newTab: 'Nueva Pestaña',
          newWindow: 'Nueva Ventana',
          incognito: 'Ventana Incógnito',
          pinTab: 'Pinear Pestaña',
          closeTab: 'Cerrar Pestaña',
          duplicateTab: 'Duplicar Pestaña',
          reload: 'Recargar Página',
          bookmarks: 'Mostrar Marcadores',
          history: 'Mostrar Historial',
          downloads: 'Mostrar Descargas',
          settings: 'Abrir Configuración',
          extensions: 'Gestionar Extensiones',
          readerMode: 'Activar Modo Lectura',
          developerMode: 'Modo Desarrollador'
        },
        
        // Descripciones de comandos
        commandDescs: {
          newTab: 'Crear nueva pestaña',
          newWindow: 'Crear nueva ventana',
          incognito: 'Ventana incógnito',
          pinTab: 'Pinear pestaña actual',
          closeTab: 'Cerrar pestaña actual',
          duplicateTab: 'Duplicar pestaña actual',
          reload: 'Recargar página',
          bookmarks: 'Mostrar marcadores',
          history: 'Mostrar historial',
          downloads: 'Mostrar descargas',
          settings: 'Abrir configuración',
          extensions: 'Gestionar extensiones',
          readerMode: 'Activar modo lectura',
          developerMode: 'Modo desarrollador'
        },
        
        // Secciones
        sections: {
          quickCommands: 'Comandos Rápidos',
          quickAccess: 'Acceso Rápido',
          availableCommands: 'Comandos Disponibles',
          webSearch: 'Búsqueda Web',
          navigation: 'Navegación',
          openTabs: 'Pestañas Abiertas',
          bookmarks: 'Marcadores',
          history: 'Historial',
          autocomplete: 'Autocompletado'
        },
        
        // Búsquedas
        search: {
          searchInGoogle: 'Buscar "{query}" en Google',
          searchInBing: 'Buscar "{query}" en Bing',
          searchInDuckDuckGo: 'Buscar "{query}" en DuckDuckGo',
          searchInYahoo: 'Buscar "{query}" en Yahoo',
          searchInPerplexity: 'Buscar "{query}" en Perplexity',
          goToUrl: 'Ir a {url}',
          openInNewTab: 'Abrir en nueva pestaña',
          noResults: 'No se encontraron comandos'
        },
        
        // Hints y ayuda
        hints: {
          pressEnter: 'Presiona Enter',
          pressTab: 'Presiona Tab',
          editMode: 'Modo Edición - Todas las acciones se abren en esta pestaña'
        },
        
        // Acciones
        actions: {
          open: 'Abrir',
          openInNewTab: 'Abrir en Nueva Pestaña',
          openInBackground: 'Abrir en Segundo Plano',
          close: 'Cerrar',
          pin: 'Pinear',
          duplicate: 'Duplicar'
        },
        
        // Support section
        support: {
          title: '☕ Apoya el Desarrollo',
          message: 'Esta extensión ha sido desarrollada con cariño, y todas sus funciones son totalmente gratuitas. Desde lo más mínimo, puedes ayudarme a seguir manteniendo y actualizando la extensión, sería de gran ayuda.',
          buyMeACoffee: 'Comprar un Café',
          thankYou: 'Gracias por tu apoyo ❤️'
        },
        
        // Cache management
            cache: {
      title: '⚡ Cache ULTRA',
      status: {
        title: 'Estado del Cache ULTRA',
        description: 'Sistema de cache permanente con favicons precargados',
        state: 'Estado:',
        urls: 'URLs en cache:',
        domains: 'Dominios únicos:',
        favicons: 'Favicons cacheados:',
        lastUpdate: 'Última actualización:',
        memory: 'Uso de memoria:',
        autoUpdate: 'Auto-actualización:'
      },
      actions: {
        title: 'Acciones de Cache ULTRA',
        description: 'Gestiona el sistema de cache avanzado',
        rebuild: 'Cargar Cache ULTRA',
        clear: 'Limpiar Cache',
        viewTopDomains: 'Ver Dominios Top',
        stats: 'Estadísticas'
      },
      config: {
        title: 'Configuración Avanzada',
        description: 'Ajusta el comportamiento del cache ULTRA'
      },
      progress: {
        title: 'Progreso de Carga ULTRA',
        description: 'Procesando historial completo...'
      },
      topDomains: {
        title: 'Dominios Más Visitados',
        description: 'Los sitios web más frecuentes en tu historial'
      },
      stats: {
        title: 'Estadísticas Detalladas',
        description: 'Información completa del rendimiento del cache'
      }
    },

        // Popup
        popup: {
          version: 'v1.4.0',
          keyboardShortcuts: 'Atajos de Teclado',
          openCommandBar: 'Abrir Command Bar',
          developerMode: 'Modo desarrollador',
          features: 'Funcionalidades',
          availableCommands: 'Comandos Disponibles',
          searchTypes: 'Tipos de Búsqueda',
          configuration: 'Configuración',
          tryCommandBar: 'Probar Command Bar',
          advancedSettings: 'Configuración Avanzada',
          changeLanguage: 'Configurar Idioma',
          
          // Mensajes del popup
          messages: {
            openOptionsManually: 'Abre las opciones de la extensión para cambiar el idioma'
          },
          
          // Características
          featureItems: {
            universalSearch: 'Búsqueda Universal',
            quickNavigation: 'Navegación Rápida',
            tabManagement: 'Gestión de Pestañas',
            bookmarkAccess: 'Acceso a Marcadores',
            historySearch: 'Búsqueda en Historial',
            quickCommands: 'Comandos Rápidos'
          },
          
          // Tipos de búsqueda
          searchTypeItems: {
            webSearch: {
              title: 'Búsqueda Web',
              desc: 'Busca en Google, Bing o DuckDuckGo'
            },
            directNavigation: {
              title: 'Navegación Directa',
              desc: 'Escribe una URL para navegar'
            },
            openTabs: {
              title: 'Pestañas Abiertas',
              desc: 'Busca y cambia entre pestañas'
            },
            bookmarks: {
              title: 'Marcadores',
              desc: 'Busca en tus marcadores guardados'
            },
            history: {
              title: 'Historial',
              desc: 'Busca en tu historial de navegación'
            }
          },
          
          // Configuración
          settings: {
            darkTheme: 'Tema Oscuro'
          },
          
          // Tips
          tips: {
            useSlash: 'Usa "/" al inicio para comandos específicos',
            directUrl: 'Escribe una URL para navegación directa'
          },
          
          // Comandos específicos
          commands: {
            newTab: 'nueva pestaña',
            newTabDesc: 'Crear nueva pestaña',
            pin: 'pinear',
            pinDesc: 'Pinear pestaña actual',
            close: 'cerrar',
            closeDesc: 'Cerrar pestaña actual',
            duplicate: 'duplicar',
            duplicateDesc: 'Duplicar pestaña actual',
            bookmarks: 'marcadores',
            bookmarksDesc: 'Mostrar marcadores',
            history: 'historial',
            historyDesc: 'Mostrar historial'
          }
        },
        
        // Opciones
        options: {
          title: 'CommandBar Pro - Opciones',
          subtitle: 'Configuración Avanzada',
          
          // Secciones principales
          generalSettings: 'Configuración General',
          searchAndResults: 'Búsqueda y Resultados',
          keyboardShortcuts: 'Atajos de Teclado',
          privacyAndData: 'Privacidad y Datos',
          language: 'Idioma',
          
          // Configuración general
          general: {
            interfaceTheme: 'Tema de Interfaz',
            interfaceThemeDesc: 'Selecciona el tema visual de CommandBar',
            animationSpeed: 'Velocidad de Animaciones',
            animationSpeedDesc: 'Controla la velocidad de las transiciones',
            maxResults: 'Máximo de Resultados',
            maxResultsDesc: 'Número máximo de sugerencias por categoría',
            
            themeOptions: {
              auto: 'Automático (Sistema)',
              light: 'Claro',
              dark: 'Oscuro'
            },
            
            animationOptions: {
              slow: 'Lenta',
              normal: 'Normal',
              fast: 'Rápida',
              none: 'Sin animaciones'
            }
          },
          
          // Búsqueda
          searchSettings: {
            searchSources: 'Fuentes de Búsqueda',
            searchSourcesDesc: 'Selecciona dónde buscar resultados',
            searchDelay: 'Retraso de Búsqueda (ms)',
            searchDelayDesc: 'Tiempo de espera antes de ejecutar búsqueda',
            searchDelayRecommended: 'Recomendado',
            defaultSearchEngine: 'Buscador por Defecto',
            defaultSearchEngineDesc: 'Motor de búsqueda para consultas web',
            
            sources: {
              openTabs: 'Pestañas Abiertas',
              bookmarks: 'Marcadores',
              history: 'Historial'
            },
            
            engines: {
              google: 'Google',
              bing: 'Bing',
              duckduckgo: 'DuckDuckGo',
              yahoo: 'Yahoo'
            }
          },
          
          // Atajos de teclado
          keyboard: {
            mainShortcuts: 'Atajos Principales',
            mainShortcutsDesc: 'Combinaciones de teclado para CommandBar',
            openCommandBar: 'Abrir Command Bar',
            editCurrentUrl: 'Editar URL actual',
            developerMode: 'Modo desarrollador',
            additionalConfig: 'Configuración Adicional',
            additionalConfigDesc: 'Personaliza el comportamiento de los atajos',
            preventSiteShortcuts: 'Prevenir atajos del sitio web',
            changeShortcut: 'Cambiar',
            resetShortcut: 'Restablecer',
            recordingPrompt: 'Presiona tu atajo...',
            pressEscapeToCancel: 'Presiona Escape para cancelar',
            shortcutSaved: 'Atajo guardado correctamente',
            shortcutReset: 'Atajo restablecido al valor por defecto',
            shortcutConflict: 'Este atajo ya está asignado a otra acción',
            shortcutInvalid: 'Se requiere al menos una tecla modificadora y una tecla regular',
            shortcutReserved: 'Este atajo está reservado por el navegador'
          },

          // Sitios web excluidos
          excludedWebsites: {
            title: 'Sitios Web Excluidos',
            description: 'CommandBar se desactivará en los sitios que coincidan con estos patrones',
            inputPlaceholder: 'Ingresa un patrón de URL (soporta regex)',
            addButton: 'Agregar',
            noPatterns: 'No hay patrones configurados',
            examples: 'Ejemplos: .*\\.google\\.com, https://mail\\..*',
            invalidRegex: 'Patrón de expresión regular inválido',
            patternAdded: 'Patrón agregado correctamente',
            patternRemoved: 'Patrón eliminado correctamente',
            duplicatePattern: 'Este patrón ya existe'
          },

          // Privacidad
          privacy: {
            dataCollection: 'Recopilación de Datos',
            dataCollectionDesc: 'Control sobre qué datos se almacenan localmente',
            dataCleanup: 'Limpieza de Datos',
            dataCleanupDesc: 'Gestionar datos almacenados',
            usageStats: 'Estadísticas de uso (local)',
            
            // Acciones de privacidad
            actions: {
              clearCache: 'Limpiar Cache',
              clearStats: 'Limpiar Estadísticas',
              resetAll: 'Restablecer Todo'
            },
            
            statsViewer: 'Estadísticas Recopiladas',
            statsViewerDesc: 'Visualiza las estadísticas de uso almacenadas localmente',
            viewStats: 'Ver Estadísticas',
            refreshStats: 'Actualizar',
            noStats: 'No hay estadísticas disponibles',
            statsEmpty: 'Activa la recopilación de datos para ver estadísticas',
            
            actions: {
              open: 'Abrir',
              openInNewTab: 'Abrir en Nueva Pestaña',
              openInBackground: 'Abrir en Segundo Plano',
              close: 'Cerrar',
              pin: 'Pinear',
              duplicate: 'Duplicar'
            },
            
            // Etiquetas de estadísticas
            statsLabels: {
              commandbar_opened: 'CommandBar abierto',
              search_performed: 'Búsquedas realizadas',
              action_executed: 'Acciones ejecutadas',
              keyboard_command: 'Comandos de teclado',
              url_edit_mode: 'Modo edición URL',
              options_page_opened: 'Página de opciones abierta',
              today: 'Hoy',
              yesterday: 'Ayer',
              total: 'Total',
              last7days: 'Últimos 7 días',
              last30days: 'Últimos 30 días'
            }
          },
          
          // Idioma
          languageSettings: {
            interfaceLanguage: 'Idioma de la Interfaz',
            interfaceLanguageDesc: 'Selecciona el idioma de CommandBar',
            languages: {
              es: 'Español',
              en: 'English'
            }
          },
          
          // Botones
          buttons: {
            exportSettings: 'Exportar Configuración',
            importSettings: 'Importar Configuración',
            saveChanges: 'Guardar Cambios',
            cancel: 'Cancelar',
            confirm: 'Confirmar'
          },
          
          // Footer
          footer: {
            version: 'CommandBar Pro v1.4.0',
            changelog: 'Registro de cambios',
            reportBug: 'Reportar bug',
            viewSource: 'Ver código fuente'
          },
          
          // Mensajes
          messages: {
            settingsLoaded: 'Configuración cargada correctamente',
            settingsSaved: 'Configuración guardada correctamente',
            cacheCleared: 'Cache limpiado correctamente',
            statsCleared: 'Estadísticas limpiadas correctamente',
            settingsReset: 'Configuración restablecida correctamente',
            settingsExported: 'Configuración exportada correctamente',
            settingsImported: 'Configuración importada correctamente',
            invalidFile: 'Error: Archivo de configuración inválido',
            themeChanged: 'Tema cambiado a: {theme}',
            languageChanged: 'Idioma cambiado a: {language}',
            
            errors: {
              loadingSettings: 'Error cargando configuración',
              savingSettings: 'Error guardando configuración',
              clearingCache: 'Error limpiando cache',
              clearingStats: 'Error limpiando estadísticas',
              resettingSettings: 'Error restableciendo configuración',
              importingSettings: 'Error importando configuración'
            }
          },
          
          // Confirmaciones
          confirmations: {
            clearCache: {
              title: 'Limpiar Cache',
              message: '¿Estás seguro de que quieres limpiar todo el cache? Esto eliminará los resultados de búsqueda guardados.'
            },
            clearStats: {
              title: 'Limpiar Estadísticas',
              message: '¿Estás seguro de que quieres limpiar todas las estadísticas de uso?'
            },
            resetAll: {
              title: 'Restablecer Todo',
              message: '¿Estás seguro de que quieres restablecer toda la configuración? Esta acción no se puede deshacer.'
            }
          }
        },
        
        // Funciones experimentales
        experimental: {
          title: 'Funciones Experimentales',
          warning: 'Las funciones experimentales están en desarrollo y pueden cambiar en futuras versiones. Úsalas bajo tu propia responsabilidad.',
          autoOpenNewTab: 'Auto-abrir en Nueva Pestaña',
          autoOpenNewTabDesc: 'Abrir CommandBar completo automáticamente al crear nuevas pestañas vacías (Ctrl+T, botón +). Incluye todas las funciones: búsqueda en pestañas, marcadores, historial y autocompletado inteligente.',
          autoOpenEnabled: 'Activar auto-apertura',
          autoOpenDelay: 'Retraso de Auto-apertura (ms)',
          autoOpenDelayDesc: 'Tiempo de espera antes de abrir CommandBar (100ms recomendado para transición rápida)',
          quickTest: 'Prueba Rápida',
          quickTestDesc: 'Verifica si la configuración experimental está funcionando correctamente',
          testAutoOpen: 'Probar Auto-apertura',
          checkConfig: 'Verificar Config',
          forceSave: 'Forzar Guardado',
          testLanguage: 'Test Idioma'
        },
        
        // Toasts y notificaciones
        notifications: {
          success: 'Éxito',
          error: 'Error',
          warning: 'Advertencia',
          info: 'Información'
        }
      },
      
      en: {
        // Main interface
        appName: 'CommandBar Pro',
        appDescription: 'Advanced Command Bar for Chrome inspired by Arc Browser',
        
        // Placeholders and input texts
        searchPlaceholder: 'Type a search/URL, or activate commands with / ...',
        editUrlPlaceholder: 'Edit current URL',
        
        // Commands
        commands: {
          newTab: 'New Tab',
          newWindow: 'New Window',
          incognito: 'Incognito Window',
          pinTab: 'Pin Tab',
          closeTab: 'Close Tab',
          duplicateTab: 'Duplicate Tab',
          reload: 'Reload Page',
          bookmarks: 'Show Bookmarks',
          history: 'Show History',
          downloads: 'Show Downloads',
          settings: 'Open Settings',
          extensions: 'Manage Extensions',
          readerMode: 'Enable Reader Mode',
          developerMode: 'Developer Mode'
        },
        
        // Command descriptions
        commandDescs: {
          newTab: 'Create new tab',
          newWindow: 'Create new window',
          incognito: 'Incognito window',
          pinTab: 'Pin current tab',
          closeTab: 'Close current tab',
          duplicateTab: 'Duplicate current tab',
          reload: 'Reload page',
          bookmarks: 'Show bookmarks',
          history: 'Show history',
          downloads: 'Show downloads',
          settings: 'Open settings',
          extensions: 'Manage extensions',
          readerMode: 'Enable reader mode',
          developerMode: 'Developer mode'
        },
        
        // Sections
        sections: {
          quickCommands: 'Quick Commands',
          quickAccess: 'Quick Access',
          availableCommands: 'Available Commands',
          webSearch: 'Web Search',
          navigation: 'Navigation',
          openTabs: 'Open Tabs',
          bookmarks: 'Bookmarks',
          history: 'History',
          autocomplete: 'Autocomplete'
        },
        
        // Search
        search: {
          searchInGoogle: 'Search "{query}" in Google',
          searchInBing: 'Search "{query}" in Bing',
          searchInDuckDuckGo: 'Search "{query}" in DuckDuckGo',
          searchInYahoo: 'Search "{query}" in Yahoo',
          searchInPerplexity: 'Search "{query}" in Perplexity',
          goToUrl: 'Go to {url}',
          openInNewTab: 'Open in new tab',
          noResults: 'No commands found'
        },
        
        // Hints and help
        hints: {
          pressEnter: 'Press Enter',
          pressTab: 'Press Tab',
          editMode: 'Edit Mode - All actions open in this tab'
        },
        
        // Actions
        actions: {
          open: 'Open',
          openInNewTab: 'Open in New Tab',
          openInBackground: 'Open in Background',
          close: 'Close',
          pin: 'Pin',
          duplicate: 'Duplicate'
        },
        
        // Support section
        support: {
          title: '☕ Support Development',
          message: 'This extension has been developed with love, and all its features are completely free. Even the smallest contribution can help me continue maintaining and updating the extension, it would be of great help.',
          buyMeACoffee: 'Buy me a Coffee',
          thankYou: 'Thank you for your support ❤️'
        },
        
        // Cache management
        cache: {
          title: '⚡ ULTRA Cache',
          status: {
            title: 'ULTRA Cache Status',
            description: 'Permanent cache system with preloaded favicons',
            state: 'Status:',
            urls: 'URLs in cache:',
            domains: 'Unique domains:',
            favicons: 'Cached favicons:',
            lastUpdate: 'Last update:',
            memory: 'Memory usage:',
            autoUpdate: 'Auto-update:'
          },
          actions: {
            title: 'ULTRA Cache Actions',
            description: 'Manage the advanced cache system',
            rebuild: 'Load ULTRA Cache',
            clear: 'Clear Cache',
            viewTopDomains: 'View Top Domains',
            stats: 'Statistics'
          },
          config: {
            title: 'Advanced Configuration',
            description: 'Adjust ULTRA cache behavior'
          },
          progress: {
            title: 'ULTRA Load Progress',
            description: 'Processing complete history...'
          },
          topDomains: {
            title: 'Most Visited Domains',
            description: 'The most frequent websites in your history'
          },
          stats: {
            title: 'Detailed Statistics',
            description: 'Complete cache performance information'
          }
        },

        // Popup
        popup: {
          version: 'v1.4.0',
          keyboardShortcuts: 'Keyboard Shortcuts',
          openCommandBar: 'Open Command Bar',
          developerMode: 'Developer mode',
          features: 'Features',
          availableCommands: 'Available Commands',
          searchTypes: 'Search Types',
          configuration: 'Configuration',
          tryCommandBar: 'Try Command Bar',
          advancedSettings: 'Advanced Settings',
          changeLanguage: 'Language Settings',
          
          // Popup messages
          messages: {
            openOptionsManually: 'Open extension options to change language'
          },
          
          // Features
          featureItems: {
            universalSearch: 'Universal Search',
            quickNavigation: 'Quick Navigation',
            tabManagement: 'Tab Management',
            bookmarkAccess: 'Bookmark Access',
            historySearch: 'History Search',
            quickCommands: 'Quick Commands'
          },
          
          // Search types
          searchTypeItems: {
            webSearch: {
              title: 'Web Search',
              desc: 'Search on Google, Bing or DuckDuckGo'
            },
            directNavigation: {
              title: 'Direct Navigation',
              desc: 'Type a URL to navigate'
            },
            openTabs: {
              title: 'Open Tabs',
              desc: 'Search and switch between tabs'
            },
            bookmarks: {
              title: 'Bookmarks',
              desc: 'Search your saved bookmarks'
            },
            history: {
              title: 'History',
              desc: 'Search your browsing history'
            }
          },
          
          // Settings
          settings: {
            darkTheme: 'Dark Theme'
          },
          
          // Tips
          tips: {
            useSlash: 'Use "/" at the start for specific commands',
            directUrl: 'Type a URL for direct navigation'
          },
          
          // Commands
          commands: {
            newTab: 'new tab',
            newTabDesc: 'Create new tab',
            pin: 'pin',
            pinDesc: 'Pin current tab',
            close: 'close',
            closeDesc: 'Close current tab',
            duplicate: 'duplicate',
            duplicateDesc: 'Duplicate current tab',
            bookmarks: 'bookmarks',
            bookmarksDesc: 'Show bookmarks',
            history: 'history',
            historyDesc: 'Show history'
          }
        },
        
        // Options
        options: {
          title: 'CommandBar Pro - Options',
          subtitle: 'Advanced Configuration',
          
          // Main sections
          generalSettings: 'General Settings',
          searchAndResults: 'Search and Results',
          keyboardShortcuts: 'Keyboard Shortcuts',
          privacyAndData: 'Privacy and Data',
          language: 'Language',
          
          // General settings
          general: {
            interfaceTheme: 'Interface Theme',
            interfaceThemeDesc: 'Select CommandBar visual theme',
            animationSpeed: 'Animation Speed',
            animationSpeedDesc: 'Control transition speed',
            maxResults: 'Maximum Results',
            maxResultsDesc: 'Maximum number of suggestions per category',
            
            themeOptions: {
              auto: 'Automatic (System)',
              light: 'Light',
              dark: 'Dark'
            },
            
            animationOptions: {
              slow: 'Slow',
              normal: 'Normal',
              fast: 'Fast',
              none: 'No animations'
            }
          },
          
          // Search settings
          searchSettings: {
            searchSources: 'Search Sources',
            searchSourcesDesc: 'Select where to search for results',
            searchDelay: 'Search Delay (ms)',
            searchDelayDesc: 'Wait time before executing search',
            searchDelayRecommended: 'Recommended',
            defaultSearchEngine: 'Default Search Engine',
            defaultSearchEngineDesc: 'Search engine for web queries',
            
            sources: {
              openTabs: 'Open Tabs',
              bookmarks: 'Bookmarks',
              history: 'History'
            },
            
            engines: {
              google: 'Google',
              bing: 'Bing',
              duckduckgo: 'DuckDuckGo',
              yahoo: 'Yahoo'
            }
          },
          
          // Keyboard shortcuts
          keyboard: {
            mainShortcuts: 'Main Shortcuts',
            mainShortcutsDesc: 'Keyboard combinations for CommandBar',
            openCommandBar: 'Open Command Bar',
            editCurrentUrl: 'Edit current URL',
            developerMode: 'Developer mode',
            additionalConfig: 'Additional Configuration',
            additionalConfigDesc: 'Customize shortcut behavior',
            preventSiteShortcuts: 'Prevent website shortcuts',
            changeShortcut: 'Change',
            resetShortcut: 'Reset',
            recordingPrompt: 'Press your shortcut...',
            pressEscapeToCancel: 'Press Escape to cancel',
            shortcutSaved: 'Shortcut saved successfully',
            shortcutReset: 'Shortcut reset to default',
            shortcutConflict: 'This shortcut is already assigned to another action',
            shortcutInvalid: 'At least one modifier key and a regular key are required',
            shortcutReserved: 'This shortcut is reserved by the browser'
          },

          // Excluded websites
          excludedWebsites: {
            title: 'Excluded Websites',
            description: 'CommandBar will be disabled on sites matching these patterns',
            inputPlaceholder: 'Enter a URL pattern (supports regex)',
            addButton: 'Add',
            noPatterns: 'No patterns configured',
            examples: 'Examples: .*\\.google\\.com, https://mail\\..*',
            invalidRegex: 'Invalid regular expression pattern',
            patternAdded: 'Pattern added successfully',
            patternRemoved: 'Pattern removed successfully',
            duplicatePattern: 'This pattern already exists'
          },

          // Privacy
          privacy: {
            dataCollection: 'Data Collection',
            dataCollectionDesc: 'Control over what data is stored locally',
            dataCleanup: 'Data Cleanup',
            dataCleanupDesc: 'Manage stored data',
            usageStats: 'Usage statistics (local)',
            
            // Privacy actions
            actions: {
              clearCache: 'Clear Cache',
              clearStats: 'Clear Statistics',
              resetAll: 'Reset All'
            },
            
            statsViewer: 'Statistics Viewer',
            statsViewerDesc: 'View locally stored usage statistics',
            viewStats: 'View Statistics',
            refreshStats: 'Refresh',
            noStats: 'No statistics available',
            statsEmpty: 'Enable data collection to view statistics',
            
            actions: {
              open: 'Open',
              openInNewTab: 'Open in New Tab',
              openInBackground: 'Open in Background',
              close: 'Close',
              pin: 'Pin',
              duplicate: 'Duplicate'
            },
            
            // Statistics labels
            statsLabels: {
              commandbar_opened: 'CommandBar opened',
              search_performed: 'Searches performed',
              action_executed: 'Actions executed',
              keyboard_command: 'Keyboard commands',
              url_edit_mode: 'URL edit mode',
              options_page_opened: 'Options page opened',
              today: 'Today',
              yesterday: 'Yesterday',
              total: 'Total',
              last7days: 'Last 7 days',
              last30days: 'Last 30 days'
            }
          },
          
          // Language
          languageSettings: {
            interfaceLanguage: 'Interface Language',
            interfaceLanguageDesc: 'Select CommandBar language',
            languages: {
              es: 'Español',
              en: 'English'
            }
          },
          
          // Buttons
          buttons: {
            exportSettings: 'Export Settings',
            importSettings: 'Import Settings',
            saveChanges: 'Save Changes',
            cancel: 'Cancel',
            confirm: 'Confirm'
          },
          
          // Footer
          footer: {
            version: 'CommandBar Pro v1.4.0',
            changelog: 'Changelog',
            reportBug: 'Report bug',
            viewSource: 'View source code'
          },
          
          // Messages
          messages: {
            settingsLoaded: 'Settings loaded successfully',
            settingsSaved: 'Settings saved successfully',
            cacheCleared: 'Cache cleared successfully',
            statsCleared: 'Statistics cleared successfully',
            settingsReset: 'Settings reset successfully',
            settingsExported: 'Settings exported successfully',
            settingsImported: 'Settings imported successfully',
            invalidFile: 'Error: Invalid settings file',
            themeChanged: 'Theme changed to: {theme}',
            languageChanged: 'Language changed to: {language}',
            
            errors: {
              loadingSettings: 'Error loading settings',
              savingSettings: 'Error saving settings',
              clearingCache: 'Error clearing cache',
              clearingStats: 'Error clearing statistics',
              resettingSettings: 'Error resetting settings',
              importingSettings: 'Error importing settings'
            }
          },
          
          // Confirmations
          confirmations: {
            clearCache: {
              title: 'Clear Cache',
              message: 'Are you sure you want to clear all cache? This will remove saved search results.'
            },
            clearStats: {
              title: 'Clear Statistics',
              message: 'Are you sure you want to clear all usage statistics?'
            },
            resetAll: {
              title: 'Reset All',
              message: 'Are you sure you want to reset all settings? This action cannot be undone.'
            }
          }
        },
        
        // Experimental functions
        experimental: {
          title: 'Experimental Functions',
          warning: 'Experimental functions are under development and may change in future versions. Use them at your own risk.',
          autoOpenNewTab: 'Auto-open in New Tab',
          autoOpenNewTabDesc: 'Automatically open complete CommandBar when creating new empty tabs (Ctrl+T, + button). Includes all features: tab search, bookmarks, history, and intelligent autocompletion.',
          autoOpenEnabled: 'Enable auto-open',
          autoOpenDelay: 'Auto-open Delay (ms)',
          autoOpenDelayDesc: 'Wait time before opening CommandBar (100ms recommended for fast transition)',
          quickTest: 'Quick Test',
          quickTestDesc: 'Verify if experimental configuration is working correctly',
          testAutoOpen: 'Test Auto-open',
          checkConfig: 'Check Config',
          forceSave: 'Force Save',
          testLanguage: 'Test Language'
        },
        
        // Toasts and notifications
        notifications: {
          success: 'Success',
          error: 'Error',
          warning: 'Warning',
          info: 'Information'
        }
      }
    };
    
    // Cargar idioma guardado
    this.loadLanguage();
  }
  
  async loadLanguage() {
    try {
      const lang = await this.getStoredLanguage();
      
      if (this.translations[lang]) {
        this.currentLanguage = lang;
      } else {
        // Error silencioso, usar idioma por defecto
        this.currentLanguage = this.defaultLanguage;
      }
    } catch (error) {
      // Error silencioso, usar idioma por defecto
      this.currentLanguage = this.defaultLanguage;
    }
  }
  
  async setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      try {
        await chrome.storage.sync.set({ language: lang });
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  }
  
  t(key, replacements = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback a español si no existe la clave en inglés
        value = this.translations['es'];
        for (const fallbackK of keys) {
          if (value && typeof value === 'object' && fallbackK in value) {
            value = value[fallbackK];
          } else {
            return key; // Devolver la clave si no se encuentra
          }
        }
        break;
      }
    }
    
    // Reemplazar variables en el texto
    if (typeof value === 'string') {
      for (const [placeholder, replacement] of Object.entries(replacements)) {
        value = value.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacement);
      }
    }
    
    return value;
  }
  
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
}

// Instancia global
const i18n = new I18n();

// Para uso en otros archivos
if (typeof window !== 'undefined') {
  window.i18n = i18n;
} 