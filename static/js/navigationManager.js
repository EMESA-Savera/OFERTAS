class NavigationManager {
  constructor() {
    this.navigationStack = [{ label: 'Inicio', target: 'inicio', htmlFile: null }];
  }

  setNavigationStack(stack) {
    this.navigationStack = Array.isArray(stack) && stack.length
      ? stack
      : [{ label: 'Inicio', target: 'inicio', htmlFile: null }];
    this.updateBreadcrumb();
  }

  updateBreadcrumb() {
    const container = document.getElementById('breadcrumbContainer');
    if (!container) {
      return;
    }

    container.innerHTML = '';
    this.navigationStack.forEach((item, index) => {
      const isLast = index === this.navigationStack.length - 1;
      const itemNode = document.createElement(isLast ? 'span' : 'button');
      itemNode.className = isLast ? 'breadcrumb-item breadcrumb-last' : 'breadcrumb-item breadcrumb-clickable';
      itemNode.textContent = item.label;

      if (!isLast) {
        itemNode.type = 'button';
        if (item.target) {
          itemNode.dataset.target = item.target;
        }
      }

      container.appendChild(itemNode);

      if (!isLast) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '>';
        container.appendChild(separator);
      }
    });
  }
}

window.navigationManager = new NavigationManager();
