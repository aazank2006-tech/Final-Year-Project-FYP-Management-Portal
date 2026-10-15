/* Evaluation service (spec §5.9). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Store = FYP.Store;
  var Utils = FYP.Utils;
  var Validation = FYP.Validation;

  function record(values, role, evaluatorId) {
    if (role === C.ROLE.STUDENT) {
      return { ok: false, errors: { role: 'Students cannot record evaluations for their own projects.' } };
    }
    var check = Validation.evaluation(values);
    if (!check.valid) return { ok: false, errors: check.errors };

    var record = {
      id: Utils.sequenceId('ev'),
      projectId: values.projectId || null,
      submissionId: values.submissionId || null,
      evaluatorId: evaluatorId || null,
      score: Number(values.score),
      judgment: values.judgment,
      evaluationDate: Utils.today()
    };
    Store.transaction(function () { Store.insert('evaluations', record); });
    return { ok: true, evaluation: record };
  }

  FYP.EvaluationService = Object.freeze({ record: record });
})(window);