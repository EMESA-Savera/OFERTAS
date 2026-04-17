document.addEventListener('DOMContentLoaded', () => {
  const getNavItems = () => document.querySelectorAll('.nav-item[data-view]');
  const getViewPanels = () => document.querySelectorAll('[data-view-panel]');
  const getSidebars = () => document.querySelectorAll('.sidebar');
  const sidebarNavContainers = document.querySelectorAll('.js-sidebar-nav');
  const configCards = document.querySelectorAll('[data-config-target]');
  const form = document.getElementById('nuevaOfertaForm');
  const feedback = document.getElementById('formFeedback');
  const mailDropzone = document.getElementById('mailDropzone');
  const mailFileInput = document.getElementById('mailFileInput');
  const numeroOfertaField = document.getElementById('numero_oferta');
  const clienteSelect = document.getElementById('cliente');
  const configButtons = document.querySelectorAll('.btn-config[data-view="configuracion"]');
  const breadcrumbContainer = document.getElementById('breadcrumbContainer');
  const clienteCreateForm = document.getElementById('clienteCreateForm');
  const clienteCreateFeedback = document.getElementById('clienteCreateFeedback');
  const clientesTableFeedback = document.getElementById('clientesTableFeedback');
  const clientesTableBody = document.getElementById('clientesTableBody');
  const clientesModeButtons = document.querySelectorAll('[data-clientes-mode]');
  const clientesModePanels = document.querySelectorAll('[data-clientes-mode-panel]');
  const estadoCreateForm = document.getElementById('estadoCreateForm');
  const estadoCreateFeedback = document.getElementById('estadoCreateFeedback');
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
  const ofertaEditObservaciones = document.getElementById('ofertaEditObservaciones');
  const ofertaEstadoModal = document.getElementById('ofertaEstadoModal');
  const ofertaEstadoForm = document.getElementById('ofertaEstadoForm');
  const ofertaEstadoFeedback = document.getElementById('ofertaEstadoFeedback');
  const ofertaEstadoId = document.getElementById('ofertaEstadoId');
  const ofertaEstadoNumero = document.getElementById('ofertaEstadoNumero');
  const ofertaEstadoActual = document.getElementById('ofertaEstadoActual');
  const ofertaEstadoNuevo = document.getElementById('ofertaEstadoNuevo');
  const ofertaEstadoFecha = document.getElementById('ofertaEstadoFecha');
  const ofertaEstadoComentario = document.getElementById('ofertaEstadoComentario');
  const ofertaEstadoHistorial = document.getElementById('ofertaEstadoHistorial');

  let clientesCache = [];
  let editingClienteId = null;
  let estadosCache = [];
  let editingEstadoId = null;
  let configuracionColumnasCache = [];
  let ofertasListadoCache = [];
  let availableOfferColumns = [];
  let currentOfferColumnsConfig = [];
  let editingConfigId = null;
  let skipConfigAutoSaveId = null;
  let selectedEstadoId = '';
  let currentListadoContext = { viewName: 'todos', estadoId: null, label: 'Todos' };
  const expandedTableCells = new Set();
  const tableStates = {
    ofertas: { filters: {}, sortKey: 'numero_oferta', sortDirection: 'asc' },
    clientes: { filters: {}, sortKey: null, sortDirection: 'asc' },
    estados: { filters: {}, sortKey: 'orden', sortDirection: 'asc' },
    configColumnas: { filters: {}, sortKey: 'orden_columna', sortDirection: 'asc' },
  };
  const tableDefinitions = {
    ofertas: {
      tableElement: () => ofertasListadoTableBody?.closest('table'),
      getColumns: () => {
        const configuredColumns = currentListadoContext.estadoId && currentOfferColumnsConfig.length
          ? currentOfferColumnsConfig.map((config) => ({
              key: config.columna,
              label: config.descripcion_columna || availableOfferColumns.find((column) => column.value === config.columna)?.label || config.columna,
              sortable: true,
              searchable: true,
            }))
          : [
              { key: 'Numero_oferta', label: 'Nº oferta', sortable: true, searchable: true },
              { key: 'Fecha_alta_oferta', label: 'Fecha alta', sortable: true, searchable: true },
              { key: 'Cliente', label: 'Cliente', sortable: true, searchable: true },
              { key: 'Observaciones_oferta', label: 'Observaciones', sortable: true, searchable: true },
              { key: 'Estado', label: 'Estado', sortable: true, searchable: true },
            ];

        return [
          ...configuredColumns,
          { key: 'acciones', label: 'Acciones', sortable: false, searchable: false },
        ];
      },
    },
    clientes: {
      tableElement: () => clientesTableBody?.closest('table'),
      columns: [
        { key: 'id_cliente', label: 'ID', sortable: true, searchable: true },
        { key: 'descripcion_cliente', label: 'Descripción cliente', sortable: true, searchable: true },
        { key: 'dominio', label: 'Dominio', sortable: true, searchable: true },
        { key: 'acciones', label: 'Acciones', sortable: false, searchable: false },
      ],
    },
    estados: {
      tableElement: () => estadosTableBody?.closest('table'),
      columns: [
        { key: 'drag', label: '', sortable: false, searchable: false, className: 'col-drag' },
        { key: 'orden', label: 'Orden', sortable: true, searchable: true },
        { key: 'descripcion_estado', label: 'Descripción estado', sortable: true, searchable: true },
        { key: 'acciones', label: 'Acciones', sortable: false, searchable: false },
      ],
    },
    configColumnas: {
      tableElement: () => configColumnasTableBody?.closest('table'),
      columns: [
        { key: 'drag', label: '', sortable: false, searchable: false, className: 'col-drag' },
        { key: 'columna', label: 'Columna', sortable: true, searchable: true },
        { key: 'descripcion_columna', label: 'Descripción', sortable: true, searchable: true },
        { key: 'orden_columna', label: 'Orden', sortable: true, searchable: true },
        { key: 'acciones', label: 'Acciones', sortable: false, searchable: false },
      ],
    },
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  const releaseSidebarFocus = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && activeElement.closest('.sidebar')) {
      activeElement.blur();
    }
  };

  const normalizeSearchValue = (value) => String(value ?? '').toLocaleLowerCase();

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
      if (!value) {
        return true;
      }
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
    const state = tableStates.estados;
    const hasFilters = Object.values(state.filters).some((value) => String(value || '').trim() !== '');
    return !hasFilters && state.sortKey === 'orden' && state.sortDirection === 'asc';
  };

  const isConfigColumnasDragEnabled = () => {
    const state = tableStates.configColumnas;
    const hasFilters = Object.values(state.filters).some((value) => String(value || '').trim() !== '');
    return !hasFilters && state.sortKey === 'orden_columna' && state.sortDirection === 'asc';
  };

  const setupTableHeaderControls = (tableKey) => {
    const definition = tableDefinitions[tableKey];
    const table = definition?.tableElement?.();
    const headerRow = table?.querySelector('thead tr');
    if (!headerRow) {
      return;
    }

    table.classList.add('table-compact', 'table-hover', 'table-card-mobile', `table-view--${sanitizeColumnClassName(tableKey)}`);

    const columns = typeof definition.getColumns === 'function' ? definition.getColumns() : definition.columns;

    headerRow.innerHTML = columns.map((column) => {
      const state = tableStates[tableKey];
      const isSorted = state.sortKey === column.key;
      const sortArrow = isSorted ? (state.sortDirection === 'asc' ? '↑' : '↓') : '↕';
      const classes = ['table-header', getColumnCellClass(tableKey, column.key)];
      if (column.className) {
        classes.push(column.className);
      }
      const filterValue = state.filters[column.key] || '';
      const filterPlaceholder = getFilterPlaceholder(tableKey, column.key, column.label);

      return `
        <th class="${classes.join(' ')}" data-table-key="${tableKey}" data-column-key="${column.key}" ${column.sortable ? 'data-sortable="true"' : ''}>
          <div class="table-header__content">
            <button class="table-header__sort" type="button" ${column.sortable ? '' : 'disabled'} aria-label="Ordenar por ${escapeHtml(column.label || column.key)}">
              <span class="table-header__label">${escapeHtml(column.label)}</span>
              ${column.sortable ? `<span class="table-header__sort-indicator">${sortArrow}</span>` : ''}
            </button>
            ${column.searchable ? `
              <div class="table-header__filter-wrap">
                <span class="table-header__filter-icon" aria-hidden="true">⌕</span>
                <input class="table-header__filter" type="text" value="${escapeHtml(filterValue)}" placeholder="${escapeHtml(filterPlaceholder)}" aria-label="${escapeHtml(filterPlaceholder)}" data-filter-key="${column.key}" />
                ${filterValue ? `<button class="table-header__filter-clear" type="button" data-clear-filter="true" data-table-key="${tableKey}" data-filter-key="${column.key}" aria-label="Limpiar filtro ${escapeHtml(column.label)}">×</button>` : ''}
              </div>
            ` : ''}
          </div>
        </th>
      `;
    }).join('');

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
          ${escapeHtml(column.label)}
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
    const placeholders = {
      ofertas: {
        Numero_oferta: 'Filtrar nº oferta',
        Fecha_alta_oferta: 'Filtrar fecha',
        Fecha_email: 'Filtrar fecha',
        Cliente: 'Filtrar cliente',
        Observaciones_oferta: 'Buscar observación',
        Estado: 'Filtrar estado',
      },
      clientes: {
        id_cliente: 'Filtrar ID',
        descripcion_cliente: 'Filtrar cliente',
        dominio: 'Filtrar dominio',
      },
      estados: {
        orden: 'Filtrar orden',
        descripcion_estado: 'Filtrar estado',
      },
      configColumnas: {
        columna: 'Filtrar columna',
        descripcion_columna: 'Filtrar descripción',
        orden_columna: 'Filtrar orden',
      },
    };

    return placeholders[tableKey]?.[columnKey] || `Filtrar ${String(label || columnKey).toLowerCase()}`;
  };

  const getColumnCellClass = (tableKey, columnKey) => {
    const sharedClass = `column-${sanitizeColumnClassName(columnKey)}`;
    const specificClasses = {
      ofertas: {
        Numero_oferta: 'column-primary column-offer-number',
        Fecha_alta_oferta: 'column-secondary column-date',
        Fecha_email: 'column-secondary column-date',
        Cliente: 'column-primary column-client',
        Observaciones_oferta: 'column-observaciones',
        Estado: 'column-status',
        acciones: 'column-actions',
      },
      clientes: {
        id_cliente: 'column-secondary column-id',
        descripcion_cliente: 'column-primary column-client',
        dominio: 'column-secondary column-domain',
        acciones: 'column-actions',
      },
      estados: {
        drag: 'column-drag',
        orden: 'column-secondary column-order',
        descripcion_estado: 'column-primary',
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
    const label = String(value || 'Sin estado').trim() || 'Sin estado';
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
    const normalizedValue = String(value ?? '');
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
            aria-label="${isExpanded ? 'Colapsar' : 'Expandir'} ${escapeHtml(columnLabel)}"
          >${isExpanded ? 'Ver menos' : 'Ver más'}</button>
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

  const applyImportedEmailData = async (data) => {
    if (!form || !data) {
      return;
    }

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
    if (observacionesField) {
      observacionesField.value = data.observaciones || '';
    }
    if (clienteSelect) {
      clienteSelect.value = data.id_cliente ? String(data.id_cliente) : '';
    }
  };

  const importMailFile = async (file) => {
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

      await applyImportedEmailData(result.data || {});
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
    localStorage.removeItem('usuarioSGA');
    if (window.LoginModal && !window.LoginModal.isOpen) {
      window.LoginModal.show();
    }
  };

  const isAuthenticated = () => {
    try {
      const raw = localStorage.getItem('usuarioSGA');
      if (!raw) return false;
      const user = JSON.parse(raw);
      return !!(user && user.id);
    } catch {
      return false;
    }
  };

  const loadNextNumeroOferta = async () => {
    if (!numeroOfertaField) {
      return;
    }

    numeroOfertaField.value = 'Consultando...';

    try {
      const response = await fetch('/api/ofertas/siguiente-numero');
      if (response.status === 401) {
        handleUnauthorized();
        numeroOfertaField.value = '';
        return;
      }
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'No se pudo consultar el siguiente número de oferta');
      }

      numeroOfertaField.value = result.numero_oferta || 'No disponible';
    } catch (error) {
      numeroOfertaField.value = 'No disponible';
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
      ? 'Seleccionar cliente'
      : 'No hay clientes creados';
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
        throw new Error(result.message || 'No se pudieron consultar los clientes');
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
        setGenericFeedback(clientesTableFeedback, error.message || 'No se pudieron cargar los clientes.', 'error');
      }

      return [];
    }
  };

  const populateOfertaEditClienteOptions = () => {
    if (!ofertaEditCliente) {
      return;
    }

    ofertaEditCliente.innerHTML = [
      '<option value="">Sin cliente</option>',
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

    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const populateOfertaEstadoOptions = (currentEstadoId) => {
    if (!ofertaEstadoNuevo) {
      return;
    }

    const availableStates = estadosCache.filter((estado) => Number(estado.id_estado) !== Number(currentEstadoId));
    ofertaEstadoNuevo.innerHTML = [
      '<option value="">Selecciona un estado</option>',
      ...availableStates.map((estado) => `<option value="${estado.id_estado}">${escapeHtml(estado.descripcion_estado)}</option>`),
    ].join('');
  };

  const renderOfertaEstadoHistorial = (interacciones = []) => {
    if (!ofertaEstadoHistorial) {
      return;
    }

    if (!interacciones.length) {
      ofertaEstadoHistorial.innerHTML = '<p class="crm-history__empty">Sin interacciones registradas.</p>';
      return;
    }

    ofertaEstadoHistorial.innerHTML = interacciones.map((interaccion) => `
      <article class="crm-history__item">
        <div class="crm-history__meta">
          <strong>${escapeHtml(interaccion.tipo_interaccion || 'Interacción')}</strong>
          <span>${escapeHtml(formatInteractionDateTime(interaccion.fecha_interaccion) || '')}</span>
        </div>
        <p>${escapeHtml(interaccion.observaciones || 'Sin comentarios.')}</p>
      </article>
    `).join('');
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
    ofertaEstadoActual.value = oferta.estado ?? '';
    ofertaEstadoFecha.value = formatInteractionDateTime(new Date().toISOString());
    ofertaEstadoComentario.value = '';
    populateOfertaEstadoOptions(oferta.id_estado);
    renderOfertaEstadoHistorial(oferta.interacciones || []);

    ofertaEstadoModal.classList.add('is-visible');
    ofertaEstadoModal.setAttribute('aria-hidden', 'false');
  };

  const closeOfertaEditModal = () => {
    if (!ofertaEditModal) {
      return;
    }

    ofertaEditModal.classList.remove('is-visible');
    ofertaEditModal.setAttribute('aria-hidden', 'true');
    clearGenericFeedback(ofertaEditFeedback);
    if (ofertaEditForm) {
      ofertaEditForm.reset();
    }
  };

  const closeOfertaEstadoModal = () => {
    if (!ofertaEstadoModal) {
      return;
    }

    ofertaEstadoModal.classList.remove('is-visible');
    ofertaEstadoModal.setAttribute('aria-hidden', 'true');
    clearGenericFeedback(ofertaEstadoFeedback);
    if (ofertaEstadoForm) {
      ofertaEstadoForm.reset();
    }
    renderOfertaEstadoHistorial([]);
  };

  const renderSidebarNav = () => {
    if (!sidebarNavContainers.length) {
      return;
    }

    const totalOffers = estadosCache.reduce((sum, estado) => sum + Number(estado.total_ofertas || 0), 0);

    const items = [
      { view: 'nueva-oferta', icon: '＋', text: 'Insertar Presupuesto' },
      { view: 'todos', icon: '☰', text: 'Todos', count: totalOffers },
      ...estadosCache.map((estado) => ({
        view: `estado-${estado.id_estado}`,
        icon: '•',
        text: estado.descripcion_estado,
        count: Number(estado.total_ofertas || 0),
      })),
    ];

    const navHtml = items.map((item) => `
      <button class="nav-item" type="button" data-view="${item.view}" aria-current="false" aria-label="${escapeHtml(item.count !== undefined ? `${item.text} (${item.count})` : item.text)}">
        <span class="nav-item-icon">${item.icon}</span>
        <span class="nav-item-text">${escapeHtml(item.text)}</span>
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
          <td colspan="${activeColumns.length}" class="clientes-table__empty">No hay ofertas para esta vista.</td>
        </tr>
      `;
      return;
    }

    ofertasListadoTableBody.innerHTML = processedOfertas.map((oferta) => `
      <tr class="table-row table-row--oferta">
        ${activeColumns.map((column) => {
          if (column.key === 'acciones') {
            return `
              <td class="table-cell table-cell--actions ${getColumnCellClass('ofertas', 'acciones')}" data-label="Acciones">
                <div class="clientes-table__actions actions-inline">
                  <button class="btn-inline btn-inline--edit btn-inline--compact" type="button" data-edit-oferta="${oferta.id_oferta}" aria-label="Editar oferta ${escapeHtml(oferta.numero_oferta || oferta.Numero_oferta || oferta.id_oferta)}">Editar</button>
                  <button class="btn-inline btn-inline--save btn-inline--compact" type="button" data-change-estado-oferta="${oferta.id_oferta}" aria-label="Cambiar estado de la oferta ${escapeHtml(oferta.numero_oferta || oferta.Numero_oferta || oferta.id_oferta)}">Estado</button>
                </div>
              </td>
            `;
          }

          const rawValue = oferta[column.key];
          const displayValue = ['Fecha_email', 'Fecha_alta_oferta'].includes(column.key)
            ? formatDisplayDate(rawValue)
            : rawValue;

          if (column.key === 'Estado') {
            return `
              <td class="table-cell ${getColumnCellClass('ofertas', 'Estado')}" data-label="${escapeHtml(column.label)}">
                <div class="table-cell__stack table-cell__stack--compact">
                  ${renderStatusBadge(displayValue)}
                </div>
              </td>
            `;
          }

          if (column.key === 'Observaciones_oferta') {
            return renderStaticTableCell({
              tableKey: 'ofertas',
              rowId: oferta.id_oferta,
              columnKey: column.key,
              label: column.label,
              value: displayValue,
              contentClass: 'text-truncate text-truncate--single table-cell__content--muted',
              title: String(displayValue || ''),
            });
          }

          if (column.key === 'Numero_oferta' || column.key === 'Cliente') {
            return renderStaticTableCell({
              tableKey: 'ofertas',
              rowId: oferta.id_oferta,
              columnKey: column.key,
              label: column.label,
              value: displayValue,
              contentClass: 'table-cell__content--strong',
            });
          }

          if (column.key === 'Fecha_email' || column.key === 'Fecha_alta_oferta') {
            return renderStaticTableCell({
              tableKey: 'ofertas',
              rowId: oferta.id_oferta,
              columnKey: column.key,
              label: column.label,
              value: displayValue,
              contentClass: 'table-cell__content--muted',
            });
          }

          return renderTableCell({ tableKey: 'ofertas', rowId: oferta.id_oferta, columnKey: column.key, label: column.label, value: displayValue });
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
        ? `Listado de ofertas asociadas al estado ${label}.`
        : 'Listado de todas las ofertas registradas.';
    }

    if (ofertasListadoTableBody) {
      ofertasListadoTableBody.innerHTML = `
        <tr>
          <td colspan="${(typeof tableDefinitions.ofertas.getColumns === 'function' ? tableDefinitions.ofertas.getColumns() : tableDefinitions.ofertas.columns).length}" class="clientes-table__empty">Cargando ofertas...</td>
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
        throw new Error(result.message || 'No se pudieron consultar las ofertas');
      }

      ofertasListadoCache = Array.isArray(result.ofertas) ? result.ofertas : [];
      renderOfertasListado(ofertasListadoCache);
    } catch (error) {
      ofertasListadoCache = [];
      if (ofertasListadoTableBody) {
        ofertasListadoTableBody.innerHTML = `
          <tr>
            <td colspan="${(typeof tableDefinitions.ofertas.getColumns === 'function' ? tableDefinitions.ofertas.getColumns() : tableDefinitions.ofertas.columns).length}" class="clientes-table__empty">No se pudo cargar el listado.</td>
          </tr>
        `;
      }
      setGenericFeedback(ofertasListadoFeedback, error.message || 'No se pudo cargar el listado de ofertas.', 'error');
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

    const currentValue = selectedEstadoId || estadoColumnasSelect.value;
    estadoColumnasSelect.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = estados.length ? 'Selecciona un estado' : 'No hay estados creados';
    estadoColumnasSelect.appendChild(placeholderOption);

    estados.forEach((estado) => {
      const option = document.createElement('option');
      option.value = String(estado.id_estado);
      option.textContent = estado.descripcion_estado;
      estadoColumnasSelect.appendChild(option);
    });

    if (estados.some((estado) => String(estado.id_estado) === String(currentValue))) {
      estadoColumnasSelect.value = String(currentValue);
      selectedEstadoId = String(currentValue);
    } else {
      selectedEstadoId = '';
    }
  };

  const setEstadosMode = (mode) => {
    estadosModeButtons.forEach((button) => {
      const isActive = button.dataset.estadosMode === mode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    estadosModePanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.estadosModePanel === mode);
    });
  };

  const renderEstadosTable = () => {
    if (!estadosTableBody) {
      return;
    }

    const processedEstados = getProcessedRows('estados', estadosCache);
    const dragEnabled = isEstadosDragEnabled();

    if (!processedEstados.length) {
      estadosTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="clientes-table__empty">No hay estados creados todavía.</td>
        </tr>
      `;
      return;
    }

    estadosTableBody.innerHTML = processedEstados
      .map((estado) => {
        const isEditing = editingEstadoId === estado.id_estado;
        return `
          <tr data-estado-row="${estado.id_estado}" draggable="${dragEnabled ? 'true' : 'false'}" class="estado-drag-row ${dragEnabled ? '' : 'estado-drag-row--disabled'}">
            <td class="drag-handle ${dragEnabled ? '' : 'drag-handle--disabled'} column-drag" data-label="" title="${dragEnabled ? 'Arrastrar para reordenar' : 'El drag se desactiva si hay filtros o un orden distinto a Orden asc'}">⠿</td>
            <td class="${getColumnCellClass('estados', 'orden')}" data-label="Orden">
              ${isEditing
                ? `<input class="clientes-table__edit-number" type="number" min="1" step="1" value="${estado.orden ?? ''}" data-edit-estado-orden="${estado.id_estado}" />`
                : `<div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${escapeHtml(estado.orden ?? '')}</div></div>`}
            </td>
            ${isEditing
              ? `
            <td class="${getColumnCellClass('estados', 'descripcion_estado')}" data-label="Descripción estado">
              ${isEditing
                ? `<input class="clientes-table__edit-input" type="text" value="${escapeHtml(estado.descripcion_estado)}" data-edit-estado-input="${estado.id_estado}" maxlength="255" />`
                : escapeHtml(estado.descripcion_estado)}
            </td>
              `
              : renderStaticTableCell({ tableKey: 'estados', rowId: estado.id_estado, columnKey: 'descripcion_estado', value: estado.descripcion_estado, contentClass: 'table-cell__content--strong', title: estado.descripcion_estado })}
            <td class="table-cell table-cell--actions ${getColumnCellClass('estados', 'acciones')}" data-label="Acciones">
              <div class="clientes-table__actions actions-inline">
                ${isEditing
                  ? `
                    <button class="btn-inline btn-inline--save" type="button" data-save-estado="${estado.id_estado}">Guardar</button>
                    <button class="btn-inline btn-inline--cancel" type="button" data-cancel-estado="${estado.id_estado}">Cancelar</button>
                  `
                  : `<button class="btn-inline btn-inline--edit" type="button" data-edit-estado="${estado.id_estado}">Editar</button>`}
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
    const dragEnabled = isConfigColumnasDragEnabled();

    if (!selectedEstadoId) {
      configColumnasTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="clientes-table__empty">Selecciona un estado para ver sus columnas configuradas.</td>
        </tr>
      `;
      return;
    }

    if (!processedConfigs.length) {
      configColumnasTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="clientes-table__empty">No hay columnas configuradas para este estado.</td>
        </tr>
      `;
      return;
    }

    configColumnasTableBody.innerHTML = processedConfigs
      .map((config) => {
        const isEditing = editingConfigId === config.id_config;
        return `
          <tr data-config-row="${config.id_config}" draggable="${dragEnabled ? 'true' : 'false'}" class="estado-drag-row ${dragEnabled ? '' : 'estado-drag-row--disabled'}">
            <td class="drag-handle ${dragEnabled ? '' : 'drag-handle--disabled'} column-drag" data-label="" title="${dragEnabled ? 'Arrastrar para reordenar' : 'El drag se desactiva si hay filtros o un orden distinto a Orden asc'}">⠿</td>
            <td class="${getColumnCellClass('configColumnas', 'columna')}" data-label="Columna">
              ${isEditing
                ? `<select class="config-column-table__edit-input" data-edit-config-columna="${config.id_config}">${availableOfferColumns.map((column) => `<option value="${escapeHtml(column.value)}" ${column.value === config.columna ? 'selected' : ''}>${escapeHtml(column.label)}</option>`).join('')}</select>`
                : `<div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${escapeHtml(config.columna)}</div></div>`}
            </td>
            ${isEditing
              ? `
            <td class="${getColumnCellClass('configColumnas', 'descripcion_columna')}" data-label="Descripción">
              ${isEditing
                ? `<input class="config-column-table__edit-input" type="text" value="${escapeHtml(config.descripcion_columna || '')}" data-edit-config-descripcion="${config.id_config}" maxlength="255" />`
                : escapeHtml(config.descripcion_columna || '')}
            </td>
              `
              : renderStaticTableCell({ tableKey: 'configColumnas', rowId: config.id_config, columnKey: 'descripcion_columna', value: config.descripcion_columna || '', contentClass: 'text-truncate text-truncate--single table-cell__content--muted', title: config.descripcion_columna || '' })}
            <td class="${getColumnCellClass('configColumnas', 'orden_columna')}" data-label="Orden">
              ${isEditing
                ? `<input class="config-column-table__edit-number" type="number" min="1" step="1" value="${config.orden_columna ?? ''}" data-edit-config-orden="${config.id_config}" />`
                : `<div class="table-cell__stack"><div class="table-cell__content table-cell__content--plain">${escapeHtml(config.orden_columna ?? '')}</div></div>`}
            </td>
            <td class="table-cell table-cell--actions ${getColumnCellClass('configColumnas', 'acciones')}" data-label="Acciones">
              <div class="clientes-table__actions actions-inline">
                ${isEditing
                  ? `
                    <span class="form-help">Se guarda al salir</span>
                    <button class="btn-inline btn-inline--delete" type="button" data-delete-config="${config.id_config}">Eliminar</button>
                    <button class="btn-inline btn-inline--cancel" type="button" data-cancel-config="${config.id_config}">Cancelar</button>
                  `
                  : `<button class="btn-inline btn-inline--edit" type="button" data-edit-config="${config.id_config}">Editar</button>`}
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

          if (currentListadoContext.estadoId === Number(selectedEstadoId)) {
            await loadListadoColumnasEstado(Number(selectedEstadoId));
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
    if (currentListadoContext.estadoId === Number(selectedEstadoId)) {
      await loadListadoColumnasEstado(Number(selectedEstadoId));
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

      estadosCache = Array.isArray(result.estados) ? result.estados : [];
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
    currentOfferColumnsConfig = estadoId ? await fetchConfiguracionColumnas(estadoId) : [];
    setupTableHeaderControls('ofertas');
    return currentOfferColumnsConfig;
  };

  const setClientesMode = (mode) => {
    clientesModeButtons.forEach((button) => {
      const isActive = button.dataset.clientesMode === mode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    clientesModePanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.clientesModePanel === mode);
    });
  };

  const renderClientesTable = () => {
    if (!clientesTableBody) {
      return;
    }

    const processedClientes = getProcessedRows('clientes', clientesCache);

    if (!processedClientes.length) {
      clientesTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="clientes-table__empty">No hay clientes creados todavía.</td>
        </tr>
      `;
      return;
    }

    clientesTableBody.innerHTML = processedClientes
      .map((cliente) => {
        const isEditing = editingClienteId === cliente.id_cliente;
        return `
          <tr data-cliente-row="${cliente.id_cliente}">
            ${renderStaticTableCell({ tableKey: 'clientes', rowId: cliente.id_cliente, columnKey: 'id_cliente', value: cliente.id_cliente })}
            ${isEditing
              ? `
            <td class="${getColumnCellClass('clientes', 'descripcion_cliente')}" data-label="Descripción cliente">
              ${isEditing
                ? `<input class="clientes-table__edit-input" type="text" value="${escapeHtml(cliente.descripcion_cliente)}" data-edit-cliente-input="${cliente.id_cliente}" maxlength="255" />`
                : escapeHtml(cliente.descripcion_cliente)}
            </td>
              `
              : renderStaticTableCell({ tableKey: 'clientes', rowId: cliente.id_cliente, columnKey: 'descripcion_cliente', value: cliente.descripcion_cliente, contentClass: 'table-cell__content--strong', title: cliente.descripcion_cliente })}
            ${isEditing
              ? `
            <td class="${getColumnCellClass('clientes', 'dominio')}" data-label="Dominio">
              ${isEditing
                ? `<input class="clientes-table__edit-input" type="text" value="${escapeHtml(cliente.dominio || '')}" data-edit-cliente-dominio="${cliente.id_cliente}" maxlength="255" placeholder="cliente.com" />`
                : escapeHtml(cliente.dominio || '')}
            </td>
              `
              : renderStaticTableCell({ tableKey: 'clientes', rowId: cliente.id_cliente, columnKey: 'dominio', value: cliente.dominio || '', contentClass: 'table-cell__content--muted', title: cliente.dominio || '' })}
            <td class="table-cell table-cell--actions ${getColumnCellClass('clientes', 'acciones')}" data-label="Acciones">
              <div class="clientes-table__actions actions-inline">
                ${isEditing
                  ? `
                    <button class="btn-inline btn-inline--save" type="button" data-save-cliente="${cliente.id_cliente}">Guardar</button>
                    <button class="btn-inline btn-inline--cancel" type="button" data-cancel-cliente="${cliente.id_cliente}">Cancelar</button>
                  `
                  : `<button class="btn-inline btn-inline--edit" type="button" data-edit-cliente="${cliente.id_cliente}">Editar</button>`}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  };

  const setActiveView = (viewName) => {
    const navItems = getNavItems();
    const isListadoView = viewName === 'todos' || viewName.startsWith('estado-');
    const panelViewName = isListadoView ? 'listado-ofertas' : viewName;

    navItems.forEach((item) => {
      const isActive = item.dataset.view === viewName;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    configButtons.forEach((configButton) => {
      const isConfigActive = viewName === 'configuracion' || viewName === 'clientes' || viewName === 'estados';
      configButton.classList.toggle('active', isConfigActive);
      configButton.setAttribute('aria-current', isConfigActive ? 'page' : 'false');
    });

    getViewPanels().forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.viewPanel === panelViewName);
    });

    if (window.navigationManager && window.navigationManager.setNavigationStack) {
      window.navigationManager.setNavigationStack(
        viewName === 'clientes'
          ? [
              { label: 'Inicio', target: 'inicio', htmlFile: null },
              { label: 'Configuración', target: 'configuracion', htmlFile: null },
              { label: 'Clientes', target: 'clientes', htmlFile: null },
            ]
          : viewName === 'estados'
            ? [
                { label: 'Inicio', target: 'inicio', htmlFile: null },
                { label: 'Configuración', target: 'configuracion', htmlFile: null },
                { label: 'Estados', target: 'estados', htmlFile: null },
              ]
          : viewName === 'todos'
            ? [
                { label: 'Inicio', target: 'inicio', htmlFile: null },
                { label: 'Todos', target: 'todos', htmlFile: null },
              ]
          : viewName.startsWith('estado-')
            ? [
                { label: 'Inicio', target: 'inicio', htmlFile: null },
                { label: currentListadoContext.label, target: viewName, htmlFile: null },
              ]
          : viewName === 'configuracion'
            ? [
                { label: 'Inicio', target: 'inicio', htmlFile: null },
                { label: 'Configuración', target: 'configuracion', htmlFile: null },
              ]
            : [
                { label: 'Inicio', target: 'inicio', htmlFile: null },
                { label: '+ Insertar Presupuesto', target: 'nueva-oferta', htmlFile: null },
              ]
      );
    }

    if (viewName === 'nueva-oferta') {
      loadNextNumeroOferta();
      loadClientes({ silent: true });
    }

    if (viewName === 'clientes') {
      clearGenericFeedback(clientesTableFeedback);
      loadClientes({ silent: false });
      setClientesMode('crear');
    }

    if (viewName === 'estados') {
      clearGenericFeedback(estadosTableFeedback);
      clearGenericFeedback(configColumnasTableFeedback);
      loadEstados({ silent: false });
      setEstadosMode('crear');
      loadConfiguracionColumnas({ estadoId: selectedEstadoId, silent: true });
    }

    if (viewName === 'todos') {
      currentListadoContext = { viewName, estadoId: null, label: 'Todos' };
      currentOfferColumnsConfig = [];
      setupTableHeaderControls('ofertas');
      loadOfertasListado({ estadoId: null, label: 'Todos' });
    }

    if (viewName.startsWith('estado-')) {
      const estadoId = Number(viewName.replace('estado-', ''));
      const estado = estadosCache.find((item) => item.id_estado === estadoId);
      const label = estado?.descripcion_estado || 'Estado';
      currentListadoContext = { viewName, estadoId, label };
      loadListadoColumnasEstado(estadoId).then(() => loadOfertasListado({ estadoId, label }));
    }
  };

  document.addEventListener('click', (event) => {
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

    document.querySelectorAll('.table-actions-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target)) {
        menu.removeAttribute('open');
      }
    });

    const viewButton = event.target.closest('[data-view]');
    if (!viewButton) {
      const editOfertaButton = event.target.closest('[data-edit-oferta]');
      if (editOfertaButton) {
        const ofertaId = Number(editOfertaButton.dataset.editOferta);

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

            openOfertaEditModal(result.oferta || {});
          } catch (error) {
            setGenericFeedback(ofertasListadoFeedback, error.message || 'No se pudo cargar la oferta.', 'error');
          }
        });
        return;
      }

      const changeEstadoButton = event.target.closest('[data-change-estado-oferta]');
      if (changeEstadoButton) {
        const ofertaId = Number(changeEstadoButton.dataset.changeEstadoOferta);

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

            openOfertaEstadoModal(result.oferta || {});
          } catch (error) {
            setGenericFeedback(ofertasListadoFeedback, error.message || 'No se pudo cargar la oferta.', 'error');
          }
        });
        return;
      }

      const closeOfertaModalButton = event.target.closest('[data-close-oferta-modal]');
      if (closeOfertaModalButton) {
        closeOfertaEditModal();
        return;
      }

      const closeOfertaEstadoModalButton = event.target.closest('[data-close-oferta-estado-modal]');
      if (closeOfertaEstadoModalButton) {
        closeOfertaEstadoModal();
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
    const state = tableStates[tableKey];
    if (!state) {
      return;
    }

    state.filters[filterKey] = filterInput.value;

    if (tableKey === 'ofertas') {
      renderOfertasListado(ofertasListadoCache);
    } else if (tableKey === 'clientes') {
      renderClientesTable();
    } else if (tableKey === 'estados') {
      renderEstadosTable();
    } else if (tableKey === 'configColumnas') {
      renderConfigColumnasTable();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ofertaEditModal?.classList.contains('is-visible')) {
      closeOfertaEditModal();
      return;
    }

    if (event.key === 'Escape' && ofertaEstadoModal?.classList.contains('is-visible')) {
      closeOfertaEstadoModal();
    }
  });

  configCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (card.dataset.configTarget === 'clientes') {
        setActiveView('clientes');
        return;
      }

      if (card.dataset.configTarget === 'estados') {
        setActiveView('estados');
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

  estadosModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setEstadosMode(button.dataset.estadosMode);
      clearGenericFeedback(estadoCreateFeedback);
      clearGenericFeedback(estadosTableFeedback);
    });
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
      window.navigationManager.setNavigationStack([
        { label: 'Inicio', target: 'inicio', htmlFile: null },
        { label: '+ Insertar Presupuesto', target: 'nueva-oferta', htmlFile: null },
      ]);
    } else {
      window.navigationManager.updateBreadcrumb();
    }
  }

  window.addEventListener('userLoggedIn', () => {
    loadAvailableOfferColumns();
    loadClientes({ silent: true });
    loadEstados({ silent: true }).then(() => setActiveView('nueva-oferta'));
  });

  if (mailDropzone && mailFileInput) {
    mailDropzone.addEventListener('click', () => {
      mailFileInput.click();
    });

    mailDropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
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
      const file = mailFileInput.files?.[0];
      if (file) {
        importMailFile(file);
      }
    });
  }

  if (form && feedback) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearFeedback();

      try {
        const response = await fetch('/api/ofertas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildPayload()),
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo guardar la oferta');
        }

        if (numeroOfertaField && result.numero_oferta) {
          numeroOfertaField.value = result.numero_oferta;
        }

        setFeedback(`Oferta ${result.numero_oferta || ''} guardada correctamente.`, 'success');
        window.setTimeout(() => {
          window.location.assign('/');
        }, 500);
      } catch (error) {
        setFeedback(error.message || 'Se produjo un error al guardar la oferta.', 'error');
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
        loadNextNumeroOferta();
      });
    });
  }

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

        setGenericFeedback(ofertaEstadoFeedback, result.message || 'Estado actualizado correctamente.', 'success');
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

  if (clienteCreateForm) {
    clienteCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

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

  if (estadoCreateForm) {
    estadoCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = estadoCreateForm.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
      }

      clearGenericFeedback(estadoCreateFeedback);

      try {
        const formData = new FormData(estadoCreateForm);
        const response = await fetch('/api/estados', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(formData.entries())),
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'No se pudo crear el estado');
        }

        estadoCreateForm.reset();
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

  if (estadosTableBody) {
    estadosTableBody.addEventListener('click', async (event) => {
      const editButton = event.target.closest('[data-edit-estado]');
      const cancelButton = event.target.closest('[data-cancel-estado]');
      const saveButton = event.target.closest('[data-save-estado]');

      if (editButton) {
        editingEstadoId = Number(editButton.dataset.editEstado);
        clearGenericFeedback(estadosTableFeedback);
        renderEstadosTable();
        return;
      }

      if (cancelButton) {
        editingEstadoId = null;
        clearGenericFeedback(estadosTableFeedback);
        renderEstadosTable();
        return;
      }

      if (saveButton) {
        const estadoId = Number(saveButton.dataset.saveEstado);
        const input = estadosTableBody.querySelector(`[data-edit-estado-input="${estadoId}"]`);
        const ordenInput = estadosTableBody.querySelector(`[data-edit-estado-orden="${estadoId}"]`);
        const descripcionEstado = input ? input.value.trim() : '';
        const ordenEstado = ordenInput && ordenInput.value.trim() !== '' ? Number(ordenInput.value) : null;

        try {
          const response = await fetch(`/api/estados/${estadoId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ descripcion_estado: descripcionEstado, orden: ordenEstado }),
          });

          const result = await response.json();

          if (!response.ok || result.success === false) {
            throw new Error(result.message || 'No se pudo actualizar el estado');
          }

          editingEstadoId = null;
          setGenericFeedback(estadosTableFeedback, result.message || 'Estado actualizado correctamente.', 'success');
          await loadEstados({ silent: true });
        } catch (error) {
          setGenericFeedback(estadosTableFeedback, error.message || 'No se pudo actualizar el estado.', 'error');
        }
      }
    });
  }

  if (configColumnCreateForm) {
    configColumnCreateForm.addEventListener('submit', async (event) => {
      event.preventDefault();

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
        if (currentListadoContext.estadoId === Number(selectedEstadoId)) {
          await loadListadoColumnasEstado(Number(selectedEstadoId));
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
      const editButton = event.target.closest('[data-edit-config]');
      const cancelButton = event.target.closest('[data-cancel-config]');
      const deleteButton = event.target.closest('[data-delete-config]');

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
          if (currentListadoContext.estadoId === Number(selectedEstadoId)) {
            await loadListadoColumnasEstado(Number(selectedEstadoId));
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
    setupAllTableHeaderControls();
    try {
      const res = await fetch('/api/session/check');
      const data = await res.json();
      if (data.authenticated) {
        // Sincronizar localStorage con los datos del servidor
        if (data.user) {
          const stored = JSON.parse(localStorage.getItem('usuarioSGA') || 'null');
          if (!stored || !stored.id) {
            localStorage.setItem('usuarioSGA', JSON.stringify({ ...data.user, success: true }));
            if (window.LoginModal && window.LoginModal.updateUserWidget) {
              window.LoginModal.updateUserWidget();
            }
          }
        }
        await loadAvailableOfferColumns();
        await loadEstados({ silent: true });
        await loadClientes({ silent: true });
        setActiveView('nueva-oferta');
      } else {
        // Sesión inválida: limpiar localStorage para que loginModal muestre el modal
        localStorage.removeItem('usuarioSGA');
        await loadAvailableOfferColumns();
        renderSidebarNav();
      }
    } catch {
      // Error de red: intentar con localStorage como fallback
      if (isAuthenticated()) {
        await loadAvailableOfferColumns();
        await loadEstados({ silent: true });
        await loadClientes({ silent: true });
        setActiveView('nueva-oferta');
      } else {
        await loadAvailableOfferColumns();
        renderSidebarNav();
      }
    }
  };

  initApp();
});
