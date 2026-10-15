/* Dashboard view (spec §5.1). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var S = FYP.Selectors;
  var K = FYP.ViewKit;
  var Utils = FYP.Utils;
  var el = UI.el;

  function metricCard(label, value, route) {
    return UI.card({
      interactive: true,
      onClick: function () { FYP.Router.navigate(route); },
      body: el('div', { class: 'metric-card' }, [
        el('span', { class: 'metric-value', text: String(value) }),
        el('span', { class: 'metric-label', text: label })
      ])
    });
  }

  function deadlineList(entries, emptyTitle) {
    if (!entries.length) return UI.emptyState(emptyTitle || 'No upcoming deadlines.', 'Deadlines within reach will appear here.');
    return UI.table([
      { key: 'label', label: 'Deadline', render: function (e) { return el('span', { class: 'cell-title', text: e.deadline.label }); } },
      { key: 'dueDate', label: 'Due date', render: function (e) { return Utils.formatDate(e.deadline.dueDate); } },
      { key: 'related', label: 'Related to', render: function (e) { return relatedLabel(e.deadline); } },
      { key: 'state', label: 'Status', render: function (e) { return K.deadlineBadge(e.state); } }
    ], entries);
  }

  function relatedLabel(deadline) {
    if (deadline.relatedType === 'Milestone') {
      var m = FYP.Store.find('milestones', deadline.relatedId);
      return m ? (FYP.Selectors.projectTitle(m.projectId) + ' \u2014 ' + m.name) : 'Milestone';
    }
    var s = FYP.Store.find('submissions', deadline.relatedId);
    return s ? (FYP.Selectors.projectTitle(s.projectId) + ' \u2014 ' + s.title) : 'Submission';
  }

  function render(container) {
    var session = K.session();
    var role = session.role;
    container.appendChild(UI.viewHead('Dashboard', 'Overview for the acting role: ' + role + ' (' + session.actorName + ')'));

    var summary = S.dashboardSummary();
    container.appendChild(el('div', { class: 'grid grid-metrics' }, [
      metricCard('Total Projects', summary.projects, 'projects'),
      metricCard('Students', summary.students, 'students'),
      metricCard('Supervisors', summary.supervisors, 'supervisors'),
      metricCard('Pending Submissions', summary.pendingSubmissions, 'submissions'),
      metricCard('Upcoming Deadlines', summary.upcomingDeadlines, 'projects')
    ]));

    if (role === C.ROLE.STUDENT) renderStudentFocus(container, session);
    else if (role === C.ROLE.SUPERVISOR) renderSupervisorFocus(container, session);
    else renderCoordinatorFocus(container);

    container.appendChild(UI.section('Deadlines', deadlineList(relevantDeadlines(role, session), 'No upcoming deadlines.')));
  }

  function ownProjects(session) {
    return FYP.Store.all('projects').filter(function (p) { return p.ownerStudentId === session.actorId; });
  }

  function relevantDeadlines(role, session) {
    var entries = S.upcomingDeadlines();
    if (role !== C.ROLE.STUDENT) return entries;
    var ids = {};
    FYP.Store.all('milestones').forEach(function (m) {
      var p = FYP.Store.find('projects', m.projectId);
      if (p && p.ownerStudentId === session.actorId) ids[MKEY(m)] = true;
    });
    return entries.filter(function (e) {
      if (e.deadline.relatedType === 'Milestone') {
        var m = FYP.Store.find('milestones', e.deadline.relatedId);
        var p = m ? FYP.Store.find('projects', m.projectId) : null;
        return p && p.ownerStudentId === session.actorId;
      }
      var s = FYP.Store.find('submissions', e.deadline.relatedId);
      return s && s.submittedBy === session.actorId;
    });
  }
  function MKEY(m) { return 'm' + m.id; }

  function renderStudentFocus(container, session) {
    var mine = ownProjects(session);
    var actions = [el('button', { class: 'btn', type: 'button', text: 'Submit new idea', onclick: function () { K.openIdeaModal(function () { FYP.Router.rerender(); }); } })];
    container.appendChild(UI.section('My Projects', (mine.length ? el('div', { class: 'grid grid-2' }, mine.map(K.projectCard)) : UI.emptyState('No projects yet.', 'Submit an idea to get started.')), el('div', { class: 'btn-row', style: 'margin-bottom:12px' }, actions)));
  }

  function renderSupervisorFocus(container, session) {
    var assigned = FYP.Store.all('projects').filter(function (p) { return p.supervisorId === session.actorId; });
    var pendingRequests = FYP.Store.all('supervisionRequests').filter(function (r) { return r.supervisorId === session.actorId && r.status === 'Pending'; });
    var awaiting = FYP.Store.all('submissions').filter(function (s) {
      var p = FYP.Store.find('projects', s.projectId);
      return p && p.supervisorId === session.actorId && (s.status === C.SUBMISSION_STATUS.SUBMITTED || s.status === C.SUBMISSION_STATUS.UNDER_REVIEW);
    });
    container.appendChild(UI.section('Assigned Teams', assigned.length ? el('div', { class: 'grid grid-2' }, assigned.map(K.projectCard)) : UI.emptyState('No assigned projects.', 'Accepted supervision requests will appear here.')));
    container.appendChild(UI.section('Pending Review Items', el('div', { class: 'grid grid-2' }, [
      UI.card({ title: 'Idea requests awaiting decision', body: pendingRequests.length ? el('div', { class: 'stack' }, pendingRequests.map(function (r) { return el('div', { class: 'small' }, [el('strong', { text: FYP.Selectors.projectTitle(r.projectId) })]); })) : el('p', { class: 'muted', text: 'No pending requests.' }) }),
      UI.card({ title: 'Submissions awaiting review', body: awaiting.length ? el('div', { class: 'stack' }, awaiting.map(function (s) { return el('div', { class: 'small' }, [el('strong', { text: s.title })]); })) : el('p', { class: 'muted', text: 'Nothing awaiting review.' }) })
    ])));
  }

  function renderCoordinatorFocus(container) {
    var projects = FYP.Store.all('projects');
    container.appendChild(UI.section('Portal-wide Project Progress', UI.table([
      { key: 'title', label: 'Project', render: function (p) { return el('span', { class: 'cell-title', text: p.title }); } },
      { key: 'status', label: 'Status', render: function (p) { return UI.badge({ label: p.status }); } },
      { key: 'supervisorId', label: 'Supervisor', render: function (p) { return S.supervisorName(p.supervisorId); } },
      { key: 'progress', label: 'Progress', render: function (p) { return UI.progressBar(S.projectProgress(p.id)); } }
    ], projects)));
  }

  FYP.Views = FYP.Views || {};
  FYP.Views.Dashboard = { render: render };
})(window);