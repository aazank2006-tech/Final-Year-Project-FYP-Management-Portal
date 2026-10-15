/* Submissions view (spec §5.8). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var S = FYP.Selectors;
  var K = FYP.ViewKit;
  var Utils = FYP.Utils;
  var el = UI.el;

  var filters = { status: '', projectId: '', type: '' };

  function render(container) {
    var session = K.session();
    var actions = [];
    if (S.can(session.role, 'createSubmission')) {
      actions.push(el('button', { class: 'btn', type: 'button', text: 'New submission', onclick: function () { K.openSubmissionModal({}, function () { FYP.Router.rerender(); }); } }));
    }
    container.appendChild(UI.viewHead('Submissions', 'Deliverables submitted against projects and milestones.', actions));

    var listHost = el('div');
    var statusSel = el('select', { id: 'sb-status' }, [{ value: '', label: 'All statuses' }].concat(Utils.values(C.SUBMISSION_STATUS).map(function (v) { return { value: v, label: v }; })));
    var projSel = el('select', { id: 'sb-project' }, [{ value: '', label: 'All projects' }].concat(FYP.Store.all('projects').map(function (p) { return { value: p.id, label: p.title }; })));
    var typeSel = el('select', { id: 'sb-type' }, [{ value: '', label: 'All types' }].concat(Utils.values(C.SUBMISSION_TYPE).map(function (v) { return { value: v, label: v }; })));
    statusSel.value = filters.status; projSel.value = filters.projectId; typeSel.value = filters.type;

    statusSel.addEventListener('change', function () { filters.status = statusSel.value; refresh(); });
    projSel.addEventListener('change', function () { filters.projectId = projSel.value; refresh(); });
    typeSel.addEventListener('change', function () { filters.type = typeSel.value; refresh(); });

    container.appendChild(UI.section(null, el('div', { class: 'toolbar' }, [
      UI.field('Status', statusSel), UI.field('Project', projSel), UI.field('Type', typeSel)
    ])));
    container.appendChild(listHost);

    function refresh() {
      UI.clear(listHost);
      var rows = S.filterSubmissions(filters);
      if (!rows.length) { listHost.appendChild(UI.emptyState('No submissions match your criteria.', 'Try adjusting the filters.')); return; }
      listHost.appendChild(K.submissionTable(rows, true, refresh));
    }
    refresh();
  }

  FYP.Views = FYP.Views || {};
  FYP.Views.Submissions = { render: render };
})(window);