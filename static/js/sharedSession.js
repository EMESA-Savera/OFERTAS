/**
 * Shared Session Management
 * Gestiona sesiones compartidas entre diferentes módulos de la aplicación
 */

const SharedSession = {
  /**
   * Almacena datos en la sesión compartida
   */
  set: function(key, value) {
    try {
      sessionStorage.setItem(`shared_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error almacenando en shared session: ${e.message}`);
    }
  },

  /**
   * Recupera datos de la sesión compartida
   */
  get: function(key) {
    try {
      const item = sessionStorage.getItem(`shared_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn(`Error recuperando de shared session: ${e.message}`);
      return null;
    }
  },

  /**
   * Elimina datos de la sesión compartida
   */
  remove: function(key) {
    try {
      sessionStorage.removeItem(`shared_${key}`);
    } catch (e) {
      console.warn(`Error eliminando de shared session: ${e.message}`);
    }
  },

  /**
   * Limpia toda la sesión compartida
   */
  clear: function() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('shared_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      console.warn(`Error limpiando shared session: ${e.message}`);
    }
  }
};

// Exportar para uso global
window.SharedSession = SharedSession;
