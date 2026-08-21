function escapeToastHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 토스트 알림 시스템
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            this.container.style.zIndex = '1050';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000, action = null) {
        this.init();

        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        const iconMap = {
            'success': 'fa-check-circle',
            'danger': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        const actionButton = action
            ? `<button type="button" class="btn btn-sm btn-light text-nowrap me-2 toast-action">${escapeToastHtml(action.label)}</button>`
            : '';

        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="toast-body">
                    <i class="fas ${iconMap[type] || iconMap.info} me-2"></i>${escapeToastHtml(message)}
                </div>
                ${actionButton}
                <button type="button" class="btn-close btn-close-white me-2" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        this.container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        toast.querySelector('.toast-action')?.addEventListener('click', () => {
            action.onClick();
            bsToast.hide();
        });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
};

window.Toast = Toast;
