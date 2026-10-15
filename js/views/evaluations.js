/* Evaluations & Feedback view (spec §5.9). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var S = FYP.Selectors;
  var K = FYP.ViewKit;
  var el = UI.el;

  function render(container) {
    var session = K.session();
    var actions = [];
    if (S.can(session.role, 'recordEvaluation')) {
      actions.push(el('button', { class: 'btn', type: 'button', text: 'Record evaluation', onclick: function () { K.openEvaluationModal({}, function () { FYP.Router.rerender(); }); } }));
    }
    container.appendChild(UI.viewHead('Evaluations', 'Recorded assessments and feedback for projects and submissions.', actions));

    var evaluations = FYP.Store.all('evaluations');
    container.appendChild(UI.section('All Evaluations', evaluations.length
      ? K.evaluationTable(evaluations)
      : UI.emptyState('No evaluations yet.', 'Evaluations recorded by supervisors will appear here.')));

    if (!S.can(session.role, 'recordEvaluation')) {
      container.appendChild(el('div', { class: 'banner banner-info', text: 'Evaluation entry is available to supervisors only. Students can view results here and feedback on their projects and submissions.' }));
    }

    container.appendChild(UI.section('Recent Feedback (newest first)', UI.feedbackList(
      FYP.Store.all('feedback').slice().sort(function (a, b) { return String(b.createdDate).localeCompare(String(a.createdDate)); }),
      'No feedback yet.'
    )));
  }

  FYP.Views = FYP.Views || {};
  FYP.Views.Evaluations = { render: render };
})(window);