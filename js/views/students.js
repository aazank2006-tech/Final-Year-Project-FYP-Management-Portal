/* Students view (spec §5.3). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var S = FYP.Selectors;
  var K = FYP.ViewKit;
  var Utils = FYP.Utils;
  var el = UI.el;

  var filters = { program: '', assignment: '', search: '' };

  function render(container) {
    container.appendChild(UI.viewHead('Students', 'Directory of students and their project associations.'));

    var listHost = el('div');
    var programSel = el('select', { id: 'st-program' }, [{ value: '', label: 'All programs' }].concat(programs()));
    var assignSel = el('select', { id: 'st-assign' }, [
      { value: '', label: 'All students' },
      { value: 'assigned', label: 'Assigned' },
      { value: 'unassigned', label: 'Unassigned' }
    ]);
    var searchInput = el('input', { id: 'st-search', type: 'text', placeholder: 'Search name or ID\u2026' });
    programSel.value = filters.program; assignSel.value = filters.assignment; searchInput.value = filters.search;

    programSel.addEventListener('change', function () { filters.program = programSel.value; refresh(); });
    assignSel.addEventListener('change', function () { filters.assignment = assignSel.value; refresh(); });
    searchInput.addEventListener('input', Utils.debounce(function () { filters.search = searchInput.value; refresh(); }, 200));

    container.appendChild(UI.section(null, el('div', { class: 'toolbar' }, [
      UI.field('Program', programSel), UI.field('Assignment', assignSel), UI.field('Search', searchInput)
    ])));
    container.appendChild(listHost);

    function refresh() {
      UI.clear(listHost);
      var rows = S.filterStudents(filters);
      if (!rows.length) { listHost.appendChild(UI.emptyState('No students match your criteria.', 'Try adjusting the filters.')); return; }
      listHost.appendChild(UI.table([
        { key: 'name', label: 'Name', render: function (s) { return el('span', { class: 'cell-title', text: s.name }); } },
        {
          key: 'studentId', label: 'Student ID', render: function (s) {
            if (!S.isDuplicateStudentId(s.studentId)) return el('span', { text: s.studentId });
            return el('span', { class: 'chip-row' }, [el('span', { text: s.studentId }), UI.badge({ label: 'Duplicate student ID', tone: C.TONE.DANGER })]);
          }
        },
        { key: 'program', label: 'Program' },
        { key: 'projectId', label: 'Project', render: function (s) { return s.projectId ? S.projectTitle(s.projectId) : 'Unassigned'; } },
        { key: 'teamRole', label: 'Team role', render: function (s) { return s.teamRole || 'Not provided'; } },
        { key: 'actions', label: '', render: function (s) { return el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: 'View', onclick: function () { K.openStudentDetail(s.id); } }); } }
      ], rows));
    }
    refresh();
  }

  function programs() {
    var seen = {};
    FYP.Store.all('students').forEach(function (s) { if (s.program) seen[s.program] = true; });
    return Object.keys(seen).sort().map(function (p) { return { value: p, label: p }; });
  }

  FYP.Views = FYP.Views || {};
  FYP.Views.Students = { render: render };
})(window);