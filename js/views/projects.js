/* Projects view (spec §5.2). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var S = FYP.Selectors;
  var K = FYP.ViewKit;
  var Utils = FYP.Utils;
  var el = UI.el;

  var filters = { status: '', domain: '', supervisorId: '', search: '' };

  function optionList(values, placeholder) {
    return [{ value: '', label: placeholder }].concat(values);
  }

  function render(container) {
    var session = K.session();
    var actions = [];
    if (S.can(session.role, 'submitIdea')) {
      actions.push(el('button', { class: 'btn', type: 'button', text: 'Submit new idea', onclick: function () { K.openIdeaModal(function () { FYP.Router.rerender(); }); } }));
    }
    container.appendChild(UI.viewHead('Projects', 'Browse and filter final-year projects.', actions));

    var listHost = el('div');

    var statusSel = el('select', { id: 'flt-status' }, optionList(Utils.values(C.PROJECT_STATUS).map(function (v) { return { value: v, label: v }; }), 'All statuses'));
    var domainSel = el('select', { id: 'flt-domain' }, optionList(uniqueDomains(), 'All domains'));
    var supSel = el('select', { id: 'flt-supervisor' }, optionList(FYP.Store.all('supervisors').map(function (s) { return { value: s.id, label: s.name }; }), 'All supervisors'));
    var searchInput = el('input', { id: 'flt-search', type: 'text', placeholder: 'Search title or team\u2026' });

    statusSel.value = filters.status;
    domainSel.value = filters.domain;
    supSel.value = filters.supervisorId;
    searchInput.value = filters.search;

    statusSel.addEventListener('change', function () { filters.status = statusSel.value; refresh(); });
    domainSel.addEventListener('change', function () { filters.domain = domainSel.value; refresh(); });
    supSel.addEventListener('change', function () { filters.supervisorId = supSel.value; refresh(); });
    searchInput.addEventListener('input', Utils.debounce(function () { filters.search = searchInput.value; refresh(); }, 200));

    container.appendChild(UI.section(null, el('div', { class: 'toolbar' }, [
      UI.field('Status', statusSel), UI.field('Domain', domainSel), UI.field('Supervisor', supSel), UI.field('Search', searchInput)
    ])));
    container.appendChild(listHost);

    function refresh() {
      UI.clear(listHost);
      var results = S.filterProjects(filters);
      if (!results.length) {
        listHost.appendChild(UI.emptyState('No projects match your criteria.', 'Try adjusting or clearing the filters.'));
        return;
      }
      listHost.appendChild(el('div', { class: 'grid grid-3' }, results.map(K.projectCard)));
    }
    refresh();
  }

  function uniqueDomains() {
    var seen = {};
    FYP.Store.all('projects').forEach(function (p) {
      if (p.domain) seen[p.domain] = true;
    });
    return Object.keys(seen).sort().map(function (d) { return { value: d, label: d }; });
  }

  FYP.Views = FYP.Views || {};
  FYP.Views.Projects = { render: render };
})(window);