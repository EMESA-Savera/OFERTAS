document.addEventListener('DOMContentLoaded', async () => {
  if (window.MonthlyI18n && window.MonthlyI18n.ready) {
    try {
      await window.MonthlyI18n.ready;
    } catch {
      // La app debe seguir usando los textos por defecto si falla i18n.
    }
  }

  const currentUrl = new URL(window.location.href);
  const shouldOpenOutlookAfterAuth = currentUrl.searchParams.get('open_outlook') === '1';
  const outlookAuthError = currentUrl.searchParams.get('outlook_error') || '';
  if (shouldOpenOutlookAfterAuth || outlookAuthError) {
    currentUrl.searchParams.delete('open_outlook');
    currentUrl.searchParams.delete('outlook_error');
    const cleanUrl = `${currentUrl.pathname}${currentUrl.search ? currentUrl.search : ''}${currentUrl.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  const getNavItems = () => document.querySelectorAll('.sidebar-menu .nav-item[data-view]');
  const getViewPanels = () => document.querySelectorAll('[data-view-panel]');
  const getSidebars = () => document.querySelectorAll('.sidebar');
  const sidebarNavContainers = document.querySelectorAll('.js-sidebar-nav');
  const configCards = document.querySelectorAll('[data-config-target]');
  const form = document.getElementById('nuevaOfertaForm');
  const feedback = document.getElementById('formFeedback');
  const mailDropzone = document.getElementById('mailDropzone');
  const mailFileInput = document.getElementById('mailFileInput');
  const openOutlookImportButton = document.getElementById('openOutlookImportButton');
  const numeroOfertaField = document.getElementById('numero_oferta');
  const clienteSelect = document.getElementById('cliente');
  const emisorInput = document.getElementById('emisor');
  const configButtons = document.querySelectorAll('.sidebar-config-btn[data-view="configuracion"], .btn-config[data-view="configuracion"]');
  const breadcrumbContainer = document.getElementById('breadcrumbContainer');
  const clienteCreateForm = document.getElementById('clienteCreateForm');
  const clienteCreateFeedback = document.getElementById('clienteCreateFeedback');
  const clientesTableFeedback = document.getElementById('clientesTableFeedback');
  const clientesTableBody = document.getElementById('clientesTableBody');
  const clientesModeButtons = document.querySelectorAll('[data-clientes-mode]');
  const clientesModePanels = document.querySelectorAll('[data-clientes-mode-panel]');
  const projectCreateForm = document.getElementById('projectCreateForm');
  const projectCreateFeedback = document.getElementById('projectCreateFeedback');
  const proyectosTableFeedback = document.getElementById('proyectosTableFeedback');
  const proyectosTableBody = document.getElementById('proyectosTableBody');
  const proyectosModeButtons = document.querySelectorAll('[data-proyectos-mode]');
  const proyectosModePanels = document.querySelectorAll('[data-proyectos-mode-panel]');
  const userCreateForm = document.getElementById('userCreateForm');
  const userCreateFeedback = document.getElementById('userCreateFeedback');
  const usuariosTableFeedback = document.getElementById('usuariosTableFeedback');
  const usuariosTableBody = document.getElementById('usuariosTableBody');
  const usuariosModeButtons = document.querySelectorAll('[data-usuarios-mode]');
  const usuariosModePanels = document.querySelectorAll('[data-usuarios-mode-panel]');
  const userNumOperarioInput = document.getElementById('user_num_operario');
  const userNombreInput = document.getElementById('user_nombre');
  const userEmailInput = document.getElementById('user_email');
  const addDepartmentButton = document.getElementById('addDepartmentButton');
  const departmentCreatePrompt = document.getElementById('departmentCreatePrompt');
  const departmentCreatePromptInput = document.getElementById('departmentCreatePromptInput');
  const departmentCreatePromptFeedback = document.getElementById('departmentCreatePromptFeedback');
  const departmentCreatePromptConfirm = document.getElementById('departmentCreatePromptConfirm');
  const userRoleSelect = document.getElementById('user_rol');
  const userDepartamentosSelect = document.getElementById('user_departamentos');
  const estadoCreateForm = document.getElementById('estadoCreateForm');
  const estadoCreateDescripcion = document.getElementById('descripcion_estado');
  const estadoEmojiSidebar = document.getElementById('estadoEmojiSidebar');
  const estadoEmojiSidebarPicker = document.getElementById('estadoEmojiSidebarPicker');
  const estadoDepartamentoSelect = document.getElementById('estado_departamento');
  const estadoCreateFeedback = document.getElementById('estadoCreateFeedback');
  const estadoEditModal = document.getElementById('estadoEditModal');
  const estadoEditForm = document.getElementById('estadoEditForm');
  const estadoEditId = document.getElementById('estadoEditId');
  const estadoEditOrden = document.getElementById('estadoEditOrden');
  const estadoEditDescripcion = document.getElementById('estadoEditDescripcion');
  const estadoEditDepartamento = document.getElementById('estadoEditDepartamento');
  const estadoEditEmojiSidebar = document.getElementById('estadoEditEmojiSidebar');
  const estadoEditEmojiSidebarPicker = document.getElementById('estadoEditEmojiSidebarPicker');
  const estadoEditActivo = document.getElementById('estadoEditActivo');
  const estadoEditFeedback = document.getElementById('estadoEditFeedback');
  const estadosTableFeedback = document.getElementById('estadosTableFeedback');
  const estadosTableBody = document.getElementById('estadosTableBody');
  const estadosModeButtons = document.querySelectorAll('[data-estados-mode]');
  const estadosModePanels = document.querySelectorAll('[data-estados-mode-panel]');
  const estadoColumnasSelect = document.getElementById('estadoColumnasSelect');
  const configColumnCreateForm = document.getElementById('configColumnCreateForm');
  const configColumnaSelect = document.getElementById('config_columna');
  const configColumnCreateFeedback = document.getElementById('configColumnCreateFeedback');
  const configColumnasTableFeedback = document.getElementById('configColumnasTableFeedback');
  const configColumnasTableBody = document.getElementById('configColumnasTableBody');
  const ofertasListadoTitle = document.getElementById('ofertasListadoTitle');
  const ofertasListadoDescription = document.getElementById('ofertasListadoDescription');
  const ofertasListadoTableBody = document.getElementById('ofertasListadoTableBody');
  const ofertasListadoFeedback = document.getElementById('ofertasListadoFeedback');
  const offerDeletePrompt = document.getElementById('offerDeletePrompt');
  const offerDeletePromptMessage = document.getElementById('offerDeletePromptMessage');
  const offerDeletePromptPassword = document.getElementById('offerDeletePromptPassword');
  const offerDeletePromptFeedback = document.getElementById('offerDeletePromptFeedback');
  const offerDeletePromptConfirm = document.getElementById('offerDeletePromptConfirm');
  const offerReassignPrompt = document.getElementById('offerReassignPrompt');
  const offerReassignPromptMessage = document.getElementById('offerReassignPromptMessage');
  const offerReassignPromptDepartment = document.getElementById('offerReassignPromptDepartment');
  const offerReassignPromptUser = document.getElementById('offerReassignPromptUser');
  const offerReassignPromptFeedback = document.getElementById('offerReassignPromptFeedback');
  const offerReassignPromptConfirm = document.getElementById('offerReassignPromptConfirm');
  const offerCenterModal = document.getElementById('offerCenterModal');
  const offerCenterRoot = document.getElementById('offerCenterRoot');
  const offerCenterFeedback = document.getElementById('offerCenterFeedback');
  const offerCenterAttachmentInput = document.getElementById('offerCenterAttachmentInput');
  const offerCenterHistoryModal = document.getElementById('offerCenterHistoryModal');
  const offerCenterChatPanel = document.getElementById('offerCenterChatPanel');
  const offerCenterChatTitle = document.getElementById('offerCenterChatTitle');
  const offerCenterChatMessages = document.getElementById('offerCenterChatMessages');
  const offerCenterChatForm = document.getElementById('offerCenterChatForm');
  const offerCenterChatInput = document.getElementById('offerCenterChatInput');
  const offerCenterChatSubmit = document.getElementById('offerCenterChatSubmit');
  const offerAttachmentPreviewModal = document.getElementById('offerAttachmentPreviewModal');
  const offerAttachmentPreviewTitle = document.getElementById('offerAttachmentPreviewTitle');
  const offerAttachmentPreviewMeta = document.getElementById('offerAttachmentPreviewMeta');
  const offerAttachmentPreviewActions = document.getElementById('offerAttachmentPreviewActions');
  const offerAttachmentPreviewBody = document.getElementById('offerAttachmentPreviewBody');
  const offerAttachmentsGalleryModal = document.getElementById('offerAttachmentsGalleryModal');
  const offerAttachmentsGalleryBody = document.getElementById('offerAttachmentsGalleryBody');
  const offerCenterHeroTitle = document.getElementById('offerCenterHeroTitle');
  const offerCenterHeroMeta = document.getElementById('offerCenterHeroMeta');
  const offerCenterHeroBadges = document.getElementById('offerCenterHeroBadges');
  const offerCenterEmailGrid = document.getElementById('offerCenterEmailGrid');
  const offerCenterHistory = document.getElementById('offerCenterHistory');
  const ofertaEditModal = document.getElementById('ofertaEditModal');
  const ofertaEditForm = document.getElementById('ofertaEditForm');
  const ofertaEditFeedback = document.getElementById('ofertaEditFeedback');
  const ofertaEditId = document.getElementById('ofertaEditId');
  const ofertaEditNumero = document.getElementById('ofertaEditNumero');
  const ofertaEditEstado = document.getElementById('ofertaEditEstado');
  const ofertaEditFechaEmail = document.getElementById('ofertaEditFechaEmail');
  const ofertaEditFechaAlta = document.getElementById('ofertaEditFechaAlta');
  const ofertaEditRef = document.getElementById('ofertaEditRef');
  const ofertaEditCliente = document.getElementById('ofertaEditCliente');
  const ofertaEditEmisor = document.getElementById('ofertaEditEmisor');
  const ofertaEditObservaciones = document.getElementById('ofertaEditObservaciones');
  const ofertaEstadoModal = document.getElementById('ofertaEstadoModal');
  const ofertaEstadoForm = document.getElementById('ofertaEstadoForm');
  const ofertaEstadoFeedback = document.getElementById('ofertaEstadoFeedback');
  const ofertaEstadoId = document.getElementById('ofertaEstadoId');
  const ofertaEstadoNumero = document.getElementById('ofertaEstadoNumero');
  const ofertaEstadoActual = document.getElementById('ofertaEstadoActual');
  const ofertaEstadoNuevo = document.getElementById('ofertaEstadoNuevo');
  const ofertaEstadoFecha = document.getElementById('ofertaEstadoFecha');
  const ofertaEstadoFechaLimite = document.getElementById('ofertaEstadoFechaLimite');
  const ofertaEstadoSinFechaLimite = document.getElementById('ofertaEstadoSinFechaLimite');
  const ofertaEstadoComentario = document.getElementById('ofertaEstadoComentario');
  const ofertaEstadoHistorial = document.getElementById('ofertaEstadoHistorial');
  const bomModal = document.getElementById('bomModal');
  const bomModalTitle = document.getElementById('bomModalTitle');
  const bomModalOffer = document.getElementById('bomModalOffer');
  const bomSearchInput = document.getElementById('bomSearchInput');
  const bomListView = document.getElementById('bomListView');
  const bomEditView = document.getElementById('bomEditView');
  const bomListBody = document.getElementById('bomListBody');
  const bomEditForm = document.getElementById('bomEditForm');
  const bomEditMaterialId = document.getElementById('bomEditMaterialId');
  const bomEditMaterial = document.getElementById('bomEditMaterial');
  const bomEditCurrentPrice = document.getElementById('bomEditCurrentPrice');
  const bomEditPreviousPrice = document.getElementById('bomEditPreviousPrice');
  const bomEditNewPrice = document.getElementById('bomEditNewPrice');
  const bomFeedback = document.getElementById('bomFeedback');
  const ofertaEtcModal = document.getElementById('ofertaEtcModal');
  const ofertaEtcForm = document.getElementById('ofertaEtcForm');
  const ofertaEtcFeedback = document.getElementById('ofertaEtcFeedback');
  const ofertaEtcResponsable = document.getElementById('ofertaEtcResponsable');
  const ofertaEtcDepartamento = document.getElementById('ofertaEtcDepartamento');
  const ofertaEtcToggleExtended = document.getElementById('ofertaEtcToggleExtended');
  const ofertaEtcExtendedFields = document.getElementById('ofertaEtcExtendedFields');
  const ofertaEtcPrioridad = document.getElementById('ofertaEtcPrioridad');
  const ofertaEtcUrgente = document.getElementById('ofertaEtcUrgente');
  const ofertaEtcCodigoExterno = document.getElementById('ofertaEtcCodigoExterno');
  const ofertaEtcCodigoInterno = document.getElementById('ofertaEtcCodigoInterno');
  const ofertaEtcReferenciaCliente = document.getElementById('ofertaEtcReferenciaCliente');
  const ofertaEtcIncoterm = document.getElementById('ofertaEtcIncoterm');
  const ofertaEtcNumeroComision = document.getElementById('ofertaEtcNumeroComision');
  const ofertaEtcProyecto = document.getElementById('ofertaEtcProyecto');
  const ofertaEtcPoOriginal = document.getElementById('ofertaEtcPoOriginal');
  const ofertaEtcPedidoB2b = document.getElementById('ofertaEtcPedidoB2b');
  const ofertaEtcFechaEnvio = document.getElementById('ofertaEtcFechaEnvio');
  const ofertaEtcSolicitanteNombre = document.getElementById('ofertaEtcSolicitanteNombre');
  const ofertaEtcSolicitanteEmail = document.getElementById('ofertaEtcSolicitanteEmail');
  const ofertaEtcTotalMaterial = document.getElementById('ofertaEtcTotalMaterial');
  const ofertaEtcTotalFee = document.getElementById('ofertaEtcTotalFee');
  const ofertaEtcResumenMaterial = document.getElementById('ofertaEtcResumenMaterial');
  const ofertaEtcObservacionesCliente = document.getElementById('ofertaEtcObservacionesCliente');
  const outlookImportModal = document.getElementById('outlookImportModal');
  const outlookImportFeedback = document.getElementById('outlookImportFeedback');
  const outlookMailboxLabel = document.getElementById('outlookMailboxLabel');
  const outlookMessagesList = document.getElementById('outlookMessagesList');
  const outlookMessageDetail = document.getElementById('outlookMessageDetail');
  const outlookImportSelectedButton = document.getElementById('outlookImportSelectedButton');

  let clientesCache = [];
  let proyectosCache = [];
  let usuariosCache = [];
  let generalUsersCache = [];
  let rolesCache = [];
  let departamentosCache = [];
  let editingClienteId = null;
  let editingProyectoId = null;
  let editingUsuarioId = null;
  let estadosCache = [];
  let stateEmojiSuggestions = {
    default: '📌',
    choices: [{ emoji: '📌', label: 'General' }],
    rules: [],
  };
  let stateEmojiSuggestionsPromise = null;
  let estadoCreateEmojiManuallyChanged = false;
  let estadoEditEmojiManuallyChanged = false;
  let configuracionColumnasCache = [];
  let ofertasListadoCache = [];
  let availableOfferColumns = [];
  let currentOfferColumnsConfig = [];
  let editingConfigId = null;
  let offerDeletePromptResolver = null;
  let offerDeletePromptPreviousFocus = null;
  let offerReassignPromptResolver = null;
  let offerReassignPromptPreviousFocus = null;
  let departmentCreatePromptResolver = null;
  let departmentCreatePromptPreviousFocus = null;
  let pendingOfferReassignContext = null;
  let skipConfigAutoSaveId = null;
  let selectedEstadoId = '';
  let currentViewName = 'nueva-oferta';
  let currentListadoContext = { viewName: 'todos', estadoId: null, label: 'Todos' };
  let currentOfertaEstadoId = null;
  let currentOfertaEstadoInteracciones = [];
  let currentOfferCenterOferta = null;
  let offerCenterReturnContext = null;
  let currentOfferChatMessages = [];
  let currentOfferAttachmentPreview = null;
  let offerAttachmentPreviewReturnToGallery = false;
  let importedEmailAttachmentToken = null;
  let importedEmailMetadata = null;
  let pendingOfertaEtcPayload = null;
  let savedOfertaContext = null;
  let currentAuthenticatedUser = null;
  let outlookMessagesCache = [];
  let selectedOutlookMessageId = null;
  let selectedOutlookMessageImportData = null;
  let outlookAuthRedirectInProgress = false;
  let bomMaterialesCache = [];
  let currentBomOfertaContext = null;
  let currentBomMaterial = null;
  const expandedTableCells = new Set();
  const ACTION_COLUMN_VISIBILITY_KEY = 'ofertasActionColumnVisibility';
  const INLINE_ATTACHMENT_CARD_LIMIT = 4;
  const OPTIONAL_ACTION_KEYS = Object.freeze(['edit', 'bom']);
  const DEFAULT_ACTION_COLUMN_VISIBILITY = Object.freeze({
    visible: ['edit', 'bom'],
    hidden: [],
  });
  let ofertasActionColumnVisibility = {
    visible: [...DEFAULT_ACTION_COLUMN_VISIBILITY.visible],
    hidden: [...DEFAULT_ACTION_COLUMN_VISIBILITY.hidden],
  };
  let draggedActionConfigKey = null;
  let actionConfigPopup = null;
  let actionConfigPopupAnchor = null;
  const GLOBAL_CONFIG_SCOPE_ID = '-1';
  const tableStates = {
    ofertas: { filters: {}, sortKey: 'numero_oferta', sortDirection: 'asc', quickFiltersOpen: false },
    clientes: { filters: {}, sortKey: null, sortDirection: 'asc', quickFiltersOpen: false },
    proyectos: { filters: {}, sortKey: null, sortDirection: 'asc', quickFiltersOpen: false },
    usuarios: { filters: {}, sortKey: 'num_operario', sortDirection: 'asc', quickFiltersOpen: false },
    estados: { filters: {}, sortKey: 'orden', sortDirection: 'asc', quickFiltersOpen: false },
    configColumnas: { filters: {}, sortKey: 'orden_columna', sortDirection: 'asc', quickFiltersOpen: false },
  };
  const tableDefinitions = {
    ofertas: {
      tableElement: () => ofertasListadoTableBody?.closest('table'),
      getColumns: () => {
        const configuredColumns = currentOfferColumnsConfig.length
          ? currentOfferColumnsConfig.map((config) => ({
              key: config.columna,
              label: getConfiguredOfferColumnLabel(config),
              sortable: true,
              searchable: true,
            }))
          : [
              { key: 'numero_oferta', label: t('table.offer_number', 'Nº oferta'), sortable: true, searchable: true },
              { key: 'fecha_alta_oferta', label: t('table.created_date', 'Fecha alta'), sortable: true, searchable: true },
              { key: 'cliente', label: t('table.client', 'Cliente'), sortable: true, searchable: true },
              { key: 'emisor', label: t('table.sender', 'Emisor'), sortable: true, searchable: true },
              { key: 'observaciones_oferta', label: t('table.notes', 'Observaciones'), sortable: true, searchable: true },
              { key: 'estado', label: t('table.status', 'Estado'), sortable: true, searchable: true },
            ];

        return [
          { key: 'vista', label: '', sortable: false, searchable: false },
          ...configuredColumns,
          { key: 'acciones', label: t('table.actions', 'Acciones'), sortable: false, searchable: false },
        ];
      },
    },
    clientes: {
      tableElement: () => clientesTableBody?.closest('table'),
      columns: [
        { key: 'id_cliente', label: t('literal.table.id', 'ID'), sortable: true, searchable: true },
        { key: 'descripcion_cliente', label: t('table.client_description', 'Descripción cliente'), sortable: true, searchable: true },
        { key: 'dominio', label: t('config.domain', 'Dominio'), sortable: true, searchable: true },
        { key: 'acciones', label: t('table.actions', 'Acciones'), sortable: false, searchable: false },
      ],
    },
    proyectos: {
      tableElement: () => proyectosTableBody?.closest('table'),
      columns: [
        { key: 'id_proyecto', label: t('literal.table.id', 'ID'), sortable: true, searchable: true },
        { key: 'descripcion_proyecto', label: t('literal.projects.project_description', 'Descripción proyecto'), sortable: true, searchable: true },
        { key: 'acciones', label: t('table.actions', 'Acciones'), sortable: false, searchable: false },
      ],
    },
    usuarios: {
      tableElement: () => usuariosTableBody?.closest('table'),
      columns: [
        { key: 'num_operario', label: t('literal.users.operator_number', 'Nº operario'), sortable: true, searchable: true },
        { key: 'nombre', label: t('literal.users.name', 'Nombre'), sortable: true, searchable: true },
        { key: 'email', label: t('literal.users.email', 'Email'), sortable: true, searchable: true },
        { key: 'rol', label: t('literal.users.role', 'Rol'), sortable: true, searchable: true },
        { key: 'departamentos', label: t('literal.users.departments', 'Departamentos'), sortable: true, searchable: true },
        { key: 'acciones', label: t('table.actions', 'Acciones'), sortable: false, searchable: false },
      ],
    },
    estados: {
      tableElement: () => estadosTableBody?.closest('table'),
      columns: [
        { key: 'drag', label: '', sortable: false, searchable: false, className: 'col-drag' },
        { key: 'orden', label: t('table.order', 'Orden'), sortable: true, searchable: true },
        { key: 'descripcion_estado', label: t('table.state_description', 'Descripción estado'), sortable: true, searchable: true },
        { key: 'nombre_departamento', label: t('table.department', 'Departamento'), sortable: true, searchable: true },
        { key: 'acciones', label: t('table.actions', 'Acciones'), sortable: false, searchable: false },
      ],
    },
    configColumnas: {
      tableElement: () => configColumnasTableBody?.closest('table'),
      columns: [
        { key: 'drag', label: '', sortable: false, searchable: false, className: 'col-drag' },
        { key: 'columna', label: t('table.column', 'Columna'), sortable: true, searchable: true },
        { key: 'descripcion_columna', label: t('table.description', 'Descripción'), sortable: true, searchable: true },
        { key: 'orden_columna', label: t('table.order', 'Orden'), sortable: true, searchable: true },
        { key: 'acciones', label: t('table.actions', 'Acciones'), sortable: false, searchable: false },
      ],
    },
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function t(key, fallback = key) {
    if (window.GlobalHeader && typeof window.GlobalHeader.translate === 'function') {
      const translated = window.GlobalHeader.translate(key);
      if (translated && translated !== key) {
        return translated;
      }

      return fallback;
    }

    return fallback;
  }

  const loadActionColumnVisibility = () => {
    try {
      const raw = window.localStorage.getItem(ACTION_COLUMN_VISIBILITY_KEY);
      if (!raw) {
        return {
          visible: [...DEFAULT_ACTION_COLUMN_VISIBILITY.visible],
          hidden: [...DEFAULT_ACTION_COLUMN_VISIBILITY.hidden],
        };
      }

      const parsed = JSON.parse(raw);
      const visible = Array.isArray(parsed?.visible)
        ? parsed.visible.filter((value) => OPTIONAL_ACTION_KEYS.includes(value))
        : [];
      const hidden = Array.isArray(parsed?.hidden)
        ? parsed.hidden.filter((value) => OPTIONAL_ACTION_KEYS.includes(value))
        : [];
      const configured = [...visible, ...hidden];
      const missingKeys = OPTIONAL_ACTION_KEYS.filter((value) => !configured.includes(value));

      return {
        visible: [...visible, ...missingKeys],
        hidden,
      };
    } catch (error) {
      return {
        visible: [...DEFAULT_ACTION_COLUMN_VISIBILITY.visible],
        hidden: [...DEFAULT_ACTION_COLUMN_VISIBILITY.hidden],
      };
    }
  };

  const persistActionColumnVisibility = () => {
    try {
      window.localStorage.setItem(ACTION_COLUMN_VISIBILITY_KEY, JSON.stringify({
        visible: ofertasActionColumnVisibility.visible,
        hidden: ofertasActionColumnVisibility.hidden,
      }));
    } catch (error) {
      // No bloquear la UI si localStorage no está disponible.
    }
  };

  const getActionColumnVisibility = () => ({
    visible: [...ofertasActionColumnVisibility.visible],
    hidden: [...ofertasActionColumnVisibility.hidden],
  });

  const isActionVisible = (actionKey) => getActionColumnVisibility().visible.includes(actionKey);

  const getActionLabel = (actionKey) => {
    if (actionKey === 'status') {
      return t('table.status', 'Estado');
    }
    if (actionKey === 'edit') {
      return t('common.edit', 'Editar');
    }
    return 'BOM';
  };

  const isGlobalConfigScope = (estadoId) => String(estadoId) === GLOBAL_CONFIG_SCOPE_ID;

  const getVisibleEstados = (estados = estadosCache) => estados.filter((estado) => !isGlobalConfigScope(estado?.id_estado));

  const getListadoConfigScopeId = (estadoId) => (estadoId == null ? GLOBAL_CONFIG_SCOPE_ID : String(estadoId));

  const isConfigScopeActiveForCurrentListado = (estadoId) => {
    if (currentViewName !== 'todos' && !currentViewName.startsWith('estado-')) {
      return false;
    }

    return String(estadoId) === getListadoConfigScopeId(currentListadoContext.estadoId);
  };

  const renderActionConfigChip = (actionKey, { locked = false } = {}) => {
    return `
      <div
        class="action-config-chip${locked ? ' action-config-chip--locked' : ''}"
        ${locked ? '' : 'draggable="true"'}
        ${locked ? '' : `data-action-config-item="${actionKey}"`}
      >
        <span class="action-config-chip__label">${escapeHtml(getActionLabel(actionKey))}</span>
        <span class="action-config-chip__meta">${locked ? escapeHtml(t('common.fixed', 'Fijo')) : '↕'}</span>
      </div>
    `;
  };

  const renderActionConfigPopupContent = () => {
    const visibility = getActionColumnVisibility();
    const visibleItems = visibility.visible.map((actionKey) => renderActionConfigChip(actionKey)).join('');
    const hiddenItems = visibility.hidden.length
      ? visibility.hidden.map((actionKey) => renderActionConfigChip(actionKey)).join('')
      : `<p class="action-config-zone__empty">${escapeHtml(t('table.actions_all_visible', 'No hay acciones ocultas.'))}</p>`;

    return `
      <p class="action-config__hint">${escapeHtml(t('table.actions_drag_hint', 'Arrastra entre visibles y ocultas para decidir qué botones mostrar.'))}</p>
      <div class="action-config-layout">
        <section class="action-config-section">
          <p class="action-config-section__title">${escapeHtml(t('common.visible', 'Visibles'))}</p>
          <div class="action-config-zone" data-action-config-zone="visible">
            ${renderActionConfigChip('status', { locked: true })}
            ${visibleItems}
          </div>
        </section>
        <section class="action-config-section">
          <p class="action-config-section__title">${escapeHtml(t('common.hidden', 'Ocultas'))}</p>
          <div class="action-config-zone action-config-zone--hidden" data-action-config-zone="hidden">
            ${hiddenItems}
          </div>
        </section>
      </div>
    `;
  };

  const renderOfertasActionHeaderConfig = () => {
    return `
      <button
        class="table-actions-menu__toggle table-actions-menu__toggle--header"
        type="button"
        data-open-action-config-popup="true"
        aria-haspopup="dialog"
        aria-expanded="${actionConfigPopup?.classList.contains('is-visible') ? 'true' : 'false'}"
        aria-label="${escapeHtml(t('table.actions', 'Acciones'))}"
      >
        <span aria-hidden="true">⚙️</span>
      </button>
    `;
  };

  const ensureActionConfigPopup = () => {
    if (actionConfigPopup) {
      return actionConfigPopup;
    }

    actionConfigPopup = document.createElement('div');
    actionConfigPopup.className = 'action-config-popup';
    actionConfigPopup.setAttribute('aria-hidden', 'true');
    actionConfigPopup.hidden = true;
    actionConfigPopup.addEventListener('click', (event) => {
      const closeButton = event.target.closest('[data-close-action-config-popup]');
      if (closeButton) {
        event.preventDefault();
        event.stopPropagation();
        closeActionConfigPopup();
      }
    });
    document.body.appendChild(actionConfigPopup);
    return actionConfigPopup;
  };

  const renderActionConfigPopup = () => {
    const popup = ensureActionConfigPopup();
    popup.innerHTML = `
      <div class="action-config-popup__panel" role="dialog" aria-modal="false" aria-label="${escapeHtml(t('table.actions', 'Acciones'))}">
        <div class="action-config-popup__header">
          <strong>${escapeHtml(t('table.actions', 'Acciones'))}</strong>
          <button class="action-config-popup__close" type="button" data-close-action-config-popup="true" aria-label="${escapeHtml(t('common.close', 'Cerrar'))}">×</button>
        </div>
        <div class="action-config-popup__body">
          ${renderActionConfigPopupContent()}
        </div>
      </div>
    `;
    return popup;
  };

  const positionActionConfigPopup = () => {
    if (!actionConfigPopup || !actionConfigPopupAnchor || !actionConfigPopup.classList.contains('is-visible')) {
      return;
    }

    if (!actionConfigPopupAnchor.isConnected) {
      const nextAnchor = document.querySelector('[data-open-action-config-popup="true"]');
      if (nextAnchor instanceof HTMLElement) {
        actionConfigPopupAnchor = nextAnchor;
        actionConfigPopupAnchor.setAttribute('aria-expanded', 'true');
      } else {
        closeActionConfigPopup();
        return;
      }
    }

    const anchorRect = actionConfigPopupAnchor.getBoundingClientRect();
    const panel = actionConfigPopup.querySelector('.action-config-popup__panel');
    if (!panel) {
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const margin = 12;
    const top = Math.min(anchorRect.bottom + 8, window.innerHeight - panelRect.height - margin);
    const left = Math.min(
      Math.max(margin, anchorRect.right - panelRect.width),
      window.innerWidth - panelRect.width - margin,
    );

    panel.style.top = `${Math.max(margin, top)}px`;
    panel.style.left = `${Math.max(margin, left)}px`;
  };

  const closeActionConfigPopup = () => {
    if (!actionConfigPopup) {
      return;
    }

    if (document.activeElement instanceof HTMLElement && actionConfigPopup.contains(document.activeElement)) {
      if (actionConfigPopupAnchor?.isConnected) {
        actionConfigPopupAnchor.focus();
      } else {
        document.activeElement.blur();
      }
    }

    actionConfigPopup.classList.remove('is-visible');
    actionConfigPopup.setAttribute('aria-hidden', 'true');
    actionConfigPopup.hidden = true;
    if (actionConfigPopupAnchor) {
      actionConfigPopupAnchor.setAttribute('aria-expanded', 'false');
    }
    actionConfigPopupAnchor = null;
  };

  const openActionConfigPopup = (anchor) => {
    actionConfigPopupAnchor = anchor;
    const popup = renderActionConfigPopup();
    popup.hidden = false;
    popup.classList.add('is-visible');
    popup.setAttribute('aria-hidden', 'false');
    anchor.setAttribute('aria-expanded', 'true');
    positionActionConfigPopup();
  };

  const refreshActionConfigUi = () => {
    setupTableHeaderControls('ofertas');
    renderOfertasListado(ofertasListadoCache);
    if (actionConfigPopup?.classList.contains('is-visible')) {
      const nextAnchor = document.querySelector('[data-open-action-config-popup="true"]');
      if (!(nextAnchor instanceof HTMLElement)) {
        closeActionConfigPopup();
        return;
      }

      actionConfigPopupAnchor = nextAnchor;
      actionConfigPopupAnchor.setAttribute('aria-expanded', 'true');
      renderActionConfigPopup();
      positionActionConfigPopup();
    }
  };

  const renderOfertasActionButtons = (oferta) => {
    const offerNumber = oferta.numero_oferta || oferta.id_oferta;
    const buttons = [];

    if (isActionVisible('edit')) {
      buttons.push(`
        <button class="btn-inline btn-inline--edit btn-inline--compact" type="button" data-edit-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.edit_aria', 'Editar oferta {number}', { number: offerNumber }))}">${escapeHtml(t('common.edit', 'Editar'))}</button>
      `);
    }

    buttons.push(`
      <button class="btn-inline btn-inline--save btn-inline--compact" type="button" data-change-estado-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.change_status_aria', 'Cambiar estado de la oferta {number}', { number: offerNumber }))}">${escapeHtml(t('table.status', 'Estado'))}</button>
    `);

    if (canReassignOffer(oferta)) {
      buttons.push(`
        <button class="btn-inline btn-inline--compact" type="button" data-reassign-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.reassign_aria', 'Reasignar la oferta {number}', { number: offerNumber }))}">${escapeHtml(t('offer.reassign', 'Reasignar'))}</button>
      `);
    }

    if (isActionVisible('bom')) {
      buttons.push(`
        <button class="btn-inline btn-inline--compact" type="button" data-bom-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.bom_aria', 'Abrir BOM de la oferta {number}', { number: offerNumber }))}">BOM</button>
      `);
    }

    if (currentViewName === 'todos' && isManagerUser()) {
      buttons.push(`
        <button class="btn-inline btn-inline--delete btn-inline--compact" type="button" data-delete-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.delete_aria', 'Eliminar oferta {number}', { number: offerNumber }))}">${escapeHtml(t('common.delete', 'Eliminar'))}</button>
      `);
    }

    return buttons.join('');
  };

  const renderOfertaViewButton = (oferta) => {
    const offerNumber = oferta.numero_oferta || oferta.id_oferta;
    const unreadBadge = renderUnreadBadge(oferta?.chat_unread_count, 'chat-unread-badge--icon');
    return `
      <button class="btn-inline btn-inline--compact btn-inline--icon${unreadBadge ? ' btn-inline--with-badge' : ''}" type="button" data-view-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.view_center_aria', 'Abrir centro de la oferta {number}', { number: offerNumber }))}" title="${escapeHtml(tf('offer.view_center', 'Ver oferta {number}', { number: offerNumber }))}">
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
            <path d="M1.5 12s3.8-6.5 10.5-6.5S22.5 12 22.5 12s-3.8 6.5-10.5 6.5S1.5 12 1.5 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"></circle>
          </svg>
        </span>
        ${unreadBadge}
      </button>
    `;
  };

  const normalizeUnreadCount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : 0;
  };

  const formatUnreadBadgeCount = (value) => {
    const unreadCount = normalizeUnreadCount(value);
    if (!unreadCount) {
      return '';
    }

    return unreadCount > 99 ? '99+' : String(unreadCount);
  };

  const renderUnreadBadge = (value, className = '') => {
    const label = formatUnreadBadgeCount(value);
    if (!label) {
      return '';
    }

    return `<span class="chat-unread-badge${className ? ` ${className}` : ''}">${escapeHtml(label)}</span>`;
  };

  const syncOfferChatUnreadState = ({ ofertaId, unreadCount }) => {
    const normalizedOfertaId = Number(ofertaId);
    const normalizedUnreadCount = normalizeUnreadCount(unreadCount);
    if (!normalizedOfertaId) {
      return;
    }

    ofertasListadoCache = ofertasListadoCache.map((item) => Number(item.id_oferta) === normalizedOfertaId
      ? {
        ...item,
        chat_unread_count: normalizedUnreadCount,
        chat_has_unread: normalizedUnreadCount > 0,
      }
      : item);

    if (currentOfferCenterOferta && Number(currentOfferCenterOferta.id_oferta) === normalizedOfertaId) {
      currentOfferCenterOferta = {
        ...currentOfferCenterOferta,
        chat_unread_count: normalizedUnreadCount,
        chat_has_unread: normalizedUnreadCount > 0,
      };

      renderOfferCenterEmail(currentOfferCenterOferta);
    }

    renderOfertasListado(ofertasListadoCache);
  };

  const moveActionConfigItem = (actionKey, targetZone) => {
    if (!OPTIONAL_ACTION_KEYS.includes(actionKey) || !['visible', 'hidden'].includes(targetZone)) {
      return false;
    }

    const currentConfig = getActionColumnVisibility();
    const nextVisible = currentConfig.visible.filter((value) => value !== actionKey);
    const nextHidden = currentConfig.hidden.filter((value) => value !== actionKey);

    if (targetZone === 'visible') {
      nextVisible.push(actionKey);
    } else {
      nextHidden.push(actionKey);
    }

    ofertasActionColumnVisibility = {
      visible: nextVisible,
      hidden: nextHidden,
    };
    persistActionColumnVisibility();
    return true;
  };

  function tf(key, fallback, replacements = {}) {
    return String(t(key, fallback)).replace(/\{(\w+)\}/g, (_, token) => replacements[token] ?? `{${token}}`);
  }

  function getCurrentLocale() {
    const language = window.GlobalHeader && typeof window.GlobalHeader.getCurrentLanguage === 'function'
      ? window.GlobalHeader.getCurrentLanguage()
      : (document.documentElement.lang || 'es');

    if (language === 'en') return 'en-US';
    if (language === 'cs') return 'cs-CZ';
    return 'es-ES';
  }

  function buildNavigationStack(viewName) {
    if (viewName === 'clientes') {
      return [
        { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
        { label: t('nav.settings', 'Configuración'), target: 'configuracion', htmlFile: null },
        { label: t('config.clients', 'Clientes'), target: 'clientes', htmlFile: null },
      ];
    }

    if (viewName === 'estados') {
      return [
        { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
        { label: t('nav.settings', 'Configuración'), target: 'configuracion', htmlFile: null },
        { label: t('config.states', 'Estados'), target: 'estados', htmlFile: null },
      ];
    }

    if (viewName === 'usuarios') {
      return [
        { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
        { label: t('nav.settings', 'Configuración'), target: 'configuracion', htmlFile: null },
        { label: 'Usuarios', target: 'usuarios', htmlFile: null },
      ];
    }

    if (viewName === 'proyectos') {
      return [
        { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
        { label: t('nav.settings', 'Configuración'), target: 'configuracion', htmlFile: null },
        { label: 'Proyectos', target: 'proyectos', htmlFile: null },
      ];
    }

    if (viewName === 'todos') {
      return [
        { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
        { label: t('listing.all', 'Todos'), target: 'todos', htmlFile: null },
      ];
    }

    if (viewName.startsWith('estado-')) {
      return [
        { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
        { label: currentListadoContext.label || t('table.status', 'Estado'), target: viewName, htmlFile: null },
      ];
    }

    if (viewName === 'configuracion') {
      return [
        { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
        { label: t('nav.settings', 'Configuración'), target: 'configuracion', htmlFile: null },
      ];
    }

    return [
      { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
      { label: t('sidebar.new_offer', 'Insertar Presupuesto'), target: 'nueva-oferta', htmlFile: null },
    ];
  }

  function getOfferColumnLabel(columnName, fallbackLabel = null) {
    const labelMap = {
      id_oferta: () => t('table.offer_id', 'ID oferta'),
      estado: () => t('table.status', 'Estado'),
      fecha_email: () => t('table.email_date', 'Fecha e-mail'),
      fecha_alta_oferta: () => t('table.offer_created_date', 'Fecha alta oferta'),
      fecha_limite: () => t('table.deadline', 'Fecha límite'),
      numero_oferta: () => t('table.offer_number', 'Nº oferta'),
      ref_cliente_asunto_email: () => t('table.client_ref_subject', 'Ref. cliente / asunto e-mail'),
      cliente: () => t('table.client', 'Cliente'),
      emisor: () => t('table.sender', 'Emisor'),
      observaciones_oferta: () => t('table.offer_notes', 'Observaciones oferta'),
      tipo_interaccion: () => t('table.interaction_types', 'Tipos interacción'),
      fecha_interaccion: () => t('table.interaction_dates', 'Fechas interacción'),
      observaciones_interaccion: () => t('table.interaction_notes', 'Observaciones interacción'),
    };

    return labelMap[columnName]?.() || fallbackLabel || columnName;
  }

  function normalizeConfiguredColumnLabel(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function getOfferColumnSystemAliases(columnName) {
    const aliasMap = {
      id_oferta: ['id oferta'],
      estado: ['estado', 'stav', 'status'],
      fecha_email: ['fecha e-mail', 'fecha email', 'datum e-mailu', 'email date'],
      fecha_alta_oferta: ['fecha alta', 'fecha alta oferta', 'fecha creación', 'fecha creacion', 'datum vytvoreni', 'datum vytvoreni nabidky', 'created date'],
      fecha_limite: ['fecha limite', 'fecha límite', 'termin', 'deadline'],
      numero_oferta: ['nº oferta', 'no oferta', 'numero oferta', 'número oferta', 'cislo nabidky', 'quote no'],
      ref_cliente_asunto_email: ['asunto', 'ref. cliente / asunto e-mail', 'ref cliente / asunto e-mail', 'ref. zakaznika / predmet e-mailu', 'client ref / email subject'],
      cliente: ['cliente', 'zakaznik', 'customer'],
      emisor: ['emisor', 'odesilatel', 'sender'],
      observaciones_oferta: ['observaciones', 'observaciones oferta', 'poznamky', 'poznamky k nabidce', 'offer notes', 'notes'],
      tipo_interaccion: ['cambio estado', 'cambio de estado', 'tipos interaccion', 'tipos interacción', 'typy interakci', 'interaction types'],
      fecha_interaccion: ['fechas interaccion', 'fechas interacción', 'data interakci', 'interaction dates'],
      observaciones_interaccion: ['comentarios', 'comentario', 'observaciones interaccion', 'observaciones interacción', 'poznamky interakci', 'interaction notes'],
    };

    return aliasMap[columnName] || [];
  }

  function getConfiguredOfferColumnLabelOverride(columnName, configuredLabel) {
    const normalizedConfigured = normalizeConfiguredColumnLabel(configuredLabel);
    const overrideMap = {
      ref_cliente_asunto_email: {
        asunto: t('table.subject', 'Asunto'),
      },
      observaciones_oferta: {
        comentario: t('table.comments', 'Comentarios'),
        comentarios: t('table.comments', 'Comentarios'),
      },
      tipo_interaccion: {
        'cambio estado': t('table.status_change', 'Cambio estado'),
        'cambio de estado': t('table.status_change', 'Cambio estado'),
      },
      observaciones_interaccion: {
        comentario: t('table.comments', 'Comentarios'),
        comentarios: t('table.comments', 'Comentarios'),
      },
    };

    return overrideMap[columnName]?.[normalizedConfigured] || null;
  }

  function shouldTranslateConfiguredLabel(columnName, configuredLabel) {
    if (!configuredLabel) {
      return true;
    }

    const normalizedConfigured = normalizeConfiguredColumnLabel(configuredLabel);
    const candidates = [
      columnName,
      getOfferColumnLabel(columnName, columnName),
      availableOfferColumns.find((column) => column.value === columnName)?.label,
      ...getOfferColumnSystemAliases(columnName),
    ].filter(Boolean);

    return candidates.some((candidate) => normalizeConfiguredColumnLabel(candidate) === normalizedConfigured);
  }

  function getConfiguredOfferColumnLabel(config) {
    if (!config) {
      return '';
    }

    const configuredLabelOverride = getConfiguredOfferColumnLabelOverride(config.columna, config.descripcion_columna);
    if (configuredLabelOverride) {
      return configuredLabelOverride;
    }

    if (shouldTranslateConfiguredLabel(config.columna, config.descripcion_columna)) {
      return getOfferColumnLabel(config.columna, config.descripcion_columna || config.columna);
    }

    return config.descripcion_columna || getOfferColumnLabel(config.columna, config.columna);
  }

  function translateEstadoLabel(label) {
    const normalized = String(label || '').trim().toLocaleLowerCase();
    const stateMap = {
      pendiente: t('state.pending', 'Pendiente'),
      'pendiente tecnico': t('state.pending_technical', 'Pendiente Tecnico'),
      'pendiente compras': t('state.pending_purchasing', 'Pendiente Compras'),
      enviada: t('state.sent', 'Enviada'),
      pedido: t('state.ordered', 'Pedido'),
      anulada: t('state.cancelled', 'Anulada'),
    };

    return stateMap[normalized] || label;
  }

  function translateDepartmentLabel(label) {
    const normalized = String(label || '').trim().toLocaleLowerCase();
    const departmentMap = {
      administracion: t('department.administration', 'Administración'),
      administración: t('department.administration', 'Administración'),
      tecnico: t('department.technical', 'Técnico'),
      técnico: t('department.technical', 'Técnico'),
      compras: t('department.purchasing', 'Compras'),
      prueba: t('department.test', 'Prueba'),
    };

    return departmentMap[normalized] || label;
  }

  function translateRoleLabel(label) {
    const normalized = String(label || '').trim().toLocaleLowerCase();
    const roleMap = {
      manager: t('role.manager', 'Manager'),
      estandar: t('role.standard', 'Estandar'),
      estándar: t('role.standard', 'Estandar'),
      standard: t('role.standard', 'Standard'),
    };

    return roleMap[normalized] || label;
  }

  function translateInteractionTypeLabel(label) {
    const normalized = normalizeConfiguredColumnLabel(label);
    const typeMap = {
      reasignacion: t('crm.reassignment', 'Reasignación'),
    };

    return typeMap[normalized] || label;
  }

  function translateInteractionSummary(value) {
    return String(value || '')
      .split('|')
      .map((segment) => String(segment || '').trim())
      .filter(Boolean)
      .map((segment) => {
        const transitionParts = segment.split(/\s*->\s*/).map((part) => String(part || '').trim()).filter(Boolean);
        if (transitionParts.length === 2) {
          return `${translateEstadoLabel(transitionParts[0])} -> ${translateEstadoLabel(transitionParts[1])}`;
        }

        return translateInteractionTypeLabel(segment);
      })
      .join(' | ');
  }

  function getSidebarStateIcon(label) {
    if (label && typeof label === 'object') {
      const explicitEmoji = String(label.emoji_sidebar || '').trim();
      if (explicitEmoji) {
        return explicitEmoji;
      }
      return getSuggestedStateEmoji(label.descripcion_estado || '');
    }

    return getSuggestedStateEmoji(label);
  }

  function getFallbackSidebarStateIcon(label) {
    const normalized = String(label || '').trim().toLocaleLowerCase();

    if (normalized.includes('tecn')) {
      return '🛠️';
    }

    if (normalized.includes('compra')) {
      return '🛒';
    }

    if (normalized.includes('envi')) {
      return '📤';
    }

    if (normalized.includes('pedido')) {
      return '📦';
    }

    if (normalized.includes('anulad') || normalized.includes('cancel')) {
      return '⛔';
    }

    if (normalized.includes('pend')) {
      return '⏳';
    }

    return '📌';
  }

  const normalizeEmojiSuggestionSource = (value) => String(value || '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const getSuggestedStateEmoji = (label) => {
    const normalized = normalizeEmojiSuggestionSource(label);
    if (!normalized) {
      return stateEmojiSuggestions.default || '📌';
    }

    const matchingRule = (Array.isArray(stateEmojiSuggestions.rules) ? stateEmojiSuggestions.rules : [])
      .find((rule) => Array.isArray(rule.keywords) && rule.keywords.some((keyword) => normalized.includes(normalizeEmojiSuggestionSource(keyword))));

    if (matchingRule?.emoji) {
      return matchingRule.emoji;
    }

    return getFallbackSidebarStateIcon(label);
  };

  const buildStateEmojiButtons = (selectedValue = '') => {
    const normalizedSelectedValue = String(selectedValue || '').trim();
    const choices = Array.isArray(stateEmojiSuggestions.choices) && stateEmojiSuggestions.choices.length
      ? stateEmojiSuggestions.choices
      : [{ emoji: '📌', label: 'General' }];

    return choices.map((choice) => {
      const emoji = String(choice.emoji || '').trim();
      const optionLabel = String(choice.label || emoji || 'Emoji').trim();
      const isSelected = emoji === normalizedSelectedValue;
      return `<button
          type="button"
          class="estado-emoji-picker__option${isSelected ? ' is-selected' : ''}"
          data-emoji-option="${escapeHtml(emoji)}"
          aria-label="${escapeHtml(optionLabel)}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >${escapeHtml(emoji)}</button>`;
    }).join('');
  };

  const updateStateEmojiPickerSelection = (pickerElement, emoji) => {
    if (!pickerElement) {
      return;
    }

    const normalizedEmoji = String(emoji || stateEmojiSuggestions.default || '📌').trim() || '📌';
    pickerElement.querySelectorAll('[data-emoji-option]').forEach((button) => {
      const isSelected = button.dataset.emojiOption === normalizedEmoji;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  };

  const populateStateEmojiSelect = (inputElement, pickerElement, selectedEmoji = '') => {
    if (!inputElement || !pickerElement) {
      return;
    }

    const resolvedEmoji = String(selectedEmoji || '').trim() || stateEmojiSuggestions.default || '📌';
    inputElement.value = resolvedEmoji;
    pickerElement.innerHTML = buildStateEmojiButtons(resolvedEmoji);
    updateStateEmojiPickerSelection(pickerElement, resolvedEmoji);
  };

  const syncStateEmojiFromDescription = (descriptionField, inputElement, pickerElement, force = false) => {
    if (!descriptionField || !inputElement || !pickerElement) {
      return;
    }

    const suggestedEmoji = getSuggestedStateEmoji(descriptionField.value || '');
    if (force) {
      populateStateEmojiSelect(inputElement, pickerElement, suggestedEmoji);
      return;
    }

    updateStateEmojiPickerSelection(pickerElement, inputElement.value || suggestedEmoji);
  };

  const bindStateEmojiPicker = (pickerElement, inputElement, onSelect) => {
    if (!pickerElement || !inputElement) {
      return;
    }

    pickerElement.addEventListener('click', (event) => {
      const optionButton = event.target.closest('[data-emoji-option]');
      if (!optionButton) {
        return;
      }

      const selectedEmoji = String(optionButton.dataset.emojiOption || '').trim() || stateEmojiSuggestions.default || '📌';
      inputElement.value = selectedEmoji;
      updateStateEmojiPickerSelection(pickerElement, selectedEmoji);
      if (typeof onSelect === 'function') {
        onSelect(selectedEmoji);
      }
    });
  };

  const getActiveEstados = () => getVisibleEstados(estadosCache).filter((estado) => estado.activo !== false);

  const loadStateEmojiSuggestions = async () => {
    if (stateEmojiSuggestionsPromise) {
      return stateEmojiSuggestionsPromise;
    }

    stateEmojiSuggestionsPromise = fetch('/static/data/state-emoji-suggestions.json')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar la configuración de emojis');
        }
        const payload = await response.json();
        stateEmojiSuggestions = {
          default: payload?.default || '📌',
          choices: Array.isArray(payload?.choices) ? payload.choices : [{ emoji: '📌', label: 'General' }],
          rules: Array.isArray(payload?.rules) ? payload.rules : [],
        };
        populateStateEmojiSelect(estadoEmojiSidebar, estadoEmojiSidebarPicker, estadoEmojiSidebar?.value || getSuggestedStateEmoji(estadoCreateDescripcion?.value || ''));
        populateStateEmojiSelect(estadoEditEmojiSidebar, estadoEditEmojiSidebarPicker, estadoEditEmojiSidebar?.value || getSuggestedStateEmoji(estadoEditDescripcion?.value || ''));
        return stateEmojiSuggestions;
      })
      .catch(() => stateEmojiSuggestions);

    return stateEmojiSuggestionsPromise;
  };

  const setGenericFeedback = (element, message, type = 'success') => {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = `form-feedback is-visible ${type === 'error' ? 'is-error' : 'is-success'}`;
  };

  const clearGenericFeedback = (element) => {
    if (!element) {
      return;
    }

    element.textContent = '';
    element.className = 'form-feedback';
  };

  const OFFER_DELETE_CONFIRM_PASSWORD = '12345';

  const renderOfferReassignUserOptions = ({ departmentId, selectedNumOperario = '' } = {}) => {
    if (!offerReassignPromptUser) {
      return [];
    }

    const users = getEtcResponsableUsers(departmentId);
    const placeholder = users.length
      ? t('offer.reassign_select_user', 'Selecciona un usuario')
      : t('offer.reassign_no_users', 'No hay usuarios configurados en este departamento');

    offerReassignPromptUser.innerHTML = [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...users.map((usuario) => `<option value="${escapeHtml(usuario.num_operario)}">${escapeHtml(buildResponsableLabel(usuario))}</option>`),
    ].join('');

    offerReassignPromptUser.value = selectedNumOperario ? String(selectedNumOperario) : '';
    offerReassignPromptUser.disabled = !users.length;
    if (offerReassignPromptConfirm) {
      offerReassignPromptConfirm.disabled = !users.length;
    }

    return users;
  };

  const closeOfferDeletePrompt = (confirmed = false) => {
    if (!offerDeletePrompt) {
      return confirmed;
    }

    offerDeletePrompt.classList.remove('is-visible');
    offerDeletePrompt.setAttribute('aria-hidden', 'true');
    if (offerDeletePromptMessage) {
      offerDeletePromptMessage.textContent = '';
    }
    if (offerDeletePromptPassword) {
      offerDeletePromptPassword.value = '';
    }
    clearGenericFeedback(offerDeletePromptFeedback);

    const resolver = offerDeletePromptResolver;
    offerDeletePromptResolver = null;

    if (offerDeletePromptPreviousFocus && typeof offerDeletePromptPreviousFocus.focus === 'function') {
      offerDeletePromptPreviousFocus.focus();
    }
    offerDeletePromptPreviousFocus = null;

    if (resolver) {
      resolver(confirmed);
    }

    return confirmed;
  };

  const confirmOfferDeletePrompt = () => {
    if (!offerDeletePromptPassword) {
      return closeOfferDeletePrompt(true);
    }

    if (offerDeletePromptPassword.value !== OFFER_DELETE_CONFIRM_PASSWORD) {
      setGenericFeedback(offerDeletePromptFeedback, t('offer.delete_password_error', 'La contraseña de confirmación no es correcta.'), 'error');
      offerDeletePromptPassword.focus();
      offerDeletePromptPassword.select();
      return false;
    }

    return closeOfferDeletePrompt(true);
  };

  const openOfferDeletePrompt = ({ offerNumber }) => {
    if (!offerDeletePrompt || !offerDeletePromptMessage) {
      return Promise.resolve(true);
    }

    if (offerDeletePromptResolver) {
      closeOfferDeletePrompt(false);
    }

    offerDeletePromptPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    offerDeletePromptMessage.textContent = tf('offer.delete_confirm', '¿Seguro que quieres eliminar la oferta {number}? Esta acción no se puede deshacer.', { number: offerNumber });
    if (offerDeletePromptPassword) {
      offerDeletePromptPassword.value = '';
    }
    clearGenericFeedback(offerDeletePromptFeedback);
    offerDeletePrompt.classList.add('is-visible');
    offerDeletePrompt.setAttribute('aria-hidden', 'false');

    return new Promise((resolve) => {
      offerDeletePromptResolver = resolve;
      window.requestAnimationFrame(() => {
        if (offerDeletePromptPassword) {
          offerDeletePromptPassword.focus();
        } else if (offerDeletePromptConfirm) {
          offerDeletePromptConfirm.focus();
        }
      });
    });
  };

  const closeOfferReassignPrompt = (result = null) => {
    if (!offerReassignPrompt) {
      return result;
    }

    offerReassignPrompt.classList.remove('is-visible');
    offerReassignPrompt.setAttribute('aria-hidden', 'true');
    if (offerReassignPromptMessage) {
      offerReassignPromptMessage.textContent = '';
    }
    if (offerReassignPromptDepartment) {
      offerReassignPromptDepartment.textContent = '';
    }
    if (offerReassignPromptUser) {
      offerReassignPromptUser.innerHTML = `<option value="">${escapeHtml(t('offer.reassign_select_user', 'Selecciona un usuario'))}</option>`;
      offerReassignPromptUser.disabled = false;
    }
    if (offerReassignPromptConfirm) {
      offerReassignPromptConfirm.disabled = false;
    }
    clearGenericFeedback(offerReassignPromptFeedback);
    pendingOfferReassignContext = null;

    const resolver = offerReassignPromptResolver;
    offerReassignPromptResolver = null;

    if (offerReassignPromptPreviousFocus && typeof offerReassignPromptPreviousFocus.focus === 'function') {
      offerReassignPromptPreviousFocus.focus();
    }
    offerReassignPromptPreviousFocus = null;

    if (resolver) {
      resolver(result);
    }

    return result;
  };

  const confirmOfferReassignPrompt = () => {
    const selectedNumOperario = offerReassignPromptUser?.value ? Number(offerReassignPromptUser.value) : NaN;
    if (!Number.isFinite(selectedNumOperario)) {
      setGenericFeedback(offerReassignPromptFeedback, t('offer.reassign_user_required', 'Debes seleccionar un usuario para reasignar la oferta.'), 'error');
      offerReassignPromptUser?.focus();
      return null;
    }

    return closeOfferReassignPrompt({
      numOperarioResponsable: selectedNumOperario,
      oferta: pendingOfferReassignContext?.oferta || null,
    });
  };

  const openOfferReassignPrompt = async ({ oferta }) => {
    if (!offerReassignPrompt || !offerReassignPromptMessage || !offerReassignPromptUser) {
      return null;
    }

    if (offerReassignPromptResolver) {
      closeOfferReassignPrompt(null);
    }

    const departmentId = Number(oferta?.id_departamento_estado);
    if (!Number.isFinite(departmentId)) {
      throw new Error(t('offer.reassign_department_missing', 'La oferta no tiene un departamento válido para reasignación.'));
    }

    if (!usuariosCache.length) {
      await loadUsuarios({ silent: true });
    }

    const users = renderOfferReassignUserOptions({ departmentId });
    pendingOfferReassignContext = { oferta, departmentId };
    offerReassignPromptPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    offerReassignPromptMessage.textContent = tf('offer.reassign_confirm', 'Selecciona a qué usuario del departamento quieres reasignar la oferta {number}.', {
      number: oferta?.numero_oferta || oferta?.id_oferta || '',
    });
    if (offerReassignPromptDepartment) {
      const departmentName = users[0]?.nombre_departamento || t('offer.reassign_department_unknown', 'Departamento sin nombre');
      offerReassignPromptDepartment.textContent = tf('offer.reassign_department_label', 'Departamento: {department}', { department: departmentName });
    }
    clearGenericFeedback(offerReassignPromptFeedback);
    offerReassignPrompt.classList.add('is-visible');
    offerReassignPrompt.setAttribute('aria-hidden', 'false');

    return new Promise((resolve) => {
      offerReassignPromptResolver = resolve;
      window.requestAnimationFrame(() => {
        if (users.length) {
          offerReassignPromptUser.focus();
        } else if (offerReassignPromptConfirm) {
          offerReassignPromptConfirm.focus();
        }
      });
    });
  };

  const closeDepartmentCreatePrompt = (value = null) => {
    if (!departmentCreatePrompt) {
      return value;
    }

    departmentCreatePrompt.classList.remove('is-visible');
    departmentCreatePrompt.setAttribute('aria-hidden', 'true');
    if (departmentCreatePromptInput) {
      departmentCreatePromptInput.value = '';
    }
    if (departmentCreatePromptConfirm) {
      departmentCreatePromptConfirm.disabled = false;
    }
    clearGenericFeedback(departmentCreatePromptFeedback);

    const resolver = departmentCreatePromptResolver;
    departmentCreatePromptResolver = null;

    if (departmentCreatePromptPreviousFocus && typeof departmentCreatePromptPreviousFocus.focus === 'function') {
      departmentCreatePromptPreviousFocus.focus();
    }
    departmentCreatePromptPreviousFocus = null;

    if (resolver) {
      resolver(value);
    }

    return value;
  };

  const confirmDepartmentCreatePrompt = () => {
    const value = departmentCreatePromptInput?.value?.trim() || '';
    if (!value) {
      setGenericFeedback(departmentCreatePromptFeedback, t('literal.users.department_prompt_required', 'Debes indicar un nombre de departamento.'), 'error');
      departmentCreatePromptInput?.focus();
      return null;
    }

    return closeDepartmentCreatePrompt(value);
  };

  const openDepartmentCreatePrompt = () => {
    if (!departmentCreatePrompt || !departmentCreatePromptInput) {
      return Promise.resolve(null);
    }

    if (departmentCreatePromptResolver) {
      closeDepartmentCreatePrompt(null);
    }

    departmentCreatePromptPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    departmentCreatePromptInput.value = '';
    if (departmentCreatePromptConfirm) {
      departmentCreatePromptConfirm.disabled = false;
    }
    clearGenericFeedback(departmentCreatePromptFeedback);
    departmentCreatePrompt.classList.add('is-visible');
    departmentCreatePrompt.setAttribute('aria-hidden', 'false');

    return new Promise((resolve) => {
      departmentCreatePromptResolver = resolve;
      window.requestAnimationFrame(() => {
        departmentCreatePromptInput.focus();
      });
    });
  };

  const setFeedback = (message, type = 'success') => {
    if (!feedback) {
      return;
    }

    feedback.textContent = message;
    feedback.className = `form-feedback is-visible ${type === 'error' ? 'is-error' : 'is-success'}`;
  };

  const clearFeedback = () => {
    clearGenericFeedback(feedback);
  };

  const getFieldContainer = (field) => field?.closest('.form-field') || null;

  const getFieldErrorElement = (field) => {
    const container = getFieldContainer(field);
    if (!container) {
      return null;
    }

    let errorElement = container.querySelector('.form-field__error');
    if (!errorElement) {
      errorElement = document.createElement('p');
      errorElement.className = 'form-field__error';
      container.appendChild(errorElement);
    }

    return errorElement;
  };

  const setFieldValidationError = (field, message) => {
    const container = getFieldContainer(field);
    const errorElement = getFieldErrorElement(field);
    if (!container || !errorElement || !field) {
      return;
    }

    container.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    errorElement.textContent = message;
  };

  const clearFieldValidationError = (field) => {
    const container = getFieldContainer(field);
    const errorElement = getFieldErrorElement(field);
    if (!container || !errorElement || !field) {
      return;
    }

    container.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    errorElement.textContent = '';
  };

  const clearFormValidationErrors = (formElement) => {
    if (!formElement) {
      return;
    }

    formElement.querySelectorAll('.form-field.is-invalid').forEach((container) => {
      container.classList.remove('is-invalid');
    });

    formElement.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
      field.removeAttribute('aria-invalid');
    });

    formElement.querySelectorAll('.form-field__error').forEach((errorElement) => {
      errorElement.textContent = '';
    });
  };

  const validateRequiredField = (field, message, validator = null) => {
    if (!field) {
      return true;
    }

    const isValid = validator ? validator(field) : (field.checkValidity() && String(field.value || '').trim() !== '');
    if (isValid) {
      clearFieldValidationError(field);
      return true;
    }

    setFieldValidationError(field, message);
    return false;
  };

  const bindFieldValidation = (field, message, validator = null) => {
    if (!field) {
      return;
    }

    const revalidateIfNeeded = () => {
      if (getFieldContainer(field)?.classList.contains('is-invalid')) {
        validateRequiredField(field, message, validator);
      }
    };

    field.addEventListener('blur', () => {
      validateRequiredField(field, message, validator);
    });
    field.addEventListener('input', revalidateIfNeeded);
    field.addEventListener('change', revalidateIfNeeded);
  };

  const extractSenderIdentityFromText = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return { name: null, email: null };
    }

    const match = normalized.match(/^(.*?)\s*<([^<>]+)>$/);
    if (match) {
      return {
        name: match[1].trim() || null,
        email: match[2].trim() || null,
      };
    }

    if (normalized.includes('@')) {
      return { name: null, email: normalized.replace(/[<>]/g, '') };
    }

    return { name: normalized, email: null };
  };

  const updateOfertaEtcStandbyUi = () => {
    if (!savedOfertaContext) {
      pendingOfertaEtcPayload = null;
    }
  };

  const buildResponsableLabel = (usuario) => {
    if (!usuario) {
      return '';
    }

    const departamento = translateDepartmentLabel(usuario.nombre_departamento || usuario.departamentos || '');
    const role = translateRoleLabel(usuario.rol || usuario.nombre_rol || '');
    const suffix = [departamento, role].filter(Boolean).join(' · ');
    return suffix
      ? `${usuario.nombre} (${usuario.num_operario}) · ${suffix}`
      : `${usuario.nombre} (${usuario.num_operario})`;
  };

  const getEtcResponsableUsers = (departamentoId = null) => {
    const normalizedDepartamentoId = departamentoId == null || departamentoId === '' ? null : Number(departamentoId);
    const source = Array.isArray(usuariosCache) ? [...usuariosCache] : [];
    const filtered = normalizedDepartamentoId == null
      ? source
      : source.filter((usuario) => Number(usuario.id_departamento) === normalizedDepartamentoId);

    return filtered.sort((left, right) => String(left.nombre || '').localeCompare(String(right.nombre || ''), 'es', { sensitivity: 'base' }));
  };

  const getDepartamentoManager = (departamentoId = null) => {
    const users = getEtcResponsableUsers(departamentoId);
    return users.find((usuario) => Number(usuario.id_rol) === 1 || String(usuario.rol || usuario.nombre_rol || '').trim().toLowerCase() === 'manager') || null;
  };

  const setOfertaEtcExtendedVisibility = (isVisible) => {
    if (!ofertaEtcExtendedFields || !ofertaEtcToggleExtended) {
      return;
    }

    ofertaEtcExtendedFields.hidden = !isVisible;
    ofertaEtcToggleExtended.textContent = isVisible
      ? t('literal.etc.hide_extended_form', 'Ocultar ext. formulario')
      : t('literal.etc.extended_form', 'Ext. formulario');
    ofertaEtcToggleExtended.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
  };

  const renderOfertaEtcResponsableOptions = ({ selectedNumOperario = null, preferManager = false } = {}) => {
    if (!ofertaEtcResponsable) {
      return;
    }

    const users = getEtcResponsableUsers(ofertaEtcDepartamento?.value || null);
    const manager = getDepartamentoManager(ofertaEtcDepartamento?.value || null);
    const selectedUser = users.find((usuario) => String(usuario.num_operario) === String(selectedNumOperario ?? ''));
    const fallbackUser = preferManager
      ? (manager || selectedUser || users[0] || null)
      : (selectedUser || manager || users[0] || null);

    const emptyLabel = ofertaEtcDepartamento?.value && !users.length
      ? t('literal.etc.no_users_in_department', 'No hay usuarios configurados en este departamento')
      : t('literal.etc.select_responsible', 'Selecciona un responsable');

    ofertaEtcResponsable.innerHTML = [
      `<option value="">${escapeHtml(emptyLabel)}</option>`,
      ...users.map((usuario) => `<option value="${escapeHtml(usuario.num_operario)}">${escapeHtml(buildResponsableLabel(usuario))}</option>`),
    ].join('');

    ofertaEtcResponsable.value = fallbackUser ? String(fallbackUser.num_operario) : '';
  };

  const populateOfertaEtcForm = (payload = null) => {
    const currentUser = getCurrentUser();

    if (ofertaEtcForm) {
      ofertaEtcForm.reset();
    }

    if (ofertaEtcDepartamento) {
      ofertaEtcDepartamento.innerHTML = buildDepartamentoOptions(payload?.id_departamento_destino || '');
      ofertaEtcDepartamento.value = payload?.id_departamento_destino ? String(payload.id_departamento_destino) : '';
    }

    if (ofertaEtcResponsable) {
      renderOfertaEtcResponsableOptions({
        selectedNumOperario: payload?.num_operario_responsable ?? currentUser?.num_operario ?? null,
        preferManager: !payload?.num_operario_responsable,
      });
    }

    setOfertaEtcExtendedVisibility(false);

    if (ofertaEtcPrioridad) ofertaEtcPrioridad.value = payload?.prioridad || 'NORMAL';
    if (ofertaEtcUrgente) ofertaEtcUrgente.checked = Boolean(payload?.es_urgente);
    if (ofertaEtcCodigoExterno) ofertaEtcCodigoExterno.value = payload?.codigo_externo_oferta || '';
    if (ofertaEtcCodigoInterno) ofertaEtcCodigoInterno.value = payload?.codigo_interno_oferta || '';
    if (ofertaEtcReferenciaCliente) ofertaEtcReferenciaCliente.value = payload?.referencia_cliente || '';
    if (ofertaEtcIncoterm) ofertaEtcIncoterm.value = payload?.incoterm || '';
    if (ofertaEtcNumeroComision) ofertaEtcNumeroComision.value = payload?.numero_comision || '';
    if (ofertaEtcProyecto) ofertaEtcProyecto.value = payload?.proyecto || '';
    if (ofertaEtcPoOriginal) ofertaEtcPoOriginal.value = payload?.po_original || '';
    if (ofertaEtcPedidoB2b) ofertaEtcPedidoB2b.value = payload?.pedido_b2b || '';
    if (ofertaEtcFechaEnvio) ofertaEtcFechaEnvio.value = payload?.fecha_envio_oferta || '';
    if (ofertaEtcSolicitanteNombre) ofertaEtcSolicitanteNombre.value = payload?.nombre_solicitante || '';
    if (ofertaEtcSolicitanteEmail) ofertaEtcSolicitanteEmail.value = payload?.email_solicitante || '';
    if (ofertaEtcTotalMaterial) ofertaEtcTotalMaterial.value = payload?.total_material_eur || '';
    if (ofertaEtcTotalFee) ofertaEtcTotalFee.value = payload?.total_fee_eur || '';
    if (ofertaEtcResumenMaterial) ofertaEtcResumenMaterial.value = payload?.resumen_material_solicitado || '';
    if (ofertaEtcObservacionesCliente) ofertaEtcObservacionesCliente.value = payload?.observaciones_cliente || '';
  };

  const openOfertaEtcModal = () => {
    if (!ofertaEtcModal) {
      return;
    }

    populateOfertaEtcForm(pendingOfertaEtcPayload || buildOfertaEtcPayloadForInsert());
    clearFormValidationErrors(ofertaEtcForm);
    clearGenericFeedback(ofertaEtcFeedback);
    ofertaEtcModal.classList.add('is-visible');
    ofertaEtcModal.setAttribute('aria-hidden', 'false');
  };

  const closeOfertaEtcModal = () => {
    if (!ofertaEtcModal) {
      return;
    }

    ofertaEtcModal.classList.remove('is-visible');
    ofertaEtcModal.setAttribute('aria-hidden', 'true');
    clearGenericFeedback(ofertaEtcFeedback);
    savedOfertaContext = null;
    pendingOfertaEtcPayload = null;
    if (ofertaEtcForm) {
      clearFormValidationErrors(ofertaEtcForm);
      ofertaEtcForm.reset();
    }
  };

  const buildPendingOfertaEtcPayload = () => {
    const currentUser = getCurrentUser();
    const selectedResponsable = usuariosCache.find((usuario) => String(usuario.num_operario) === String(ofertaEtcResponsable?.value || '')) || null;

    return {
      num_operario_responsable: ofertaEtcResponsable?.value || currentUser?.num_operario || null,
      nombre_responsable: selectedResponsable?.nombre || currentUser?.nombre || null,
      id_departamento_destino: ofertaEtcDepartamento?.value || null,
      prioridad: ofertaEtcPrioridad?.value || 'NORMAL',
      es_urgente: Boolean(ofertaEtcUrgente?.checked),
      codigo_externo_oferta: ofertaEtcCodigoExterno?.value?.trim() || null,
      codigo_interno_oferta: ofertaEtcCodigoInterno?.value?.trim() || null,
      referencia_cliente: ofertaEtcReferenciaCliente?.value?.trim() || null,
      incoterm: ofertaEtcIncoterm?.value?.trim() || null,
      numero_comision: ofertaEtcNumeroComision?.value?.trim() || null,
      proyecto: ofertaEtcProyecto?.value?.trim() || null,
      po_original: ofertaEtcPoOriginal?.value?.trim() || null,
      pedido_b2b: ofertaEtcPedidoB2b?.value?.trim() || null,
      fecha_envio_oferta: ofertaEtcFechaEnvio?.value || null,
      nombre_solicitante: ofertaEtcSolicitanteNombre?.value?.trim() || null,
      email_solicitante: ofertaEtcSolicitanteEmail?.value?.trim() || null,
      total_material_eur: ofertaEtcTotalMaterial?.value?.trim() || null,
      total_fee_eur: ofertaEtcTotalFee?.value?.trim() || null,
      resumen_material_solicitado: ofertaEtcResumenMaterial?.value?.trim() || null,
      observaciones_cliente: ofertaEtcObservacionesCliente?.value?.trim() || null,
      origen_registro: 'MANUAL',
      activo: true,
    };
  };

  const buildOfertaEtcPayloadForInsert = () => {
    const basePayload = buildPayload();
    const senderIdentity = extractSenderIdentityFromText(emisorInput?.value || '');

    return {
      ...(pendingOfertaEtcPayload || {}),
      id_cliente: pendingOfertaEtcPayload?.id_cliente || basePayload.id_cliente || basePayload.cliente || null,
      fecha_recepcion: pendingOfertaEtcPayload?.fecha_recepcion || basePayload.fecha_email || null,
      referencia_cliente: pendingOfertaEtcPayload?.referencia_cliente || basePayload.ref_cliente_asunto_email || null,
      nombre_solicitante: pendingOfertaEtcPayload?.nombre_solicitante || senderIdentity.name || null,
      email_solicitante: pendingOfertaEtcPayload?.email_solicitante || senderIdentity.email || null,
      observaciones_cliente: pendingOfertaEtcPayload?.observaciones_cliente || basePayload.observaciones || null,
    };
  };

  const validateSenderEmailField = (field) => Boolean(extractSenderIdentityFromText(field?.value || '').email);

  const ofertaEtcPriorityFieldConfigs = [
    { field: ofertaEtcResponsable, message: 'Este campo es obligatorio.' },
    { field: ofertaEtcDepartamento, message: 'Este campo es obligatorio.' },
    { field: ofertaEtcCodigoExterno, message: 'Este campo es obligatorio.' },
    { field: ofertaEtcReferenciaCliente, message: 'Este campo es obligatorio.' },
    { field: ofertaEtcIncoterm, message: 'Este campo es obligatorio.' },
  ].filter((config) => Boolean(config.field));

  const ofertaEtcIdentifierFields = [
    ofertaEtcCodigoExterno,
    ofertaEtcCodigoInterno,
    ofertaEtcReferenciaCliente,
    ofertaEtcNumeroComision,
    ofertaEtcProyecto,
  ].filter(Boolean);

  const validateOfertaPrincipalForm = () => {
    const validations = [
      {
        field: document.getElementById('fecha_email'),
        message: 'Este campo es obligatorio.',
      },
      {
        field: clienteSelect,
        message: 'Este campo es obligatorio.',
      },
      {
        field: emisorInput,
        message: 'Este campo es obligatorio y debe incluir un correo electrónico.',
        validator: validateSenderEmailField,
      },
    ];

    let firstInvalidField = null;
    validations.forEach(({ field, message, validator }) => {
      const isValid = validateRequiredField(field, message, validator);
      if (!isValid && !firstInvalidField) {
        firstInvalidField = field;
      }
    });

    if (firstInvalidField) {
      firstInvalidField.focus();
      return false;
    }

    return true;
  };

  const validateOfertaEtcIdentifierFields = () => {
    const hasIdentifier = ofertaEtcIdentifierFields.some((field) => String(field.value || '').trim() !== '');
    if (hasIdentifier) {
      ofertaEtcIdentifierFields.forEach((field) => clearFieldValidationError(field));
      return true;
    }

    const message = 'Debes rellenar al menos uno de estos campos obligatorios.';
    ofertaEtcIdentifierFields.forEach((field) => setFieldValidationError(field, message));
    ofertaEtcIdentifierFields[0]?.focus();
    return false;
  };

  const validateOfertaEtcPriorityFields = () => {
    let firstInvalidField = null;

    ofertaEtcPriorityFieldConfigs.forEach(({ field, message }) => {
      const isValid = validateRequiredField(field, message);
      if (!isValid && !firstInvalidField) {
        firstInvalidField = field;
      }
    });

    if (firstInvalidField) {
      firstInvalidField.focus();
      return false;
    }

    return true;
  };

  const releaseSidebarFocus = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && activeElement.closest('.sidebar')) {
      activeElement.blur();
    }
  };

  const normalizeSearchValue = (value) => String(value ?? '').toLocaleLowerCase();

  const DATE_FILTER_COLUMN_KEYS = new Set(['fecha_alta_oferta', 'fecha_email', 'fecha_limite', 'fecha_interaccion']);

  const isDateFilterColumn = (columnKey) => DATE_FILTER_COLUMN_KEYS.has(String(columnKey || '').toLowerCase());

  const normalizeDateFilterValue = (value) => {
    if (!value || typeof value !== 'object') {
      return { from: '', to: '' };
    }

    return {
      from: String(value.from || ''),
      to: String(value.to || ''),
    };
  };

  const hasActiveFilterValue = (value) => {
    if (!value) {
      return false;
    }

    if (typeof value === 'object') {
      return Boolean(String(value.from || '').trim() || String(value.to || '').trim());
    }

    return Boolean(String(value).trim());
  };

  const parseTableDateValue = (value, bound = 'from') => {
    if (!value) {
      return null;
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      return new Date(`${normalizedValue}T${bound === 'to' ? '23:59:59.999' : '00:00:00.000'}`);
    }

    const parsedDate = new Date(normalizedValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  const compareTableValues = (left, right) => {
    const leftValue = left ?? '';
    const rightValue = right ?? '';
    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);

    if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && `${leftValue}` !== '' && `${rightValue}` !== '') {
      return leftNumber - rightNumber;
    }

    const leftDate = Date.parse(leftValue);
    const rightDate = Date.parse(rightValue);
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
      return leftDate - rightDate;
    }

    return String(leftValue).localeCompare(String(rightValue), 'es', { sensitivity: 'base', numeric: true });
  };

  const getProcessedRows = (tableKey, rows) => {
    const state = tableStates[tableKey];
    const filteredRows = rows.filter((row) => Object.entries(state.filters).every(([key, value]) => {
      if (!hasActiveFilterValue(value)) {
        return true;
      }

      // Fecha desactivada temporalmente: volvemos al filtrado anterior por texto.
      // if (isDateFilterColumn(key) && typeof value === 'object') {
      //   const { from, to } = normalizeDateFilterValue(value);
      //   const rowDate = parseTableDateValue(row[key]);
      //   if (!rowDate) {
      //     return false;
      //   }
      //
      //   const fromDate = from ? parseTableDateValue(from, 'from') : null;
      //   const toDate = to ? parseTableDateValue(to, 'to') : null;
      //
      //   if (fromDate && rowDate < fromDate) {
      //     return false;
      //   }
      //
      //   if (toDate && rowDate > toDate) {
      //     return false;
      //   }
      //
      //   return true;
      // }

      return normalizeSearchValue(row[key]).includes(normalizeSearchValue(value));
    }));

    if (!state.sortKey) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      const result = compareTableValues(a[state.sortKey], b[state.sortKey]);
      return state.sortDirection === 'asc' ? result : -result;
    });
  };

  const isEstadosDragEnabled = () => {
    if (isReadOnlyUser()) {
      return false;
    }

    const state = tableStates.estados;
    const hasFilters = Object.values(state.filters).some((value) => hasActiveFilterValue(value));
    return !hasFilters && state.sortKey === 'orden' && state.sortDirection === 'asc';
  };

  const isConfigColumnasDragEnabled = () => {
    if (isReadOnlyUser()) {
      return false;
    }

    const state = tableStates.configColumnas;
    const hasFilters = Object.values(state.filters).some((value) => hasActiveFilterValue(value));
    return !hasFilters && state.sortKey === 'orden_columna' && state.sortDirection === 'asc';
  };

  const normalizeDisabledDateFilters = (tableKey) => {
    const state = tableStates[tableKey];
    if (!state) {
      return;
    }

    Object.keys(state.filters).forEach((filterKey) => {
      if (typeof state.filters[filterKey] === 'object') {
        state.filters[filterKey] = '';
      }
    });
  };

  const resetTableFilters = (tableKey) => {
    const state = tableStates[tableKey];
    if (!state) {
      return;
    }

    state.filters = {};
  };

  // Filtros rápidos de fecha desactivados temporalmente.
  // const cloneQuickDateFilters = (state, dateColumns) => dateColumns.reduce((accumulator, column) => {
  //   accumulator[column.key] = normalizeDateFilterValue(state.filters[column.key]);
  //   return accumulator;
  // }, {});
  //
  // const closeQuickFilters = (tableKey) => {
  //   const state = tableStates[tableKey];
  //   if (!state || !state.quickFiltersOpen) {
  //     return;
  //   }
  //
  //   state.quickFiltersOpen = false;
  //   state.quickFiltersDraft = null;
  //   setupTableHeaderControls(tableKey);
  // };
  //
  // const closeAllQuickFilters = (exceptTableKey = null) => {
  //   Object.keys(tableStates).forEach((tableKey) => {
  //     if (tableKey === exceptTableKey) {
  //       return;
  //     }
  //
  //     closeQuickFilters(tableKey);
  //   });
  // };
  //
  // const applyQuickFilters = (tableKey) => {
  //   const state = tableStates[tableKey];
  //   if (!state) {
  //     return;
  //   }
  //
  //   const draftEntries = Object.entries(state.quickFiltersDraft || {});
  //   draftEntries.forEach(([filterKey, value]) => {
  //     state.filters[filterKey] = normalizeDateFilterValue(value);
  //   });
  //
  //   state.quickFiltersOpen = false;
  //   state.quickFiltersDraft = null;
  //   setupTableHeaderControls(tableKey);
  //   rerenderTable(tableKey);
  // };
  //
  // const renderTableQuickDateFilters = (tableKey, table, columns) => {
  //   ...
  // };
  const renderTableQuickDateFilters = (tableKey, table) => {
    const tableWrap = table?.closest('.clientes-table-wrap');
    const parentElement = tableWrap?.parentElement;
    const quickFilters = parentElement?.querySelector(`:scope > [data-table-quick-filters="${tableKey}"]`);
    quickFilters?.remove();
  };

  const setupTableHeaderControls = (tableKey) => {
    const definition = tableDefinitions[tableKey];
    const table = definition?.tableElement?.();
    const headerRow = table?.querySelector('thead tr');
    if (!headerRow) {
      return;
    }

    normalizeDisabledDateFilters(tableKey);

    table.classList.add('table-compact', 'table-hover', 'table-card-mobile', `table-view--${sanitizeColumnClassName(tableKey)}`);

    const columns = typeof definition.getColumns === 'function' ? definition.getColumns() : definition.columns;
    // renderTableQuickDateFilters(tableKey, table, columns);
    renderTableQuickDateFilters(tableKey, table);

    headerRow.innerHTML = columns.map((column) => {
      const state = tableStates[tableKey];
      const isSorted = state.sortKey === column.key;
      const sortArrow = isSorted ? (state.sortDirection === 'asc' ? '↑' : '↓') : '↕';
      const classes = ['table-header', getColumnCellClass(tableKey, column.key)];
      if (column.className) {
        classes.push(column.className);
      }
      const filterValue = state.filters[column.key] || '';
      const hasFilterValue = hasActiveFilterValue(filterValue);
      const filterPlaceholder = getFilterPlaceholder(tableKey, column.key, column.label);
      const headerActions = tableKey === 'ofertas' && column.key === 'acciones'
        ? renderOfertasActionHeaderConfig()
        : '';

      return `
        <th class="${classes.join(' ')}" data-table-key="${tableKey}" data-column-key="${column.key}" ${column.sortable ? 'data-sortable="true"' : ''}>
          <div class="table-header__content">
            <button class="table-header__sort" type="button" ${column.sortable ? '' : 'disabled'} aria-label="${escapeHtml(tf('table.sort_by', 'Ordenar por {label}', { label: column.label || column.key }))}">
              <span class="table-header__label">${escapeHtml(column.label)}</span>
              ${column.sortable ? `<span class="table-header__sort-indicator">${sortArrow}</span>` : ''}
            </button>
            ${headerActions}
            ${column.searchable ? `
              <div class="table-header__filter-wrap">
                <span class="table-header__filter-icon" aria-hidden="true">⌕</span>
                <input class="table-header__filter" type="text" value="${escapeHtml(filterValue)}" placeholder="${escapeHtml(filterPlaceholder)}" aria-label="${escapeHtml(filterPlaceholder)}" data-filter-key="${column.key}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" />
                ${hasFilterValue ? `<button class="table-header__filter-clear" type="button" data-clear-filter="true" data-table-key="${tableKey}" data-filter-key="${column.key}" aria-label="${escapeHtml(tf('table.clear_filter', 'Limpiar filtro {label}', { label: column.label }))}">×</button>` : ''}
              </div>
            ` : ''}
          </div>
        </th>
      `;
    }).join('');

    requestAnimationFrame(() => {
      const currentState = tableStates[tableKey];
      headerRow.querySelectorAll('.table-header__filter').forEach((input) => {
        const filterKey = input.dataset.filterKey;
        input.value = String(currentState?.filters?.[filterKey] || '');
        input.setAttribute('autocomplete', 'off');
      });
    });

    headerRow.dataset.enhanced = 'true';
  };

  const setupAllTableHeaderControls = () => {
    Object.keys(tableDefinitions).forEach((tableKey) => setupTableHeaderControls(tableKey));
  };

  const renderAvailableColumnOptions = (selectedValues = []) => {
    if (!configColumnaSelect) {
      return;
    }

    configColumnaSelect.innerHTML = availableOfferColumns
      .map((column) => `
        <option value="${escapeHtml(column.value)}" ${selectedValues.includes(column.value) ? 'selected' : ''}>
          ${escapeHtml(getOfferColumnLabel(column.value, column.label))}
        </option>
      `)
      .join('');
  };

  const loadAvailableOfferColumns = async () => {
    try {
      const response = await fetch('/api/ofertas/columnas-disponibles');
      if (response.status === 401) {
        handleUnauthorized();
        return [];
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron cargar las columnas disponibles');
      }

      availableOfferColumns = Array.isArray(result.columnas) ? result.columnas : [];
      renderAvailableColumnOptions();
      return availableOfferColumns;
    } catch (error) {
      availableOfferColumns = [];
      renderAvailableColumnOptions();
      return [];
    }
  };

  const formatDisplayDate = (value) => {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('es-ES');
  };

  const formatDisplayDateTime = (value) => {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString(getCurrentLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrencyAmount = (value) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return String(value);
    }

    return new Intl.NumberFormat(getCurrentLocale(), {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const formatSignedCurrencyAmount = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return String(value ?? '');
    }

    const absoluteValue = formatCurrencyAmount(Math.abs(numericValue));
    if (numericValue > 0) {
      return `+${absoluteValue}`;
    }
    if (numericValue < 0) {
      return `-${absoluteValue}`;
    }
    return formatCurrencyAmount(0);
  };

  const normalizeSearchText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const getFilteredBomMateriales = () => {
    const query = normalizeSearchText(bomSearchInput?.value || '');
    if (!query) {
      return bomMaterialesCache;
    }

    return bomMaterialesCache.filter((material) => normalizeSearchText(material.material).includes(query));
  };

  const renderBomDifference = (material) => {
    if (material?.diferencia_precio === null || material?.diferencia_precio === undefined) {
      return '<span class="bom-diff bom-diff--neutral">Sin histórico</span>';
    }

    const difference = Number(material.diferencia_precio);
    const className = difference > 0
      ? 'bom-diff bom-diff--positive'
      : difference < 0
        ? 'bom-diff bom-diff--negative'
        : 'bom-diff bom-diff--neutral';

    return `<span class="${className}">${escapeHtml(formatSignedCurrencyAmount(difference))}</span>`;
  };

  const renderBomMaterialesTable = ({ loading = false } = {}) => {
    if (!bomListBody) {
      return;
    }

    if (loading) {
      bomListBody.innerHTML = `
        <tr>
          <td colspan="5" class="clientes-table__empty">Cargando materiales...</td>
        </tr>
      `;
      return;
    }

    const materiales = getFilteredBomMateriales();
    if (!materiales.length) {
      const emptyMessage = bomMaterialesCache.length
        ? 'No hay materiales que coincidan con la búsqueda.'
        : 'No hay materiales registrados todavía.';
      bomListBody.innerHTML = `
        <tr>
          <td colspan="5" class="clientes-table__empty">${escapeHtml(emptyMessage)}</td>
        </tr>
      `;
      return;
    }

    const readOnly = isReadOnlyUser();

    bomListBody.innerHTML = materiales.map((material) => `
      <tr>
        <td><span class="bom-material-name">${escapeHtml(material.material || '')}</span></td>
        <td class="column-bom-price">${escapeHtml(formatCurrencyAmount(material.precio))}</td>
        <td class="column-bom-date">${escapeHtml(formatDisplayDateTime(material.fecha_creacion) || '—')}</td>
        <td class="column-bom-diff">${renderBomDifference(material)}</td>
        <td class="column-bom-actions">
          <button
            class="btn-inline btn-inline--success btn-inline--icon"
            type="button"
            data-edit-material-precio="${escapeHtml(material.id_material_precio)}"
            aria-label="Editar precio de ${escapeHtml(material.material || '')}"
            title="Editar precio"
            ${readOnly ? 'disabled' : ''}
          >✎</button>
        </td>
      </tr>
    `).join('');
  };

  const openBomListView = () => {
    currentBomMaterial = null;
    if (bomListView) {
      bomListView.hidden = false;
    }
    if (bomEditView) {
      bomEditView.hidden = true;
    }
    if (bomSearchInput) {
      bomSearchInput.disabled = false;
    }
    renderBomMaterialesTable();
  };

  const openBomEditView = (material) => {
    if (!material || !bomEditView) {
      return;
    }

    currentBomMaterial = material;
    clearGenericFeedback(bomFeedback);

    if (bomEditMaterialId) {
      bomEditMaterialId.value = material.id_material_precio ?? '';
    }
    if (bomEditMaterial) {
      bomEditMaterial.value = material.material ?? '';
    }
    if (bomEditCurrentPrice) {
      bomEditCurrentPrice.value = formatCurrencyAmount(material.precio);
    }
    if (bomEditPreviousPrice) {
      bomEditPreviousPrice.value = material.precio_anterior == null
        ? 'Sin histórico'
        : formatCurrencyAmount(material.precio_anterior);
    }
    if (bomEditNewPrice) {
      bomEditNewPrice.value = Number.isFinite(Number(material.precio)) ? Number(material.precio).toFixed(2) : '';
      bomEditNewPrice.focus();
      bomEditNewPrice.select();
    }
    if (bomSearchInput) {
      bomSearchInput.disabled = true;
    }
    if (bomListView) {
      bomListView.hidden = true;
    }
    bomEditView.hidden = false;
  };

  const closeBomModal = ({ reopenOfferCenter = false } = {}) => {
    if (!bomModal) {
      return;
    }

    bomModal.classList.remove('is-visible');
    bomModal.setAttribute('aria-hidden', 'true');
    bomMaterialesCache = [];
    currentBomOfertaContext = null;
    currentBomMaterial = null;
    clearGenericFeedback(bomFeedback);
    if (bomSearchInput) {
      bomSearchInput.value = '';
      bomSearchInput.disabled = false;
    }
    if (bomEditForm) {
      bomEditForm.reset();
    }
    openBomListView();
    if (reopenOfferCenter) {
      reopenOfferCenterFromReturnContext();
    }
  };

  const loadBomMateriales = async ({ silent = false } = {}) => {
    if (!silent) {
      clearGenericFeedback(bomFeedback);
      renderBomMaterialesTable({ loading: true });
    }

    const response = await fetch('/api/materiales-precio');
    if (response.status === 401) {
      handleUnauthorized();
      return [];
    }

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.message || t('literal.feedback.bom_load_error', 'No se pudieron cargar los materiales BOM'));
    }

    bomMaterialesCache = Array.isArray(result.materiales) ? result.materiales : [];
    renderBomMaterialesTable();
    return bomMaterialesCache;
  };

  const openBomModal = async (ofertaId) => {
    if (!bomModal) {
      return;
    }

    const oferta = ofertasListadoCache.find((item) => Number(item.id_oferta) === Number(ofertaId)) || null;
    currentBomOfertaContext = oferta || { id_oferta: ofertaId, numero_oferta: ofertaId };

    if (bomModalTitle) {
      bomModalTitle.textContent = t('literal.bom.title', 'Materiales y precios');
    }
    if (bomModalOffer) {
      const offerReference = currentBomOfertaContext?.numero_oferta || `#${currentBomOfertaContext?.id_oferta ?? ofertaId}`;
      bomModalOffer.textContent = tf('literal.bom.offer_context', 'Oferta {offerReference}. El cambio de precio inserta una nueva versión y conserva el histórico.', { offerReference });
    }
    if (bomSearchInput) {
      bomSearchInput.value = '';
    }

    bomModal.classList.add('is-visible');
    bomModal.setAttribute('aria-hidden', 'false');
    openBomListView();

    try {
      await loadBomMateriales();
    } catch (error) {
      setGenericFeedback(bomFeedback, error.message || t('literal.feedback.bom_load_error', 'No se pudieron cargar los materiales BOM.'), 'error');
      renderBomMaterialesTable();
    }
  };

  const renderOutlookMessagesList = () => {
    if (!outlookMessagesList) {
      return;
    }

    if (!outlookMessagesCache.length) {
      outlookMessagesList.innerHTML = `<p class="outlook-import__empty">${escapeHtml(t('offer.outlook_empty', 'No hay correos disponibles en Outlook.'))}</p>`;
      return;
    }

    outlookMessagesList.innerHTML = outlookMessagesCache.map((message) => {
      const isSelected = message.id === selectedOutlookMessageId;
      const sender = message.sender_name || message.sender_email || t('common.not_available', 'No disponible');
      return `
        <button class="outlook-import__item ${isSelected ? 'is-selected' : ''}" type="button" data-outlook-message-id="${escapeHtml(message.id)}">
          <strong>${escapeHtml(message.subject || t('literal.bom.no_subject', '(sin asunto)'))}</strong>
          <span>${escapeHtml(sender)}</span>
          <small>${escapeHtml(formatDisplayDateTime(message.received_at) || '')}</small>
        </button>
      `;
    }).join('');
  };

  const renderOutlookMessageDetail = (message = null) => {
    if (!outlookMessageDetail) {
      return;
    }

    if (!message) {
      outlookMessageDetail.innerHTML = `<p class="outlook-import__empty">${escapeHtml(t('offer.outlook_select_message', 'Selecciona un correo para ver el detalle.'))}</p>`;
      if (outlookImportSelectedButton) {
        outlookImportSelectedButton.disabled = true;
      }
      return;
    }

    const sender = message.sender_name || message.sender_email || t('common.not_available', 'No disponible');
    const recipients = Array.isArray(message.to_recipients) && message.to_recipients.length
      ? message.to_recipients.map((item) => item.name || item.address).filter(Boolean).join(', ')
      : '—';
    const escapedBody = escapeHtml(selectedOutlookMessageImportData?.observaciones || '').replace(/\n/g, '<br>');

    outlookMessageDetail.innerHTML = `
      <div class="outlook-import__detail-meta">
        <p><strong>${escapeHtml(t('offer.fields.client_ref_subject', 'REF. CLIENTE / ASUNTO E-MAIL'))}:</strong> ${escapeHtml(message.subject || t('literal.bom.no_subject', '(sin asunto)'))}</p>
        <p><strong>${escapeHtml(t('offer.fields.sender', 'QUIÉN LO ENVÍA'))}:</strong> ${escapeHtml(sender)}</p>
        <p><strong>${escapeHtml(t('offer.fields.email_date', 'FECHA e-mail'))}:</strong> ${escapeHtml(formatDisplayDateTime(message.received_at) || '—')}</p>
        <p><strong>${escapeHtml(t('literal.bom.to', 'Para:'))}</strong> ${escapeHtml(recipients)}</p>
      </div>
      <div class="outlook-import__detail-body">${escapedBody || '<span class="table-cell__placeholder">—</span>'}</div>
    `;

    if (outlookImportSelectedButton) {
      outlookImportSelectedButton.disabled = false;
    }
  };

  const closeOutlookImportModal = () => {
    if (!outlookImportModal) {
      return;
    }

    outlookImportModal.classList.remove('is-visible');
    outlookImportModal.setAttribute('aria-hidden', 'true');
    clearGenericFeedback(outlookImportFeedback);
    outlookMessagesCache = [];
    selectedOutlookMessageId = null;
    selectedOutlookMessageImportData = null;
    if (outlookMailboxLabel) {
      outlookMailboxLabel.textContent = '';
    }
    if (outlookMessagesList) {
      outlookMessagesList.innerHTML = '';
    }
    if (outlookMessageDetail) {
      outlookMessageDetail.innerHTML = '';
    }
    if (outlookImportSelectedButton) {
      outlookImportSelectedButton.disabled = true;
    }
  };

  const loadOutlookMessageDetail = async (messageId) => {
    if (!messageId) {
      return;
    }

    selectedOutlookMessageId = messageId;
    selectedOutlookMessageImportData = null;
    renderOutlookMessagesList();
    renderOutlookMessageDetail(null);
    clearGenericFeedback(outlookImportFeedback);
    if (outlookMessageDetail) {
      outlookMessageDetail.innerHTML = `<p class="outlook-import__empty">${escapeHtml(t('offer.outlook_loading', 'Cargando correos de Outlook...'))}</p>`;
    }

    try {
      const response = await fetch(`/api/outlook/messages/${encodeURIComponent(messageId)}`);
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudo cargar el correo de Outlook');
      }

      selectedOutlookMessageImportData = result.import_data || null;
      renderOutlookMessageDetail(result.outlook_message || null);
    } catch (error) {
      renderOutlookMessageDetail(null);
      setGenericFeedback(outlookImportFeedback, error.message || 'No se pudo cargar el correo de Outlook.', 'error');
    }
  };

  const openOutlookImportModal = async () => {
    if (!outlookImportModal) {
      return;
    }

    clearGenericFeedback(outlookImportFeedback);
    if (outlookMessagesList) {
      outlookMessagesList.innerHTML = `<p class="outlook-import__empty">${escapeHtml(t('offer.outlook_loading', 'Cargando correos de Outlook...'))}</p>`;
    }
    renderOutlookMessageDetail(null);
    outlookImportModal.classList.add('is-visible');
    outlookImportModal.setAttribute('aria-hidden', 'false');

    try {
      const statusResponse = await fetch('/api/outlook/status');
      if (statusResponse.status === 401) {
        handleUnauthorized();
        closeOutlookImportModal();
        return;
      }

      const statusResult = await statusResponse.json();
      if (!statusResponse.ok || statusResult.success === false) {
        throw new Error(statusResult.message || 'No se pudo consultar el estado de Outlook');
      }

      if (!statusResult.configured || !statusResult.available) {
        const missingConfig = (statusResult.missing_config || []).join(', ');
        const missingDependencies = (statusResult.missing_dependencies || []).join(', ');
        throw new Error(missingConfig || missingDependencies || 'Outlook no está configurado todavía.');
      }

      if (!statusResult.connected) {
        if (outlookMailboxLabel) {
          outlookMailboxLabel.textContent = '';
        }
        if (statusResult.login_url) {
          if (outlookAuthRedirectInProgress) {
            return;
          }
          outlookAuthRedirectInProgress = true;
          window.location.href = statusResult.login_url;
          return;
        }
        throw new Error('Outlook no está conectado para este usuario.');
      }

      outlookAuthRedirectInProgress = false;

      if (outlookMailboxLabel) {
        const mailboxLabel = statusResult.mailbox || statusResult.account?.username || '';
        outlookMailboxLabel.textContent = mailboxLabel ? `${t('offer.outlook_mailbox', 'Buzón')}: ${mailboxLabel}` : '';
      }

      const response = await fetch('/api/outlook/messages?folder=inbox&top=20');
      if (response.status === 401) {
        handleUnauthorized();
        closeOutlookImportModal();
        return;
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron cargar los correos de Outlook');
      }

      if (outlookMailboxLabel) {
        const mailboxLabel = result.account?.username || statusResult.mailbox || statusResult.account?.username || '';
        outlookMailboxLabel.textContent = mailboxLabel ? `${t('offer.outlook_mailbox', 'Buzón')}: ${mailboxLabel}` : '';
      }

      outlookMessagesCache = Array.isArray(result.messages) ? result.messages : [];
      selectedOutlookMessageId = outlookMessagesCache[0]?.id || null;
      renderOutlookMessagesList();

      if (selectedOutlookMessageId) {
        await loadOutlookMessageDetail(selectedOutlookMessageId);
      } else {
        renderOutlookMessageDetail(null);
      }
    } catch (error) {
      outlookAuthRedirectInProgress = false;
      outlookMessagesCache = [];
      selectedOutlookMessageId = null;
      selectedOutlookMessageImportData = null;
      renderOutlookMessagesList();
      renderOutlookMessageDetail(null);
      setGenericFeedback(outlookImportFeedback, error.message || 'No se pudo abrir Outlook.', 'error');
    }
  };

  const sanitizeColumnClassName = (value) => String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const getColumnDefinition = (tableKey, columnKey) => {
    const definition = tableDefinitions[tableKey];
    const columns = typeof definition?.getColumns === 'function' ? definition.getColumns() : definition?.columns;
    return Array.isArray(columns) ? columns.find((column) => column.key === columnKey) : null;
  };

  const getColumnLabel = (tableKey, columnKey) => getColumnDefinition(tableKey, columnKey)?.label || columnKey;

  const getFilterPlaceholder = (tableKey, columnKey, label) => {
    const normalizedColumnKey = String(columnKey || '').trim().toLowerCase();
    const placeholders = {
      ofertas: {
        numero_oferta: t('table.filter_offer_number', 'Filtrar nº oferta'),
        fecha_alta_oferta: t('table.filter_date', 'Filtrar fecha'),
        fecha_email: t('table.filter_date', 'Filtrar fecha'),
        fecha_limite: t('table.filter_date', 'Filtrar fecha'),
        ref_cliente_asunto_email: t('table.filter_subject', 'Filtrar asunto'),
        cliente: t('table.filter_client', 'Filtrar cliente'),
        emisor: t('table.filter_sender', 'Filtrar emisor'),
        observaciones_oferta: t('table.search_notes', 'Buscar observación'),
        observaciones_interaccion: t('table.search_comments', 'Buscar comentarios'),
        estado: t('table.filter_status', 'Filtrar estado'),
        tipo_interaccion: t('table.filter_status_change', 'Filtrar cambio estado'),
      },
      clientes: {
        id_cliente: t('table.filter_id', 'Filtrar ID'),
        descripcion_cliente: t('table.filter_client', 'Filtrar cliente'),
        dominio: t('table.filter_domain', 'Filtrar dominio'),
      },
      proyectos: {
        id_proyecto: t('table.filter_id', 'Filtrar ID'),
        descripcion_proyecto: t('table.filter_description', 'Filtrar descripción'),
      },
      usuarios: {
        num_operario: t('literal.filters.users.operator_number', 'Filtrar nº operario'),
        nombre: t('literal.filters.users.name', 'Filtrar nombre'),
        rol: t('literal.filters.users.role', 'Filtrar rol'),
        departamentos: t('literal.filters.users.departments', 'Filtrar departamentos'),
      },
      estados: {
        orden: t('table.filter_order', 'Filtrar orden'),
        descripcion_estado: t('table.filter_status', 'Filtrar estado'),
        nombre_departamento: t('table.filter_department', 'Filtrar departamento'),
      },
      configColumnas: {
        columna: t('table.filter_column', 'Filtrar columna'),
        descripcion_columna: t('table.filter_description', 'Filtrar descripción'),
        orden_columna: t('table.filter_order', 'Filtrar orden'),
      },
    };

    return placeholders[tableKey]?.[normalizedColumnKey] || tf('table.filter_generic', 'Filtrar {label}', { label: String(label || normalizedColumnKey || columnKey).toLowerCase() });
  };

  const getColumnCellClass = (tableKey, columnKey) => {
    const sharedClass = `column-${sanitizeColumnClassName(columnKey)}`;
    const specificClasses = {
      ofertas: {
        vista: 'column-view',
        numero_oferta: 'column-primary column-offer-number',
        fecha_alta_oferta: 'column-secondary column-date',
        fecha_email: 'column-secondary column-date',
        fecha_limite: 'column-secondary column-date',
        cliente: 'column-primary column-client',
        emisor: 'column-secondary column-sender',
        observaciones_oferta: 'column-observaciones',
        estado: 'column-status',
        vista: 'column-view',
        acciones: 'column-actions',
      },
      clientes: {
        id_cliente: 'column-secondary column-id',
        descripcion_cliente: 'column-primary column-client',
        dominio: 'column-secondary column-domain',
        acciones: 'column-actions',
      },
      proyectos: {
        id_proyecto: 'column-secondary column-id',
        descripcion_proyecto: 'column-primary',
        acciones: 'column-actions',
      },
      usuarios: {
        num_operario: 'column-secondary column-id',
        nombre: 'column-primary column-client',
        rol: 'column-secondary',
        departamentos: 'column-observaciones',
      },
      estados: {
        drag: 'column-drag',
        orden: 'column-secondary column-order',
        descripcion_estado: 'column-primary',
        nombre_departamento: 'column-secondary column-department',
        acciones: 'column-actions',
      },
      configColumnas: {
        drag: 'column-drag',
        columna: 'column-primary column-config-key',
        descripcion_columna: 'column-secondary column-observaciones',
        orden_columna: 'column-secondary column-order',
        acciones: 'column-actions',
      },
    };

    return [sharedClass, specificClasses[tableKey]?.[columnKey]].filter(Boolean).join(' ');
  };

  const getStatusTone = (value) => {
    const normalized = normalizeSearchValue(value);
    if (normalized.includes('pend')) return 'pending';
    if (normalized.includes('envi')) return 'sent';
    if (normalized.includes('aprob') || normalized.includes('acept')) return 'success';
    if (normalized.includes('rechaz') || normalized.includes('cancel')) return 'danger';
    if (normalized.includes('proceso') || normalized.includes('curso')) return 'info';
    return 'neutral';
  };

  const renderStatusBadge = (value) => {
    const label = translateEstadoLabel(String(value || t('table.no_status', 'Sin estado')).trim() || t('table.no_status', 'Sin estado'));
    return `<span class="status-badge status-badge--${getStatusTone(label)}">${escapeHtml(label)}</span>`;
  };

  const renderStaticTableCell = ({ tableKey, rowId, columnKey, value, label, className = '', contentClass = '', title = '' }) => {
    return renderTableCell({
      tableKey,
      rowId,
      columnKey,
      value,
      label,
      className,
      contentClass,
      expandable: false,
      title,
    });
  };

  const getExpandableCellKey = (tableKey, rowId, columnKey) => `${tableKey}:${rowId}:${columnKey}`;

  const isExpandableCellValue = (value) => {
    const normalized = String(value ?? '').trim();
    return normalized.length > 90 || /\r|\n/.test(normalized);
  };

  const renderTableCell = ({ tableKey, rowId, columnKey, value, label, className = '', contentClass = '', expandable = true, title = '' }) => {
    const resolvedValue = tableKey === 'ofertas' && String(columnKey || '').trim().toLowerCase() === 'tipo_interaccion'
      ? translateInteractionSummary(value)
      : value;
    const normalizedValue = String(resolvedValue ?? '');
    const columnLabel = label || getColumnLabel(tableKey, columnKey);
    const classes = ['table-cell', getColumnCellClass(tableKey, columnKey)];
    if (className) {
      classes.push(className);
    }

    const escapedValue = escapeHtml(normalizedValue).replace(/\n/g, '<br>');
    const canExpand = expandable && isExpandableCellValue(normalizedValue);
    const contentClasses = ['table-cell__content'];
    if (!canExpand && !contentClass) {
      contentClasses.push('table-cell__content--plain');
    }
    if (contentClass) {
      contentClasses.push(...contentClass.split(' ').filter(Boolean));
    }
    const renderedValue = escapedValue || '<span class="table-cell__placeholder">—</span>';
    const titleAttr = title || (!canExpand && normalizedValue ? normalizedValue : '');
    const labelAttr = columnLabel ? ` data-label="${escapeHtml(columnLabel)}"` : '';
    const titleAttribute = titleAttr ? ` title="${escapeHtml(titleAttr)}"` : '';

    if (!canExpand) {
      return `
        <td class="${classes.join(' ')}"${labelAttr}${titleAttribute}>
          <div class="table-cell__stack">
            <div class="${contentClasses.join(' ')}">${renderedValue}</div>
          </div>
        </td>
      `;
    }

    const cellKey = getExpandableCellKey(tableKey, rowId, columnKey);
    const isExpanded = expandedTableCells.has(cellKey);
    classes.push('table-cell--expandable');
    if (isExpanded) {
      classes.push('is-expanded');
    }

    return `
      <td class="${classes.join(' ')}"${labelAttr}>
        <div class="table-cell__stack">
          <div class="${contentClasses.join(' ')}">${renderedValue}</div>
          <button
            class="table-cell__toggle"
            type="button"
            data-toggle-table-cell="${escapeHtml(cellKey)}"
            data-table-key="${escapeHtml(tableKey)}"
            aria-expanded="${isExpanded ? 'true' : 'false'}"
            aria-label="${escapeHtml(tf(isExpanded ? 'table.collapse_label' : 'table.expand_label', isExpanded ? 'Colapsar {label}' : 'Expandir {label}', { label: columnLabel }))}"
          >${isExpanded ? t('table.show_less', 'Ver menos') : t('table.show_more', 'Ver más')}</button>
        </div>
      </td>
    `;
  };

  const rerenderTable = (tableKey) => {
    if (tableKey === 'ofertas') {
      renderOfertasListado(ofertasListadoCache);
      return;
    }

    if (tableKey === 'clientes') {
      renderClientesTable();
      return;
    }

    if (tableKey === 'proyectos') {
      renderProyectosTable();
      return;
    }

    if (tableKey === 'usuarios') {
      renderUsuariosTable();
      return;
    }

    if (tableKey === 'estados') {
      renderEstadosTable();
      return;
    }

    if (tableKey === 'configColumnas') {
      renderConfigColumnasTable();
    }
  };

  const buildPayload = () => {
    if (!form) {
      return {};
    }

    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  };

  const checkDuplicateEmailSubject = async () => {
    const payload = buildPayload();
    const response = await fetch('/api/ofertas/verificar-duplicado-correo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fecha_email: payload.fecha_email,
        ref_cliente_asunto_email: payload.ref_cliente_asunto_email,
      }),
    });

    if (response.status === 401) {
      handleUnauthorized();
      return { exists: false };
    }

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'No se pudo comprobar si el correo ya existe.');
    }

    return result;
  };

  const renderProyectoOptions = (selectedValue = '') => {
    if (!ofertaEtcProyecto) {
      return;
    }

    ofertaEtcProyecto.innerHTML = [
      `<option value="">${escapeHtml(t('offer.no_project', 'Sin proyecto'))}</option>`,
      ...proyectosCache.map((proyecto) => `<option value="${escapeHtml(proyecto.descripcion_proyecto)}">${escapeHtml(proyecto.descripcion_proyecto)}</option>`),
    ].join('');

    ofertaEtcProyecto.value = selectedValue || '';
  };

  const applyImportedEmailData = async (data) => {
    if (!form || !data) {
      return;
    }

    importedEmailAttachmentToken = data.imported_email_attachment_token || null;
    importedEmailMetadata = data.imported_email_metadata || null;

    if (!clientesCache.length) {
      await loadClientes({ silent: true });
    }

    const fechaEmailField = document.getElementById('fecha_email');
    const fechaAltaField = document.getElementById('fecha_alta_oferta');
    const refField = document.getElementById('ref_cliente_asunto_email');
    const observacionesField = document.getElementById('observaciones');

    if (fechaEmailField) {
      fechaEmailField.value = data.fecha_email || '';
    }
    if (fechaAltaField) {
      fechaAltaField.value = data.fecha_alta_oferta || '';
    }
    if (refField) {
      refField.value = data.ref_cliente_asunto_email || '';
    }
    if (emisorInput) {
      emisorInput.value = data.emisor || data.sender_email || '';
    }
    if (observacionesField) {
      observacionesField.value = data.observaciones || '';
    }
    if (clienteSelect) {
      clienteSelect.value = data.id_cliente ? String(data.id_cliente) : '';
    }
  };

  const focusImportedOffer = async (ofertaId) => {
    if (!ofertaId) {
      return false;
    }

    await loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label });
    let oferta = ofertasListadoCache.find((item) => String(item.id_oferta) === String(ofertaId));

    if (!oferta) {
      await loadOfertasListado({ estadoId: null, label: t('listing.all', 'Todos') });
      oferta = ofertasListadoCache.find((item) => String(item.id_oferta) === String(ofertaId));
    }

    if (!oferta) {
      return false;
    }

    openOfferCenterModal(oferta);
    return true;
  };

  const handleImportedEmailResult = async (result, { feedbackTarget = feedback, closeOutlook = false } = {}) => {
    if ((result?.mode || '') === 'synced_existing_offer') {
      importedEmailAttachmentToken = null;
      importedEmailMetadata = null;
      savedOfertaContext = null;
      pendingOfertaEtcPayload = null;
      updateOfertaEtcStandbyUi();

      if (closeOutlook) {
        closeOutlookImportModal();
      }

      const openedOffer = await focusImportedOffer(result.id_oferta);
      const successMessage = result.message || 'Correo sincronizado con una oferta existente.';
      if (feedbackTarget === outlookImportFeedback) {
        setGenericFeedback(outlookImportFeedback, successMessage, 'success');
      }
      setFeedback(successMessage, 'success');
      if (!openedOffer && feedbackTarget && feedbackTarget !== outlookImportFeedback) {
        setGenericFeedback(feedbackTarget, successMessage, 'success');
      }
      return true;
    }

    await applyImportedEmailData(result?.data || {});
    return false;
  };

  const importMailFile = async (file) => {
    if (guardReadOnlyAction()) {
      if (mailFileInput) {
        mailFileInput.value = '';
      }
      return;
    }

    if (!file) {
      return;
    }

    const fileName = String(file.name || '').toLowerCase();
    if (!fileName.endsWith('.eml') && !fileName.endsWith('.msg')) {
      setFeedback('Solo se admiten correos en formato .eml o .msg.', 'error');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('correo', file);
    setFeedback('Importando correo...', 'success');

    try {
      const response = await fetch('/api/ofertas/importar-correo', {
        method: 'POST',
        body: uploadData,
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudo importar el correo');
      }

      await handleImportedEmailResult(result);
      setFeedback(result.message || 'Correo importado correctamente.', 'success');
    } catch (error) {
      setFeedback(error.message || 'No se pudo importar el correo.', 'error');
    } finally {
      if (mailFileInput) {
        mailFileInput.value = '';
      }
    }
  };

  // Gestión de sesión: sincroniza localStorage con el servidor y muestra modal si no hay sesión
  const handleUnauthorized = () => {
    currentAuthenticatedUser = null;
    localStorage.removeItem('usuarioSGA');
    if (window.LoginModal && !window.LoginModal.isOpen) {
      window.LoginModal.show();
    }
  };

  const setCurrentUser = (user) => {
    currentAuthenticatedUser = user && typeof user === 'object' ? { ...user, success: true } : null;

    if (currentAuthenticatedUser) {
      localStorage.setItem('usuarioSGA', JSON.stringify(currentAuthenticatedUser));
    } else {
      localStorage.removeItem('usuarioSGA');
    }

    if (window.LoginModal && window.LoginModal.updateUserWidget) {
      window.LoginModal.updateUserWidget();
    }

    return currentAuthenticatedUser;
  };

  const syncCurrentUserFromServer = async () => {
    const response = await fetch('/api/session/check');
    const data = await response.json();

    if (data.authenticated && data.user) {
      return setCurrentUser(data.user);
    }

    return setCurrentUser(null);
  };

  const getCurrentUser = () => {
    return currentAuthenticatedUser;
  };

  const isAuthenticated = () => {
    const user = getCurrentUser();
    return !!(user && user.id);
  };

  const isReadOnlyUser = () => {
    const user = getCurrentUser();
    if (!user) {
      return false;
    }

    if (user.read_only === true) {
      return true;
    }

    return Number(user.num_operario) === 4;
  };

  const isManagerUser = () => {
    const user = getCurrentUser();
    if (!user) {
      return false;
    }

    if (Number(user.id_rol) === 1) {
      return true;
    }

    return String(user.rol || user.nombre_rol || '').trim().toLowerCase() === 'manager';
  };

  const getCurrentUserDepartmentIds = () => {
    const user = getCurrentUser();
    const departments = Array.isArray(user?.departamentos) ? user.departamentos : [];

    return departments
      .map((department) => (department && typeof department === 'object' ? department.id_departamento : department))
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  };

  const canReassignOffer = (oferta) => {
    if (!isManagerUser() || !oferta) {
      return false;
    }

    const departmentId = Number(oferta.id_departamento_estado);
    if (!Number.isFinite(departmentId)) {
      return false;
    }

    return getCurrentUserDepartmentIds().includes(departmentId);
  };

  const MANAGER_ONLY_MESSAGE = 'Solo los usuarios con rol Manager pueden añadir o editar configuraciones.';
  const OFFER_DELETE_MANAGER_ONLY_MESSAGE = 'Solo los usuarios con rol Manager pueden eliminar ofertas.';

  const enforceManagerOnlyUi = (buttons, panels, requestedMode, createModeName = 'crear') => {
    const resolvedMode = isManagerUser() ? requestedMode : 'ver';

    buttons.forEach((button) => {
      const isCreateButton = button.dataset.clientesMode === createModeName
        || button.dataset.proyectosMode === createModeName
        || button.dataset.estadosMode === createModeName
        || button.dataset.usuariosMode === createModeName;
      button.hidden = !isManagerUser() && isCreateButton;
      const buttonMode = button.dataset.clientesMode || button.dataset.proyectosMode || button.dataset.estadosMode || button.dataset.usuariosMode;
      const isActive = buttonMode === resolvedMode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const panelMode = panel.dataset.clientesModePanel || panel.dataset.proyectosModePanel || panel.dataset.estadosModePanel || panel.dataset.usuariosModePanel;
      const isCreatePanel = panelMode === createModeName;
      panel.hidden = !isManagerUser() && isCreatePanel;
      panel.classList.toggle('active', panelMode === resolvedMode);
    });

    return resolvedMode;
  };

  const showManagerOnlyFeedback = (feedbackElement, modeSetter = null) => {
    if (typeof modeSetter === 'function') {
      modeSetter('ver');
    }
    setGenericFeedback(feedbackElement, MANAGER_ONLY_MESSAGE, 'error');
  };

  const showReadOnlyAlert = () => {
    window.alert(t('auth.read_only_alert', 'Read-only user. This account can only view information.'));
  };

  const guardReadOnlyAction = (event = null) => {
    if (!isReadOnlyUser()) {
      return false;
    }

    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    showReadOnlyAlert();
    return true;
  };

  const loadNextNumeroOferta = async () => {
    if (!numeroOfertaField) {
      return;
    }

    numeroOfertaField.value = t('offer.loading', 'Consultando...');

    try {
      const response = await fetch('/api/ofertas/siguiente-numero');
      if (response.status === 401) {
        handleUnauthorized();
        numeroOfertaField.value = '';
        return;
      }
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || t('offer.next_number_error', 'No se pudo consultar el siguiente número de oferta'));
      }

      numeroOfertaField.value = result.numero_oferta || t('common.not_available', 'No disponible');
    } catch (error) {
      numeroOfertaField.value = t('common.not_available', 'No disponible');
    }
  };

  const renderClienteOptions = (clientes) => {
    if (!clienteSelect) {
      return;
    }

    const currentValue = clienteSelect.value;
    clienteSelect.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = clientes.length
      ? t('offer.select_client', 'Seleccionar cliente')
      : t('config.clients_none', 'No hay clientes creados');
    clienteSelect.appendChild(placeholderOption);

    clientes.forEach((cliente) => {
      const option = document.createElement('option');
      option.value = String(cliente.id_cliente);
      option.textContent = cliente.descripcion_cliente;
      clienteSelect.appendChild(option);
    });

    if (clientes.some((cliente) => String(cliente.id_cliente) === currentValue)) {
      clienteSelect.value = currentValue;
    }
  };

  const loadClientes = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('/api/clientes');
      if (response.status === 401) { handleUnauthorized(); return []; }
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || t('config.clients_fetch_error', 'No se pudieron consultar los clientes'));
      }

      clientesCache = Array.isArray(result.clientes) ? result.clientes : [];
      renderClienteOptions(clientesCache);
      renderClientesTable();
      return clientesCache;
    } catch (error) {
      clientesCache = [];
      renderClienteOptions(clientesCache);
      renderClientesTable();

      if (!silent) {
        setGenericFeedback(clientesTableFeedback, error.message || t('config.clients_load_error', 'No se pudieron cargar los clientes.'), 'error');
      }

      return [];
    }
  };

  const renderRoleOptions = () => {
    if (!userRoleSelect) {
      return;
    }

    userRoleSelect.innerHTML = [
      `<option value="">${escapeHtml(t('literal.users.select_role', 'Selecciona un rol'))}</option>`,
      ...rolesCache.map((role) => `<option value="${escapeHtml(role.id_rol)}">${escapeHtml(translateRoleLabel(role.nombre_rol))}</option>`),
    ].join('');
  };

  const buildRoleOptions = (selectedValue = '') => {
    const normalizedSelectedValue = String(selectedValue ?? '');

    return [
      `<option value="">${escapeHtml(t('literal.users.select_role', 'Selecciona un rol'))}</option>`,
      ...rolesCache.map((role) => {
        const optionValue = String(role.id_rol ?? '');
        const isSelected = optionValue === normalizedSelectedValue ? ' selected' : '';
        return `<option value="${escapeHtml(optionValue)}"${isSelected}>${escapeHtml(translateRoleLabel(role.nombre_rol))}</option>`;
      }),
    ].join('');
  };

  const buildDepartamentoOptions = (selectedValue = '', emptyLabel = t('literal.etc.no_department', 'Sin departamento')) => {
    const normalizedSelectedValue = String(selectedValue ?? '');

    return [
      `<option value="">${escapeHtml(emptyLabel)}</option>`,
      ...departamentosCache.map((departamento) => {
        const optionValue = String(departamento.id_departamento ?? '');
        const isSelected = optionValue === normalizedSelectedValue ? ' selected' : '';
        return `<option value="${escapeHtml(optionValue)}"${isSelected}>${escapeHtml(translateDepartmentLabel(departamento.nombre_departamento))}</option>`;
      }),
    ].join('');
  };

  const renderDepartamentoOptions = () => {
    if (userDepartamentosSelect) {
      userDepartamentosSelect.innerHTML = buildDepartamentoOptions(userDepartamentosSelect.value);
    }

    if (estadoDepartamentoSelect) {
      estadoDepartamentoSelect.innerHTML = buildDepartamentoOptions(estadoDepartamentoSelect.value);
    }

    if (ofertaEtcDepartamento) {
      ofertaEtcDepartamento.innerHTML = buildDepartamentoOptions(ofertaEtcDepartamento.value);
    }
  };

  const renderGeneralUsersDatalists = () => {
    const numberList = document.getElementById('generalUsersByNumber');
    const nameList = document.getElementById('generalUsersByName');

    if (numberList) {
      numberList.innerHTML = generalUsersCache
        .map((user) => `<option value="${escapeHtml(user.num_operario)}">${escapeHtml(user.nombre)}</option>`)
        .join('');
    }

    if (nameList) {
      nameList.innerHTML = generalUsersCache
        .map((user) => `<option value="${escapeHtml(user.nombre)}">${escapeHtml(user.num_operario)}</option>`)
        .join('');
    }
  };

  const findGeneralUserByNumOperario = (value) => {
    const normalizedValue = String(value ?? '').trim();
    return generalUsersCache.find((user) => String(user.num_operario) === normalizedValue) || null;
  };

  const findGeneralUserByNombre = (value) => {
    const normalizedValue = String(value ?? '').trim().toLocaleLowerCase();
    const matches = generalUsersCache.filter((user) => String(user.nombre || '').trim().toLocaleLowerCase() === normalizedValue);
    if (matches.length === 1) {
      return matches[0];
    }
    return null;
  };

  const syncUserFieldsFromGeneralUser = (generalUser, source = 'num_operario') => {
    if (!generalUser) {
      return;
    }

    if (userNumOperarioInput && source !== 'num_operario') {
      userNumOperarioInput.value = String(generalUser.num_operario ?? '');
    }

    if (userNombreInput && source !== 'nombre') {
      userNombreInput.value = String(generalUser.nombre ?? '');
    }
  };

  const loadGeneralUsers = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('/api/usuarios-general');
      if (response.status === 401) {
        handleUnauthorized();
        return [];
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron consultar los usuarios de General.Usuarios');
      }

      generalUsersCache = Array.isArray(result.usuarios) ? result.usuarios : [];
      renderGeneralUsersDatalists();
      return generalUsersCache;
    } catch (error) {
      generalUsersCache = [];
      renderGeneralUsersDatalists();
      if (!silent) {
        setGenericFeedback(userCreateFeedback, error.message || 'No se pudo cargar el catálogo de usuarios.', 'error');
      }
      return [];
    }
  };

  const loadRoles = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('/api/roles');
      if (response.status === 401) {
        handleUnauthorized();
        return [];
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron consultar los roles');
      }

      rolesCache = Array.isArray(result.roles) ? result.roles : [];
      renderRoleOptions();
      return rolesCache;
    } catch (error) {
      rolesCache = [];
      renderRoleOptions();
      if (!silent) {
        setGenericFeedback(userCreateFeedback, error.message || 'No se pudieron cargar los roles.', 'error');
      }
      return [];
    }
  };

  const loadDepartamentos = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('/api/departamentos');
      if (response.status === 401) {
        handleUnauthorized();
        return [];
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron consultar los departamentos');
      }

      departamentosCache = Array.isArray(result.departamentos) ? result.departamentos : [];
      renderDepartamentoOptions();
      return departamentosCache;
    } catch (error) {
      departamentosCache = [];
      renderDepartamentoOptions();
      if (!silent) {
        setGenericFeedback(userCreateFeedback, error.message || 'No se pudieron cargar los departamentos.', 'error');
      }
      return [];
    }
  };

  const setUsuariosMode = (mode) => {
    enforceManagerOnlyUi(usuariosModeButtons, usuariosModePanels, mode, 'crear');

    if (!isManagerUser()) {
      clearGenericFeedback(userCreateFeedback);
    }
  };

  const renderUsuariosTable = () => {
    if (!usuariosTableBody) {
      return;
    }

    const processedUsuarios = getProcessedRows('usuarios', usuariosCache);
    const canManageUsers = isManagerUser();

    if (!processedUsuarios.length) {
      usuariosTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="clientes-table__empty">${escapeHtml(t('literal.users.empty', 'No hay usuarios creados todavía.'))}</td>
        </tr>
      `;
      return;
    }

    usuariosTableBody.innerHTML = processedUsuarios.map((usuario) => {
      const isEditing = canManageUsers && editingUsuarioId === Number(usuario.num_operario);

      return `
      <tr data-usuario-row="${escapeHtml(usuario.num_operario)}" class="${isEditing ? 'usuarios-table__row usuarios-table__row--editing' : 'usuarios-table__row'}">
        ${renderStaticTableCell({ tableKey: 'usuarios', rowId: usuario.num_operario, columnKey: 'num_operario', value: usuario.num_operario, contentClass: 'table-cell__content--strong' })}
        ${renderStaticTableCell({ tableKey: 'usuarios', rowId: usuario.num_operario, columnKey: 'nombre', value: usuario.nombre, contentClass: 'table-cell__content--strong', title: usuario.nombre })}
        ${isEditing
          ? `
            <td class="${getColumnCellClass('usuarios', 'email')} usuarios-table__cell usuarios-table__cell--editing" data-label="${escapeHtml(t('literal.users.email', 'Email'))}">
              <input class="usuarios-table__edit-input" type="email" value="${escapeHtml(usuario.email || '')}" data-edit-usuario-email="${escapeHtml(usuario.num_operario)}" maxlength="255" />
            </td>
          `
          : renderTableCell({ tableKey: 'usuarios', rowId: usuario.num_operario, columnKey: 'email', value: usuario.email || '', contentClass: 'table-cell__content--muted', title: usuario.email || '' })}
        ${isEditing
          ? `
            <td class="${getColumnCellClass('usuarios', 'rol')} usuarios-table__cell usuarios-table__cell--editing" data-label="${escapeHtml(t('literal.users.role', 'Rol'))}">
              <select class="usuarios-table__edit-input usuarios-table__edit-select" data-edit-usuario-rol="${escapeHtml(usuario.num_operario)}">
                ${buildRoleOptions(usuario.id_rol || '')}
              </select>
            </td>
          `
          : renderStaticTableCell({ tableKey: 'usuarios', rowId: usuario.num_operario, columnKey: 'rol', value: translateRoleLabel(usuario.rol || usuario.nombre_rol), contentClass: 'table-cell__content--muted' })}
        ${isEditing
          ? `
            <td class="${getColumnCellClass('usuarios', 'departamentos')} usuarios-table__cell usuarios-table__cell--editing" data-label="${escapeHtml(t('literal.users.departments', 'Departamentos'))}">
              <select class="usuarios-table__edit-input usuarios-table__edit-select" data-edit-usuario-departamento="${escapeHtml(usuario.num_operario)}">
                ${buildDepartamentoOptions(usuario.id_departamento || '')}
              </select>
            </td>
          `
          : renderTableCell({ tableKey: 'usuarios', rowId: usuario.num_operario, columnKey: 'departamentos', value: translateDepartmentLabel(usuario.departamentos), contentClass: 'table-cell__content--muted', title: translateDepartmentLabel(usuario.departamentos) })}
        <td class="table-cell table-cell--actions ${getColumnCellClass('usuarios', 'acciones')}" data-label="${escapeHtml(t('table.actions', 'Acciones'))}">
          <div class="clientes-table__actions actions-inline ${isEditing ? 'usuarios-table__actions usuarios-table__actions--editing' : ''}">
            ${isEditing
              ? `
                <button class="btn-inline btn-inline--save btn-inline--compact" type="button" data-save-usuario="${escapeHtml(usuario.num_operario)}">${escapeHtml(t('common.save', 'Guardar'))}</button>
                <button class="btn-inline btn-inline--cancel btn-inline--compact" type="button" data-cancel-usuario="${escapeHtml(usuario.num_operario)}">${escapeHtml(t('common.cancel', 'Cancelar'))}</button>
              `
              : canManageUsers
                ? `<button class="btn-inline btn-inline--edit" type="button" data-edit-usuario="${escapeHtml(usuario.num_operario)}">${escapeHtml(t('common.edit', 'Editar'))}</button>`
                : '<span class="table-cell__content table-cell__content--muted">-</span>'}
          </div>
        </td>
      </tr>
    `;
    }).join('');
  };

  const loadUsuarios = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('/api/usuarios');
      if (response.status === 401) {
        handleUnauthorized();
        return [];
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron consultar los usuarios');
      }

      usuariosCache = Array.isArray(result.usuarios) ? result.usuarios : [];
      renderUsuariosTable();
      return usuariosCache;
    } catch (error) {
      usuariosCache = [];
      renderUsuariosTable();
      if (!silent) {
        setGenericFeedback(usuariosTableFeedback, error.message || 'No se pudieron cargar los usuarios.', 'error');
      }
      return [];
    }
  };

  const populateOfertaEditClienteOptions = () => {
    if (!ofertaEditCliente) {
      return;
    }

    ofertaEditCliente.innerHTML = [
      `<option value="">${escapeHtml(t('offer.no_client', 'Sin cliente'))}</option>`,
      ...clientesCache.map((cliente) => `<option value="${cliente.id_cliente}">${escapeHtml(cliente.descripcion_cliente)}</option>`),
    ].join('');
  };

  const formatInteractionDateTime = (value) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(getCurrentLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const populateOfertaEstadoOptions = (currentEstadoId) => {
    if (!ofertaEstadoNuevo) {
      return;
    }

    const availableStates = getActiveEstados().filter((estado) => Number(estado.id_estado) !== Number(currentEstadoId));
    currentOfertaEstadoId = currentEstadoId;
    ofertaEstadoNuevo.innerHTML = [
      `<option value="">${escapeHtml(t('config.select_state', 'Selecciona un estado'))}</option>`,
      ...availableStates.map((estado) => `<option value="${estado.id_estado}">${escapeHtml(translateEstadoLabel(estado.descripcion_estado))}</option>`),
    ].join('');
  };

  const renderOfferHistory = (targetElement, interacciones = []) => {
    if (!targetElement) {
      return;
    }

    if (!interacciones.length) {
      targetElement.innerHTML = `<p class="crm-history__empty">${escapeHtml(t('crm.history_empty', 'Sin interacciones registradas.'))}</p>`;
      return;
    }

    targetElement.innerHTML = interacciones.map((interaccion) => `
      <article class="crm-history__item">
        <div class="crm-history__meta">
          <strong>${escapeHtml(translateInteractionSummary(interaccion.tipo_interaccion || t('crm.interaction', 'Interacción')))}</strong>
          <span>${escapeHtml(formatInteractionDateTime(interaccion.fecha_interaccion) || '')}</span>
        </div>
        <p class="crm-history__deadline"><strong>${escapeHtml(t('crm.deadline', 'Fecha límite'))}:</strong> ${escapeHtml(interaccion.fecha_limite ? formatDisplayDate(interaccion.fecha_limite) : t('crm.undefined_deadline', 'Sin definir'))}</p>
        <p>${escapeHtml(interaccion.observaciones || t('crm.no_comments', 'Sin comentarios.'))}</p>
      </article>
    `).join('');
  };

  const renderOfertaEstadoHistorial = (interacciones = []) => {
    if (!ofertaEstadoHistorial) {
      return;
    }

    currentOfertaEstadoInteracciones = interacciones;
    renderOfferHistory(ofertaEstadoHistorial, interacciones);
  };

  const splitOfferConversation = (rawText) => {
    const normalized = String(rawText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!normalized) {
      return [];
    }

    const lines = normalized.split('\n');
    const segments = [];
    const currentLines = [];
    const hardDividerRegex = /^(?:-{2,}\s*(?:original message|mensaje original|quoted message)\s*-*|_{5,})$/i;
    const wroteRegex = /^on\s.+wrote:$/i;
    const headerLineRegex = /^(from|de|sent|enviado|to|para|cc|subject|asunto)\s*:/i;

    const pushSegment = () => {
      const text = currentLines.join('\n').trim();
      if (text) {
        segments.push(text);
      }
      currentLines.length = 0;
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        if (currentLines.length && currentLines[currentLines.length - 1] !== '') {
          currentLines.push('');
        }
        continue;
      }

      const nextLines = lines.slice(index, index + 4).map((item) => item.trim()).filter(Boolean);
      const headerMatches = nextLines.filter((item) => headerLineRegex.test(item)).length;
      const startsQuotedBlock = hardDividerRegex.test(trimmed) || wroteRegex.test(trimmed) || headerMatches >= 2;

      if (startsQuotedBlock) {
        pushSegment();
        continue;
      }

      currentLines.push(trimmed);
    }

    pushSegment();
    return segments.length ? segments : [normalized];
  };

  const renderOfferConversation = (bodyText) => {
    const segments = splitOfferConversation(bodyText);
    if (!segments.length) {
      return `<p>${escapeHtml(t('crm.no_comments', 'Sin comentarios.'))}</p>`;
    }

    const sanitizeConversationSegmentForDisplay = (segment) => {
      const lines = String(segment || '').split('\n');
      const sanitizedLines = [];
      let skippingSafeLinksBlock = false;

      const isSafeLinksLine = (line) => /safelinks\.protection\.outlook\.com/i.test(line);
      const isSafeLinksContinuationLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return false;
        }

        const normalized = trimmed.toLowerCase();
        if (
          normalized.startsWith('url=')
          || normalized.startsWith('&')
          || normalized.startsWith('data=')
          || normalized.startsWith('reserved=')
          || normalized.includes('safelinks.protection.outlook.com')
        ) {
          return true;
        }

        return trimmed.length > 90 && !/\s{2,}/.test(trimmed) && /[%=?&/]/.test(trimmed);
      };

      lines.forEach((line) => {
        const trimmed = line.trim();

        if (isSafeLinksLine(trimmed)) {
          skippingSafeLinksBlock = true;
          return;
        }

        if (skippingSafeLinksBlock) {
          if (!trimmed) {
            skippingSafeLinksBlock = false;
            return;
          }

          if (isSafeLinksContinuationLine(trimmed)) {
            return;
          }

          skippingSafeLinksBlock = false;
        }

        sanitizedLines.push(line);
      });

      return sanitizedLines.join('\n').trim();
    };

    const visibleSegments = segments
      .map((segment) => sanitizeConversationSegmentForDisplay(segment))
      .filter(Boolean);

    if (!visibleSegments.length) {
      return `<p>${escapeHtml(t('crm.no_comments', 'Sin comentarios.'))}</p>`;
    }

    return `
      <div class="offer-center__conversation">
        ${visibleSegments.map((segment, index) => {
          const title = index === 0
            ? t('offer.current_message', 'Mensaje actual')
            : tf('offer.previous_message', 'Correo anterior {index}', { index });

          return `
            <article class="offer-center__thread-card">
              <header class="offer-center__thread-header">
                <strong>${escapeHtml(title)}</strong>
              </header>
              <div class="offer-center__thread-body">${escapeHtml(segment).replace(/\n/g, '<br>')}</div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  };

  const formatFileSize = (sizeBytes) => {
    const normalized = Number(sizeBytes);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return '0 B';
    }

    if (normalized < 1024) {
      return `${normalized} B`;
    }
    if (normalized < 1024 * 1024) {
      return `${(normalized / 1024).toFixed(1)} KB`;
    }
    return `${(normalized / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAttachmentExtensionLabel = (attachment) => {
    const fileName = String(attachment?.original_name || attachment?.stored_name || '').trim();
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'file';
    return String(extension || 'file').toUpperCase().slice(0, 5);
  };

  const renderAttachmentThumb = (attachment, variant = 'inline') => {
    const isImage = attachment?.preview_kind === 'image' && attachment?.preview_url;
    const extensionLabel = getAttachmentExtensionLabel(attachment);

    return `
      <div class="offer-center__attachment-thumb offer-center__attachment-thumb--${variant}${isImage ? ' is-image' : ''}">
        ${isImage
          ? `<img src="${attachment.preview_url}" alt="${escapeHtml(attachment?.original_name || t('common.attachment', 'Adjunto'))}" loading="lazy" />`
          : '<div class="offer-center__attachment-thumb-empty"></div>'}
        <span class="offer-center__attachment-ext">${escapeHtml(extensionLabel)}</span>
      </div>
    `;
  };

  const renderAttachmentCard = (attachment, mode = 'inline') => {
    const originalName = attachment?.original_name || attachment?.stored_name || t('common.file', 'Archivo');
    const sizeLabel = formatFileSize(attachment?.size_bytes);

    if (mode === 'inline') {
      return `
        <article class="offer-center__attachment-card offer-center__attachment-card--inline">
          <button class="offer-center__attachment-card-button" type="button" data-offer-attachment-preview="${attachment?.stored_name || ''}">
            ${renderAttachmentThumb(attachment, 'inline')}
            <span class="offer-center__attachment-card-name">${escapeHtml(originalName)}</span>
          </button>
        </article>
      `;
    }

    return `
      <article class="offer-center__attachment-card offer-center__attachment-card--gallery">
        <button class="offer-center__attachment-card-button" type="button" data-offer-attachment-preview="${attachment?.stored_name || ''}">
          ${renderAttachmentThumb(attachment, 'gallery')}
          <span class="offer-center__attachment-card-name">${escapeHtml(originalName)}</span>
          <span class="offer-center__attachment-card-size">${escapeHtml(sizeLabel)}</span>
        </button>
        <div class="offer-center__attachment-card-actions">
          <button class="btn-inline btn-inline--edit" type="button" data-offer-attachment-preview="${attachment?.stored_name || ''}">${escapeHtml(t('common.preview', 'Vista previa'))}</button>
          <a class="btn-inline" href="${attachment?.download_url || '#'}" target="_blank" rel="noopener">${escapeHtml(t('common.download', 'Descargar'))}</a>
        </div>
      </article>
    `;
  };

  const renderOfferAttachmentStrip = (attachments) => {
    const items = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    if (!items.length) {
      return `<p class="offer-center__attachments-empty">${escapeHtml(t('offer.attachments_empty', 'Sin archivos adjuntos todavía.'))}</p>`;
    }

    const visibleItems = items.slice(0, INLINE_ATTACHMENT_CARD_LIMIT);
    const hiddenCount = Math.max(items.length - visibleItems.length, 0);

    return `
      <div class="offer-center__attachments-strip">
        ${visibleItems.map((attachment) => renderAttachmentCard(attachment, 'inline')).join('')}
        ${hiddenCount > 0 ? `
          <button class="offer-center__attachments-more" type="button" data-open-offer-attachments-gallery="true">
            + ${hiddenCount}
          </button>
        ` : ''}
      </div>
    `;
  };

  const renderOfferAttachmentsGallery = (attachments) => {
    const items = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    if (!items.length) {
      return `<p class="attachments-gallery__empty">${escapeHtml(t('offer.attachments_empty', 'Sin archivos adjuntos todavía.'))}</p>`;
    }

    return `
      <div class="attachments-gallery__grid">
        ${items.map((attachment) => renderAttachmentCard(attachment, 'gallery')).join('')}
      </div>
    `;
  };

  const openOfferAttachmentsGalleryModal = () => {
    if (!offerAttachmentsGalleryModal || !offerAttachmentsGalleryBody) {
      return;
    }

    offerAttachmentsGalleryBody.innerHTML = renderOfferAttachmentsGallery(currentOfferCenterOferta?.adjuntos || []);
    offerAttachmentsGalleryModal.classList.add('is-visible');
    offerAttachmentsGalleryModal.setAttribute('aria-hidden', 'false');
  };

  const closeOfferAttachmentsGalleryModal = () => {
    if (!offerAttachmentsGalleryBody || !offerAttachmentsGalleryModal) {
      return;
    }

    offerAttachmentsGalleryBody.innerHTML = '';
    offerAttachmentsGalleryModal.classList.remove('is-visible');
    offerAttachmentsGalleryModal.setAttribute('aria-hidden', 'true');
  };

  const renderAttachmentPreviewFallback = (attachment) => `
    <div class="attachment-preview__fallback">
      <strong>${escapeHtml(t('offer.preview_unavailable', 'Este formato no se puede previsualizar directamente en el navegador.'))}</strong>
      <p>${escapeHtml(attachment?.original_name || t('common.file', 'Archivo'))}</p>
      <div class="attachment-preview__fallback-actions">
        <a class="btn-inline" href="${attachment?.download_url || '#'}" target="_blank" rel="noopener">${escapeHtml(t('common.download_file', 'Descargar archivo'))}</a>
      </div>
    </div>
  `;

  const closeOfferAttachmentPreviewModal = () => {
    const shouldReturnToGallery = offerAttachmentPreviewReturnToGallery;
    offerAttachmentPreviewReturnToGallery = false;
    currentOfferAttachmentPreview = null;
    if (offerAttachmentPreviewTitle) {
      offerAttachmentPreviewTitle.textContent = t('common.preview', 'Vista previa');
    }
    if (offerAttachmentPreviewMeta) {
      offerAttachmentPreviewMeta.innerHTML = '';
    }
    if (offerAttachmentPreviewActions) {
      offerAttachmentPreviewActions.innerHTML = '';
    }
    if (offerAttachmentPreviewBody) {
      offerAttachmentPreviewBody.innerHTML = '';
    }
    if (offerAttachmentPreviewModal) {
      offerAttachmentPreviewModal.classList.remove('is-visible');
      offerAttachmentPreviewModal.setAttribute('aria-hidden', 'true');
    }

    if (shouldReturnToGallery) {
      openOfferAttachmentsGalleryModal();
    }
  };

  const openOfferAttachmentPreviewModal = async (attachment) => {
    if (!offerAttachmentPreviewModal || !offerAttachmentPreviewBody || !attachment) {
      return;
    }

    currentOfferAttachmentPreview = attachment;
    if (offerAttachmentPreviewTitle) {
      offerAttachmentPreviewTitle.textContent = attachment.original_name || t('common.preview', 'Vista previa');
    }
    if (offerAttachmentPreviewMeta) {
      offerAttachmentPreviewMeta.innerHTML = `
        <span>${escapeHtml(attachment.mime_type || 'application/octet-stream')}</span>
        <span>${escapeHtml(formatFileSize(attachment.size_bytes))}</span>
      `;
    }
    if (offerAttachmentPreviewActions) {
      offerAttachmentPreviewActions.innerHTML = attachment.download_url
        ? `<a class="btn-inline" href="${attachment.download_url}" target="_blank" rel="noopener">${escapeHtml(t('common.download', 'Descargar'))}</a>`
        : '';
    }

    offerAttachmentPreviewModal.classList.add('is-visible');
    offerAttachmentPreviewModal.setAttribute('aria-hidden', 'false');
    offerAttachmentPreviewBody.innerHTML = `<div class="attachment-preview__loading">${escapeHtml(t('offer.preview_loading', 'Cargando vista previa...'))}</div>`;

    try {
      if (attachment.preview_kind === 'image') {
        offerAttachmentPreviewBody.innerHTML = `
          <div class="attachment-preview__image-wrap">
            <img class="attachment-preview__image" src="${attachment.preview_url}" alt="${escapeHtml(attachment.original_name || t('common.attachment', 'Adjunto'))}" />
          </div>
        `;
        return;
      }

      if (attachment.preview_kind === 'inline') {
        offerAttachmentPreviewBody.innerHTML = `
          <iframe class="attachment-preview__frame" src="${attachment.preview_url}" title="${escapeHtml(attachment.original_name || t('common.preview', 'Vista previa'))}" loading="lazy"></iframe>
        `;
        return;
      }

      if (attachment.preview_kind === 'text') {
        const response = await fetch(attachment.preview_url, { method: 'GET' });
        if (response.status === 401) {
          handleUnauthorized();
          closeOfferAttachmentPreviewModal();
          return;
        }
        if (!response.ok) {
          throw new Error(t('offer.preview_error', 'No se pudo cargar la vista previa del archivo.'));
        }

        const textContent = await response.text();
        offerAttachmentPreviewBody.innerHTML = `
          <pre class="attachment-preview__text">${escapeHtml(textContent || '')}</pre>
        `;
        return;
      }

      offerAttachmentPreviewBody.innerHTML = renderAttachmentPreviewFallback(attachment);
    } catch (error) {
      offerAttachmentPreviewBody.innerHTML = `
        <div class="attachment-preview__fallback">
          <strong>${escapeHtml(error.message || t('offer.preview_error_generic', 'No se pudo cargar la vista previa.'))}</strong>
          <div class="attachment-preview__fallback-actions">
            <a class="btn-inline" href="${attachment?.download_url || '#'}" target="_blank" rel="noopener">${escapeHtml(t('common.download_file', 'Descargar archivo'))}</a>
          </div>
        </div>
      `;
    }
  };

  const uploadOfferAttachments = async (fileList) => {
    if (!currentOfferCenterOferta?.id_oferta) {
      setGenericFeedback(offerCenterFeedback, t('offer.current_offer_error', 'No se pudo recuperar la oferta actual.'), 'error');
      if (offerCenterAttachmentInput) {
        offerCenterAttachmentInput.value = '';
      }
      return;
    }

    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) {
      if (offerCenterAttachmentInput) {
        offerCenterAttachmentInput.value = '';
      }
      return;
    }

    const uploadData = new FormData();
    files.forEach((file) => uploadData.append('archivos', file));
  setGenericFeedback(offerCenterFeedback, files.length === 1 ? t('offer.uploading_file', 'Subiendo archivo...') : t('offer.uploading_files', 'Subiendo archivos...'), 'success');

    try {
      const response = await fetch(`/api/ofertas/${currentOfferCenterOferta.id_oferta}/adjuntos`, {
        method: 'POST',
        body: uploadData,
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || t('offer.upload_files_error', 'No se pudieron subir los archivos.'));
      }

      currentOfferCenterOferta = {
        ...currentOfferCenterOferta,
        adjuntos: Array.isArray(result.all_adjuntos) ? result.all_adjuntos : [],
      };
      renderOfferCenterEmail(currentOfferCenterOferta);
      setGenericFeedback(offerCenterFeedback, result.message || t('offer.upload_files_success', 'Archivos subidos correctamente.'), 'success');
    } catch (error) {
      setGenericFeedback(offerCenterFeedback, error.message || t('offer.upload_files_error', 'No se pudieron subir los archivos.'), 'error');
    } finally {
      if (offerCenterAttachmentInput) {
        offerCenterAttachmentInput.value = '';
      }
    }
  };

  const renderOfferCenterEmail = (oferta) => {
    if (!offerCenterEmailGrid) {
      return;
    }

    const offerNumber = oferta.numero_oferta || oferta.id_oferta;
    const sender = oferta.emisor || t('common.not_available', 'No disponible');
    const subject = oferta.ref_cliente_asunto_email || t('common.not_available', 'No disponible');
    const notes = oferta.observaciones || t('crm.no_comments', 'Sin comentarios.');
    const chatUnreadBadge = renderUnreadBadge(oferta?.chat_unread_count, 'chat-unread-badge--inline');

    offerCenterEmailGrid.innerHTML = `
      <section class="offer-center__mail-panel">
        <article class="offer-center__mail-meta-item">
          <span>${escapeHtml(t('offer.fields.sender', 'QUIÉN LO ENVÍA'))}</span>
          <strong>${escapeHtml(sender)}</strong>
        </article>
        <div class="offer-center__mail-row">
          <article class="offer-center__mail-meta-item offer-center__mail-meta-item--subject">
            <span>${escapeHtml(t('offer.fields.client_ref_subject', 'REF. CLIENTE / ASUNTO E-MAIL'))}</span>
            <strong>${escapeHtml(subject)}</strong>
          </article>
          <aside class="offer-center__actions offer-center__actions--inline offer-center__actions--hero" aria-label="${escapeHtml(t('table.actions', 'Acciones'))}">
            <button class="btn-inline btn-inline--edit btn-inline--compact" type="button" data-edit-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.edit_aria', 'Editar oferta {number}', { number: offerNumber }))}">${escapeHtml(t('common.edit', 'Editar'))}</button>
            <button class="btn-inline btn-inline--save btn-inline--compact" type="button" data-change-estado-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.change_status_aria', 'Cambiar estado de la oferta {number}', { number: offerNumber }))}">${escapeHtml(t('table.status', 'Estado'))}</button>
            <button class="btn-inline btn-inline--success" type="button" data-offer-center-action="upload-files">${escapeHtml(t('offer.upload_files', 'Subir archivos'))}</button>
            <button class="btn-inline btn-inline--compact" type="button" data-bom-oferta="${escapeHtml(oferta.id_oferta)}" aria-label="${escapeHtml(tf('offer.bom_aria', 'Abrir BOM de la oferta {number}', { number: offerNumber }))}">BOM</button>
            <button class="btn-inline btn-inline--compact" type="button" data-offer-center-action="history">${escapeHtml(t('common.history', 'Histórico'))}</button>
            <button class="btn-inline btn-inline--save${chatUnreadBadge ? ' btn-inline--with-badge' : ''}" type="button" data-offer-center-action="chat">${escapeHtml(t('offer.chat_label', 'Chat'))}${chatUnreadBadge}</button>
          </aside>
        </div>
        <article class="offer-center__mail-attachments offer-center__mail-attachments--strip">
          <span>${escapeHtml(t('common.files', 'ARCHIVOS'))}</span>
          ${renderOfferAttachmentStrip(oferta.adjuntos || [])}
        </article>
        <article class="offer-center__mail-body">
          <span>${escapeHtml(t('offer.fields.notes', 'OBSERVACIONES'))}</span>
          ${renderOfferConversation(notes)}
        </article>
      </section>
    `;
  };

  const clearOfferCenterReturnContext = () => {
    offerCenterReturnContext = null;
  };

  const setOfferCenterReturnContext = (oferta) => {
    if (!oferta?.id_oferta) {
      offerCenterReturnContext = null;
      return;
    }

    offerCenterReturnContext = { ...oferta };
  };

  const reopenOfferCenterFromReturnContext = () => {
    if (!offerCenterReturnContext) {
      return;
    }

    const oferta = offerCenterReturnContext;
    offerCenterReturnContext = null;
    openOfferCenterModal(oferta);
  };

  const setOfferCenterChatOpen = (isOpen) => {
    if (!offerCenterRoot || !offerCenterChatPanel) {
      return;
    }

    offerCenterRoot.classList.toggle('offer-center--chat-open', Boolean(isOpen));
    offerCenterChatPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  };

  const openOfferCenterHistoryModal = () => {
    if (!offerCenterHistoryModal || !currentOfferCenterOferta) {
      return;
    }

    renderOfferHistory(offerCenterHistory, currentOfferCenterOferta.interacciones || []);
    offerCenterHistoryModal.classList.add('is-visible');
    offerCenterHistoryModal.setAttribute('aria-hidden', 'false');
  };

  const closeOfferCenterHistoryModal = () => {
    if (!offerCenterHistoryModal) {
      return;
    }

    offerCenterHistoryModal.classList.remove('is-visible');
    offerCenterHistoryModal.setAttribute('aria-hidden', 'true');
  };

  const setOfferCenterChatBusy = (isBusy) => {
    if (offerCenterChatInput) {
      offerCenterChatInput.disabled = isBusy;
    }
    if (offerCenterChatSubmit) {
      offerCenterChatSubmit.disabled = isBusy;
      offerCenterChatSubmit.setAttribute('aria-label', isBusy ? t('offer.chat_sending', 'Enviando mensaje') : t('offer.chat_send', 'Enviar mensaje'));
    }
  };

  const renderOfferChatMessages = (messages = []) => {
    if (!offerCenterChatMessages) {
      return;
    }

    currentOfferChatMessages = Array.isArray(messages) ? messages : [];
    if (!currentOfferChatMessages.length) {
      offerCenterChatMessages.innerHTML = `<p class="offer-center__chat-empty">${escapeHtml(t('offer.chat_empty', 'Todavia no hay mensajes en este chat.'))}</p>`;
      return;
    }

    const currentUser = getCurrentUser();
    offerCenterChatMessages.innerHTML = currentOfferChatMessages.map((message) => {
      const isOwnMessage = currentUser && (
        String(message.author_operario || '') === String(currentUser.num_operario || '')
        || String(message.author_email || '').toLowerCase() === String(currentUser.email || '').toLowerCase()
      );
      const authorLabel = message.author_name || t('literal.users.title', 'Usuario');

      return `
        <article class="offer-center__chat-message${isOwnMessage ? ' offer-center__chat-message--own' : ''}">
          <strong class="offer-center__chat-message-author">${escapeHtml(authorLabel)}</strong>
          <p class="offer-center__chat-message-body">${escapeHtml(message.message || '').replace(/\n/g, '<br>')}</p>
          <span class="offer-center__chat-message-time">${escapeHtml(formatDisplayDateTime(message.created_at) || '')}</span>
        </article>
      `;
    }).join('');

    offerCenterChatMessages.scrollTop = offerCenterChatMessages.scrollHeight;
  };

  const closeOfferChatPanel = () => {
    setOfferCenterChatOpen(false);
    currentOfferChatMessages = [];
    if (offerCenterChatMessages) {
      offerCenterChatMessages.innerHTML = `<p class="offer-center__chat-empty">${escapeHtml(t('offer.chat_empty', 'Todavia no hay mensajes en este chat.'))}</p>`;
    }
    if (offerCenterChatInput) {
      offerCenterChatInput.value = '';
      offerCenterChatInput.disabled = false;
    }
    if (offerCenterChatSubmit) {
      offerCenterChatSubmit.disabled = false;
      offerCenterChatSubmit.setAttribute('aria-label', t('offer.chat_send', 'Enviar mensaje'));
    }
  };

  const loadOfferChatMessages = async ({ focusComposer = false } = {}) => {
    const ofertaId = Number(currentOfferCenterOferta?.id_oferta);
    if (!ofertaId) {
      return false;
    }

    offerCenterChatMessages.innerHTML = `<p class="offer-center__chat-empty">${escapeHtml(t('offer.chat_loading', 'Cargando mensajes...'))}</p>`;

    try {
      const response = await fetch(`/api/ofertas/${encodeURIComponent(ofertaId)}/chat`);
      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return false;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || t('offer.chat_error_load', 'No se pudo cargar el chat.'));
      }

      renderOfferChatMessages(result.messages || []);

      if (focusComposer) {
        offerCenterChatInput?.focus();
      }
      return true;
    } catch (error) {
      if (offerCenterChatMessages) {
        offerCenterChatMessages.innerHTML = `<p class="offer-center__chat-empty">${escapeHtml(error.message || t('offer.chat_error_retrieve', 'No se pudieron recuperar los mensajes.'))}</p>`;
      }
      return false;
    }
  };

  const markOfferChatAsRead = async () => {
    const ofertaId = Number(currentOfferCenterOferta?.id_oferta);
    if (!ofertaId) {
      return false;
    }

    try {
      const response = await fetch(`/api/ofertas/${encodeURIComponent(ofertaId)}/chat/read`, {
        method: 'POST',
      });
      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return false;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'No se pudo actualizar el estado del chat.');
      }

      syncOfferChatUnreadState({ ofertaId, unreadCount: result.chat_unread_count || 0 });
      return true;
    } catch {
      return false;
    }
  };

  const openOfferChatPanel = async () => {
    if (!currentOfferCenterOferta) {
      setGenericFeedback(offerCenterFeedback, t('offer.current_offer_error', 'No se pudo recuperar la oferta actual.'), 'error');
      return;
    }

    setOfferCenterChatOpen(true);
    if (offerCenterChatTitle) {
      const offerReference = currentOfferCenterOferta.numero_oferta || `${t('offer.offer_label', 'Oferta')} #${currentOfferCenterOferta.id_oferta || '-'}`;
      offerCenterChatTitle.textContent = tf('offer.chat_title_with_offer', 'Chat · {offer}', { offer: offerReference });
    }

    const loaded = await loadOfferChatMessages({ focusComposer: true });
    if (loaded) {
      await markOfferChatAsRead();
    }
  };

  const openOfferCenterModal = (oferta) => {
    if (!offerCenterModal) {
      return;
    }

    currentOfferCenterOferta = oferta || null;
    closeOfferChatPanel();
    clearGenericFeedback(offerCenterFeedback);

    if (offerCenterHeroTitle) {
      offerCenterHeroTitle.textContent = oferta?.numero_oferta || `${t('offer.budget', 'Presupuesto')} #${oferta?.id_oferta || '-'}`;
    }

    if (offerCenterHeroMeta) {
      const metaItems = [
        {
          label: t('offer.fields.email_date', 'FECHA e-mail'),
          value: formatDisplayDate(oferta?.fecha_email) || t('common.not_available', 'No disponible'),
        },
        {
          label: t('offer.fields.offer_created_date', 'FECHA ALTA OFERTA'),
          value: formatDisplayDate(oferta?.fecha_alta_oferta) || t('common.not_available', 'No disponible'),
        },
      ];

      offerCenterHeroMeta.innerHTML = metaItems.map((item) => `
        <div class="offer-center__meta-item">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      `).join('');
    }

    if (offerCenterHeroBadges) {
      const badgeItems = [
        { label: t('table.status', 'Estado'), value: translateEstadoLabel(oferta?.estado || t('crm.no_status', 'Sin estado')) },
        { label: t('offer.fields.client', 'CLIENTE'), value: oferta?.cliente || (oferta?.id_cliente ? `#${oferta.id_cliente}` : t('common.not_available', 'No disponible')) },
      ];
      offerCenterHeroBadges.innerHTML = badgeItems.map((item) => `
        <div class="offer-center__badge">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      `).join('');
    }
    renderOfferCenterEmail(oferta || {});

    offerCenterModal.classList.add('is-visible');
    offerCenterModal.setAttribute('aria-hidden', 'false');
  };

  const closeOfferCenterModal = ({ preserveReturnContext = false } = {}) => {
    if (!offerCenterModal) {
      return;
    }

    closeOfferAttachmentPreviewModal();
    closeOfferAttachmentsGalleryModal();
    closeOfferCenterHistoryModal();
    closeOfferChatPanel();
    offerCenterModal.classList.remove('is-visible');
    offerCenterModal.setAttribute('aria-hidden', 'true');
    currentOfferCenterOferta = null;
    if (!preserveReturnContext) {
      clearOfferCenterReturnContext();
    }
    clearGenericFeedback(offerCenterFeedback);
    if (offerCenterAttachmentInput) {
      offerCenterAttachmentInput.value = '';
    }
  };

  const syncOfertaEstadoFechaLimite = () => {
    if (!ofertaEstadoFechaLimite || !ofertaEstadoSinFechaLimite) {
      return;
    }

    ofertaEstadoFechaLimite.disabled = ofertaEstadoSinFechaLimite.checked;
    if (ofertaEstadoSinFechaLimite.checked) {
      ofertaEstadoFechaLimite.value = '';
    }
  };

  const openOfertaEditModal = (oferta) => {
    if (!ofertaEditModal) {
      return;
    }

    populateOfertaEditClienteOptions();
    clearGenericFeedback(ofertaEditFeedback);

    ofertaEditId.value = oferta.id_oferta ?? '';
    ofertaEditNumero.value = oferta.numero_oferta ?? '';
    ofertaEditEstado.value = oferta.id_estado ? String(oferta.id_estado) : '';
    ofertaEditFechaEmail.value = oferta.fecha_email ?? '';
    ofertaEditFechaAlta.value = oferta.fecha_alta_oferta ?? '';
    ofertaEditRef.value = oferta.ref_cliente_asunto_email ?? '';
    ofertaEditCliente.value = oferta.id_cliente ? String(oferta.id_cliente) : '';
    if (ofertaEditEmisor) {
      ofertaEditEmisor.value = oferta.emisor ?? '';
    }
    ofertaEditObservaciones.value = oferta.observaciones ?? '';

    ofertaEditModal.classList.add('is-visible');
    ofertaEditModal.setAttribute('aria-hidden', 'false');
  };

  const openOfertaEstadoModal = (oferta) => {
    if (!ofertaEstadoModal) {
      return;
    }

    clearGenericFeedback(ofertaEstadoFeedback);
    ofertaEstadoId.value = oferta.id_oferta ?? '';
    ofertaEstadoNumero.value = oferta.numero_oferta ?? '';
    ofertaEstadoActual.value = translateEstadoLabel(oferta.estado ?? '');
    ofertaEstadoFecha.value = formatInteractionDateTime(new Date().toISOString());
    if (ofertaEstadoSinFechaLimite) {
      ofertaEstadoSinFechaLimite.checked = true;
    }
    if (ofertaEstadoFechaLimite) {
      ofertaEstadoFechaLimite.value = '';
    }
    syncOfertaEstadoFechaLimite();
    ofertaEstadoComentario.value = '';
    populateOfertaEstadoOptions(oferta.id_estado);
    renderOfertaEstadoHistorial(oferta.interacciones || []);

    ofertaEstadoModal.classList.add('is-visible');
    ofertaEstadoModal.setAttribute('aria-hidden', 'false');
  };

  const closeOfertaEditModal = ({ reopenOfferCenter = false } = {}) => {
    if (!ofertaEditModal) {
      return;
    }

    ofertaEditModal.classList.remove('is-visible');
    ofertaEditModal.setAttribute('aria-hidden', 'true');
    clearGenericFeedback(ofertaEditFeedback);
    if (ofertaEditForm) {
      ofertaEditForm.reset();
    }
    if (reopenOfferCenter) {
      reopenOfferCenterFromReturnContext();
    }
  };

  const closeOfertaEstadoModal = ({ reopenOfferCenter = false } = {}) => {
    if (!ofertaEstadoModal) {
      return;
    }

    ofertaEstadoModal.classList.remove('is-visible');
    ofertaEstadoModal.setAttribute('aria-hidden', 'true');
    clearGenericFeedback(ofertaEstadoFeedback);
    if (ofertaEstadoForm) {
      ofertaEstadoForm.reset();
    }
    if (ofertaEstadoSinFechaLimite) {
      ofertaEstadoSinFechaLimite.checked = true;
    }
    syncOfertaEstadoFechaLimite();
    renderOfertaEstadoHistorial([]);
    if (reopenOfferCenter) {
      reopenOfferCenterFromReturnContext();
    }
  };

  const openEstadoEditModal = (estado) => {
    if (!estadoEditModal) {
      return;
    }

    clearGenericFeedback(estadoEditFeedback);
    if (estadoEditId) {
      estadoEditId.value = estado.id_estado ?? '';
    }
    if (estadoEditOrden) {
      estadoEditOrden.value = estado.orden ?? '';
    }
    if (estadoEditDescripcion) {
      estadoEditDescripcion.value = estado.descripcion_estado ?? '';
    }
    if (estadoEditDepartamento) {
      estadoEditDepartamento.innerHTML = buildDepartamentoOptions(estado.id_departamento);
      estadoEditDepartamento.value = estado.id_departamento != null ? String(estado.id_departamento) : '';
    }
    if (estadoEditEmojiSidebar) {
      estadoEditEmojiManuallyChanged = false;
      populateStateEmojiSelect(estadoEditEmojiSidebar, estadoEditEmojiSidebarPicker, estado.emoji_sidebar || getSuggestedStateEmoji(estado.descripcion_estado || ''));
    }
    if (estadoEditActivo) {
      estadoEditActivo.checked = estado.activo !== false;
    }

    estadoEditModal.classList.add('is-visible');
    estadoEditModal.setAttribute('aria-hidden', 'false');
  };

  const closeEstadoEditModal = () => {
    if (!estadoEditModal) {
      return;
    }

    estadoEditModal.classList.remove('is-visible');
    estadoEditModal.setAttribute('aria-hidden', 'true');
    clearGenericFeedback(estadoEditFeedback);
    if (estadoEditForm) {
      estadoEditForm.reset();
    }
    estadoEditEmojiManuallyChanged = false;
    populateStateEmojiSelect(estadoEditEmojiSidebar, estadoEditEmojiSidebarPicker, getSuggestedStateEmoji(''));
    if (estadoEditActivo) {
      estadoEditActivo.checked = true;
    }
  };

  const renderSidebarNav = () => {
    if (!sidebarNavContainers.length) {
      return;
    }

    const activeStates = getActiveEstados();
    const totalOffers = estadosCache.reduce((sum, estado) => sum + Number(estado.total_ofertas || 0), 0);

    const items = [
      { view: 'nueva-oferta', icon: '＋', text: t('sidebar.new_offer', 'Insertar Presupuesto') },
      { view: 'todos', icon: '☰', text: t('listing.all', 'Todos'), count: totalOffers },
      ...activeStates.map((estado) => ({
        view: `estado-${estado.id_estado}`,
        icon: getSidebarStateIcon(estado),
        text: translateEstadoLabel(estado.descripcion_estado),
        count: Number(estado.total_ofertas || 0),
      })),
    ];

    const navHtml = items.map((item) => `
      <button class="menu-btn nav-item" type="button" data-view="${item.view}" aria-current="false" aria-pressed="false" aria-label="${escapeHtml(item.count !== undefined ? `${item.text} (${item.count})` : item.text)}" title="${escapeHtml(item.count !== undefined ? `${item.text} (${item.count})` : item.text)}">
        <span class="nav-item-icon emoji">${item.icon}</span>
        <span class="nav-item-text label">${escapeHtml(item.text)}</span>
        ${item.count !== undefined ? `<span class="nav-item-badge" aria-hidden="true">${item.count}</span>` : ''}
      </button>
    `).join('');

    sidebarNavContainers.forEach((container) => {
      container.innerHTML = navHtml;
    });
  };

  const renderOfertasListado = (ofertas) => {
    if (!ofertasListadoTableBody) {
      return;
    }

    const activeColumns = (typeof tableDefinitions.ofertas.getColumns === 'function' ? tableDefinitions.ofertas.getColumns() : tableDefinitions.ofertas.columns);
    const processedOfertas = getProcessedRows('ofertas', ofertas);

    if (!processedOfertas.length) {
      ofertasListadoTableBody.innerHTML = `
        <tr>
          <td colspan="${activeColumns.length}" class="clientes-table__empty">${escapeHtml(t('listing.empty_for_view', 'No hay ofertas para esta vista.'))}</td>
        </tr>
      `;
      return;
    }

    ofertasListadoTableBody.innerHTML = processedOfertas.map((oferta) => `
      <tr class="table-row table-row--oferta">
        ${activeColumns.map((column) => {
          const normalizedColumnKey = String(column.key || '').trim().toLowerCase();

          if (column.key === 'vista') {
            return `
              <td class="table-cell table-cell--view ${getColumnCellClass('ofertas', 'vista')}" data-label="">
                <div class="clientes-table__actions clientes-table__actions--view">
                  ${renderOfertaViewButton(oferta)}
                </div>
              </td>
            `;
          }

          if (column.key === 'acciones') {
            return `
              <td class="table-cell table-cell--actions ${getColumnCellClass('ofertas', 'acciones')}" data-label="${escapeHtml(t('table.actions', 'Acciones'))}">
                <div class="clientes-table__actions actions-inline">
                  ${renderOfertasActionButtons(oferta)}
                </div>
              </td>
            `;
          }

          const rawValue = oferta[column.key] ?? oferta[normalizedColumnKey];
          const displayValue = ['fecha_email', 'fecha_alta_oferta', 'fecha_limite'].includes(normalizedColumnKey)
            ? formatDisplayDate(rawValue)
            : rawValue;

          if (normalizedColumnKey === 'estado') {
            return `
              <td class="table-cell ${getColumnCellClass('ofertas', normalizedColumnKey)}" data-label="${escapeHtml(column.label)}">
                <div class="table-cell__stack table-cell__stack--compact">
                  ${renderStatusBadge(displayValue)}
                </div>
              </td>
            `;
          }

          if (normalizedColumnKey === 'observaciones_oferta') {
            return renderStaticTableCell({
              tableKey: 'ofertas',
              rowId: oferta.id_oferta,
              columnKey: normalizedColumnKey,
              label: column.label,
              value: displayValue,
              contentClass: 'text-truncate text-truncate--single table-cell__content--muted',
              title: String(displayValue || ''),
            });
          }

          if (normalizedColumnKey === 'numero_oferta' || normalizedColumnKey === 'cliente') {
            return renderStaticTableCell({
              tableKey: 'ofertas',
              rowId: oferta.id_oferta,
              columnKey: normalizedColumnKey,
              label: column.label,
              value: displayValue,
              contentClass: 'table-cell__content--strong',
            });
          }

          if (normalizedColumnKey === 'fecha_email' || normalizedColumnKey === 'fecha_alta_oferta' || normalizedColumnKey === 'fecha_limite') {
            return renderStaticTableCell({
              tableKey: 'ofertas',
              rowId: oferta.id_oferta,
              columnKey: normalizedColumnKey,
              label: column.label,
              value: displayValue,
              contentClass: 'table-cell__content--muted',
            });
          }

          return renderTableCell({ tableKey: 'ofertas', rowId: oferta.id_oferta, columnKey: normalizedColumnKey, label: column.label, value: displayValue });
        }).join('')}
      </tr>
    `).join('');
  };

  const loadOfertasListado = async ({ estadoId = null, label = 'Todos' } = {}) => {
    if (ofertasListadoTitle) {
      ofertasListadoTitle.textContent = label;
    }

    if (ofertasListadoDescription) {
      ofertasListadoDescription.textContent = estadoId
        ? tf('listing.by_state_description', 'Listado de ofertas asociadas al estado {label}.', { label })
        : t('listing.all_description', 'Listado de todas las ofertas registradas.');
    }

    if (ofertasListadoTableBody) {
      ofertasListadoTableBody.innerHTML = `
        <tr>
          <td colspan="${(typeof tableDefinitions.ofertas.getColumns === 'function' ? tableDefinitions.ofertas.getColumns() : tableDefinitions.ofertas.columns).length}" class="clientes-table__empty">${escapeHtml(t('listing.loading', 'Cargando ofertas...'))}</td>
        </tr>
      `;
    }

    clearGenericFeedback(ofertasListadoFeedback);

    try {
      const query = estadoId ? `?estado_id=${encodeURIComponent(estadoId)}` : '';
      const response = await fetch(`/api/ofertas${query}`);
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || t('listing.fetch_error', 'No se pudieron consultar las ofertas'));
      }

      ofertasListadoCache = Array.isArray(result.ofertas) ? result.ofertas : [];
      renderOfertasListado(ofertasListadoCache);
    } catch (error) {
      ofertasListadoCache = [];
      if (ofertasListadoTableBody) {
        ofertasListadoTableBody.innerHTML = `
          <tr>
            <td colspan="${(typeof tableDefinitions.ofertas.getColumns === 'function' ? tableDefinitions.ofertas.getColumns() : tableDefinitions.ofertas.columns).length}" class="clientes-table__empty">${escapeHtml(t('listing.load_error', 'No se pudo cargar el listado.'))}</td>
          </tr>
        `;
      }
      setGenericFeedback(ofertasListadoFeedback, error.message || t('listing.load_feedback_error', 'No se pudo cargar el listado de ofertas.'), 'error');
    }
  };

  const fetchConfiguracionColumnas = async (estadoId) => {
    const response = await fetch(`/api/estados/${estadoId}/columnas`);
    if (response.status === 401) {
      handleUnauthorized();
      return [];
    }

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'No se pudo consultar la configuración de columnas');
    }

    return Array.isArray(result.configuraciones) ? result.configuraciones : [];
  };

  const renderEstadoOptions = (estados) => {
    if (!estadoColumnasSelect) {
      return;
    }

    const visibleEstados = getVisibleEstados(estados);

    const currentValue = selectedEstadoId || estadoColumnasSelect.value;
    estadoColumnasSelect.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = visibleEstados.length ? t('config.select_state', 'Selecciona un estado') : t('config.states_none', 'No hay estados creados');
    estadoColumnasSelect.appendChild(placeholderOption);

    const globalOption = document.createElement('option');
    globalOption.value = GLOBAL_CONFIG_SCOPE_ID;
    globalOption.textContent = t('listing.all', 'Todos');
    estadoColumnasSelect.appendChild(globalOption);

    visibleEstados.forEach((estado) => {
      const option = document.createElement('option');
      option.value = String(estado.id_estado);
      option.textContent = `${estado.activo === false ? t('literal.states.inactive_prefix', '[Inactivo] ') : ''}${translateEstadoLabel(estado.descripcion_estado)}`;
      estadoColumnasSelect.appendChild(option);
    });

    if (String(currentValue) === GLOBAL_CONFIG_SCOPE_ID || visibleEstados.some((estado) => String(estado.id_estado) === String(currentValue))) {
      estadoColumnasSelect.value = String(currentValue);
      selectedEstadoId = String(currentValue);
    } else {
      selectedEstadoId = '';
    }
  };

  const setEstadosMode = (mode) => {
    enforceManagerOnlyUi(estadosModeButtons, estadosModePanels, mode, 'crear');
    if (configColumnCreateForm) {
      configColumnCreateForm.hidden = !isManagerUser();
    }
    if (!isManagerUser()) {
      clearGenericFeedback(estadoCreateFeedback);
      if (estadoEditModal?.classList.contains('is-visible')) {
        closeEstadoEditModal();
      }
    }
  };

  const renderEstadosTable = () => {
    if (!estadosTableBody) {
      return;
    }

    const processedEstados = getProcessedRows('estados', getVisibleEstados(estadosCache));
    const canManageStates = isManagerUser();
    const dragEnabled = canManageStates && isEstadosDragEnabled();

    if (!processedEstados.length) {
      estadosTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="clientes-table__empty">${escapeHtml(t('config.states_empty', 'No hay estados creados todavía.'))}</td>
        </tr>
      `;
      return;
    }

    estadosTableBody.innerHTML = processedEstados
      .map((estado) => {
        const stateEmoji = getSidebarStateIcon(estado);
        const isActive = estado.activo !== false;
        const activeIndicatorClass = isActive ? 'estado-activity-indicator--active' : 'estado-activity-indicator--inactive';
        const activeLabel = estado.activo !== false ? t('literal.states.active', 'Activo') : t('literal.states.inactive', 'Inactivo');
        const translatedStateLabel = translateEstadoLabel(estado.descripcion_estado);
        const translatedDepartmentLabel = translateDepartmentLabel(estado.nombre_departamento || t('table.no_department', 'Sin departamento'));
        return `
          <tr data-estado-row="${estado.id_estado}" draggable="${dragEnabled ? 'true' : 'false'}" class="estado-drag-row ${dragEnabled ? '' : 'estado-drag-row--disabled'} ${estado.activo !== false ? '' : 'estado-drag-row--inactive'}">
            <td class="drag-handle ${dragEnabled ? '' : 'drag-handle--disabled'} column-drag" data-label="" title="${escapeHtml(dragEnabled ? t('table.drag_to_reorder', 'Arrastrar para reordenar') : t('table.drag_disabled', 'El drag se desactiva si hay filtros o un orden distinto a Orden asc'))}">⠿</td>
            <td class="${getColumnCellClass('estados', 'orden')} estados-table__cell estados-table__cell--order" data-label="${escapeHtml(t('table.order', 'Orden'))}">
              <div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${escapeHtml(estado.orden ?? '')}</div></div>
            </td>
            <td class="${getColumnCellClass('estados', 'descripcion_estado')} estados-table__cell estados-table__cell--description" data-label="${escapeHtml(t('table.state_description', 'Descripción estado'))}">
              <div class="table-cell__stack table-cell__stack--compact estados-table__stack">
                <div class="table-cell__content table-cell__content--strong estados-table__title" title="${escapeHtml(translatedStateLabel)}"><span class="estados-table__emoji" aria-hidden="true">${escapeHtml(stateEmoji)}</span>${escapeHtml(translatedStateLabel)}</div>
                <span class="estado-activity-indicator ${activeIndicatorClass}" title="${escapeHtml(isActive ? t('literal.states.active_title', 'Estado activo en sidebar y procesos') : t('literal.states.inactive_title', 'Estado inactivo: solo visible en administración'))}">
                  <span class="estado-activity-indicator__dot" aria-hidden="true"></span>
                  <span class="estado-activity-indicator__label">${escapeHtml(activeLabel)}</span>
                </span>
              </div>
            </td>
            <td class="${getColumnCellClass('estados', 'nombre_departamento')} estados-table__cell estados-table__cell--department" data-label="${escapeHtml(t('table.department', 'Departamento'))}">
              <div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${escapeHtml(translatedDepartmentLabel)}</div></div>
            </td>
            <td class="table-cell table-cell--actions ${getColumnCellClass('estados', 'acciones')} estados-table__cell estados-table__cell--actions" data-label="${escapeHtml(t('table.actions', 'Acciones'))}">
              <div class="clientes-table__actions actions-inline">
                ${canManageStates ? `<button class="btn-inline btn-inline--edit" type="button" data-edit-estado="${estado.id_estado}">${escapeHtml(t('common.edit', 'Editar'))}</button>` : '<span class="table-cell__content table-cell__content--muted">-</span>'}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    if (dragEnabled) {
      initEstadosDragDrop();
    }
  };

  const initEstadosDragDrop = () => {
    if (!estadosTableBody) return;
    let dragSrcRow = null;

    estadosTableBody.querySelectorAll('tr.estado-drag-row').forEach((row) => {
      row.addEventListener('dragstart', (e) => {
        dragSrcRow = row;
        row.classList.add('drag-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('drag-dragging');
        estadosTableBody.querySelectorAll('tr').forEach((r) => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        estadosTableBody.querySelectorAll('tr').forEach((r) => r.classList.remove('drag-over'));
        if (row !== dragSrcRow) row.classList.add('drag-over');
      });

      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (!dragSrcRow || dragSrcRow === row) return;

        row.classList.remove('drag-over');

        // Reordenar en el DOM
        const rows = [...estadosTableBody.querySelectorAll('tr.estado-drag-row')];
        const srcIdx = rows.indexOf(dragSrcRow);
        const tgtIdx = rows.indexOf(row);
        if (srcIdx < tgtIdx) {
          row.after(dragSrcRow);
        } else {
          row.before(dragSrcRow);
        }

        // Recalcular órdenes según posición DOM y actualizar cache
        const orderedRows = [...estadosTableBody.querySelectorAll('tr.estado-drag-row')];
        const payload = orderedRows.map((r, i) => ({
          id_estado: Number(r.dataset.estadoRow),
          orden: i + 1,
        }));

        // Actualizar números visibles en la columna Orden
        orderedRows.forEach((r, i) => {
          const ordenCell = r.querySelectorAll('td')[1];
          if (ordenCell) {
            ordenCell.innerHTML = `<div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${i + 1}</div></div>`;
          }
        });

        // Actualizar cache local
        payload.forEach(({ id_estado, orden }) => {
          const entry = estadosCache.find((e) => e.id_estado === id_estado);
          if (entry) entry.orden = orden;
        });
        estadosCache.sort((a, b) => {
          const orderA = a.orden ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.orden ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB || a.descripcion_estado.localeCompare(b.descripcion_estado);
        });
        renderSidebarNav();

        // Persistir en BD
        try {
          const res = await fetch('/api/estados/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orden: payload }),
          });
          if (res.status === 401) { handleUnauthorized(); return; }
          const result = await res.json();
          if (!res.ok || result.success === false) {
            setGenericFeedback(estadosTableFeedback, result.message || 'No se pudo guardar el orden.', 'error');
          }
        } catch {
          setGenericFeedback(estadosTableFeedback, 'Error de red al guardar el orden.', 'error');
        }
      });
    });
  };

  const renderConfigColumnasTable = () => {
    if (!configColumnasTableBody) {
      return;
    }

    const processedConfigs = getProcessedRows('configColumnas', configuracionColumnasCache);
    const canManageConfigColumns = isManagerUser();
    const dragEnabled = canManageConfigColumns && isConfigColumnasDragEnabled();

    if (!selectedEstadoId) {
      configColumnasTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="clientes-table__empty">${escapeHtml(t('config.columns_empty', 'Selecciona un estado para ver sus columnas configuradas.'))}</td>
        </tr>
      `;
      return;
    }

    if (!processedConfigs.length) {
      configColumnasTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="clientes-table__empty">${escapeHtml(t('config.columns_none', 'No hay columnas configuradas para este estado.'))}</td>
        </tr>
      `;
      return;
    }

    configColumnasTableBody.innerHTML = processedConfigs
      .map((config) => {
        const isEditing = canManageConfigColumns && editingConfigId === config.id_config;
        return `
          <tr data-config-row="${config.id_config}" draggable="${dragEnabled ? 'true' : 'false'}" class="estado-drag-row ${dragEnabled ? '' : 'estado-drag-row--disabled'}">
            <td class="drag-handle ${dragEnabled ? '' : 'drag-handle--disabled'} column-drag" data-label="" title="${escapeHtml(dragEnabled ? t('table.drag_to_reorder', 'Arrastrar para reordenar') : t('table.drag_disabled', 'El drag se desactiva si hay filtros o un orden distinto a Orden asc'))}">⠿</td>
            <td class="${getColumnCellClass('configColumnas', 'columna')}" data-label="${escapeHtml(t('table.column', 'Columna'))}">
              ${isEditing
                ? `<select class="config-column-table__edit-input" data-edit-config-columna="${config.id_config}">${availableOfferColumns.map((column) => `<option value="${escapeHtml(column.value)}" ${column.value === config.columna ? 'selected' : ''}>${escapeHtml(getOfferColumnLabel(column.value, column.label))}</option>`).join('')}</select>`
                : `<div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${escapeHtml(config.columna)}</div></div>`}
            </td>
            ${isEditing
              ? `
            <td class="${getColumnCellClass('configColumnas', 'descripcion_columna')}" data-label="${escapeHtml(t('table.description', 'Descripción'))}">
              ${isEditing
                ? `<input class="config-column-table__edit-input" type="text" value="${escapeHtml(config.descripcion_columna || '')}" data-edit-config-descripcion="${config.id_config}" maxlength="255" />`
                : escapeHtml(config.descripcion_columna || '')}
            </td>
              `
              : renderStaticTableCell({ tableKey: 'configColumnas', rowId: config.id_config, columnKey: 'descripcion_columna', value: getConfiguredOfferColumnLabel(config), contentClass: 'text-truncate text-truncate--single table-cell__content--muted', title: getConfiguredOfferColumnLabel(config) })}
            <td class="${getColumnCellClass('configColumnas', 'orden_columna')}" data-label="${escapeHtml(t('table.order', 'Orden'))}">
              ${isEditing
                ? `<input class="config-column-table__edit-number" type="number" min="1" step="1" value="${config.orden_columna ?? ''}" data-edit-config-orden="${config.id_config}" />`
                : `<div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${escapeHtml(config.orden_columna ?? '')}</div></div>`}
            </td>
            <td class="table-cell table-cell--actions ${getColumnCellClass('configColumnas', 'acciones')}" data-label="${escapeHtml(t('table.actions', 'Acciones'))}">
              <div class="clientes-table__actions actions-inline">
                ${isEditing
                  ? `
                    <span class="form-help">${escapeHtml(t('config.save_on_exit', 'Se guarda al salir'))}</span>
                    <button class="btn-inline btn-inline--delete" type="button" data-delete-config="${config.id_config}">${escapeHtml(t('common.delete', 'Eliminar'))}</button>
                    <button class="btn-inline btn-inline--cancel" type="button" data-cancel-config="${config.id_config}">${escapeHtml(t('common.cancel', 'Cancelar'))}</button>
                  `
                  : canManageConfigColumns
                    ? `<button class="btn-inline btn-inline--edit" type="button" data-edit-config="${config.id_config}">${escapeHtml(t('common.edit', 'Editar'))}</button>`
                    : '<span class="table-cell__content table-cell__content--muted">-</span>'}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    if (dragEnabled) {
      initConfigColumnasDragDrop();
    }
  };

  const initConfigColumnasDragDrop = () => {
    if (!configColumnasTableBody) return;
    let dragSrcRow = null;

    configColumnasTableBody.querySelectorAll('tr[data-config-row]').forEach((row) => {
      row.addEventListener('dragstart', (event) => {
        dragSrcRow = row;
        row.classList.add('drag-dragging');
        event.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('drag-dragging');
        configColumnasTableBody.querySelectorAll('tr').forEach((r) => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        configColumnasTableBody.querySelectorAll('tr').forEach((r) => r.classList.remove('drag-over'));
        if (row !== dragSrcRow) row.classList.add('drag-over');
      });

      row.addEventListener('drop', async (event) => {
        event.preventDefault();
        if (!dragSrcRow || dragSrcRow === row) return;

        row.classList.remove('drag-over');

        const rows = [...configColumnasTableBody.querySelectorAll('tr[data-config-row]')];
        const srcIdx = rows.indexOf(dragSrcRow);
        const tgtIdx = rows.indexOf(row);
        if (srcIdx < tgtIdx) {
          row.after(dragSrcRow);
        } else {
          row.before(dragSrcRow);
        }

        const orderedRows = [...configColumnasTableBody.querySelectorAll('tr[data-config-row]')];
        const payload = orderedRows.map((r, i) => ({
          id_config: Number(r.dataset.configRow),
          orden_columna: i + 1,
        }));

        orderedRows.forEach((r, i) => {
          const ordenCell = r.querySelectorAll('td')[3];
          if (ordenCell) {
            ordenCell.innerHTML = `<div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${i + 1}</div></div>`;
          }
        });

        payload.forEach(({ id_config, orden_columna }) => {
          const entry = configuracionColumnasCache.find((item) => item.id_config === id_config);
          if (entry) entry.orden_columna = orden_columna;
        });
        configuracionColumnasCache.sort((a, b) => {
          const orderA = a.orden_columna ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.orden_columna ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB || a.columna.localeCompare(b.columna);
        });

        try {
          const res = await fetch('/api/configuracion-columnas/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orden: payload }),
          });
          if (res.status === 401) { handleUnauthorized(); return; }
          const result = await res.json();
          if (!res.ok || result.success === false) {
            setGenericFeedback(configColumnasTableFeedback, result.message || 'No se pudo guardar el orden.', 'error');
            return;
          }

          if (isConfigScopeActiveForCurrentListado(selectedEstadoId)) {
            await loadListadoColumnasEstado(selectedEstadoId);
            await loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label });
          }
        } catch {
          setGenericFeedback(configColumnasTableFeedback, 'Error de red al guardar el orden.', 'error');
        }
      });
    });
  };

  const saveConfigColumnRow = async (configId) => {
    const columnaInput = configColumnasTableBody?.querySelector(`[data-edit-config-columna="${configId}"]`);
    const descripcionInput = configColumnasTableBody?.querySelector(`[data-edit-config-descripcion="${configId}"]`);
    const ordenInput = configColumnasTableBody?.querySelector(`[data-edit-config-orden="${configId}"]`);

    if (!selectedEstadoId || !columnaInput || !descripcionInput || !ordenInput) {
      return false;
    }

    const response = await fetch(`/api/configuracion-columnas/${configId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_estado: selectedEstadoId,
        columna: columnaInput.value,
        descripcion_columna: descripcionInput.value.trim(),
        orden_columna: ordenInput.value.trim(),
      }),
    });

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'No se pudo actualizar la columna de configuración');
    }

    editingConfigId = null;
    setGenericFeedback(configColumnasTableFeedback, result.message || 'Columna de configuración actualizada correctamente.', 'success');
    await loadConfiguracionColumnas({ estadoId: selectedEstadoId, silent: true });
    if (isConfigScopeActiveForCurrentListado(selectedEstadoId)) {
      await loadListadoColumnasEstado(selectedEstadoId);
      await loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label });
    }

    return true;
  };

  const loadEstados = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('/api/estados');
      if (response.status === 401) { handleUnauthorized(); return []; }
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron consultar los estados');
      }

      estadosCache = getVisibleEstados(Array.isArray(result.estados) ? result.estados : []);
      renderSidebarNav();
      renderEstadoOptions(estadosCache);
      renderEstadosTable();
      return estadosCache;
    } catch (error) {
      estadosCache = [];
      renderSidebarNav();
      renderEstadoOptions(estadosCache);
      renderEstadosTable();
      if (!silent) {
        setGenericFeedback(estadosTableFeedback, error.message || 'No se pudieron cargar los estados.', 'error');
      }
      return [];
    }
  };

  const refreshOfferCounters = async () => loadEstados({ silent: true });

  const loadConfiguracionColumnas = async ({ estadoId = selectedEstadoId, silent = false } = {}) => {
    if (!estadoId) {
      configuracionColumnasCache = [];
      renderConfigColumnasTable();
      return [];
    }

    try {
      configuracionColumnasCache = await fetchConfiguracionColumnas(estadoId);
      renderConfigColumnasTable();
      return configuracionColumnasCache;
    } catch (error) {
      configuracionColumnasCache = [];
      renderConfigColumnasTable();
      if (!silent) {
        setGenericFeedback(configColumnasTableFeedback, error.message || 'No se pudo cargar la configuración de columnas.', 'error');
      }
      return [];
    }
  };

  const loadListadoColumnasEstado = async (estadoId) => {
    const configScopeId = getListadoConfigScopeId(estadoId);
    currentOfferColumnsConfig = configScopeId ? await fetchConfiguracionColumnas(configScopeId) : [];
    setupTableHeaderControls('ofertas');
    return currentOfferColumnsConfig;
  };

  const resetConfigViewEditingState = (viewName) => {
    if (viewName === 'clientes') {
      editingClienteId = null;
      return;
    }

    if (viewName === 'proyectos') {
      editingProyectoId = null;
      return;
    }

    if (viewName === 'usuarios') {
      editingUsuarioId = null;
      return;
    }

    if (viewName === 'estados') {
      editingConfigId = null;
      skipConfigAutoSaveId = null;
      closeEstadoEditModal();
    }
  };

  const setClientesMode = (mode) => {
    enforceManagerOnlyUi(clientesModeButtons, clientesModePanels, mode, 'crear');
    if (!isManagerUser()) {
      clearGenericFeedback(clienteCreateFeedback);
      editingClienteId = null;
    }
  };

  const setProyectosMode = (mode) => {
    enforceManagerOnlyUi(proyectosModeButtons, proyectosModePanels, mode, 'crear');
    if (!isManagerUser()) {
      clearGenericFeedback(projectCreateFeedback);
      editingProyectoId = null;
    }
  };

  const renderProyectosTable = () => {
    if (!proyectosTableBody) {
      return;
    }

    const processedProyectos = getProcessedRows('proyectos', proyectosCache);
    const canManageProjects = isManagerUser();

    if (!processedProyectos.length) {
      proyectosTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="clientes-table__empty">${escapeHtml(t('literal.projects.empty', 'No hay proyectos creados todavía.'))}</td>
        </tr>
      `;
      return;
    }

    proyectosTableBody.innerHTML = processedProyectos
      .map((proyecto) => {
        const isEditing = canManageProjects && editingProyectoId === proyecto.id_proyecto;
        return `
          <tr data-proyecto-row="${proyecto.id_proyecto}">
            ${renderStaticTableCell({ tableKey: 'proyectos', rowId: proyecto.id_proyecto, columnKey: 'id_proyecto', value: proyecto.id_proyecto })}
            ${isEditing
              ? `
            <td class="${getColumnCellClass('proyectos', 'descripcion_proyecto')}" data-label="${escapeHtml(t('literal.projects.project_description', 'Descripción proyecto'))}">
              <input class="clientes-table__edit-input" type="text" value="${escapeHtml(proyecto.descripcion_proyecto)}" data-edit-proyecto-input="${proyecto.id_proyecto}" maxlength="255" />
            </td>
              `
              : renderStaticTableCell({ tableKey: 'proyectos', rowId: proyecto.id_proyecto, columnKey: 'descripcion_proyecto', value: proyecto.descripcion_proyecto, contentClass: 'table-cell__content--strong', title: proyecto.descripcion_proyecto })}
            <td class="table-cell table-cell--actions ${getColumnCellClass('proyectos', 'acciones')}" data-label="${escapeHtml(t('table.actions', 'Acciones'))}">
              <div class="clientes-table__actions actions-inline">
                ${isEditing
                  ? `
                    <button class="btn-inline btn-inline--save" type="button" data-save-proyecto="${proyecto.id_proyecto}">${escapeHtml(t('common.save', 'Guardar'))}</button>
                    <button class="btn-inline btn-inline--cancel" type="button" data-cancel-proyecto="${proyecto.id_proyecto}">${escapeHtml(t('common.cancel', 'Cancelar'))}</button>
                  `
                  : canManageProjects
                    ? `<button class="btn-inline btn-inline--edit" type="button" data-edit-proyecto="${proyecto.id_proyecto}">${escapeHtml(t('common.edit', 'Editar'))}</button>`
                    : '<span class="table-cell__content table-cell__content--muted">-</span>'}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  };

  const loadProyectos = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('/api/proyectos');
      if (response.status === 401) {
        handleUnauthorized();
        return [];
      }

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudieron consultar los proyectos');
      }

      proyectosCache = Array.isArray(result.proyectos) ? result.proyectos : [];
      renderProyectosTable();
      renderProyectoOptions(ofertaEtcProyecto?.value || '');
      return proyectosCache;
    } catch (error) {
      proyectosCache = [];
      renderProyectosTable();
      renderProyectoOptions('');
      if (!silent) {
        setGenericFeedback(proyectosTableFeedback, error.message || 'No se pudieron cargar los proyectos.', 'error');
      }
      return [];
    }
  };

  const renderClientesTable = () => {
    if (!clientesTableBody) {
      return;
    }

    const processedClientes = getProcessedRows('clientes', clientesCache);
    const canManageClients = isManagerUser();

    if (!processedClientes.length) {
      clientesTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="clientes-table__empty">${escapeHtml(t('config.clients_empty', 'No hay clientes creados todavía.'))}</td>
        </tr>
      `;
      return;
    }

    clientesTableBody.innerHTML = processedClientes
      .map((cliente) => {
        const isEditing = canManageClients && editingClienteId === cliente.id_cliente;
        return `
          <tr data-cliente-row="${cliente.id_cliente}">
            ${renderStaticTableCell({ tableKey: 'clientes', rowId: cliente.id_cliente, columnKey: 'id_cliente', value: cliente.id_cliente })}
            ${isEditing
              ? `
            <td class="${getColumnCellClass('clientes', 'descripcion_cliente')}" data-label="${escapeHtml(t('table.client_description', 'Descripción cliente'))}">
              ${isEditing
                ? `<input class="clientes-table__edit-input" type="text" value="${escapeHtml(cliente.descripcion_cliente)}" data-edit-cliente-input="${cliente.id_cliente}" maxlength="255" />`
                : escapeHtml(cliente.descripcion_cliente)}
            </td>
              `
              : renderStaticTableCell({ tableKey: 'clientes', rowId: cliente.id_cliente, columnKey: 'descripcion_cliente', value: cliente.descripcion_cliente, contentClass: 'table-cell__content--strong', title: cliente.descripcion_cliente })}
            ${isEditing
              ? `
            <td class="${getColumnCellClass('clientes', 'dominio')}" data-label="${escapeHtml(t('config.domain', 'Dominio'))}">
              ${isEditing
                ? `<input class="clientes-table__edit-input" type="text" value="${escapeHtml(cliente.dominio || '')}" data-edit-cliente-dominio="${cliente.id_cliente}" maxlength="255" placeholder="${escapeHtml(t('config.domain_example', 'cliente.com'))}" />`
                : escapeHtml(cliente.dominio || '')}
            </td>
              `
              : renderStaticTableCell({ tableKey: 'clientes', rowId: cliente.id_cliente, columnKey: 'dominio', value: cliente.dominio || '', contentClass: 'table-cell__content--muted', title: cliente.dominio || '' })}
            <td class="table-cell table-cell--actions ${getColumnCellClass('clientes', 'acciones')}" data-label="${escapeHtml(t('table.actions', 'Acciones'))}">
              <div class="clientes-table__actions actions-inline">
                ${isEditing
                  ? `
                    <button class="btn-inline btn-inline--save" type="button" data-save-cliente="${cliente.id_cliente}">${escapeHtml(t('common.save', 'Guardar'))}</button>
                    <button class="btn-inline btn-inline--cancel" type="button" data-cancel-cliente="${cliente.id_cliente}">${escapeHtml(t('common.cancel', 'Cancelar'))}</button>
                  `
                  : canManageClients
                    ? `<button class="btn-inline btn-inline--edit" type="button" data-edit-cliente="${cliente.id_cliente}">${escapeHtml(t('common.edit', 'Editar'))}</button>`
                    : '<span class="table-cell__content table-cell__content--muted">-</span>'}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  };

  const setActiveView = (viewName) => {
    if (currentViewName !== viewName) {
      resetConfigViewEditingState(currentViewName);
    }

    currentViewName = viewName;
    const navItems = getNavItems();
    const isListadoView = viewName === 'todos' || viewName.startsWith('estado-');
    const panelViewName = isListadoView ? 'listado-ofertas' : viewName;

    if (viewName === 'todos') {
      currentListadoContext = { viewName, estadoId: null, label: t('listing.all', 'Todos') };
    }

    if (viewName.startsWith('estado-')) {
      const estadoId = Number(viewName.replace('estado-', ''));
      const estado = estadosCache.find((item) => Number(item.id_estado) === estadoId);
      const label = translateEstadoLabel(estado?.descripcion_estado || t('table.status', 'Estado'));
      currentListadoContext = { viewName, estadoId, label };
    }

    navItems.forEach((item) => {
      const isActive = item.dataset.view === viewName;
      item.classList.toggle('active', isActive);
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    configButtons.forEach((configButton) => {
      const isConfigActive = viewName === 'configuracion' || viewName === 'clientes' || viewName === 'estados' || viewName === 'usuarios' || viewName === 'proyectos';
      configButton.classList.toggle('active', isConfigActive);
      configButton.classList.toggle('is-active', isConfigActive);
      configButton.setAttribute('aria-current', isConfigActive ? 'page' : 'false');
      configButton.setAttribute('aria-pressed', isConfigActive ? 'true' : 'false');
    });

    getViewPanels().forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.viewPanel === panelViewName);
    });

    if (window.navigationManager && window.navigationManager.setNavigationStack) {
      window.navigationManager.setNavigationStack(buildNavigationStack(viewName));
    }

    if (viewName === 'nueva-oferta') {
      loadNextNumeroOferta();
      loadClientes({ silent: true });
      loadProyectos({ silent: true });
    }

    if (viewName === 'clientes') {
      clearGenericFeedback(clientesTableFeedback);
      loadClientes({ silent: false });
      setClientesMode(isManagerUser() ? 'crear' : 'ver');
      if (!isManagerUser()) {
        setGenericFeedback(clientesTableFeedback, MANAGER_ONLY_MESSAGE, 'success');
      }
    }

    if (viewName === 'usuarios') {
      clearGenericFeedback(userCreateFeedback);
      clearGenericFeedback(usuariosTableFeedback);
      if (isManagerUser()) {
        Promise.all([
          loadGeneralUsers({ silent: true }),
          loadRoles({ silent: true }),
          loadDepartamentos({ silent: true }),
          loadUsuarios({ silent: true }),
        ]);
        setUsuariosMode('crear');
      } else {
        loadUsuarios({ silent: true });
        setUsuariosMode('ver');
        setGenericFeedback(usuariosTableFeedback, 'Solo los usuarios con rol Manager pueden añadir o editar usuarios.', 'success');
      }
    }

    if (viewName === 'proyectos') {
      clearGenericFeedback(projectCreateFeedback);
      clearGenericFeedback(proyectosTableFeedback);
      loadProyectos({ silent: false });
      setProyectosMode(isManagerUser() ? 'crear' : 'ver');
      if (!isManagerUser()) {
        setGenericFeedback(proyectosTableFeedback, MANAGER_ONLY_MESSAGE, 'success');
      }
    }

    if (viewName === 'estados') {
      clearGenericFeedback(estadosTableFeedback);
      clearGenericFeedback(configColumnasTableFeedback);
      loadDepartamentos({ silent: true });
      loadEstados({ silent: false });
      setEstadosMode(isManagerUser() ? 'crear' : 'ver');
      loadConfiguracionColumnas({ estadoId: selectedEstadoId, silent: true });
      if (!isManagerUser()) {
        setGenericFeedback(estadosTableFeedback, MANAGER_ONLY_MESSAGE, 'success');
        setGenericFeedback(configColumnasTableFeedback, MANAGER_ONLY_MESSAGE, 'success');
      }
    }

    if (viewName === 'todos') {
      const label = t('listing.all', 'Todos');
      resetTableFilters('ofertas');
      loadListadoColumnasEstado(null).then(() => loadOfertasListado({ estadoId: null, label }));
    }

    if (viewName.startsWith('estado-')) {
      const { estadoId, label } = currentListadoContext;
      resetTableFilters('ofertas');
      loadListadoColumnasEstado(estadoId).then(() => loadOfertasListado({ estadoId, label }));
    }
  };

  document.addEventListener('click', (event) => {
    const actionConfigPopupButton = event.target.closest('[data-open-action-config-popup]');
    if (actionConfigPopupButton) {
      if (actionConfigPopup?.classList.contains('is-visible') && actionConfigPopupAnchor === actionConfigPopupButton) {
        closeActionConfigPopup();
      } else {
        openActionConfigPopup(actionConfigPopupButton);
      }
      return;
    }

    const closeActionConfigPopupButton = event.target.closest('[data-close-action-config-popup]');
    if (closeActionConfigPopupButton) {
      closeActionConfigPopup();
      return;
    }

    const clearFilterButton = event.target.closest('[data-clear-filter]');
    if (clearFilterButton) {
      const { tableKey, filterKey } = clearFilterButton.dataset;
      const state = tableStates[tableKey];
      if (!state) {
        return;
      }

      state.filters[filterKey] = '';
      setupTableHeaderControls(tableKey);
      rerenderTable(tableKey);
      return;
    }

    // Filtros rápidos de fecha desactivados temporalmente.
    // const clearDateFiltersButton = event.target.closest('[data-clear-date-filters]');
    // if (clearDateFiltersButton) {
    //   ...
    // }
    //
    // const toggleQuickFiltersButton = event.target.closest('[data-toggle-quick-filters]');
    // if (toggleQuickFiltersButton) {
    //   ...
    // }
    //
    // const closeQuickFiltersButton = event.target.closest('[data-close-quick-filters]');
    // if (closeQuickFiltersButton) {
    //   ...
    // }
    //
    // const applyQuickFiltersButton = event.target.closest('[data-apply-quick-filters]');
    // if (applyQuickFiltersButton) {
    //   ...
    // }
    //
    // if (!event.target.closest('[data-table-quick-filters]')) {
    //   closeAllQuickFilters();
    // }

    const toggleCellButton = event.target.closest('[data-toggle-table-cell]');
    if (toggleCellButton) {
      const cellKey = toggleCellButton.dataset.toggleTableCell;
      const tableKey = toggleCellButton.dataset.tableKey;
      if (cellKey && tableKey) {
        if (expandedTableCells.has(cellKey)) {
          expandedTableCells.delete(cellKey);
        } else {
          expandedTableCells.add(cellKey);
        }
        rerenderTable(tableKey);
      }
      return;
    }

    if (actionConfigPopup?.classList.contains('is-visible')) {
      const clickedInsidePopup = actionConfigPopup.contains(event.target);
      const clickedToggle = event.target.closest('[data-open-action-config-popup]');
      if (!clickedInsidePopup && !clickedToggle) {
        closeActionConfigPopup();
      }
    }

    const viewButton = event.target.closest('[data-view]');
    if (!viewButton) {
      const closeDeleteOfferPromptButton = event.target.closest('[data-close-delete-offer-prompt]');
      if (closeDeleteOfferPromptButton) {
        closeOfferDeletePrompt(false);
        return;
      }

      const confirmDeleteOfferPromptButton = event.target.closest('[data-confirm-delete-offer-prompt]');
      if (confirmDeleteOfferPromptButton) {
        confirmOfferDeletePrompt();
        return;
      }

      const closeReassignOfferPromptButton = event.target.closest('[data-close-reassign-offer-prompt]');
      if (closeReassignOfferPromptButton) {
        closeOfferReassignPrompt(null);
        return;
      }

      const confirmReassignOfferPromptButton = event.target.closest('[data-confirm-reassign-offer-prompt]');
      if (confirmReassignOfferPromptButton) {
        confirmOfferReassignPrompt();
        return;
      }

      const closeCreateDepartmentPromptButton = event.target.closest('[data-close-create-department-prompt]');
      if (closeCreateDepartmentPromptButton) {
        closeDepartmentCreatePrompt(null);
        return;
      }

      const confirmCreateDepartmentPromptButton = event.target.closest('[data-confirm-create-department-prompt]');
      if (confirmCreateDepartmentPromptButton) {
        confirmDepartmentCreatePrompt();
        return;
      }

      const editOfertaButton = event.target.closest('[data-edit-oferta]');
      if (editOfertaButton) {
        const ofertaId = Number(editOfertaButton.dataset.editOferta);
        const cameFromOfferCenter = Boolean(editOfertaButton.closest('#offerCenterModal'));

        Promise.all([
          clientesCache.length ? Promise.resolve(clientesCache) : loadClientes({ silent: true }),
        ]).then(async () => {
          try {
            const response = await fetch(`/api/ofertas/${ofertaId}`);
            if (response.status === 401) {
              handleUnauthorized();
              return;
            }

            const result = await response.json();
            if (!response.ok || result.success === false) {
              throw new Error(result.message || 'No se pudo cargar la oferta');
            }

            if (cameFromOfferCenter) {
              setOfferCenterReturnContext(currentOfferCenterOferta);
              closeOfferCenterModal({ preserveReturnContext: true });
            }
            openOfertaEditModal(result.oferta || {});
          } catch (error) {
            setGenericFeedback(ofertasListadoFeedback, error.message || 'No se pudo cargar la oferta.', 'error');
          }
        });
        return;
      }

      const viewOfertaButton = event.target.closest('[data-view-oferta]');
      if (viewOfertaButton) {
        const ofertaId = Number(viewOfertaButton.dataset.viewOferta);
        const ofertaBase = ofertasListadoCache.find((item) => Number(item.id_oferta) === ofertaId) || {};

        fetch(`/api/ofertas/${ofertaId}`)
          .then(async (response) => {
            if (response.status === 401) {
              handleUnauthorized();
              return null;
            }

            const result = await response.json();
            if (!response.ok || result.success === false) {
              throw new Error(result.message || 'No se pudo cargar la oferta');
            }

            return result;
          })
          .then((result) => {
            if (!result) {
              return;
            }

            openOfferCenterModal({
              ...ofertaBase,
              ...(result.oferta || {}),
            });
          })
          .catch((error) => {
            setGenericFeedback(ofertasListadoFeedback, error.message || 'No se pudo cargar la oferta.', 'error');
          });
        return;
      }

      const bomOfertaButton = event.target.closest('[data-bom-oferta]');
      if (bomOfertaButton) {
        const ofertaId = Number(bomOfertaButton.dataset.bomOferta);
        if (bomOfertaButton.closest('#offerCenterModal')) {
          setOfferCenterReturnContext(currentOfferCenterOferta);
          closeOfferCenterModal({ preserveReturnContext: true });
        }
        openBomModal(ofertaId);
        return;
      }

      const reassignOfertaButton = event.target.closest('[data-reassign-oferta]');
      if (reassignOfertaButton) {
        if (!isManagerUser()) {
          setGenericFeedback(ofertasListadoFeedback, t('offer.reassign_manager_only', 'Solo los managers pueden reasignar tareas.'), 'error');
          return;
        }

        if (guardReadOnlyAction(event)) {
          return;
        }

        const ofertaId = Number(reassignOfertaButton.dataset.reassignOferta);
        const oferta = ofertasListadoCache.find((item) => Number(item.id_oferta) === ofertaId);
        if (!oferta) {
          setGenericFeedback(ofertasListadoFeedback, t('offer.reassign_load_error', 'No se pudo cargar la oferta para reasignarla.'), 'error');
          return;
        }

        if (!canReassignOffer(oferta)) {
          setGenericFeedback(ofertasListadoFeedback, t('offer.reassign_department_forbidden', 'Solo puedes reasignar ofertas del departamento que gestionas.'), 'error');
          return;
        }

        openOfferReassignPrompt({ oferta })
          .then(async (selection) => {
            if (!selection) {
              return;
            }

            clearGenericFeedback(ofertasListadoFeedback);

            const response = await fetch(`/api/ofertas/${encodeURIComponent(ofertaId)}/reasignar`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                num_operario_responsable: selection.numOperarioResponsable,
              }),
            });
            const result = await response.json().catch(() => ({}));

            if (response.status === 401) {
              handleUnauthorized();
              return;
            }

            if (!response.ok || result?.success === false) {
              throw new Error(result?.message || t('offer.reassign_error', 'No se pudo reasignar la oferta.'));
            }

            setGenericFeedback(ofertasListadoFeedback, result.message || t('offer.reassign_success', 'Oferta reasignada correctamente.'), 'success');
            await Promise.all([
              refreshOfferCounters(),
              loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label }),
            ]);
          })
          .catch((error) => {
            setGenericFeedback(ofertasListadoFeedback, error.message || t('offer.reassign_error', 'No se pudo reasignar la oferta.'), 'error');
          });
        return;
      }

      const deleteOfertaButton = event.target.closest('[data-delete-oferta]');
      if (deleteOfertaButton) {
        if (!isManagerUser()) {
          setGenericFeedback(ofertasListadoFeedback, OFFER_DELETE_MANAGER_ONLY_MESSAGE, 'error');
          return;
        }

        if (guardReadOnlyAction(event)) {
          return;
        }

        const ofertaId = Number(deleteOfertaButton.dataset.deleteOferta);
        const oferta = ofertasListadoCache.find((item) => Number(item.id_oferta) === ofertaId);
        const offerNumber = oferta?.numero_oferta || ofertaId;
        openOfferDeletePrompt({ offerNumber }).then((confirmed) => {
          if (!confirmed) {
            return;
          }

          clearGenericFeedback(ofertasListadoFeedback);

          fetch(`/api/ofertas/${encodeURIComponent(ofertaId)}`, { method: 'DELETE' })
            .then(async (response) => {
              const result = await response.json().catch(() => ({}));
              if (response.status === 401) {
                handleUnauthorized();
                return null;
              }
              if (response.status === 403 && result?.manager_only) {
                setGenericFeedback(ofertasListadoFeedback, result.message || OFFER_DELETE_MANAGER_ONLY_MESSAGE, 'error');
                return null;
              }
              if (!response.ok || result?.success === false) {
                throw new Error(result?.message || t('offer.delete_error', 'No se pudo eliminar la oferta.'));
              }
              return result;
            })
            .then(async (result) => {
              if (!result) {
                return;
              }
              setGenericFeedback(ofertasListadoFeedback, result.message || t('offer.delete_success', 'Oferta eliminada correctamente.'), 'success');
              await Promise.all([
                refreshOfferCounters(),
                loadOfertasListado({ estadoId: null, label: t('listing.all', 'Todos') }),
              ]);
            })
            .catch((error) => {
              setGenericFeedback(ofertasListadoFeedback, error.message || t('offer.delete_error', 'No se pudo eliminar la oferta.'), 'error');
            });
        });
        return;
      }

      const editMaterialPrecioButton = event.target.closest('[data-edit-material-precio]');
      if (editMaterialPrecioButton) {
        const materialId = Number(editMaterialPrecioButton.dataset.editMaterialPrecio);
        const material = bomMaterialesCache.find((item) => Number(item.id_material_precio) === materialId);
        if (material) {
          openBomEditView(material);
        }
        return;
      }

      const backToBomListButton = event.target.closest('[data-back-to-bom-list]');
      if (backToBomListButton) {
        openBomListView();
        return;
      }

      const closeBomModalButton = event.target.closest('[data-close-bom-modal]');
      if (closeBomModalButton) {
        closeBomModal({ reopenOfferCenter: true });
        return;
      }

      const changeEstadoButton = event.target.closest('[data-change-estado-oferta]');
      if (changeEstadoButton) {
        const ofertaId = Number(changeEstadoButton.dataset.changeEstadoOferta);
        const cameFromOfferCenter = Boolean(changeEstadoButton.closest('#offerCenterModal'));

        Promise.all([
          estadosCache.length ? Promise.resolve(estadosCache) : loadEstados({ silent: true }),
        ]).then(async () => {
          try {
            const response = await fetch(`/api/ofertas/${ofertaId}`);
            if (response.status === 401) {
              handleUnauthorized();
              return;
            }

            const result = await response.json();
            if (!response.ok || result.success === false) {
              throw new Error(result.message || 'No se pudo cargar la oferta');
            }

            if (cameFromOfferCenter) {
              setOfferCenterReturnContext(currentOfferCenterOferta);
              closeOfferCenterModal({ preserveReturnContext: true });
            }
            openOfertaEstadoModal(result.oferta || {});
          } catch (error) {
            setGenericFeedback(ofertasListadoFeedback, error.message || 'No se pudo cargar la oferta.', 'error');
          }
        });
        return;
      }

      const closeOfertaModalButton = event.target.closest('[data-close-oferta-modal]');
      if (closeOfertaModalButton) {
        closeOfertaEditModal({ reopenOfferCenter: true });
        return;
      }

      const closeOfferCenterModalButton = event.target.closest('[data-close-offer-center-modal]');
      if (closeOfferCenterModalButton) {
        closeOfferCenterModal();
        return;
      }

      const closeOfferAttachmentPreviewModalButton = event.target.closest('[data-close-offer-attachment-preview-modal]');
      if (closeOfferAttachmentPreviewModalButton) {
        closeOfferAttachmentPreviewModal();
        return;
      }

      const closeOfferAttachmentsGalleryModalButton = event.target.closest('[data-close-offer-attachments-gallery-modal]');
      if (closeOfferAttachmentsGalleryModalButton) {
        closeOfferAttachmentsGalleryModal();
        return;
      }

      const openOfferAttachmentsGalleryButton = event.target.closest('[data-open-offer-attachments-gallery]');
      if (openOfferAttachmentsGalleryButton) {
        openOfferAttachmentsGalleryModal();
        return;
      }

      const attachmentPreviewButton = event.target.closest('[data-offer-attachment-preview]');
      if (attachmentPreviewButton) {
        const storedName = attachmentPreviewButton.dataset.offerAttachmentPreview;
        const attachment = (currentOfferCenterOferta?.adjuntos || []).find((item) => item?.stored_name === storedName);
        if (!attachment) {
          setGenericFeedback(offerCenterFeedback, t('offer.attachment_selected_error', 'No se pudo recuperar el adjunto seleccionado.'), 'error');
          return;
        }

        offerAttachmentPreviewReturnToGallery = offerAttachmentsGalleryModal?.classList.contains('is-visible') || false;
        closeOfferAttachmentsGalleryModal();
        openOfferAttachmentPreviewModal(attachment);
        return;
      }

      const offerCenterActionButton = event.target.closest('[data-offer-center-action]');
      if (offerCenterActionButton) {
        if (!currentOfferCenterOferta) {
          setGenericFeedback(offerCenterFeedback, t('offer.current_offer_error', 'No se pudo recuperar la oferta actual.'), 'error');
          return;
        }

        const action = offerCenterActionButton.dataset.offerCenterAction;
        if (action === 'upload-files') {
          if (guardReadOnlyAction(event)) {
            return;
          }
          offerCenterAttachmentInput?.click();
          return;
        }

        if (action === 'history') {
          openOfferCenterHistoryModal();
          return;
        }

        if (action === 'chat') {
          openOfferChatPanel();
          return;
        }
      }

      const closeOfferCenterHistoryModalButton = event.target.closest('[data-close-offer-center-history-modal]');
      if (closeOfferCenterHistoryModalButton) {
        closeOfferCenterHistoryModal();
        return;
      }

      const closeOfferChatPanelButton = event.target.closest('[data-close-offer-chat-panel]');
      if (closeOfferChatPanelButton) {
        closeOfferChatPanel();
        return;
      }

      const closeOfertaEstadoModalButton = event.target.closest('[data-close-oferta-estado-modal]');
      if (closeOfertaEstadoModalButton) {
        closeOfertaEstadoModal({ reopenOfferCenter: true });
        return;
      }

      const closeEstadoModalButton = event.target.closest('[data-close-estado-modal]');
      if (closeEstadoModalButton) {
        closeEstadoEditModal();
        return;
      }

      const closeOfertaEtcModalButton = event.target.closest('[data-close-oferta-etc-modal]');
      if (closeOfertaEtcModalButton) {
        closeOfertaEtcModal();
        return;
      }

      const closeOutlookImportModalButton = event.target.closest('[data-close-outlook-import-modal]');
      if (closeOutlookImportModalButton) {
        closeOutlookImportModal();
        return;
      }

      const outlookMessageButton = event.target.closest('[data-outlook-message-id]');
      if (outlookMessageButton) {
        loadOutlookMessageDetail(outlookMessageButton.dataset.outlookMessageId);
        return;
      }

      const sortButton = event.target.closest('.table-header__sort');
      if (!sortButton) {
        return;
      }

      const header = sortButton.closest('th[data-table-key][data-column-key]');
      if (!header || sortButton.disabled) {
        return;
      }

      const { tableKey, columnKey } = header.dataset;
      const state = tableStates[tableKey];
      if (!state) {
        return;
      }

      if (state.sortKey === columnKey) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = columnKey;
        state.sortDirection = 'asc';
      }

      setupTableHeaderControls(tableKey);

      if (tableKey === 'ofertas') {
        renderOfertasListado(ofertasListadoCache);
      } else if (tableKey === 'clientes') {
        renderClientesTable();
      } else if (tableKey === 'proyectos') {
        renderProyectosTable();
      } else if (tableKey === 'usuarios') {
        renderUsuariosTable();
      } else if (tableKey === 'estados') {
        renderEstadosTable();
      } else if (tableKey === 'configColumnas') {
        renderConfigColumnasTable();
      }
      return;
    }

    setActiveView(viewButton.dataset.view);
    if (viewButton instanceof HTMLElement) {
      viewButton.blur();
    }
  });

  document.addEventListener('dragstart', (event) => {
    const actionChip = event.target.closest('[data-action-config-item]');
    if (!actionChip) {
      return;
    }

    draggedActionConfigKey = actionChip.dataset.actionConfigItem;
    actionChip.classList.add('drag-dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedActionConfigKey);
    }
  });

  document.addEventListener('dragend', (event) => {
    const actionChip = event.target.closest('[data-action-config-item]');
    if (actionChip) {
      actionChip.classList.remove('drag-dragging');
    }

    draggedActionConfigKey = null;
    document.querySelectorAll('.action-config-zone').forEach((zone) => zone.classList.remove('drag-over'));
  });

  document.addEventListener('dragover', (event) => {
    const dropZone = event.target.closest('[data-action-config-zone]');
    if (!dropZone || !draggedActionConfigKey) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  });

  document.addEventListener('dragenter', (event) => {
    const dropZone = event.target.closest('[data-action-config-zone]');
    if (!dropZone || !draggedActionConfigKey) {
      return;
    }

    document.querySelectorAll('.action-config-zone').forEach((zone) => zone.classList.remove('drag-over'));
    dropZone.classList.add('drag-over');
  });

  document.addEventListener('dragleave', (event) => {
    const dropZone = event.target.closest('[data-action-config-zone]');
    if (!dropZone || dropZone.contains(event.relatedTarget)) {
      return;
    }

    dropZone.classList.remove('drag-over');
  });

  document.addEventListener('drop', (event) => {
    const dropZone = event.target.closest('[data-action-config-zone]');
    if (!dropZone || !draggedActionConfigKey) {
      return;
    }

    event.preventDefault();
    dropZone.classList.remove('drag-over');

    if (moveActionConfigItem(draggedActionConfigKey, dropZone.dataset.actionConfigZone)) {
      refreshActionConfigUi();
    }

    draggedActionConfigKey = null;
  });

  getSidebars().forEach((sidebar) => {
    sidebar.addEventListener('mouseleave', () => {
      window.setTimeout(() => {
        if (!sidebar.matches(':hover')) {
          releaseSidebarFocus();
        }
      }, 0);
    });
  });

  document.addEventListener('input', (event) => {
    // Filtros rápidos de fecha desactivados temporalmente.
    // const quickDateFilterInput = event.target.closest('.table-quick-filter__input');
    // if (quickDateFilterInput) {
    //   ...
    // }

    const filterInput = event.target.closest('.table-header__filter');
    if (!filterInput) {
      return;
    }

    const header = filterInput.closest('th[data-table-key]');
    if (!header) {
      return;
    }

    const { tableKey } = header.dataset;
    const filterKey = filterInput.dataset.filterKey;
    const filterBound = filterInput.dataset.filterBound;
    const state = tableStates[tableKey];
    if (!state) {
      return;
    }

    state.filters[filterKey] = filterInput.value;

    if (tableKey === 'ofertas') {
      renderOfertasListado(ofertasListadoCache);
    } else if (tableKey === 'clientes') {
      renderClientesTable();
    } else if (tableKey === 'proyectos') {
      renderProyectosTable();
    } else if (tableKey === 'usuarios') {
      renderUsuariosTable();
    } else if (tableKey === 'estados') {
      renderEstadosTable();
    } else if (tableKey === 'configColumnas') {
      renderConfigColumnasTable();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && offerAttachmentPreviewModal?.classList.contains('is-visible')) {
      closeOfferAttachmentPreviewModal();
      return;
    }

    if (event.key === 'Escape' && offerAttachmentsGalleryModal?.classList.contains('is-visible')) {
      closeOfferAttachmentsGalleryModal();
      return;
    }

    if (event.key === 'Escape' && ofertaEditModal?.classList.contains('is-visible')) {
      closeOfertaEditModal({ reopenOfferCenter: true });
      return;
    }

    if (event.key === 'Escape' && offerCenterRoot?.classList.contains('offer-center--chat-open')) {
      closeOfferChatPanel();
      return;
    }

    if (event.key === 'Escape' && offerCenterHistoryModal?.classList.contains('is-visible')) {
      closeOfferCenterHistoryModal();
      return;
    }

    if (event.key === 'Escape' && offerCenterModal?.classList.contains('is-visible')) {
      closeOfferCenterModal();
      return;
    }

    if (event.key === 'Escape' && ofertaEstadoModal?.classList.contains('is-visible')) {
      closeOfertaEstadoModal({ reopenOfferCenter: true });
      return;
    }

    if (event.key === 'Escape' && estadoEditModal?.classList.contains('is-visible')) {
      closeEstadoEditModal();
      return;
    }

    if (event.key === 'Escape' && ofertaEtcModal?.classList.contains('is-visible')) {
      closeOfertaEtcModal();
      return;
    }

    if (event.key === 'Escape' && bomModal?.classList.contains('is-visible')) {
      closeBomModal({ reopenOfferCenter: true });
      return;
    }

    if (event.key === 'Escape' && outlookImportModal?.classList.contains('is-visible')) {
      closeOutlookImportModal();
      return;
    }

    if (event.key === 'Escape' && actionConfigPopup?.classList.contains('is-visible')) {
      closeActionConfigPopup();
    }
  });

  window.addEventListener('resize', positionActionConfigPopup);
  window.addEventListener('scroll', positionActionConfigPopup, true);

  if (openOutlookImportButton) {
    openOutlookImportButton.addEventListener('click', async (event) => {
      if (guardReadOnlyAction(event)) {
        return;
      }

      setFeedback('La integracion con Outlook esta desactivada temporalmente. El inicio de sesion de la app sigue activo.', 'error');
    });
  }

  if (outlookImportSelectedButton) {
    outlookImportSelectedButton.addEventListener('click', async (event) => {
      if (guardReadOnlyAction(event)) {
        return;
      }

      if (!selectedOutlookMessageId) {
        setGenericFeedback(outlookImportFeedback, t('offer.outlook_select_message', 'Selecciona un correo para ver el detalle.'), 'error');
        return;
      }

      try {
        const response = await fetch(`/api/outlook/messages/${encodeURIComponent(selectedOutlookMessageId)}/import`, {
          method: 'POST',
        });
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo importar el correo de Outlook');
        }

        const syncedExistingOffer = await handleImportedEmailResult(result, { feedbackTarget: outlookImportFeedback, closeOutlook: true });
        if (!syncedExistingOffer) {
          closeOutlookImportModal();
          setFeedback(result.message || t('offer.outlook_import_success', 'Correo de Outlook importado correctamente.'), 'success');
        }
      } catch (error) {
        setGenericFeedback(outlookImportFeedback, error.message || 'No se pudo importar el correo de Outlook.', 'error');
      }
    });
  }

  if (bomSearchInput) {
    bomSearchInput.addEventListener('input', () => {
      renderBomMaterialesTable();
    });
  }

  if (bomEditForm) {
    bomEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = bomEditForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = t('literal.feedback.loading_state', 'Guardando...');
      }

      clearGenericFeedback(bomFeedback);

      try {
        const formData = new FormData(bomEditForm);
        const material = String(formData.get('material') || '').trim();
        const precio = String(formData.get('precio') || '').trim();

        if (!material) {
          throw new Error(t('literal.feedback.material_required', 'El material es obligatorio.'));
        }
        if (!precio) {
          throw new Error(t('literal.feedback.new_price_required', 'El nuevo precio es obligatorio.'));
        }

        const response = await fetch('/api/materiales-precio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ material, precio }),
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo guardar el nuevo precio BOM');
        }

        await loadBomMateriales({ silent: true });
        if (bomSearchInput && material) {
          bomSearchInput.value = material;
        }
        openBomListView();
        setGenericFeedback(bomFeedback, result.message || t('literal.feedback.bom_saved', 'Precio BOM guardado correctamente.'), 'success');
      } catch (error) {
        setGenericFeedback(bomFeedback, error.message || t('literal.feedback.bom_save_error', 'No se pudo guardar el nuevo precio BOM.'), 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (offerCenterChatForm) {
    offerCenterChatForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (guardReadOnlyAction(event)) {
        return;
      }

      const ofertaId = Number(currentOfferCenterOferta?.id_oferta);
      const message = offerCenterChatInput?.value?.trim() || '';
      if (!ofertaId) {
        setGenericFeedback(offerCenterFeedback, t('offer.current_offer_error', 'No se pudo recuperar la oferta actual.'), 'error');
        return;
      }
      if (!message) {
        if (offerCenterChatMessages && !currentOfferChatMessages.length) {
          offerCenterChatMessages.innerHTML = `<p class="offer-center__chat-empty">${escapeHtml(t('offer.chat_start_prompt', 'Escribe un mensaje para iniciar la conversacion.'))}</p>`;
        }
        offerCenterChatInput?.focus();
        return;
      }

      setOfferCenterChatBusy(true);

      try {
        const response = await fetch(`/api/ofertas/${encodeURIComponent(ofertaId)}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok || result?.success === false) {
          throw new Error(result?.message || t('offer.chat_error_send', 'No se pudo enviar el mensaje.'));
        }

        renderOfferChatMessages(result.messages || []);
        syncOfferChatUnreadState({ ofertaId, unreadCount: result.chat_unread_count || 0 });
        if (offerCenterChatInput) {
          offerCenterChatInput.value = '';
          offerCenterChatInput.focus();
        }
      } catch (error) {
        if (offerCenterChatMessages && !currentOfferChatMessages.length) {
          offerCenterChatMessages.innerHTML = `<p class="offer-center__chat-empty">${escapeHtml(error.message || 'No se pudo enviar el mensaje.')}</p>`;
        }
      } finally {
        setOfferCenterChatBusy(false);
      }
    });
  }

  configCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (card.dataset.configTarget === 'clientes') {
        setActiveView('clientes');
        return;
      }

      if (card.dataset.configTarget === 'estados') {
        setActiveView('estados');
        return;
      }

      if (card.dataset.configTarget === 'usuarios') {
        setActiveView('usuarios');
        return;
      }

      if (card.dataset.configTarget === 'proyectos') {
        setActiveView('proyectos');
      }
    });
  });

  if (breadcrumbContainer) {
    breadcrumbContainer.addEventListener('click', (event) => {
      const targetButton = event.target.closest('[data-target]');
      if (!targetButton) {
        return;
      }

      const targetView = targetButton.dataset.target;
      if (targetView === 'inicio') {
        setActiveView('nueva-oferta');
        return;
      }

      if (targetView === 'configuracion') {
        setActiveView('configuracion');
        return;
      }

      if (targetView === 'todos') {
        setActiveView('todos');
        return;
      }

      if (targetView === 'clientes') {
        setActiveView('clientes');
        return;
      }

      if (targetView === 'estados') {
        setActiveView('estados');
        return;
      }

      if (targetView === 'usuarios') {
        setActiveView('usuarios');
        return;
      }

      if (targetView === 'proyectos') {
        setActiveView('proyectos');
        return;
      }

      if (targetView.startsWith('estado-')) {
        setActiveView(targetView);
      }
    });
  }

  clientesModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setClientesMode(button.dataset.clientesMode);
      clearGenericFeedback(clienteCreateFeedback);
      clearGenericFeedback(clientesTableFeedback);
    });
  });

  usuariosModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setUsuariosMode(button.dataset.usuariosMode);
      clearGenericFeedback(userCreateFeedback);
      clearGenericFeedback(usuariosTableFeedback);
    });
  });

  proyectosModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setProyectosMode(button.dataset.proyectosMode);
      clearGenericFeedback(projectCreateFeedback);
      clearGenericFeedback(proyectosTableFeedback);
    });
  });

  estadosModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setEstadosMode(button.dataset.estadosMode);
      clearGenericFeedback(estadoCreateFeedback);
      clearGenericFeedback(estadosTableFeedback);
    });
  });

  if (estadoCreateDescripcion) {
    estadoCreateDescripcion.addEventListener('input', () => {
      if (!estadoCreateEmojiManuallyChanged) {
        syncStateEmojiFromDescription(estadoCreateDescripcion, estadoEmojiSidebar, estadoEmojiSidebarPicker, true);
      }
    });
  }

  bindStateEmojiPicker(estadoEmojiSidebarPicker, estadoEmojiSidebar, () => {
      estadoCreateEmojiManuallyChanged = true;
  });

  if (estadoEditDescripcion) {
    estadoEditDescripcion.addEventListener('input', () => {
      if (!estadoEditEmojiManuallyChanged) {
        syncStateEmojiFromDescription(estadoEditDescripcion, estadoEditEmojiSidebar, estadoEditEmojiSidebarPicker, true);
      }
    });
  }

  bindStateEmojiPicker(estadoEditEmojiSidebarPicker, estadoEditEmojiSidebar, () => {
      estadoEditEmojiManuallyChanged = true;
  });

  if (estadoColumnasSelect) {
    estadoColumnasSelect.addEventListener('change', () => {
      selectedEstadoId = estadoColumnasSelect.value;
      editingConfigId = null;
      clearGenericFeedback(configColumnCreateFeedback);
      clearGenericFeedback(configColumnasTableFeedback);
      loadConfiguracionColumnas({ estadoId: selectedEstadoId, silent: false });
    });
  }

  if (window.navigationManager) {
    if (window.navigationManager.setNavigationStack) {
      window.navigationManager.setNavigationStack(buildNavigationStack('nueva-oferta'));
    } else {
      window.navigationManager.updateBreadcrumb();
    }
  }

  const refreshTranslatedUi = () => {
    if (currentViewName === 'todos') {
      currentListadoContext.label = t('listing.all', 'Todos');
    } else if (currentViewName.startsWith('estado-') && currentListadoContext.estadoId != null) {
      const currentEstado = estadosCache.find((estado) => Number(estado.id_estado) === Number(currentListadoContext.estadoId));
      if (currentEstado) {
        currentListadoContext.label = translateEstadoLabel(currentEstado.descripcion_estado);
      }
    }

    setupAllTableHeaderControls();
    renderSidebarNav();
    renderClienteOptions(clientesCache);
    renderGeneralUsersDatalists();
    renderRoleOptions();
    renderDepartamentoOptions();
    populateOfertaEditClienteOptions();
    renderEstadoOptions(estadosCache);
    populateOfertaEstadoOptions(currentOfertaEstadoId);
    renderOfertaEstadoHistorial(currentOfertaEstadoInteracciones);
    updateOfertaEtcStandbyUi();
    renderClientesTable();
    renderUsuariosTable();
    renderEstadosTable();
    renderConfigColumnasTable();

    if (currentViewName === 'todos' || currentViewName.startsWith('estado-')) {
      loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label });
    }

    if (window.navigationManager && window.navigationManager.setNavigationStack) {
      window.navigationManager.setNavigationStack(buildNavigationStack(currentViewName));
    }
  };

  const readOnlyActionSelector = [
    '[data-edit-oferta]',
    '[data-change-estado-oferta]',
    '[data-delete-oferta]',
    '[data-edit-cliente]',
    '[data-save-cliente]',
    '[data-edit-estado]',
    '[data-save-estado]',
    '[data-edit-config]',
    '[data-delete-config]',
  ].join(',');

  document.addEventListener('click', (event) => {
    if (!isReadOnlyUser()) {
      return;
    }

    const blockedAction = event.target.closest(readOnlyActionSelector);
    if (!blockedAction) {
      return;
    }

    guardReadOnlyAction(event);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (offerDeletePrompt?.classList.contains('is-visible')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOfferDeletePrompt(false);
        return;
      }

      if (event.key === 'Enter' && event.target === offerDeletePromptPassword) {
        event.preventDefault();
        confirmOfferDeletePrompt();
      }
      return;
    }

    if (offerReassignPrompt?.classList.contains('is-visible')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOfferReassignPrompt(null);
        return;
      }

      if (event.key === 'Enter' && event.target === offerReassignPromptUser) {
        event.preventDefault();
        confirmOfferReassignPrompt();
      }
      return;
    }

    if (!departmentCreatePrompt?.classList.contains('is-visible')) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDepartmentCreatePrompt(null);
      return;
    }

    if (event.key === 'Enter' && event.target === departmentCreatePromptInput) {
      event.preventDefault();
      confirmDepartmentCreatePrompt();
    }
  });

  [form, ofertaEditForm, ofertaEstadoForm, clienteCreateForm, userCreateForm, estadoCreateForm, configColumnCreateForm]
    .filter(Boolean)
    .forEach((targetForm) => {
      targetForm.addEventListener('submit', (event) => {
        guardReadOnlyAction(event);
      }, true);
    });

  window.addEventListener('languageChanged', refreshTranslatedUi);

  window.addEventListener('userLoggedIn', async () => {
    try {
      await syncCurrentUserFromServer();
      await loadAvailableOfferColumns();
      await loadClientes({ silent: true });
      await loadEstados({ silent: true });
      await loadProyectos({ silent: true });
      setActiveView('nueva-oferta');
    } catch {
      handleUnauthorized();
    }
  });

  if (mailDropzone && mailFileInput) {
    mailDropzone.addEventListener('click', (event) => {
      if (guardReadOnlyAction(event)) {
        return;
      }

      mailFileInput.click();
    });

    mailDropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        if (guardReadOnlyAction(event)) {
          return;
        }

        event.preventDefault();
        mailFileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      mailDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        mailDropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'dragend'].forEach((eventName) => {
      mailDropzone.addEventListener(eventName, () => {
        mailDropzone.classList.remove('is-dragover');
      });
    });

    mailDropzone.addEventListener('drop', (event) => {
      if (guardReadOnlyAction(event)) {
        mailDropzone.classList.remove('is-dragover');
        return;
      }

      event.preventDefault();
      mailDropzone.classList.remove('is-dragover');
      const file = event.dataTransfer?.files?.[0];
      if (!file) {
        setFeedback('No se ha detectado un archivo de correo válido al arrastrar.', 'error');
        return;
      }
      importMailFile(file);
    });

    mailFileInput.addEventListener('change', () => {
      if (guardReadOnlyAction()) {
        mailFileInput.value = '';
        return;
      }

      const file = mailFileInput.files?.[0];
      if (file) {
        importMailFile(file);
      }
    });
  }

  if (offerCenterAttachmentInput) {
    offerCenterAttachmentInput.addEventListener('change', (event) => {
      if (guardReadOnlyAction(event)) {
        offerCenterAttachmentInput.value = '';
        return;
      }

      uploadOfferAttachments(event.target.files);
    });
  }

  if (form && feedback) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      clearFeedback();
      clearFormValidationErrors(form);
      if (!validateOfertaPrincipalForm()) {
        setFeedback(t('literal.feedback.review_required_fields', 'Revisa los campos obligatorios marcados en rojo.'), 'error');
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = t('literal.feedback.continuing_state', 'Continuando...');
      }

      try {
        const duplicateCheck = await checkDuplicateEmailSubject();
        if (duplicateCheck.exists) {
          savedOfertaContext = null;
          setFeedback(duplicateCheck.message || 'Ya existe una oferta con la misma fecha de e-mail y el mismo asunto.', 'error');
          return;
        }

        savedOfertaContext = { pending: true };

        await Promise.all([
          loadDepartamentos({ silent: true }),
          loadUsuarios({ silent: true }),
        ]);

        setFeedback(
          t('literal.feedback.header_ready', 'Cabecera preparada. Completa ahora el ETC para guardar todo el proceso.'),
          'success',
        );
        openOfertaEtcModal();
      } catch (error) {
        savedOfertaContext = null;
        setFeedback(error.message || t('literal.feedback.prepare_etc_error', 'Se produjo un error al preparar el formulario ETC.'), 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });

    form.addEventListener('reset', () => {
      window.requestAnimationFrame(() => {
        clearFeedback();
        clearFormValidationErrors(form);
        importedEmailAttachmentToken = null;
        importedEmailMetadata = null;
        savedOfertaContext = null;
        pendingOfertaEtcPayload = null;
        updateOfertaEtcStandbyUi();
        loadNextNumeroOferta();
      });
    });
  }

  if (ofertaEtcForm) {
    ofertaEtcForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      clearGenericFeedback(ofertaEtcFeedback);
      clearFormValidationErrors(ofertaEtcForm);
      const arePriorityFieldsValid = validateOfertaEtcPriorityFields();
      if (!arePriorityFieldsValid) {
        setGenericFeedback(ofertaEtcFeedback, t('literal.feedback.review_required_fields', 'Revisa los campos obligatorios marcados en rojo.'), 'error');
        return;
      }

      const submitButton = ofertaEtcForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = t('literal.feedback.accepting_state', 'Aceptando...');
      }

      try {
        const payload = buildPendingOfertaEtcPayload();
        if (!payload.codigo_externo_oferta && !payload.codigo_interno_oferta && !payload.referencia_cliente && !payload.numero_comision && !payload.proyecto) {
          throw new Error(t('literal.feedback.missing_etc_identifier', 'Indica al menos un identificador ETC: código externo, código interno, referencia cliente, número comisión o proyecto.'));
        }

        if (!savedOfertaContext) {
          throw new Error(t('literal.feedback.save_header_first', 'Primero debes guardar la cabecera de la oferta.'));
        }

        pendingOfertaEtcPayload = payload;

        const response = await fetch('/api/ofertas-completa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oferta: buildPayload(),
            oferta_etc: buildOfertaEtcPayloadForInsert(),
            imported_email_attachment_token: importedEmailAttachmentToken,
            imported_email_metadata: importedEmailMetadata,
          }),
        });

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo guardar la oferta completa');
        }

        const numeroOferta = result.numero_oferta || numeroOfertaField?.value || '';
    importedEmailAttachmentToken = null;
    importedEmailMetadata = null;
        savedOfertaContext = null;
        pendingOfertaEtcPayload = null;
        updateOfertaEtcStandbyUi();
        if (numeroOfertaField && result.numero_oferta) {
          numeroOfertaField.value = result.numero_oferta;
        }
        setGenericFeedback(ofertaEtcFeedback, 'Oferta y ETC guardados correctamente.', 'success');
        setFeedback(`Oferta ${numeroOferta} guardada correctamente. ETC insertado también.`, 'success');
        window.setTimeout(() => {
          closeOfertaEtcModal();
          window.location.assign('/');
        }, 400);
      } catch (error) {
        setGenericFeedback(ofertaEtcFeedback, error.message || 'No se pudo guardar el ETC.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (ofertaEtcDepartamento) {
    ofertaEtcDepartamento.addEventListener('change', () => {
      renderOfertaEtcResponsableOptions({
        selectedNumOperario: ofertaEtcResponsable?.value || null,
        preferManager: true,
      });
      if (getFieldContainer(ofertaEtcResponsable)?.classList.contains('is-invalid')) {
        validateRequiredField(ofertaEtcResponsable, 'Este campo es obligatorio.');
      }
    });
  }

  if (ofertaEtcToggleExtended) {
    ofertaEtcToggleExtended.addEventListener('click', () => {
      setOfertaEtcExtendedVisibility(Boolean(ofertaEtcExtendedFields?.hidden));
    });
  }

  bindFieldValidation(document.getElementById('fecha_email'), 'Este campo es obligatorio.');
  bindFieldValidation(clienteSelect, 'Este campo es obligatorio.');
  bindFieldValidation(emisorInput, 'Este campo es obligatorio y debe incluir un correo electrónico.', validateSenderEmailField);

  ofertaEtcPriorityFieldConfigs.forEach(({ field, message }) => {
    bindFieldValidation(field, message);
  });

  ofertaEtcIdentifierFields.forEach((field) => {
    const revalidateIdentifiers = () => {
      if (ofertaEtcIdentifierFields.some((item) => getFieldContainer(item)?.classList.contains('is-invalid'))) {
        validateOfertaEtcIdentifierFields();
      }
    };

    field.addEventListener('blur', revalidateIdentifiers);
    field.addEventListener('input', revalidateIdentifiers);
    field.addEventListener('change', revalidateIdentifiers);
  });

  if (ofertaEditForm) {
    ofertaEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = ofertaEditForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(ofertaEditFeedback);

      try {
        const formData = new FormData(ofertaEditForm);
        const ofertaId = formData.get('id_oferta');
        const response = await fetch(`/api/ofertas/${ofertaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(formData.entries())),
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo actualizar la oferta');
        }

        setGenericFeedback(ofertaEditFeedback, result.message || 'Oferta actualizada correctamente.', 'success');
        await loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label });
        window.setTimeout(() => closeOfertaEditModal(), 400);
      } catch (error) {
        setGenericFeedback(ofertaEditFeedback, error.message || 'No se pudo actualizar la oferta.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (ofertaEstadoForm) {
    if (ofertaEstadoSinFechaLimite) {
      ofertaEstadoSinFechaLimite.addEventListener('change', () => {
        syncOfertaEstadoFechaLimite();
      });
    }

    if (ofertaEstadoFechaLimite) {
      ofertaEstadoFechaLimite.addEventListener('input', () => {
        if (ofertaEstadoSinFechaLimite && ofertaEstadoFechaLimite.value) {
          ofertaEstadoSinFechaLimite.checked = false;
          syncOfertaEstadoFechaLimite();
        }
      });
    }

    ofertaEstadoForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = ofertaEstadoForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(ofertaEstadoFeedback);

      try {
        const formData = new FormData(ofertaEstadoForm);
        const ofertaId = formData.get('id_oferta');
        const response = await fetch(`/api/ofertas/${ofertaId}/estado`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_estado: formData.get('id_estado'),
            fecha_limite: ofertaEstadoSinFechaLimite?.checked ? null : (formData.get('fecha_limite') || null),
            comentario: formData.get('comentario'),
          }),
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo actualizar el estado');
        }

        const notification = result.notification || null;
        let feedbackMessage = result.message || 'Estado actualizado correctamente.';
        let feedbackType = 'success';

        if (notification && notification.sent === false) {
          feedbackType = notification.success === false ? 'warning' : 'success';
          feedbackMessage = notification.message
            ? `${feedbackMessage} Aviso correo: ${notification.message}`
            : `${feedbackMessage} El aviso por correo no se ha enviado.`;
        }

        setGenericFeedback(ofertaEstadoFeedback, feedbackMessage, feedbackType);
        await Promise.all([
          loadEstados({ silent: true }),
          loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label }),
        ]);
        window.setTimeout(() => closeOfertaEstadoModal(), 500);
      } catch (error) {
        setGenericFeedback(ofertaEstadoFeedback, error.message || 'No se pudo actualizar el estado.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (estadoEditForm) {
    estadoEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isManagerUser()) {
        showManagerOnlyFeedback(estadosTableFeedback, setEstadosMode);
        closeEstadoEditModal();
        return;
      }

      const submitButton = estadoEditForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(estadoEditFeedback);

      try {
        const formData = new FormData(estadoEditForm);
        const estadoId = formData.get('id_estado');
        const payload = Object.fromEntries(formData.entries());
        payload.activo = Boolean(estadoEditActivo?.checked);
        payload.emoji_sidebar = estadoEditEmojiSidebar?.value || getSuggestedStateEmoji(estadoEditDescripcion?.value || '');
        const response = await fetch(`/api/estados/${estadoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo actualizar el estado');
        }

        setGenericFeedback(estadoEditFeedback, result.message || 'Estado actualizado correctamente.', 'success');
        await loadEstados({ silent: true });
        window.setTimeout(() => closeEstadoEditModal(), 400);
      } catch (error) {
        setGenericFeedback(estadoEditFeedback, error.message || 'No se pudo actualizar el estado.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (clienteCreateForm) {
    clienteCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isManagerUser()) {
        showManagerOnlyFeedback(clientesTableFeedback, setClientesMode);
        return;
      }

      const submitButton = clienteCreateForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(clienteCreateFeedback);

      try {
        const formData = new FormData(clienteCreateForm);
        const response = await fetch('/api/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(formData.entries())),
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo crear el cliente');
        }

        clienteCreateForm.reset();
        setGenericFeedback(clienteCreateFeedback, result.message || 'Cliente creado correctamente.', 'success');
        await loadClientes({ silent: true });
        setClientesMode('ver');
      } catch (error) {
        setGenericFeedback(clienteCreateFeedback, error.message || 'No se pudo crear el cliente.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (projectCreateForm) {
    projectCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isManagerUser()) {
        showManagerOnlyFeedback(proyectosTableFeedback, setProyectosMode);
        return;
      }

      const submitButton = projectCreateForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(projectCreateFeedback);

      try {
        const formData = new FormData(projectCreateForm);
        const response = await fetch('/api/proyectos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(formData.entries())),
        });

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo crear el proyecto');
        }

        projectCreateForm.reset();
        setGenericFeedback(projectCreateFeedback, result.message || 'Proyecto creado correctamente.', 'success');
        await loadProyectos({ silent: true });
        setProyectosMode('ver');
      } catch (error) {
        setGenericFeedback(projectCreateFeedback, error.message || 'No se pudo crear el proyecto.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (userCreateForm) {
    userCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isManagerUser()) {
        setUsuariosMode('ver');
        setGenericFeedback(usuariosTableFeedback, 'Solo los usuarios con rol Manager pueden añadir o editar usuarios.', 'error');
        return;
      }

      const submitButton = userCreateForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(userCreateFeedback);

      try {
        const formData = new FormData(userCreateForm);
        const selectedGeneralUser = findGeneralUserByNumOperario(formData.get('num_operario')) || findGeneralUserByNombre(formData.get('nombre'));
        if (!selectedGeneralUser) {
          throw new Error('Debes seleccionar un usuario existente de General.Usuarios.');
        }

        const payload = {
          num_operario: selectedGeneralUser.num_operario,
          nombre: selectedGeneralUser.nombre,
          email: formData.get('email')?.trim() || null,
          id_rol: formData.get('id_rol'),
          id_departamento: formData.get('id_departamento') || null,
        };

        const response = await fetch('/api/usuarios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo crear el usuario');
        }

        userCreateForm.reset();
        if (userNumOperarioInput) {
          userNumOperarioInput.value = '';
        }
        if (userNombreInput) {
          userNombreInput.value = '';
        }
        if (userEmailInput) {
          userEmailInput.value = '';
        }
        renderDepartamentoOptions();
        setGenericFeedback(userCreateFeedback, result.message || 'Usuario creado correctamente.', 'success');
        await loadUsuarios({ silent: true });
        setUsuariosMode('ver');
      } catch (error) {
        setGenericFeedback(userCreateFeedback, error.message || 'No se pudo crear el usuario.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (userNumOperarioInput) {
    const syncFromNumOperario = () => {
      syncUserFieldsFromGeneralUser(findGeneralUserByNumOperario(userNumOperarioInput.value), 'num_operario');
    };
    userNumOperarioInput.addEventListener('change', syncFromNumOperario);
    userNumOperarioInput.addEventListener('blur', syncFromNumOperario);
  }

  if (userNombreInput) {
    const syncFromNombre = () => {
      syncUserFieldsFromGeneralUser(findGeneralUserByNombre(userNombreInput.value), 'nombre');
    };
    userNombreInput.addEventListener('change', syncFromNombre);
    userNombreInput.addEventListener('blur', syncFromNombre);
  }

  if (addDepartmentButton) {
    addDepartmentButton.addEventListener('click', async (event) => {
      if (!isManagerUser()) {
        event.preventDefault();
        setUsuariosMode('ver');
        setGenericFeedback(usuariosTableFeedback, 'Solo los usuarios con rol Manager pueden añadir o editar usuarios.', 'error');
        return;
      }

      if (guardReadOnlyAction(event)) {
        return;
      }

      const nombreDepartamento = await openDepartmentCreatePrompt();
      if (!nombreDepartamento) {
        return;
      }

      try {
        if (departmentCreatePromptConfirm) {
          departmentCreatePromptConfirm.disabled = true;
        }
        const response = await fetch('/api/departamentos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombre_departamento: nombreDepartamento }),
        });

        if (response.status === 401) {
          closeDepartmentCreatePrompt(null);
          handleUnauthorized();
          return;
        }

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo crear el departamento');
        }

        await loadDepartamentos({ silent: true });
        if (userDepartamentosSelect && result.departamento?.id_departamento) {
          userDepartamentosSelect.value = String(result.departamento.id_departamento);
        }
        closeDepartmentCreatePrompt(null);
        setGenericFeedback(userCreateFeedback, result.message || 'Departamento creado correctamente.', 'success');
      } catch (error) {
        if (departmentCreatePromptConfirm) {
          departmentCreatePromptConfirm.disabled = false;
        }
        setGenericFeedback(departmentCreatePromptFeedback, error.message || t('literal.users.department_create_error', 'No se pudo crear el departamento.'), 'error');
      }
    });
  }

  if (estadoCreateForm) {
    estadoCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isManagerUser()) {
        showManagerOnlyFeedback(estadosTableFeedback, setEstadosMode);
        return;
      }

      const submitButton = estadoCreateForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(estadoCreateFeedback);

      try {
        const formData = new FormData(estadoCreateForm);
        const payload = Object.fromEntries(formData.entries());
        payload.emoji_sidebar = estadoEmojiSidebar?.value || getSuggestedStateEmoji(estadoCreateDescripcion?.value || '');
        const response = await fetch('/api/estados', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo crear el estado');
        }

        estadoCreateForm.reset();
        estadoCreateEmojiManuallyChanged = false;
        if (estadoDepartamentoSelect) {
          estadoDepartamentoSelect.value = '';
        }
        populateStateEmojiSelect(estadoEmojiSidebar, estadoEmojiSidebarPicker, getSuggestedStateEmoji(''));
        setGenericFeedback(estadoCreateFeedback, result.message || 'Estado creado correctamente.', 'success');
        await loadEstados({ silent: true });

        if (!selectedEstadoId && result.estado?.id_estado) {
          selectedEstadoId = String(result.estado.id_estado);
          renderEstadoOptions(estadosCache);
        }

        setEstadosMode('ver');
      } catch (error) {
        setGenericFeedback(estadoCreateFeedback, error.message || 'No se pudo crear el estado.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (clientesTableBody) {
    clientesTableBody.addEventListener('click', async (event) => {
      if (!isManagerUser()) {
        const clienteAction = event.target.closest('[data-edit-cliente], [data-cancel-cliente], [data-save-cliente]');
        if (clienteAction) {
          showManagerOnlyFeedback(clientesTableFeedback, setClientesMode);
        }
        return;
      }

      const editButton = event.target.closest('[data-edit-cliente]');
      const cancelButton = event.target.closest('[data-cancel-cliente]');
      const saveButton = event.target.closest('[data-save-cliente]');

      if (editButton) {
        editingClienteId = Number(editButton.dataset.editCliente);
        clearGenericFeedback(clientesTableFeedback);
        renderClientesTable();
        return;
      }

      if (cancelButton) {
        editingClienteId = null;
        clearGenericFeedback(clientesTableFeedback);
        renderClientesTable();
        return;
      }

      if (saveButton) {
        const clienteId = Number(saveButton.dataset.saveCliente);
        const input = clientesTableBody.querySelector(`[data-edit-cliente-input="${clienteId}"]`);
        const domainInput = clientesTableBody.querySelector(`[data-edit-cliente-dominio="${clienteId}"]`);
        const descripcionCliente = input ? input.value.trim() : '';
        const dominio = domainInput ? domainInput.value.trim() : '';

        try {
          const response = await fetch(`/api/clientes/${clienteId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ descripcion_cliente: descripcionCliente, dominio }),
          });

          const result = await response.json();

          if (!response.ok || result.success === false) {
            throw new Error(result.message || 'No se pudo actualizar el cliente');
          }

          editingClienteId = null;
          setGenericFeedback(clientesTableFeedback, result.message || 'Cliente actualizado correctamente.', 'success');
          await loadClientes({ silent: true });
        } catch (error) {
          setGenericFeedback(clientesTableFeedback, error.message || 'No se pudo actualizar el cliente.', 'error');
        }
      }
    });
  }

  if (proyectosTableBody) {
    proyectosTableBody.addEventListener('click', async (event) => {
      if (!isManagerUser()) {
        const proyectoAction = event.target.closest('[data-edit-proyecto], [data-cancel-proyecto], [data-save-proyecto]');
        if (proyectoAction) {
          showManagerOnlyFeedback(proyectosTableFeedback, setProyectosMode);
        }
        return;
      }

      const editButton = event.target.closest('[data-edit-proyecto]');
      const cancelButton = event.target.closest('[data-cancel-proyecto]');
      const saveButton = event.target.closest('[data-save-proyecto]');

      if (editButton) {
        editingProyectoId = Number(editButton.dataset.editProyecto);
        clearGenericFeedback(proyectosTableFeedback);
        renderProyectosTable();
        return;
      }

      if (cancelButton) {
        editingProyectoId = null;
        clearGenericFeedback(proyectosTableFeedback);
        renderProyectosTable();
        return;
      }

      if (saveButton) {
        const proyectoId = Number(saveButton.dataset.saveProyecto);
        const input = proyectosTableBody.querySelector(`[data-edit-proyecto-input="${proyectoId}"]`);
        const descripcionProyecto = input ? input.value.trim() : '';

        try {
          const response = await fetch(`/api/proyectos/${proyectoId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ descripcion_proyecto: descripcionProyecto }),
          });

          const result = await response.json();
          if (!response.ok || result.success === false) {
            throw new Error(result.message || 'No se pudo actualizar el proyecto');
          }

          editingProyectoId = null;
          setGenericFeedback(proyectosTableFeedback, result.message || 'Proyecto actualizado correctamente.', 'success');
          await loadProyectos({ silent: true });
        } catch (error) {
          setGenericFeedback(proyectosTableFeedback, error.message || 'No se pudo actualizar el proyecto.', 'error');
        }
      }
    });
  }

  if (usuariosTableBody) {
    usuariosTableBody.addEventListener('click', async (event) => {
      if (!isManagerUser()) {
        const usuarioAction = event.target.closest('[data-edit-usuario], [data-cancel-usuario], [data-save-usuario]');
        if (usuarioAction) {
          showManagerOnlyFeedback(usuariosTableFeedback, setUsuariosMode);
        }
        return;
      }

      const editButton = event.target.closest('[data-edit-usuario]');
      const cancelButton = event.target.closest('[data-cancel-usuario]');
      const saveButton = event.target.closest('[data-save-usuario]');

      if (editButton) {
        editingUsuarioId = Number(editButton.dataset.editUsuario);
        clearGenericFeedback(usuariosTableFeedback);
        renderUsuariosTable();
        return;
      }

      if (cancelButton) {
        editingUsuarioId = null;
        clearGenericFeedback(usuariosTableFeedback);
        renderUsuariosTable();
        return;
      }

      if (saveButton) {
        const numOperario = Number(saveButton.dataset.saveUsuario);
        const usuario = usuariosCache.find((item) => Number(item.num_operario) === numOperario);
        const emailInput = usuariosTableBody.querySelector(`[data-edit-usuario-email="${numOperario}"]`);
        const rolInput = usuariosTableBody.querySelector(`[data-edit-usuario-rol="${numOperario}"]`);
        const departamentoInput = usuariosTableBody.querySelector(`[data-edit-usuario-departamento="${numOperario}"]`);

        try {
          const response = await fetch(`/api/usuarios/${numOperario}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              num_operario: numOperario,
              nombre: usuario?.nombre || '',
              email: emailInput ? emailInput.value.trim() : '',
              id_rol: rolInput ? rolInput.value : '',
              id_departamento: departamentoInput ? departamentoInput.value : '',
            }),
          });

          if (response.status === 401) {
            handleUnauthorized();
            return;
          }

          const result = await response.json();
          if (!response.ok || result.success === false) {
            throw new Error(result.message || 'No se pudo actualizar el usuario');
          }

          editingUsuarioId = null;
          setGenericFeedback(usuariosTableFeedback, result.message || 'Usuario actualizado correctamente.', 'success');
          await loadUsuarios({ silent: true });
        } catch (error) {
          setGenericFeedback(usuariosTableFeedback, error.message || 'No se pudo actualizar el usuario.', 'error');
        }
      }
    });
  }

  if (estadosTableBody) {
    estadosTableBody.addEventListener('click', async (event) => {
      if (!isManagerUser()) {
        const estadoAction = event.target.closest('[data-edit-estado]');
        if (estadoAction) {
          showManagerOnlyFeedback(estadosTableFeedback, setEstadosMode);
        }
        return;
      }

      const editButton = event.target.closest('[data-edit-estado]');

      if (editButton) {
        const estadoId = Number(editButton.dataset.editEstado);
        const estado = estadosCache.find((item) => Number(item.id_estado) === estadoId);
        clearGenericFeedback(estadosTableFeedback);
        if (estado) {
          openEstadoEditModal(estado);
        }
      }
    });
  }

  if (configColumnCreateForm) {
    configColumnCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isManagerUser()) {
        showManagerOnlyFeedback(configColumnasTableFeedback);
        return;
      }

      if (!selectedEstadoId) {
        setGenericFeedback(configColumnCreateFeedback, 'Debes seleccionar un estado antes de guardar columnas.', 'error');
        return;
      }

      const submitButton = configColumnCreateForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(configColumnCreateFeedback);

      try {
        const selectedColumns = configColumnaSelect ? [...configColumnaSelect.selectedOptions].map((option) => option.value) : [];
        if (!selectedColumns.length) {
          throw new Error('Debes seleccionar al menos una columna.');
        }

        const response = await fetch(`/api/estados/${selectedEstadoId}/columnas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            columnas: selectedColumns,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo guardar la columna de configuración');
        }

        configColumnCreateForm.reset();
        renderAvailableColumnOptions();
        setGenericFeedback(configColumnCreateFeedback, result.message || 'Columnas añadidas correctamente.', 'success');
        await loadConfiguracionColumnas({ estadoId: selectedEstadoId, silent: true });
        if (isConfigScopeActiveForCurrentListado(selectedEstadoId)) {
          await loadListadoColumnasEstado(selectedEstadoId);
          await loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label });
        }
      } catch (error) {
        setGenericFeedback(configColumnCreateFeedback, error.message || 'No se pudo guardar la columna de configuración.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  if (configColumnasTableBody) {
    configColumnasTableBody.addEventListener('mousedown', (event) => {
      const cancelButton = event.target.closest('[data-cancel-config]');
      if (cancelButton) {
        skipConfigAutoSaveId = Number(cancelButton.dataset.cancelConfig);
        return;
      }

      const deleteButton = event.target.closest('[data-delete-config]');
      if (deleteButton) {
        skipConfigAutoSaveId = Number(deleteButton.dataset.deleteConfig);
      }
    });

    configColumnasTableBody.addEventListener('click', async (event) => {
      if (!isManagerUser()) {
        const configAction = event.target.closest('[data-edit-config], [data-cancel-config], [data-delete-config]');
        if (configAction) {
          showManagerOnlyFeedback(configColumnasTableFeedback);
        }
        return;
      }

      const editButton = event.target.closest('[data-edit-config]');
      const cancelButton = event.target.closest('[data-cancel-config]');
      const deleteButton = event.target.closest('[data-delete-config]');
        const ofertaId = Number(bomOfertaButton.dataset.bomOferta);
        openBomModal(ofertaId);
        return;

      if (editButton) {
        editingConfigId = Number(editButton.dataset.editConfig);
        clearGenericFeedback(configColumnasTableFeedback);
        renderConfigColumnasTable();
        window.requestAnimationFrame(() => {
          configColumnasTableBody
            .querySelector(`[data-edit-config-columna="${editingConfigId}"]`)
            ?.focus();
        });
        return;
      }

      if (cancelButton) {
        editingConfigId = null;
        skipConfigAutoSaveId = null;
        clearGenericFeedback(configColumnasTableFeedback);
        renderConfigColumnasTable();
        return;
      }

      if (deleteButton) {
        const configId = Number(deleteButton.dataset.deleteConfig);

        try {
          const response = await fetch(`/api/configuracion-columnas/${configId}`, {
            method: 'DELETE',
          });

          if (response.status === 401) {
            handleUnauthorized();
            return;
          }

          const result = await response.json();
          if (!response.ok || result.success === false) {
            throw new Error(result.message || 'No se pudo eliminar la columna de configuración');
          }

          editingConfigId = null;
          skipConfigAutoSaveId = null;
          setGenericFeedback(configColumnasTableFeedback, result.message || 'Columna de configuración eliminada correctamente.', 'success');
          await loadConfiguracionColumnas({ estadoId: selectedEstadoId, silent: true });
          if (isConfigScopeActiveForCurrentListado(selectedEstadoId)) {
            await loadListadoColumnasEstado(selectedEstadoId);
            await loadOfertasListado({ estadoId: currentListadoContext.estadoId, label: currentListadoContext.label });
          }
        } catch (error) {
          setGenericFeedback(configColumnasTableFeedback, error.message || 'No se pudo eliminar la columna de configuración.', 'error');
        }
        return;
      }
    });

    configColumnasTableBody.addEventListener('focusout', async (event) => {
      const currentRow = event.target.closest('tr[data-config-row]');
      if (!currentRow) {
        return;
      }

      const configId = Number(currentRow.dataset.configRow);
      if (!configId || editingConfigId !== configId) {
        return;
      }

      const nextFocusedElement = event.relatedTarget;
      if (nextFocusedElement && currentRow.contains(nextFocusedElement)) {
        return;
      }

      if (skipConfigAutoSaveId === configId) {
        skipConfigAutoSaveId = null;
        return;
      }

      try {
        await saveConfigColumnRow(configId);
      } catch (error) {
        setGenericFeedback(configColumnasTableFeedback, error.message || 'No se pudo actualizar la columna de configuración.', 'error');
      }
    });
  }

  // Verificar sesión con el servidor al cargar: si no hay sesión, el loginModal mostrará el modal
  // Si hay sesión válida, cargar la vista principal
  const initApp = async () => {
    ofertasActionColumnVisibility = loadActionColumnVisibility();
    updateOfertaEtcStandbyUi();
    setupAllTableHeaderControls();
    await loadStateEmojiSuggestions();
    populateStateEmojiSelect(estadoEmojiSidebar, estadoEmojiSidebarPicker, estadoEmojiSidebar?.value || getSuggestedStateEmoji(estadoCreateDescripcion?.value || ''));
    populateStateEmojiSelect(estadoEditEmojiSidebar, estadoEditEmojiSidebarPicker, estadoEditEmojiSidebar?.value || getSuggestedStateEmoji(estadoEditDescripcion?.value || ''));
    try {
      const authenticatedUser = await syncCurrentUserFromServer();
      if (authenticatedUser) {
        await loadAvailableOfferColumns();
        await loadEstados({ silent: true });
        await loadClientes({ silent: true });
        await loadProyectos({ silent: true });
        setActiveView('nueva-oferta');
        if (outlookAuthError) {
          setGenericFeedback(feedback, outlookAuthError, 'error');
        }
      } else {
        await loadAvailableOfferColumns();
        renderSidebarNav();
      }
    } catch {
      setCurrentUser(null);
      await loadAvailableOfferColumns();
      renderSidebarNav();
    }
  };

  initApp();
});
