/* Submission service (spec §5.8). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Store = FYP.Store;
  var Utils = FYP.Utils;
  var Validation = FYP.Validation;
  var SS = C.SUBMISSION_STATUS;
  var FT = C.FEEDBACK_TARGET;

  function create(values, submittedBy) {
    var check = Validation.submission(values);
    if (!check.valid) return { ok: false, errors: check.errors };

    var record = {
      id: Utils.sequenceId('sub'),
      title: String(values.title).trim(),
      type: values.type,
      projectId: values.projectId || null,
      milestoneId: values.milestoneId || null,
      submittedBy: submittedBy,
      submittedDate: Utils.today(),
      deadlineDate: values.deadlineDate || null,
      status: SS.SUBMITTED
    };
    Store.transaction(function () { Store.insert('submissions', record); });
    return { ok: true, submission: record };
  }

  function review(submissionId, action, reason, authorId) {
    var sub = Store.find('submissions', submissionId);
    if (!sub) return { ok: false, errors: { submission: 'Submission not found.' } };

    if (action === 'start') {
      if (sub.status !== SS.SUBMITTED) {
        return { ok: false, errors: { submission: 'Only a newly submitted deliverable can move to Under Review.' } };
      }
      Store.transaction(function () { Store.update('submissions', submissionId, { status: SS.UNDER_REVIEW }); });
      return { ok: true, submission: Store.find('submissions', submissionId) };
    }

    if (action === 'approve') {
      if (sub.status !== SS.UNDER_REVIEW) {
        return { ok: false, errors: { submission: 'Move the submission to Under Review before approving.' } };
      }
      Store.transaction(function () { Store.update('submissions', submissionId, { status: SS.APPROVED }); });
      return { ok: true, submission: Store.find('submissions', submissionId) };
    }

    if (action === 'needsRevision') {
      if (sub.status !== SS.UNDER_REVIEW) {
        return { ok: false, errors: { submission: 'Move the submission to Under Review before requesting changes.' } };
      }
      var check = Validation.revisionReason(reason);
      if (!check.valid) return { ok: false, errors: check.errors };
      Store.transaction(function () {
        Store.update('submissions', submissionId, { status: SS.NEEDS_REVISION });
        Store.insert('feedback', {
          id: Utils.sequenceId('fb'),
          targetType: FT.SUBMISSION,
          targetId: submissionId,
          authorId: authorId || null,
          comment: String(reason).trim(),
          createdDate: Utils.today()
        });
      });
      return { ok: true, submission: Store.find('submissions', submissionId) };
    }

    return { ok: false, errors: { submission: 'Unknown review action.' } };
  }

  FYP.SubmissionService = Object.freeze({ create: create, review: review });
})(window);