/* Reusable UI components (design I-13). All text is set via textContent. */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Utils = FYP.Utils;
  var TONE = C.TONE;

  function appendChildren(node, children) {
    if (children === null || children === undefined) return;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
    });
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'dataset') {
          Object.keys(value).forEach(function (d) { node.dataset[d] = value[d]; });
        } else if (typeof value === 'boolean') {
          if (value) node.setAttribute(key, '');
        } else if (key.indexOf('on') === 0 && typeof value === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'for') {
          node.htmlFor = value;
        } else {
          node.setAttribute(key, value);
        }
      });
    }
    appendChildren(node, children);
    return node;
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function statusTone(status) {
    switch (status) {
      case C.PROJECT_STATUS.COMPLETED:
      case C.MILESTONE_STATUS.COMPLETED:
      case C.SUBMISSION_STATUS.APPROVED:
      case C.DEADLINE_STATE.UPCOMING:
        return TONE.SUCCESS;
      case C.PROJECT_STATUS.IN_PROGRESS:
      case C.MILESTONE_STATUS.IN_PROGRESS:
      case C.SUBMISSION_STATUS.UNDER_REVIEW:
      case C.DEADLINE_STATE.DUE_SOON:
        return TONE.INFO;
      case C.PROJECT_STATUS.IDEA_SUBMITTED:
      case C.PROJECT_STATUS.SUPERVISOR_PENDING:
      case C.SUBMISSION_STATUS.SUBMITTED:
        return TONE.NEUTRAL;
      case C.MILESTONE_STATUS.PENDING:
        return TONE.WARNING;
      case C.SUBMISSION_STATUS.NEEDS_REVISION:
      case C.MILESTONE_STATUS.OVERDUE:
      case C.PROJECT_STATUS.REJECTED:
      case C.DEADLINE_STATE.OVERDUE:
        return TONE.DANGER;
      default:
        return TONE.NEUTRAL;
    }
  }

  function badge(opts) {
    opts = opts || {};
    var tone = opts.tone || statusTone(opts.label);
    return el('span', { class: 'badge badge-' + tone, text: opts.label || 'Unknown' });
  }

  function progressBar(progress) {
    var known = progress && progress.percent !== null && progress.percent !== undefined;
    var track = el('div', { class: 'progress-track' });
    if (known) {
      track.appendChild(el('div', { class: 'progress-fill', style: 'width:' + progress.percent + '%' }));
    }
    return el('div', { class: 'progress' }, [
      track,
      el('span', { class: 'progress-value', text: progress ? progress.label : 'Not started' })
    ]);
  }

  function card(opts) {
    opts = opts || {};
    var head = null;
    if (opts.title || opts.headRight) {
      head = el('div', { class: 'card-head' }, [
        el('div', null, [
          el('h3', { class: 'card-title', text: opts.title || '' }),
          opts.sub ? el('p', { class: 'card-sub', text: opts.sub }) : null
        ]),
        opts.headRight || null
      ]);
    }
    var attrs = { class: 'card' + (opts.interactive ? ' card-interactive' : '') };
    if (opts.interactive) {
      attrs.tabindex = '0';
      attrs.role = 'button';
      if (opts.onClick) {
        attrs.onclick = opts.onClick;
        attrs.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onClick(e); } };
      }
    }
    var node = el('div', attrs, [head, opts.body ? el('div', { class: 'card-body' }, opts.body) : null]);
    return node;
  }

  function emptyState(title, message) {
    return el('div', { class: 'empty-state' }, [
      el('strong', { text: title || 'Nothing here yet' }),
      el('span', { text: message || '' })
    ]);
  }

  function table(columns, rows, opts) {
    opts = opts || {};
    var thead = el('thead', null, el('tr', null, columns.map(function (col) {
      return el('th', { text: col.label, scope: 'col' });
    })));
    var tbody = el('tbody');
    rows.forEach(function (row) {
      var tr = el('tr', row.__click ? { class: 'row-clickable', onclick: function () { row.__click(row); } } : null,
        columns.map(function (col) {
          var cell = el('td');
          var content = col.render ? col.render(row) : row[col.key];
          if (content && content.nodeType) cell.appendChild(content);
          else if (content !== null && content !== undefined) cell.textContent = String(content);
          else cell.textContent = '';
          if (col.className) cell.className = col.className;
          return cell;
        }));
      tbody.appendChild(tr);
    });
    return el('div', { class: 'table-wrap' }, el('table', { class: 'data-table' }, [thead, tbody]));
  }

  function form(opts) {
    opts = opts || {};
    var inputs = {};
    var errorNodes = {};
    var fields = (opts.fields || []).map(function (field) {
      var control;
      if (field.type === 'textarea') {
        control = el('textarea', { id: 'f-' + field.name, placeholder: field.placeholder || '' });
        if (field.value) control.value = field.value;
      } else if (field.type === 'select') {
        control = el('select', { id: 'f-' + field.name });
        (field.options || []).forEach(function (opt) {
          var o = el('option', { value: opt.value, text: opt.label });
          if (String(opt.value) === String(field.value)) o.selected = true;
          control.appendChild(o);
        });
      } else {
        control = el('input', { id: 'f-' + field.name, type: field.type || 'text', placeholder: field.placeholder || '' });
        if (field.value !== undefined && field.value !== null) control.value = field.value;
      }
      inputs[field.name] = control;
      errorNodes[field.name] = el('div', { class: 'field-error', role: 'alert' });
      return el('div', { class: 'field' }, [
        el('label', { for: 'f-' + field.name, text: field.label + (field.required ? ' *' : '') }),
        control,
        field.hint ? el('div', { class: 'small muted', text: field.hint }) : null,
        errorNodes[field.name]
      ]);
    });

    function collect() {
      var values = {};
      Object.keys(inputs).forEach(function (name) { values[name] = inputs[name].value; });
      return values;
    }

    function setErrors(errors) {
      Object.keys(inputs).forEach(function (name) {
        var node = errorNodes[name];
        var control = inputs[name];
        if (errors && errors[name]) {
          node.textContent = errors[name];
          control.classList.add('invalid');
        } else {
          node.textContent = '';
          control.classList.remove('invalid');
        }
      });
    }

    var submitBtn = el('button', { class: 'btn', type: 'submit', text: opts.submitLabel || 'Submit' });
    var formNode = el('form', { class: 'stack', novalidate: true }, fields.concat([
      el('div', { class: 'btn-row' }, [submitBtn, opts.extraButton || null])
    ]));

    formNode.addEventListener('submit', function (e) {
      e.preventDefault();
      setErrors({});
      if (typeof opts.onSubmit === 'function') opts.onSubmit(collect(), { setErrors: setErrors, reset: function () { formNode.reset(); } });
    });

    formNode.__collect = collect;
    formNode.__setErrors = setErrors;
    return formNode;
  }

  function toast(message, tone) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var node = el('div', { class: 'toast toast-' + (tone || 'info'), role: 'status', text: message });
    root.appendChild(node);
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 4200);
  }

  function modal(opts) {
    opts = opts || {};
    var root = document.getElementById('modal-root');
    if (!root) return { close: function () {} };
    var backdrop;
    function close() { if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    backdrop = el('div', { class: 'modal-backdrop', onclick: function (e) { if (e.target === backdrop) close(); } }, 
      el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Dialog' }, [
        el('div', { class: 'modal-head' }, [
          el('h3', { text: opts.title || '' }),
          el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Close', text: '\u00D7', onclick: close })
        ]),
        el('div', { class: 'modal-body' }, opts.body)
      ]));
    root.appendChild(backdrop);
    document.addEventListener('keydown', onKey);
    return { close: close };
  }

  function feedbackList(items, emptyTitle) {
    if (!items || !items.length) return emptyState(emptyTitle || 'No feedback yet.', 'Feedback from your supervisor will appear here.');
    return el('ul', { class: 'timeline' }, items.map(function (f) {
      var author = FYP.Selectors.supervisorName(f.authorId);
      return el('li', null, [
        el('div', { class: 'meta', text: author + ' \u00B7 ' + Utils.formatDate(f.createdDate) }),
        el('div', { class: 'text', text: f.comment })
      ]);
    }));
  }

  function viewHead(title, subtitle, actions) {
    return el('div', { class: 'view-head' }, [
      el('div', null, [
        el('h2', { text: title }),
        subtitle ? el('p', { text: subtitle }) : null
      ]),
      actions ? el('div', { class: 'btn-row' }, actions) : null
    ]);
  }

  function section(title, children, afterTitle) {
    return el('section', { class: 'section' }, [
      title ? el('h3', { text: title }) : null,
      afterTitle || null,
      children
    ]);
  }

  function field(labelText, control) {
    return el('div', { class: 'field' }, [el('label', { text: labelText }), control]);
  }

  FYP.UI = Object.freeze({
    el: el,
    viewHead: viewHead,
    section: section,
    field: field,
    clear: clear,
    badge: badge,
    statusTone: statusTone,
    progressBar: progressBar,
    card: card,
    emptyState: emptyState,
    table: table,
    form: form,
    toast: toast,
    modal: modal,
    feedbackList: feedbackList
  });
})(window);