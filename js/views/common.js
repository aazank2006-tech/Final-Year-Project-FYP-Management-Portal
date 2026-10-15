/* Shared view helpers and detail modals. */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var S = FYP.Selectors;
  var Utils = FYP.Utils;
  var el = UI.el;
  var PS = C.PROJECT_STATUS;
  var MS = C.MILESTONE_STATUS;
  var SS = C.SUBMISSION_STATUS;
  var FT = C.FEEDBACK_TARGET;

  function session() { return FYP.Session.get(); }

  function deadlineBadge(state) {
    if (!state) return UI.badge({ label: 'No deadline set', tone: C.TONE.NEUTRAL });
    return UI.badge({ label: state });
  }

  function projectStatusBadge(p) { return UI.badge({ label: p.status }); }

  function kv(pairs) {
    var dl = el('dl', { class: 'kv' });
    pairs.forEach(function (pair) {
      dl.appendChild(el('dt', { text: pair[0] }));
      var dd = el('dd');
      if (pair[1] && pair[1].nodeType) dd.appendChild(pair[1]);
      else dd.textContent = pair[1] === null || pair[1] === undefined || pair[1] === '' ? 'Not provided' : String(pair[1]);
      dl.appendChild(dd);
    });
    return dl;
  }

  /* ---------- project card ---------- */
  function projectCard(p) {
    var progress = S.projectProgress(p.id);
    var team = S.teamName(p.teamId);
    var headRight = projectStatusBadge(p);
    var body = [
      el('div', { class: 'chip-row' }, [
        UI.badge({ label: p.domain || 'No domain', tone: C.TONE.NEUTRAL })
      ]),
      kv([
        ['Supervisor', p.supervisorId ? S.supervisorName(p.supervisorId) : 'Unassigned'],
        ['Team', team || 'Team not formed'],
        ['Created', Utils.formatDate(p.createdDate)]
      ]),
      UI.progressBar(progress)
    ];
    return UI.card({ title: p.title, sub: 'Project ' + p.id, headRight: headRight, body: body, interactive: true, onClick: function () { openProjectDetail(p.id); } });
  }

  /* ---------- project detail modal ---------- */
  function openProjectDetail(projectId) {
    var host = el('div');
    var modal;
    function refresh() {
      UI.clear(host);
      host.appendChild(buildProjectDetail(projectId, refresh));
    }
    refresh();
    modal = UI.modal({ title: 'Project Detail', body: host });
    return modal;
  }

  function buildProjectDetail(projectId, refresh) {
    var detail = S.projectDetail(projectId);
    if (!detail) return UI.emptyState('Project not found.', 'This record no longer exists.');
    var p = detail.project;
    var role = session().role;
    var nodes = [];

    nodes.push(el('div', { class: 'card-head' }, [
      el('div', null, [el('h3', { text: p.title }), el('p', { class: 'card-sub', text: 'Owned by ' + S.studentName(p.ownerStudentId) })]),
      projectStatusBadge(p)
    ]));
    nodes.push(kv([
      ['Domain', p.domain || 'Not provided'],
      ['Supervisor', p.supervisorId ? S.supervisorName(p.supervisorId) : 'Unassigned'],
      ['Team', detail.team ? detail.team.teamName : 'Team not formed'],
      ['Created', Utils.formatDate(p.createdDate)]
    ]));
    nodes.push(el('p', { class: 'muted', text: p.description }));
    nodes.push(UI.progressBar(detail.progress));

    var requestable = [PS.IDEA_SUBMITTED, PS.SUPERVISOR_PENDING].indexOf(p.status) !== -1;
    if (role === C.ROLE.STUDENT && p.ownerStudentId === session().actorId && requestable && !p.supervisorId) {
      var pending = FYP.Store.all('supervisionRequests').filter(function (r) { return r.projectId === p.id && r.status === 'Pending'; });
      nodes.push(el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', text: 'Select supervisor', onclick: function () { openRequestSupervisorModal(p.id, function () { if (refresh) refresh(); }); } })
      ]));
      if (pending.length) nodes.push(el('div', { class: 'banner banner-info', text: 'A supervision request is pending for this project.' }));
    }

    nodes.push(el('hr', { class: 'hr' }));
    nodes.push(el('h4', { text: 'Team Members' }));
    if (!detail.members.length) {
      nodes.push(el('p', { class: 'muted', text: 'Team not formed.' }));
    } else {
      nodes.push(UI.table(
        [{ key: 'name', label: 'Member' }, { key: 'teamRole', label: 'Role', render: function (r) { return r.teamRole || 'Member'; } }],
        detail.members
      ));
    }

    nodes.push(el('hr', { class: 'hr' }));
    nodes.push(el('h4', { text: 'Milestones' }));
    nodes.push(milestoneTable(detail.milestones, refresh));

    nodes.push(el('hr', { class: 'hr' }));
    nodes.push(el('h4', { text: 'Submissions' }));
    nodes.push(submissionTable(detail.submissions, false, refresh));

    nodes.push(el('hr', { class: 'hr' }));
    nodes.push(el('h4', { text: 'Feedback (newest first)' }));
    nodes.push(UI.feedbackList(FS(detail.feedback), 'No feedback yet.'));
    if (S.can(role, 'addFeedback')) {
      nodes.push(el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', text: 'Add project feedback', onclick: function () { openFeedbackModal(FT.PROJECT, p.id, p.title, refresh); } })
      ]));
    }

    nodes.push(el('hr', { class: 'hr' }));
    nodes.push(el('h4', { text: 'Evaluations' }));
    nodes.push(evaluationTable(detail.evaluations));
    if (S.can(role, 'recordEvaluation')) {
      nodes.push(el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', text: 'Record evaluation', onclick: function () { openEvaluationModal({ projectId: p.id }, refresh); } })
      ]));
    }

    return el('div', { class: 'stack' }, nodes);
  }

  function FS(list) { return list; }

  function milestoneTable(milestones, refresh) {
    if (!milestones.length) return UI.emptyState('No milestones yet.', 'Milestones will appear once the project is scheduled.');
    var role = session().role;
    var canManage = S.can(role, 'manageMilestones');
    return UI.table([
      { key: 'name', label: 'Milestone' },
      { key: 'dueDate', label: 'Due', render: function (m) { return Utils.formatDate(m.dueDate); } },
      { key: 'status', label: 'Status', render: function (m) { return UI.badge({ label: S.milestoneDisplayStatus(m) }); } },
      {
        key: 'actions', label: 'Actions', render: function (m) {
          if (!canManage || m.status === MS.COMPLETED) return el('span', { class: 'muted small', text: m.status === MS.COMPLETED ? 'Completed' : '\u2014' });
          var btn = m.status === MS.PENDING
            ? el('button', { class: 'btn btn-sm btn-secondary', type: 'button', text: 'Start', onclick: function () { advance(m, MS.IN_PROGRESS, refresh); } })
            : el('button', { class: 'btn btn-sm', type: 'button', text: 'Complete', onclick: function () { advance(m, MS.COMPLETED, refresh); } });
          return btn;
        }
      }
    ], milestones);
  }

  function advance(m, next, refresh) {
    var res = FYP.MilestoneService.setStatus(m.id, next);
    if (!res.ok) { UI.toast(firstError(res.errors), 'danger'); return; }
    UI.toast('Milestone updated.', 'success');
    if (refresh) refresh();
  }

  function firstError(errors) {
    if (!errors) return 'Action failed.';
    var keys = Object.keys(errors);
    return keys.length ? errors[keys[0]] : 'Action failed.';
  }

  function submissionTable(submissions, showActions, refresh) {
    if (!submissions.length) return UI.emptyState('No submissions yet.', 'Submitted deliverables will be listed here.');
    var role = session().role;
    var canReview = showActions && S.can(role, 'reviewSubmission');
    var columns = [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'projectId', label: 'Project', render: function (s) { return S.projectTitle(s.projectId); } },
      { key: 'submittedBy', label: 'Submitter', render: function (s) { return S.studentName(s.submittedBy); } },
      { key: 'submittedDate', label: 'Date', render: function (s) { return Utils.formatDate(s.submittedDate); } },
      { key: 'status', label: 'Status', render: function (s) { return UI.badge({ label: s.status }); } },
      { key: 'timeliness', label: 'Timeliness', render: function (s) { var t = S.submissionTimeliness(s); return t ? UI.badge({ label: t, tone: t === 'Late' ? C.TONE.WARNING : C.TONE.SUCCESS }) : UI.badge({ label: 'No deadline set', tone: C.TONE.NEUTRAL }); } }
    ];
    if (canReview) {
      columns.push({
        key: 'actions', label: 'Review', render: function (s) {
          return el('div', { class: 'btn-row' }, reviewButtons(s, refresh));
        }
      });
    }
    return UI.table(columns, submissions);
  }

  function reviewButtons(s, refresh) {
    var buttons = [];
    if (s.status === SS.SUBMITTED) {
      buttons.push(el('button', { class: 'btn btn-sm btn-secondary', type: 'button', text: 'Start review', onclick: function () { doReview(s.id, 'start', null, refresh); } }));
    } else if (s.status === SS.UNDER_REVIEW) {
      buttons.push(el('button', { class: 'btn btn-sm', type: 'button', text: 'Approve', onclick: function () { doReview(s.id, 'approve', null, refresh); } }));
      buttons.push(el('button', { class: 'btn btn-sm btn-secondary', type: 'button', text: 'Request changes', onclick: function () { promptRevision(s.id, refresh); } }));
    } else {
      buttons.push(el('span', { class: 'muted small', text: s.status }));
    }
    return buttons;
  }

  function doReview(id, action, reason, refresh) {
    var res = FYP.SubmissionService.review(id, action, reason, session().actorId);
    if (!res.ok) { UI.toast(firstError(res.errors), 'danger'); return; }
    UI.toast('Submission updated.', 'success');
    if (refresh) refresh();
  }

  function promptRevision(id, refresh) {
    var host = el('div', { class: 'stack' }, [
      el('p', { class: 'muted', text: 'A short reason is required before requesting changes.' })
    ]);
    var modalRef;
    var f = UI.form({
      fields: [{ name: 'reason', label: 'Revision reason', type: 'textarea', required: true }],
      submitLabel: 'Request changes',
      onSubmit: function (values, helpers) {
        var res = FYP.SubmissionService.review(id, 'needsRevision', values.reason, session().actorId);
        if (!res.ok) { helpers.setErrors(res.errors); return; }
        UI.toast('Revision requested.', 'warning');
        if (modalRef) modalRef.close();
        if (refresh) refresh();
      }
    });
    host.appendChild(f);
    modalRef = UI.modal({ title: 'Request changes', body: host });
  }

  function evaluationTable(evaluations) {
    if (!evaluations.length) return UI.emptyState('No evaluations yet.', 'Recorded evaluations will be listed here.');
    return UI.table([
      { key: 'projectId', label: 'Project', render: function (e) { return S.projectTitle(e.projectId); } },
      { key: 'evaluatorId', label: 'Evaluator', render: function (e) { return S.supervisorName(e.evaluatorId); } },
      { key: 'score', label: 'Score' },
      { key: 'judgment', label: 'Judgment', render: function (e) { return UI.badge({ label: e.judgment, tone: C.TONE.INFO }); } },
      { key: 'evaluationDate', label: 'Date', render: function (e) { return Utils.formatDate(e.evaluationDate); } }
    ], evaluations);
  }

  function openEvaluationModal(preset, refresh) {
    preset = preset || {};
    var projectOptions = [{ value: '', label: 'Select a project\u2026' }].concat(
      FYP.Store.all('projects').map(function (p) { return { value: p.id, label: p.title }; })
    );
    var judgmentOptions = [{ value: '', label: 'Select judgment\u2026' }].concat(
      Utils.values(C.JUDGMENT).map(function (j) { return { value: j, label: j }; })
    );

    function submissionOptions(projectId) {
      return [{ value: '', label: 'No specific submission' }].concat(
        FYP.Store.all('submissions').filter(function (s) { return s.projectId === projectId; })
          .map(function (s) { return { value: s.id, label: s.title }; })
      );
    }

    var host = el('div');
    var modalRef;
    var subSelect;

    function buildForm() {
      UI.clear(host);
      subSelect = el('select', { id: 'f-submissionId' });
      function fillSubs(pid) {
        UI.clear(subSelect);
        submissionOptions(pid).forEach(function (o) {
          var opt = el('option', { value: o.value, text: o.label });
          if (String(o.value) === String(preset.submissionId || '')) opt.selected = true;
          subSelect.appendChild(opt);
        });
      }
      fillSubs(preset.projectId || '');

      var projSelect = el('select', { id: 'f-projectId' });
      projectOptions.forEach(function (o) {
        var opt = el('option', { value: o.value, text: o.label });
        if (String(o.value) === String(preset.projectId || '')) opt.selected = true;
        projSelect.appendChild(opt);
      });
      projSelect.addEventListener('change', function () { fillSubs(projSelect.value); });

      var scoreInput = el('input', { id: 'f-score', type: 'number', min: '0', max: '100' });
      var judgmentSelect = el('select', { id: 'f-judgment' });
      judgmentOptions.forEach(function (o) { judgmentSelect.appendChild(el('option', { value: o.value, text: o.label })); });

      var errorNodes = {};
      function fieldWrap(name, label, control) {
        errorNodes[name] = el('div', { class: 'field-error' });
        return el('div', { class: 'field' }, [el('label', { for: 'f-' + name, text: label }), control, errorNodes[name]]);
      }
      function setErrors(errors) {
        ['target', 'projectId', 'score', 'judgment'].forEach(function (name) {
          var node = errorNodes[name];
          if (!node) return;
          node.textContent = errors && errors[name] ? errors[name] : '';
        });
      }

      var formNode = el('form', { class: 'stack', novalidate: true }, [
        fieldWrap('projectId', 'Project', projSelect),
        fieldWrap('submissionId', 'Submission (optional)', subSelect),
        fieldWrap('score', 'Score (0\u2013100)', scoreInput),
        fieldWrap('judgment', 'Judgment', judgmentSelect),

        el('div', { class: 'btn-row' }, [el('button', { class: 'btn', type: 'submit', text: 'Save evaluation' })])
      ]);

      formNode.addEventListener('submit', function (e) {
        e.preventDefault();
        var values = { projectId: projSelect.value, submissionId: subSelect.value, score: scoreInput.value, judgment: judgmentSelect.value };
        var res = FYP.EvaluationService.record(values, session().role, session().actorId);
        if (!res.ok) { setErrors(res.errors); return; }
        UI.toast('Evaluation recorded.', 'success');
        if (modalRef) modalRef.close();
        if (refresh) refresh();
      });
      host.appendChild(formNode);
    }

    buildForm();
    modalRef = UI.modal({ title: 'Record Evaluation', body: host });
  }

  function openFeedbackModal(targetType, targetId, label, refresh) {
    var host = el('div', { class: 'stack' }, [
      el('p', { class: 'muted', text: 'Target: ' + label })
    ]);
    var modalRef;
    var f = UI.form({
      fields: [{ name: 'comment', label: 'Comment', type: 'textarea', required: true }],
      submitLabel: 'Add feedback',
      onSubmit: function (values, helpers) {
        var res = FYP.FeedbackService.add(targetType, targetId, values.comment, session().actorId);
        if (!res.ok) { helpers.setErrors(res.errors); return; }
        UI.toast('Feedback added.', 'success');
        if (modalRef) modalRef.close();
        if (refresh) refresh();
      }
    });
    host.appendChild(f);
    modalRef = UI.modal({ title: 'Add Feedback', body: host });
  }

  /* ---------- idea modal ---------- */
  function openIdeaModal(onDone) {
    var supervisorOptions = [{ value: '', label: 'No preference' }].concat(
      FYP.Store.all('supervisors').map(function (s) { return { value: s.id, label: s.name }; })
    );
    var modalRef;
    var f = UI.form({
      fields: [
        { name: 'title', label: 'Project title', type: 'text', required: true, placeholder: 'e.g. Smart Campus Energy Monitor' },
        { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the problem, approach, and expected outcome (min 20 characters).' },
        { name: 'domain', label: 'Domain (optional)', type: 'text', placeholder: 'e.g. AI/ML, Web Development' },
        { name: 'preferredSupervisorId', label: 'Preferred supervisor (optional)', type: 'select', options: supervisorOptions }
      ],
      submitLabel: 'Submit idea',
      onSubmit: function (values, helpers) {
        var res = FYP.IdeaService.submit(values, session().actorId);
        if (!res.ok) { helpers.setErrors(res.errors); return; }
        UI.toast('Idea "' + res.project.title + '" submitted successfully.', 'success');
        if (modalRef) modalRef.close();
        if (onDone) onDone(res.project);
      }
    });
    modalRef = UI.modal({ title: 'Submit Project Idea', body: f });
    return modalRef;
  }

  /* ---------- supervisor request modal ---------- */
  function openRequestSupervisorModal(projectId, refresh) {
    var project = FYP.Store.find('projects', projectId);
    var options = [{ value: '', label: 'Select a supervisor\u2026' }].concat(
      FYP.Store.all('supervisors').map(function (s) {
        var cap = S.supervisorCapacity(s.id);
        return { value: s.id, label: s.name + ' (' + cap.assigned + '/' + cap.capacity + ')' + (cap.atCapacity ? ' \u2014 At capacity' : '') };
      })
    );
    var host = el('div', { class: 'stack' }, [
      el('p', { class: 'muted', text: 'Requesting a supervisor records a pending request; the project moves to "Supervisor Pending" until the supervisor responds.' })
    ]);
    var modalRef;
    var f = UI.form({
      fields: [{ name: 'supervisorId', label: 'Supervisor', type: 'select', options: options, required: true }],
      submitLabel: 'Send request',
      onSubmit: function (values, helpers) {
        var res = FYP.SupervisorRequestService.request(projectId, values.supervisorId);
        if (!res.ok) { helpers.setErrors(res.errors); return; }
        UI.toast('Supervision request recorded.', 'success');
        if (modalRef) modalRef.close();
        if (refresh) refresh();
      }
    });
    host.appendChild(f);
    modalRef = UI.modal({ title: 'Select Supervisor ' + (project ? '\u2014 ' + project.title : ''), body: host });
  }

  /* ---------- submission modal ---------- */
  function openSubmissionModal(preset, refresh) {
    preset = preset || {};
    var projectOptions = [{ value: '', label: 'Select a project\u2026' }].concat(
      FYP.Store.all('projects').map(function (p) { return { value: p.id, label: p.title }; })
    );
    var typeOptions = [{ value: '', label: 'Select a type\u2026' }].concat(
      Utils.values(C.SUBMISSION_TYPE).map(function (t) { return { value: t, label: t }; })
    );

    var host = el('div');
    var modalRef;

    function submissionMilestones(pid) {
      return FYP.Store.all('milestones').filter(function (m) { return m.projectId === pid; });
    }

    var projSelect = el('select', { id: 'sub-projectId' });
    projectOptions.forEach(function (o) {
      var opt = el('option', { value: o.value, text: o.label });
      if (String(o.value) === String(preset.projectId || '')) opt.selected = true;
      projSelect.appendChild(opt);
    });
    var mSel = el('select', { id: 'sub-milestoneId' });
    function fillMilestones() {
      UI.clear(mSel);
      mSel.appendChild(el('option', { value: '', text: 'No specific milestone' }));
      submissionMilestones(projSelect.value).forEach(function (m) {
        var opt = el('option', { value: m.id, text: m.name });
        if (String(m.id) === String(preset.milestoneId || '')) opt.selected = true;
        mSel.appendChild(opt);
      });
    }
    fillMilestones();
    projSelect.addEventListener('change', fillMilestones);

    var typeSelect = el('select', { id: 'sub-type' });
    typeOptions.forEach(function (o) { typeSelect.appendChild(el('option', { value: o.value, text: o.label })); });
    var titleInput = el('input', { id: 'sub-title', type: 'text', placeholder: 'Deliverable title' });
    var deadlineInput = el('input', { id: 'sub-deadline', type: 'date' });

    var errorNodes = {};
    function wrap(name, label, control) {
      errorNodes[name] = el('div', { class: 'field-error' });
      return el('div', { class: 'field' }, [el('label', { for: 'sub-' + name, text: label }), control, errorNodes[name]]);
    }
    function setErrors(errors) {
      ['title', 'type', 'project'].forEach(function (name) {
        if (errorNodes[name]) errorNodes[name].textContent = errors && errors[name] ? errors[name] : '';
      });
    }

    var formNode = el('form', { class: 'stack', novalidate: true }, [
      wrap('projectId', 'Project', projSelect),
      wrap('milestoneId', 'Milestone (optional)', mSel),
      wrap('title', 'Title *', titleInput),
      wrap('type', 'Type *', typeSelect),
      wrap('deadlineDate', 'Deadline (optional)', deadlineInput),
      el('div', { class: 'btn-row' }, [el('button', { class: 'btn', type: 'submit', text: 'Submit deliverable' })])
    ]);
    formNode.addEventListener('submit', function (e) {
      e.preventDefault();
      var values = {
        projectId: projSelect.value,
        milestoneId: mSel.value,
        title: titleInput.value,
        type: typeSelect.value,
        deadlineDate: deadlineInput.value
      };
      var res = FYP.SubmissionService.create(values, session().actorId);
      if (!res.ok) { setErrors(res.errors); return; }
      UI.toast('Submission recorded: ' + res.submission.title, 'success');
      if (modalRef) modalRef.close();
      if (refresh) refresh();
    });
    host.appendChild(formNode);
    modalRef = UI.modal({ title: 'Create Submission', body: host });
  }

  /* ---------- student detail ---------- */
  function openStudentDetail(studentId) {
    var st = FYP.Store.find('students', studentId);
    if (!st) return;
    var agg = S.studentFor(st);
    var nodes = [
      el('div', { class: 'card-head' }, [
        el('div', null, [el('h3', { text: st.name }), el('p', { class: 'card-sub', text: st.studentId + ' \u00B7 ' + st.program })]),
        st.projectId ? UI.badge({ label: 'Assigned', tone: C.TONE.SUCCESS }) : UI.badge({ label: 'Unassigned', tone: C.TONE.NEUTRAL })
      ]),
      kv([
        ['Student ID', st.studentId],
        ['Program', st.program],
        ['Team role', st.teamRole || 'Not provided'],
        ['Project', agg.project ? agg.project.title : 'Unassigned']
      ])
    ];
    if (agg.project) {
      nodes.push(el('hr', { class: 'hr' }));
      nodes.push(UI.progressBar(S.projectProgress(agg.project.id)));
      nodes.push(el('h4', { text: 'Milestones' }));
      nodes.push(milestoneTable(agg.milestones, null));
      nodes.push(el('h4', { text: 'Submissions' }));
      nodes.push(submissionTable(agg.submissions, false));
      nodes.push(el('h4', { text: 'Feedback' }));
      nodes.push(UI.feedbackList(agg.feedback, 'No feedback yet.'));
    } else {
      nodes.push(el('p', { class: 'muted', text: 'This student is not yet part of a project.' }));
    }
    UI.modal({ title: 'Student Detail', body: el('div', { class: 'stack' }, nodes) });
  }

  /* ---------- supervisor detail ---------- */
  function openSupervisorDetail(supervisorId) {
    var d = S.supervisorDetail(supervisorId);
    if (!d) return;
    var s = d.supervisor;
    var nodes = [
      el('div', { class: 'card-head' }, [
        el('div', null, [el('h3', { text: s.name }), el('p', { class: 'card-sub', text: s.department })]),
        d.capacity.atCapacity ? UI.badge({ label: 'At capacity', tone: C.TONE.DANGER }) : UI.badge({ label: d.capacity.remaining + ' slot(s) free', tone: C.TONE.SUCCESS })
      ]),
      kv([
        ['Department', s.department],
        ['Specialization', s.specialization || 'Not specified'],
        ['Assigned', d.capacity.assigned + ' / ' + d.capacity.capacity]
      ]),
      el('hr', { class: 'hr' }),
      el('h4', { text: 'Supervised Projects' }),
      d.projects.length ? UI.table([
        { key: 'title', label: 'Project' },
        { key: 'status', label: 'Status', render: function (p) { return UI.badge({ label: p.status }); } },
        { key: 'progress', label: 'Progress', render: function (p) { return S.projectProgress(p.id).label; } }
      ], d.projects) : el('p', { class: 'muted', text: 'No supervised projects yet.' }),
      el('h4', { text: 'Pending Idea Requests' }),
      d.pendingRequests.length ? UI.table([
        { key: 'projectId', label: 'Project', render: function (r) { return S.projectTitle(r.projectId); } },
        { key: 'requestedDate', label: 'Requested', render: function (r) { return Utils.formatDate(r.requestedDate); } },
        { key: 'actions', label: 'Decision', render: function (r) { return decisionButtons(r); } }
      ], d.pendingRequests) : el('p', { class: 'muted', text: 'No pending requests.' }),
      el('h4', { text: 'Submissions Awaiting Review' }),
      d.awaitingReview.length ? UI.table([
        { key: 'title', label: 'Submission' },
        { key: 'status', label: 'Status', render: function (x) { return UI.badge({ label: x.status }); } }
      ], d.awaitingReview) : el('p', { class: 'muted', text: 'Nothing awaiting review.' })
    ];
    UI.modal({ title: 'Supervisor Detail', body: el('div', { class: 'stack' }, nodes) });
  }

  function decisionButtons(r) {
    if (!S.can(session().role, 'decideRequest')) return el('span', { class: 'muted small', text: 'Pending' });
    return el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-sm', type: 'button', text: 'Accept', onclick: function () { decideReq(r.id, true); } }),
      el('button', { class: 'btn btn-sm btn-secondary', type: 'button', text: 'Decline', onclick: function () { decideReq(r.id, false); } })
    ]);
  }

  function decideReq(id, accept) {
    var res = FYP.SupervisorRequestService.decide(id, accept);
    if (!res.ok) { UI.toast(firstError(res.errors), 'danger'); return; }
    UI.toast(accept ? 'Request accepted.' : 'Request declined.', accept ? 'success' : 'warning');
  }

  FYP.ViewKit = Object.freeze({
    session: session,
    deadlineBadge: deadlineBadge,
    projectStatusBadge: projectStatusBadge,
    kv: kv,
    projectCard: projectCard,
    openProjectDetail: openProjectDetail,
    openStudentDetail: openStudentDetail,
    openSupervisorDetail: openSupervisorDetail,
    openIdeaModal: openIdeaModal,
    openRequestSupervisorModal: openRequestSupervisorModal,
    openSubmissionModal: openSubmissionModal,
    openEvaluationModal: openEvaluationModal,
    openFeedbackModal: openFeedbackModal,
    milestoneTable: milestoneTable,
    submissionTable: submissionTable,
    evaluationTable: evaluationTable,
    firstError: firstError
  });
})(window);