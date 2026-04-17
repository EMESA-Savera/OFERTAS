// loginModal.js - Sistema de Login Modal Universal con Gestión de Sesión
// =====================================================================

// Configuración global
const LOGIN_MODAL_CONFIG = {
  AUTO_CHECK_INTERVAL: 30000, // Verificar cada 30 segundos si hay usuario
  REDIRECT_DELAY: 1500, // Delay antes de redireccionar después del login exitoso
  STYLES_LOADED: false
};

// Estado global del modal
let loginModalState = {
  isOpen: false,
  checkInterval: null,
  originalUrl: null
};

// Debug de autenticación (sin datos sensibles)
function debugAuthSnapshot(context = 'snapshot') {
  try {
    const rawUser = localStorage.getItem('usuarioSGA');
    let parsedUser = null;
    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch {
        parsedUser = { _parse_error: true, raw: rawUser };
      }
    }

    console.log(`🔎 [AUTH][${context}]`, {
      hasUsuarioSGA: !!rawUser,
      localStorageKeys: Object.keys(localStorage || {}),
      sessionStorageKeys: Object.keys(sessionStorage || {}),
      usuarioSGA: parsedUser
    });
  } catch (error) {
    console.warn(`⚠️ [AUTH][${context}] No se pudo leer storage:`, error);
  }
}

// Función para cargar los estilos CSS si no están cargados
function loadLoginModalStyles() {
  if (LOGIN_MODAL_CONFIG.STYLES_LOADED) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/static/css/loginModal.css';
  document.head.appendChild(link);
  
  LOGIN_MODAL_CONFIG.STYLES_LOADED = true;
}

// Función para crear el HTML del modal
function createLoginModalHTML() {
  return `
    <div id="loginModalOverlay" class="login-modal-overlay">
      <div class="login-modal-container">
        <div class="login-modal-header">
          <h2 data-original-text="Acceso Requerido">🔐 Acceso Requerido</h2>
          <p data-original-text="Debes iniciar sesión para continuar">Debes iniciar sesión para continuar</p>
        </div>
        
        <form class="login-modal-form" id="loginModalForm">
          <div class="login-modal-field">
            <label for="loginModalUsername" 
                   class="login-modal-label"
                   data-original-text="Usuario (Número de Operario)">Usuario (Número de Operario)</label>
            <input 
              type="text" 
              id="loginModalUsername" 
              name="username" 
              class="login-modal-input" 
              placeholder="Ingresa tu número de operario"
              data-original-placeholder="Ingresa tu número de operario"
              required 
              autocomplete="username"
            >
          </div>
          
          <div class="login-modal-field">
            <label for="loginModalPassword" 
                   class="login-modal-label"
                   data-original-text="Contraseña">Contraseña</label>
            <input 
              type="password" 
              id="loginModalPassword" 
              name="password" 
              class="login-modal-input" 
              placeholder="Ingresa tu contraseña"
              data-original-placeholder="Ingresa tu contraseña"
              required 
              autocomplete="current-password"
            >
          </div>
          
          <div id="loginModalMessage" class="login-modal-message"></div>
          
          <div class="login-modal-buttons">
            <button type="submit" class="login-modal-btn-primary" id="loginModalSubmit">
              <span class="login-modal-btn-text" data-original-text="Iniciar Sesión">Iniciar Sesión</span>
              <span class="login-modal-spinner" style="display: none;">⟳</span>
            </button>
          </div>
        </form>
        
        <div class="login-modal-footer">
          <small data-original-text="Tip: Una vez que inicies sesión, podrás continuar con tu trabajo normal">💡 Tip: Una vez que inicies sesión, podrás continuar con tu trabajo normal</small>
        </div>
      </div>
    </div>
  `;
}

// Función para verificar si hay usuario logueado
function checkUserSession() {
  try {
    const usuarioSGA = JSON.parse(localStorage.getItem('usuarioSGA'));
    const hasSession = !!(usuarioSGA && usuarioSGA.id);
    if (!hasSession) {
      console.log('🔐 [AUTH] No hay sesión válida (falta usuarioSGA.id)');
    }
    return hasSession;
  } catch {
    console.log('🔐 [AUTH] No hay sesión válida (JSON inválido en usuarioSGA)');
    return false;
  }
}

// Función para mostrar el modal de login
function showLoginModal() {
  if (loginModalState.isOpen) return;
  
  // Cargar estilos si no están cargados
  loadLoginModalStyles();
  
  // Guardar URL original para redirección posterior
  loginModalState.originalUrl = window.location.href;
  
  // Crear y añadir el modal al DOM
  const modalHTML = createLoginModalHTML();
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);
  
  // Configurar event listeners
  setupLoginModalEvents();
  
  // Traducir el modal si el sistema de traducción está disponible
  if (window.GlobalHeader && window.GlobalHeader.translatePage) {
    window.GlobalHeader.translatePage();
  }
  
  // Mostrar modal con animación
  setTimeout(() => {
    document.getElementById('loginModalOverlay').classList.add('active');
    document.getElementById('loginModalUsername').focus();
  }, 10);
  
  loginModalState.isOpen = true;
  
  console.log('🔐 Modal de login mostrado - Usuario no autenticado');
}

