/* Milestone tracking service (spec §5.7). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Store = FYP.Store;
  var Utils = FYP.Utils;
  var MS = C.MILESTONE_STATUS;

  function hasLinkedSubmission(milestoneId) {
    return Store.all('submissions').some(function (s) { return s.milestoneId === milestoneId; });
  }

  function setStatus(milestoneId, next) {
    var m = Store.find('milestones', milestoneId);
    if (!m) return { ok: false, errors: { milestone: 'Milestone not found.' } };

    if (m.status === MS.COMPLETED) {
      return { ok: false, errors: { milestone: 'This milestone is already completed.' } };
    }

    if (next === MS.COMPLETED && m.status === MS.PENDING) {
      return { ok: false, errors: { milestone: 'Advance the milestone to In Progress first.' } };
    }

    var allowed = {
      'Pending': MS.IN_PROGRESS,
      'In Progress': MS.COMPLETED
    };
    if (allowed[m.status] !== next) {
      return { ok: false, errors: { milestone: 'Invalid milestone transition.' } };
    }

    if (next === MS.COMPLETED && m.requiresSubmission && !hasLinkedSubmission(milestoneId)) {
      return { ok: false, errors: { milestone: 'Upload the required submission before completing this milestone.' } };
    }

    Store.transaction(function () { Store.update('milestones', milestoneId, { status: next }); });
    return { ok: true, milestone: Store.find('milestones', milestoneId) };
  }

  FYP.MilestoneService = Object.freeze({ setStatus: setStatus, hasLinkedSubmission: hasLinkedSubmission });
})(window);