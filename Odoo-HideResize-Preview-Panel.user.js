// ==UserScript==
// @name            Odoo Hide & Resize Preview Panel
// @name:tr         Odoo Önizleme Panelini Gizleme ve Boyutlandırma
// @namespace       https://github.com/sipsak
// @version         1.1
// @description     Adds hide and resize functionality to the preview panel in Odoo. Simply double-click the splitter in the middle to restore the panel to its default size.
// @description:tr  Odoo'da bulunan önizleme paneline gizleme ve boyutlandırma özellikleri ekler, paneli varsayılan boyutuna döndürmek için ortaya çift tıklamanız yeterlidir.
// @author          Burak Şipşak
// @match           https://portal.bskhvac.com.tr/*
// @match           https://*.odoo.com/*
// @grant           none
// @icon            data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNDQuNTIxIDUuNWE0LjQ3NyA0LjQ3NyAwIDAgMSAwIDYuMzMybC0zNC4xOSAzNC4xOUg0VjM5LjY5TDM4LjE5IDUuNWE0LjQ3NyA0LjQ3NyAwIDAgMSA2LjMzMSAwWiIgZmlsbD0iIzJFQkNGQSIvPjxwYXRoIGQ9Ik0xMC45IDE1LjEyMiA0Ljg5OCA5LjEyYTkuMDA0IDkuMDA0IDAgMCAwIDEwLjQ4IDEyLjU2OGwyMy4wMDEgMjNhNC40NzcgNC40NzcgMCAwIDAgNi4zMzEtNi4zM2wtMjMtMjMuMDAxQTkuMDA0IDkuMDA0IDAgMCAwIDkuMTQxIDQuODc3bDYuMDAyIDYuMDAyLTQuMjQzIDQuMjQzWiIgZmlsbD0iIzk4NTE4NCIvPjxwYXRoIGQ9Ik0yNS4wMjMgMTguNjcgMTguNjkgMjVsNi4zMzIgNi4zMzFMMzEuMzUyIDI1bC02LjMzLTYuMzMxWiIgZmlsbD0iIzE0NDQ5NiIvPjwvc3ZnPgo=
// @updateURL       https://raw.githubusercontent.com/sipsak/Odoo-Batch-Processing/main/Odoo-HideResize-Preview-Panel.user.js
// @downloadURL     https://raw.githubusercontent.com/sipsak/Odoo-Batch-Processing/main/Odoo-HideResize-Preview-Panel.user.js
// ==/UserScript==