// Función para ocultar el modal de login
function hideLoginModal() {
  const overlay = document.getElementById('loginModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
  loginModalState.isOpen = false;
}

// Función para configurar los eventos del modal
function setupLoginModalEvents() {
  const form = document.getElementById('loginModalForm');
  const usernameInput = document.getElementById('loginModalUsername');
  const passwordInput = document.getElementById('loginModalPassword');
  
  // Envío del formulario
  form.addEventListener('submit', handleLoginSubmit);
  
  // Enter en los campos
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });
  
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });
  
  // Limpiar mensaje de error al escribir
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('input', () => {
      clearLoginMessage();
      input.classList.remove('error');
    });
  });
}

// Función para manejar el envío del login
async function handleLoginSubmit(event) {
  event.preventDefault();
  
  // Helper para traducir
  const t = (key) => (window.GlobalHeader && window.GlobalHeader.translate)
                     ? window.GlobalHeader.translate(key)
                     : key;
  
  const username = document.getElementById('loginModalUsername').value.trim();
  const password = document.getElementById('loginModalPassword').value.trim();
  const submitBtn = document.getElementById('loginModalSubmit');
  const btnText = submitBtn.querySelector('.login-modal-btn-text');
  const spinner = submitBtn.querySelector('.login-modal-spinner');
  
  if (!username || !password) {
    showLoginMessage(t('Por favor, complete todos los campos.'), 'error');
    return;
  }

  console.log('🔐 [AUTH] Intento de login iniciado', {
    usuario: username,
    hasPassword: !!password,
    passwordLength: password.length
  });
  debugAuthSnapshot('before-login-request');
  
  // Mostrar estado de carga
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline';
  clearLoginMessage();
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: username, password: password })
    });
    
    const userData = await response.json();
    
    if (response.ok && userData.success !== false) {
      // Guardar usuario en localStorage
      localStorage.setItem('usuarioSGA', JSON.stringify(userData));
      console.log('✅ [AUTH] Login API correcto, usuario persistido en localStorage', {
        id: userData.id,
        num_operario: userData.num_operario,
        nombre: userData.nombre,
        rol: userData.rol,
        tipo_usuario: userData.tipo_usuario
      });
      debugAuthSnapshot('after-login-success-save');
      
      // Actualizar widget de usuario
      if (typeof updateUserWidget === 'function') {
        updateUserWidget();
      }
      
      // Mostrar mensaje de éxito
      showLoginMessage(`${t('¡Bienvenido')}, ${userData.nombre || userData.num_operario}!`, 'success');
      
      // Ocultar modal después de un breve delay
      setTimeout(async () => {
        hideLoginModal();
        
        // Esperar a que el modal de login se anime completamente
        await new Promise(resolve => setTimeout(resolve, 300));
        // Flujo híbrido: NO solicitar credenciales aquí.
        // OAuth2 se pedirá únicamente cuando una acción lo requiera.
        
        // Emitir evento personalizado para notificar a la página (carga datos sin reload)
        window.dispatchEvent(new CustomEvent('userLoggedIn', { 
          detail: userData 
        }));
        
        console.log('✅ Usuario autenticado exitosamente:', userData.num_operario);
        
      }, LOGIN_MODAL_CONFIG.REDIRECT_DELAY);
      
    } else {
      console.warn('❌ [AUTH] Login API rechazado', {
        status: response.status,
        response: userData
      });
      showLoginMessage(userData.message || t('Usuario o contraseña incorrectos.'), 'error');
      document.getElementById('loginModalUsername').classList.add('error');
      document.getElementById('loginModalPassword').classList.add('error');
    }
    
  } catch (error) {
    console.error('Error en login modal:', error);
    debugAuthSnapshot('login-catch-error');
    showLoginMessage(t('Error de conexión. Intenta nuevamente.'), 'error');
  } finally {
    // Restaurar estado del botón
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

// Función para mostrar mensajes en el modal
function showLoginMessage(message, type = 'info') {
  const messageDiv = document.getElementById('loginModalMessage');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `login-modal-message ${type}`;
    messageDiv.style.display = 'block';
  }
}

// Función para limpiar mensajes
function clearLoginMessage() {
  const messageDiv = document.getElementById('loginModalMessage');
  if (messageDiv) {
    messageDiv.style.display = 'none';
    messageDiv.textContent = '';
    messageDiv.className = 'login-modal-message';
  }
}


