/* Supervisors view (spec §5.4). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var S = FYP.Selectors;
  var K = FYP.ViewKit;
  var Utils = FYP.Utils;
  var el = UI.el;

  var filters = { department: '', search: '' };

  function render(container) {
    container.appendChild(UI.viewHead('Supervisors', 'Faculty directory with supervision capacity.'));

    var listHost = el('div');
    var deptSel = el('select', { id: 'sp-dept' }, [{ value: '', label: 'All departments' }].concat(departments()));
    var searchInput = el('input', { id: 'sp-search', type: 'text', placeholder: 'Search name or specialization\u2026' });
    deptSel.value = filters.department; searchInput.value = filters.search;

    deptSel.addEventListener('change', function () { filters.department = deptSel.value; refresh(); });
    searchInput.addEventListener('input', Utils.debounce(function () { filters.search = searchInput.value; refresh(); }, 200));

    container.appendChild(UI.section(null, el('div', { class: 'toolbar' }, [
      UI.field('Department', deptSel), UI.field('Search', searchInput)
    ])));
    container.appendChild(listHost);

    function refresh() {
      UI.clear(listHost);
      var rows = S.filterSupervisors(filters);
      if (!rows.length) { listHost.appendChild(UI.emptyState('No supervisors match your criteria.', 'Try adjusting the filters.')); return; }
      listHost.appendChild(UI.table([
        { key: 'name', label: 'Name', render: function (s) { return el('span', { class: 'cell-title', text: s.name }); } },
        { key: 'department', label: 'Department' },
        { key: 'specialization', label: 'Specialization', render: function (s) { return s.specialization || 'Not specified'; } },
        { key: 'count', label: 'Supervised', render: function (s) { return String(S.supervisorCapacity(s.id).assigned); } },
        {
          key: 'capacity', label: 'Capacity', render: function (s) {
            var cap = S.supervisorCapacity(s.id);
            return el('span', { class: 'chip-row' }, [
              el('span', { text: cap.assigned + ' / ' + cap.capacity }),
              cap.atCapacity ? UI.badge({ label: 'At capacity', tone: C.TONE.DANGER }) : UI.badge({ label: cap.remaining + ' free', tone: C.TONE.SUCCESS })
            ]);
          }
        },
        { key: 'actions', label: '', render: function (s) { return el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: 'View', onclick: function () { K.openSupervisorDetail(s.id); } }); } }
      ], rows));
    }
    refresh();
  }

  function departments() {
    var seen = {};
    FYP.Store.all('supervisors').forEach(function (s) { if (s.department) seen[s.department] = true; });
    return Object.keys(seen).sort().map(function (d) { return { value: d, label: d }; });
  }

  FYP.Views = FYP.Views || {};
  FYP.Views.Supervisors = { render: render };
})(window);