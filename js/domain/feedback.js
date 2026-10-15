/* Feedback service (spec §5.9). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var Store = FYP.Store;
  var Utils = FYP.Utils;
  var Validation = FYP.Validation;

  function add(targetType, targetId, comment, authorId) {
    var check = Validation.feedbackComment(comment);
    if (!check.valid) return { ok: false, errors: check.errors };
    if (!targetType || !targetId) {
      return { ok: false, errors: { target: 'Select a project, milestone, or submission.' } };
    }
    var record = {
      id: Utils.sequenceId('fb'),
      targetType: targetType,
      targetId: targetId,
      authorId: authorId || null,
      comment: String(comment).trim(),
      createdDate: Utils.today()
    };
    Store.transaction(function () { Store.insert('feedback', record); });
    return { ok: true, feedback: record };
  }

  FYP.FeedbackService = Object.freeze({ add: add });
})(window);