(function () {
    'use strict';

    const SPLITTER_CLASS = 'tm-odoo-splitter';
    const INITED_ATTR = 'data-tm-splitter-inited';
    const MIN_PANEL_PX = 120;
    const SPLITTER_WIDTH = 8;

    const css = `
    .${SPLITTER_CLASS} {
        width: ${SPLITTER_WIDTH}px;
        min-width: ${SPLITTER_WIDTH}px;
        max-width: ${SPLITTER_WIDTH}px;
        cursor: col-resize;
        background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12));
        position: relative;
        z-index: 30;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
    }
    .${SPLITTER_CLASS}:hover {
        background: linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0.18));
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.03);
    }

    .tm-collapse-overlay-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 60;
        background: rgba(255,255,255,0.95);
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 3px;
        padding: 4px 6px;
        cursor: default;
        font-weight: 700;
        box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        user-select: none;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    .tm-collapse-overlay-btn:hover { background: rgba(255,255,255,1); }
    .o_attachment_preview:hover .tm-collapse-overlay-btn {
        opacity: 1;
    }

    .tm-attachment-placeholder.o_attachment_preview {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        z-index: 70;
        width: 0;
        overflow: visible;
        pointer-events: none;
    }
    .tm-attachment-placeholder.o_attachment_preview .o_attachment_control {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: black;
        opacity: 0.3;
        transition: all 0.3s;
        border-radius: 0 30px 30px 0;
        padding: 15px 15px 15px 5px;
        pointer-events: auto;
        cursor: default;
        user-select: none;
    }
    .tm-attachment-placeholder.o_attachment_preview .o_attachment_control:hover {
        opacity: 0.7;
    }
    .tm-attachment-placeholder.o_attachment_preview .o_attachment_control::after {
        color: white;
        content: '>>';
    }

    .tm-attachment-placeholder.o_attachment_preview.hidden {
        width: 0;
    }
    .tm-attachment-placeholder.o_attachment_preview.hidden .o_attachment_control {
        right: 0;
        border-radius: 30px 0 0 30px;
        padding: 15px 0 15px 15px;
    }
    .tm-attachment-placeholder.o_attachment_preview.hidden .o_attachment_control::after {
        content: '<';
    }
    .tm-attachment-placeholder.o_attachment_preview.hidden .o_attachment_control:hover::after {
        content: '<<';
    }
    .tm-attachment-placeholder.o_attachment_preview.hidden .o_attachment_control:hover {
        padding-right: 5px;
    }

    .tm-central-toggle.o_attachment_control {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: black;
        opacity: 0;
        transition: all 0.25s;
        border-radius: 0 30px 30px 0;
        padding: 12px 12px 12px 6px;
        pointer-events: auto;
        cursor: default;
        user-select: none;
        z-index: 80;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        min-height: 28px;
        box-sizing: content-box;
        left: 0;
    }
    .tm-central-toggle.o_attachment_control:hover { opacity: 0.7; }
    .o_attachment_preview:hover .tm-central-toggle.o_attachment_control {
        opacity: 0.3;
    }
    .o_attachment_preview:hover .tm-central-toggle.o_attachment_control:hover {
        opacity: 0.7;
    }
    .tm-central-toggle.o_attachment_control::after {
        color: white;
        content: '>>';
        font-weight: 700;
    }
    `;

    injectStyle(css);

    const mo = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length) {
                tryAttachSplitters();
                break;
            } else if (m.type === 'attributes') {
                tryAttachSplitters();
            }
        }
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        tryAttachSplitters();
    } else {
        window.addEventListener('DOMContentLoaded', tryAttachSplitters);
    }

    function tryAttachSplitters() {
        const containers = document.querySelectorAll('.o_form_renderer');
        containers.forEach(container => {
            const left = container.querySelector('.o_form_sheet_bg');
            const right = container.querySelector('.o_attachment_preview');

            if (!left || !right) {
                container.removeAttribute(INITED_ATTR);
                return;
            }

            const alreadyInited = container.getAttribute(INITED_ATTR) === '1';
            const existingSplitter = container.querySelector('.' + SPLITTER_CLASS);

            if (alreadyInited) {
                if (!existingSplitter) {
                    container.removeAttribute(INITED_ATTR);
                } else {
                    setupCollapseControls(container, left, right, existingSplitter);
                    if (container._tmSaved && container._tmSaved.collapsed) {
                        enforceCollapsedState(container, left, right, existingSplitter);
                    }
                    setTimeout(() => updateAllCentralPositions(container, left, right, existingSplitter), 30);
                    return;
                }
            }

            container.setAttribute(INITED_ATTR, '1');

            const splitter = document.createElement('div');
            splitter.className = SPLITTER_CLASS;
            splitter.setAttribute('data-tm-splitter', '1');
            left.parentNode.insertBefore(splitter, right);

            container._tmSaved = container._tmSaved || {};

            setupPointerDrag(splitter, container, left, right);
            setupCollapseControls(container, left, right, splitter);

            if (container._tmSaved && container._tmSaved.collapsed) {
                enforceCollapsedState(container, left, right, splitter);
            }
            setTimeout(() => updateAllCentralPositions(container, left, right, splitter), 30);
        });
    }

    function setupPointerDrag(splitter, container, left, right) {
        let dragging = false;
        let startX = 0;
        let startLeftWidth = 0;
        const splitterW = SPLITTER_WIDTH;

        splitter.addEventListener('dblclick', () => {
            left.style.removeProperty('flex');
            left.style.removeProperty('width');
            left.style.removeProperty('min-width');
            right.style.removeProperty('flex');
            right.style.removeProperty('min-width');
            if (container._tmSaved) container._tmSaved.dragged = false;
            try { splitter.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 180 }); } catch (e) {}
            setTimeout(() => updateAllCentralPositions(container, left, right, splitter), 40);
        });

        splitter.addEventListener('pointerdown', (e) => {
            if (container._tmSaved && container._tmSaved.collapsed) return;
            e.preventDefault();
            splitter.setPointerCapture(e.pointerId);
            dragging = true;
            startX = e.clientX;

            const leftRect = left.getBoundingClientRect();
            startLeftWidth = leftRect.width;

            left.style.flex = '0 0 ' + startLeftWidth + 'px';
            right.style.flex = right.style.flex || '1 1 auto';

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onPointerMove = (ev) => {
                if (!dragging) return;
                const dx = ev.clientX - startX;
                let newLeft = startLeftWidth + dx;

                const containerRect = container.getBoundingClientRect();
                const maxLeft = containerRect.width - MIN_PANEL_PX - splitterW;
                const minLeft = MIN_PANEL_PX;
                if (newLeft < minLeft) newLeft = minLeft;
                if (newLeft > maxLeft) newLeft = maxLeft;

                left.style.flex = '0 0 ' + newLeft + 'px';
                container._tmSaved = container._tmSaved || {};
                container._tmSaved.dragged = true;

                updateAllCentralPositions(container, left, right, splitter);
            };

            const onPointerUp = (ev) => {
                dragging = false;
                try { splitter.releasePointerCapture(e.pointerId); } catch (err) {}
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                updateAllCentralPositions(container, left, right, splitter);
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        });

        splitter.tabIndex = 0;
        splitter.addEventListener('keydown', (e) => {
            const step = e.shiftKey ? 40 : 8;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (container._tmSaved && container._tmSaved.collapsed) return;
                let leftRect = left.getBoundingClientRect();
                let leftW = leftRect.width + (e.key === 'ArrowLeft' ? -step : step);

                const containerRect = container.getBoundingClientRect();
                const maxLeft = containerRect.width - MIN_PANEL_PX - splitterW;
                const minLeft = MIN_PANEL_PX;
                if (leftW < minLeft) leftW = minLeft;
                if (leftW > maxLeft) leftW = maxLeft;

                left.style.flex = '0 0 ' + leftW + 'px';
                right.style.flex = right.style.flex || '1 1 auto';
                container._tmSaved = container._tmSaved || {};
                container._tmSaved.dragged = true;

                setTimeout(() => updateAllCentralPositions(container, left, right, splitter), 20);
            }
        });

        window.addEventListener('resize', () => updateAllCentralPositions(container, left, right, splitter));
    }

    function setupCollapseControls(container, left, right, splitter) {
        container._tmSaved = container._tmSaved || {};
        container._tmSaved.left = container._tmSaved.left || {};
        container._tmSaved.right = container._tmSaved.right || {};

        function tryInjectIntoIframe() {
            if (container._tmSaved && container._tmSaved.collapsed) {
                enforceCollapsedState(container, left, right, splitter);
                return;
            }
            const iframe = right.querySelector('iframe') || right.querySelector('object') || null;
            if (iframe) {
                ensureCentralButtonInsideRight(splitter, container, left, right);
                const existingOverlay = right.querySelector('.tm-collapse-overlay-btn');
                if (existingOverlay && existingOverlay.parentNode) existingOverlay.parentNode.removeChild(existingOverlay);
                return;
            }
            ensureOverlayButton(right, container, left, splitter);
        }

        tryInjectIntoIframe();

        const rightMo = new MutationObserver((muts) => {
            if (container._tmSaved && container._tmSaved.collapsed) return;
            tryInjectIntoIframe();
            setTimeout(() => updateAllCentralPositions(container, left, right, splitter), 40);
        });
        rightMo.observe(right, { childList: true, subtree: true, attributes: true });
    }

    function enforceCollapsedState(container, left, right, splitter) {
        try {
            if (!container._tmSaved) container._tmSaved = {};
            if (container._tmSaved.leftInline === undefined) container._tmSaved.leftInline = left.getAttribute('style') || '';
            if (container._tmSaved.rightInline === undefined) container._tmSaved.rightInline = right.getAttribute('style') || '';
            if (container._tmSaved.splitterInline === undefined) container._tmSaved.splitterInline = (splitter && splitter.getAttribute('style')) || '';
        } catch (e) {}
        try {
            right.style.display = 'none';
        } catch (e) {}
        try {
            if (splitter) splitter.style.display = 'none';
        } catch (e) {}
        try {
            left.style.flex = '1 1 100%';
            left.style.width = '';
            left.style.minWidth = '';
        } catch (e) {}
        try {
            const overlay = right.querySelector('.tm-collapse-overlay-btn');
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        } catch (e) {}
        try {
            const central = right.querySelector('.tm-central-toggle');
            if (central && central.parentNode) central.parentNode.removeChild(central);
        } catch (e) {}
        if (!container._tmSaved) container._tmSaved = {};
        if (!container._tmSaved._placeholder) {
            const parent = container.parentNode || document.body;
            const placeholder = document.createElement('div');
            placeholder.className = 'o_attachment_preview hidden tm-attachment-placeholder';
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
            placeholder.style.top = '0';
            placeholder.style.right = '0';
            placeholder.style.height = '100%';
            placeholder.style.pointerEvents = 'auto';
            const ctl = document.createElement('div');
            ctl.className = 'o_attachment_control';
            ctl.textContent = '';
            ctl.setAttribute('role', 'button');
            ctl.addEventListener('click', (e) => {
                e.preventDefault();
                reopenAttachment(container, left, right, splitter, placeholder);
            });
            placeholder.appendChild(ctl);
            parent.appendChild(placeholder);
            container._tmSaved._placeholder = placeholder;
        }
        container._tmSaved.collapsed = true;
    }

    function ensureCentralButtonInsideRight(splitter, container, left, right) {
        if (!right) return;
        try {
            const oldOnSplitter = splitter.querySelector('.tm-central-toggle');
            if (oldOnSplitter && oldOnSplitter.parentNode) oldOnSplitter.parentNode.removeChild(oldOnSplitter);
        } catch (e) {}

        let ctl = right.querySelector('.tm-central-toggle');
        if (!ctl) {
            ctl = document.createElement('div');
            ctl.className = 'o_attachment_control tm-central-toggle';
            ctl.setAttribute('role', 'button');
            ctl.innerText = '';
            ctl.style.pointerEvents = 'auto';
            ctl.addEventListener('click', (e) => {
                e.preventDefault();
                collapseAttachment(container, left, right, splitter);
            });
            if (getComputedStyle(right).position === 'static') {
                right.style.position = 'relative';
            }
            right.appendChild(ctl);
            setTimeout(() => updateCentralButtonPosition(splitter, right, ctl), 10);
        } else {
            updateCentralButtonPosition(splitter, right, ctl);
        }
    }

    function ensureOverlayButton(rightElement, container, left, splitter) {
        if (!rightElement) return;
        if (rightElement.querySelector('.tm-collapse-overlay-btn')) return;
        if (getComputedStyle(rightElement).position === 'static') {
            rightElement.style.position = 'relative';
        }
        const overlay = document.createElement('div');
        overlay.className = 'tm-collapse-overlay-btn';
        overlay.innerText = '✕';
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            collapseAttachment(container, left, rightElement, splitter);
        });
        rightElement.appendChild(overlay);
    }

    function updateAllCentralPositions(container, left, right, splitter) {
        try {
            const ctl = right.querySelector('.tm-central-toggle');
            if (ctl) updateCentralButtonPosition(splitter, right, ctl);
        } catch (err) {}
    }

    function updateCentralButtonPosition(splitter, right, ctl) {
        if (!splitter || !right || !ctl) return;
        try {
            const spRect = splitter.getBoundingClientRect();
            const rightRect = right.getBoundingClientRect();
            if (!spRect.width || !rightRect.width) return;

            const centerX = spRect.left + spRect.width / 2;

            let offsetCenterInRight = centerX - rightRect.left;

            const btnW = (ctl.offsetWidth > 0) ? ctl.offsetWidth : 28;

            let desiredLeft = offsetCenterInRight - btnW / 2;

            const minLeft = 0;
            const maxLeft = Math.max(0, rightRect.width - btnW);
            if (desiredLeft < minLeft) desiredLeft = minLeft;
            if (desiredLeft > maxLeft) desiredLeft = maxLeft;

            ctl.style.left = Math.round(desiredLeft) + 'px';
        } catch (e) {}
    }

    function collapseAttachment(container, left, right, splitter) {
        container._tmSaved = container._tmSaved || {};
        if (container._tmSaved.collapsed) return;

        container._tmSaved.leftInline = left.getAttribute('style') || '';
        container._tmSaved.rightInline = right.getAttribute('style') || '';
        container._tmSaved.splitterInline = splitter.getAttribute('style') || '';
        try {
            const leftRect = left.getBoundingClientRect();
            container._tmSaved.leftWidthPx = Math.round(leftRect.width);
        } catch (e) {}

        right.style.display = 'none';
        splitter.style.display = 'none';

        left.style.flex = '1 1 100%';
        left.style.width = '';
        left.style.minWidth = '';

        const overlay = right.querySelector('.tm-collapse-overlay-btn');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);

        try {
            const central = right.querySelector('.tm-central-toggle');
            if (central && central.parentNode) central.parentNode.removeChild(central);
        } catch (err) {}

        if (!container._tmSaved._placeholder) {
            const parent = container.parentNode || document.body;
            const placeholder = document.createElement('div');
            placeholder.className = 'o_attachment_preview hidden tm-attachment-placeholder';
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
            placeholder.style.top = '0';
            placeholder.style.right = '0';
            placeholder.style.height = '100%';
            placeholder.style.pointerEvents = 'auto';

            const ctl = document.createElement('div');
            ctl.className = 'o_attachment_control';
            ctl.textContent = '';
            ctl.setAttribute('role', 'button');

            ctl.addEventListener('click', (e) => {
                e.preventDefault();
                reopenAttachment(container, left, right, splitter, placeholder);
            });

            placeholder.appendChild(ctl);
            parent.appendChild(placeholder);
            container._tmSaved._placeholder = placeholder;
        }

        container._tmSaved.collapsed = true;
    }

    function reopenAttachment(container, left, right, splitter, placeholderElement) {
        if (!left || !left.isConnected) left = container.querySelector('.o_form_sheet_bg');
        if (!right || !right.isConnected) right = container.querySelector('.o_attachment_preview');
        if (!splitter || !splitter.isConnected) splitter = container.querySelector('.' + SPLITTER_CLASS);
        let placeholder = placeholderElement || (container.parentNode || document.body).querySelector('.tm-attachment-placeholder');
        if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);

        if (container._tmSaved) {
            left.setAttribute('style', container._tmSaved.leftInline || '');
            right.setAttribute('style', container._tmSaved.rightInline || '');
            splitter.setAttribute('style', container._tmSaved.splitterInline || '');
            if (!container._tmSaved.leftInline) left.removeAttribute('style');
            if (!container._tmSaved.rightInline) right.removeAttribute('style');
            if (!container._tmSaved.splitterInline) splitter.removeAttribute('style');
            if (!container._tmSaved.leftInline && container._tmSaved.leftWidthPx) {
                left.style.flex = '0 0 ' + container._tmSaved.leftWidthPx + 'px';
            }
            right.style.flex = right.style.flex || '1 1 auto';
            right.style.display = '';
            splitter.style.display = '';
            container._tmSaved.collapsed = false;
            container._tmSaved._placeholder = null;
        } else {
            right.style.display = '';
            splitter.style.display = '';
            left.style.removeProperty('flex');
        }

        setTimeout(() => {
            try {
                const iframe = right.querySelector('iframe') || right.querySelector('object');
                if (iframe) {
                    const overlay = right.querySelector('.tm-collapse-overlay-btn');
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    ensureCentralButtonInsideRight(splitter, container, left, right);
                } else {
                    ensureOverlayButton(right, container, left, splitter);
                }
            } catch (err) {
                if (right && !right.querySelector('.tm-collapse-overlay-btn')) {
                    if (getComputedStyle(right).position === 'static') right.style.position = 'relative';
                    const overlay = document.createElement('div');
                    overlay.className = 'tm-collapse-overlay-btn';
                    overlay.innerText = '✕';
                    overlay.addEventListener('click', (e) => {
                        e.preventDefault();
                        collapseAttachment(container, left, right, splitter);
                    });
                    right.appendChild(overlay);
                }
            }
            setTimeout(() => updateAllCentralPositions(container, left, right, splitter), 60);
        }, 300);
    }

    function injectStyle(s) {
        const st = document.createElement('style');
        st.type = 'text/css';
        st.appendChild(document.createTextNode(s));
        document.head.appendChild(st);
    }

})();