// Función para verificar automáticamente la sesión
function startSessionCheck() {
  // Detener verificación previa si existe
  if (loginModalState.checkInterval) {
    clearInterval(loginModalState.checkInterval);
  }
  
  // Verificación inicial
  if (!checkUserSession()) {
    showLoginModal();
  }
  
  // Verificación periódica
  loginModalState.checkInterval = setInterval(() => {
    if (!checkUserSession() && !loginModalState.isOpen) {
      showLoginModal();
    }
  }, LOGIN_MODAL_CONFIG.AUTO_CHECK_INTERVAL);
}

// Función para detener la verificación automática
function stopSessionCheck() {
  if (loginModalState.checkInterval) {
    clearInterval(loginModalState.checkInterval);
    loginModalState.checkInterval = null;
  }
}

// Función para verificar usuario antes de operaciones críticas
function requireUser(callback, errorMessage = 'Debes iniciar sesión para realizar esta acción.') {
  if (checkUserSession()) {
    return callback();
  } else {
    showLoginModal();
    // Opcional: mostrar mensaje específico
    setTimeout(() => {
      showLoginMessage(errorMessage, 'warning');
    }, 500);
    return false;
  }
}

// Función para obtener el usuario actual
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('usuarioSGA'));
  } catch {
    return null;
  }
}

// Función para cerrar sesión
async function logoutUser() {
  try {
    await fetch('/api/logout', { method: 'POST' });

    // Limpiar localStorage
    localStorage.removeItem('usuarioSGA');
    
    // Detener verificación automática
    stopSessionCheck();
    
    // Actualizar widget de usuario si existe
    if (typeof updateUserWidget === 'function') {
      updateUserWidget();
    }
    
    // Mostrar mensaje de confirmación
    console.log('🚪 Sesión cerrada correctamente');

    // Cerrar también sesión OAuth (cookie/token server-side)
    // Esto evita que correos salgan con un usuario OAuth anterior.
    window.location.href = '/auth/logout';
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    alert('Error al cerrar sesión');
  }
}

// Función para crear el widget de usuario
function createUserWidget() {
  const container = document.getElementById('loginWidgetContainer');
  if (!container) {
    console.warn('loginWidgetContainer no encontrado en el DOM');
    return;
  }
  
  updateUserWidget();
}

// Función para actualizar el widget de usuario
function updateUserWidget() {
  const container = document.getElementById('loginWidgetContainer');
  if (!container) return;
  
  const user = getCurrentUser();
  
  if (user && user.nombre) {
    container.innerHTML = `
      <div class="user-info">
        <span class="user-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style="vertical-align:middle;">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" fill="#fff"/>
            </svg>
        </span>
        <span class="user-name">${user.nombre}</span>
        <button class="logout-btn" onclick="LoginModal.logout()" title="Cerrar Sesión">
          Salir
        </button>
      </div>
    `;
    container.style.display = 'flex';
  } else {
    container.innerHTML = '';
    container.style.display = 'none';
  }
}

// Función para crear los estilos del widget de usuario
function createUserWidgetStyles() {
  if (document.getElementById('userWidgetStyles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'userWidgetStyles';
  styles.textContent = `
    #loginWidgetContainer {
      display: none;
      align-items: center;
      gap: 8px;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 6px 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .user-icon {
      font-size: 16px;
    }
    
    .user-name {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .logout-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 15px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
    
    .logout-btn:active {
      transform: translateY(0);
    }
    
    /* Responsive para móviles */
    @media (max-width: 768px) {
      .user-info {
        padding: 4px 8px;
        font-size: 12px;
      }
      
      .user-name {
        max-width: 80px;
      }
      
      .logout-btn {
        padding: 2px 6px;
        font-size: 11px;
      }
    }
  `;
  
  document.head.appendChild(styles);
}

// API pública del módulo
window.LoginModal = {
  // Métodos principales
  show: showLoginModal,
  hide: hideLoginModal,
  checkUser: checkUserSession,
  requireUser: requireUser,
  getCurrentUser: getCurrentUser,
  logout: logoutUser,
  
  // Inicialización manual (para uso desde globalHeader.js)
  init: function() {
    createUserWidgetStyles();
    createUserWidget();
    startSessionCheck();
  },
  
  // Gestión del widget de usuario
  createUserWidget: createUserWidget,
  updateUserWidget: updateUserWidget,
  
  // Control de verificación automática
  startAutoCheck: startSessionCheck,
  stopAutoCheck: stopSessionCheck,
  
  // Configuración
  config: LOGIN_MODAL_CONFIG,
  
  // Estado (solo lectura)
  get isOpen() { return loginModalState.isOpen; },
  get hasUser() { return checkUserSession(); }
};

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Crear estilos del widget
    createUserWidgetStyles();
    // Crear widget de usuario
    createUserWidget();
    // Iniciar verificación de sesión
    startSessionCheck();
    debugAuthSnapshot('dom-content-loaded-init');
  });
} else {
  // DOM ya está listo
  createUserWidgetStyles();
  createUserWidget();
  startSessionCheck();
  debugAuthSnapshot('immediate-init');
}

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  stopSessionCheck();
});

console.log('🔐 LoginModal cargado - Sistema de autenticación universal activo');
