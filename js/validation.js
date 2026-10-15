/* Validation module (design I-5). Each function returns { valid, errors } and never throws. */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Store = FYP.Store;
  var Utils = FYP.Utils;
  var L = C.LIMITS;

  function result(errors) {
    var keys = Object.keys(errors);
    return { valid: keys.length === 0, errors: errors };
  }

  function isBlank(v) {
    return v === null || v === undefined || String(v).trim() === '';
  }

  function idea(values, ctx) {
    values = values || {};
    ctx = ctx || {};
    var errors = {};
    var title = values.title;
    var description = values.description;

    if (isBlank(title)) {
      errors.title = 'Title is required.';
    } else if (String(title).length > L.TITLE_MAX) {
      errors.title = 'Title must be ' + L.TITLE_MAX + ' characters or fewer.';
    }

    if (isBlank(description)) {
      errors.description = 'Description is required.';
    } else if (String(description).trim().length < L.DESCRIPTION_MIN) {
      errors.description = 'Description must be at least ' + L.DESCRIPTION_MIN + ' characters.';
    }

    if (!errors.title && ctx.ownerStudentId) {
      var duplicate = Store.all('projects').some(function (p) {
        return p.ownerStudentId === ctx.ownerStudentId &&
          String(p.title).trim().toLowerCase() === String(title).trim().toLowerCase();
      });
      if (duplicate) errors.title = 'You already submitted an idea with this title.';
    }

    return result(errors);
  }

  function submission(values) {
    values = values || {};
    var errors = {};
    if (isBlank(values.title)) errors.title = 'Title is required.';
    else if (String(values.title).length > L.TITLE_MAX) errors.title = 'Title must be ' + L.TITLE_MAX + ' characters or fewer.';
    if (isBlank(values.type)) errors.type = 'Type is required.';
    return result(errors);
  }

  function evaluation(values) {
    values = values || {};
    var errors = {};
    var hasTarget = !isBlank(values.projectId) || !isBlank(values.submissionId);
    if (!hasTarget) errors.target = 'Select a project or submission to evaluate.';

    var raw = values.score;
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      errors.score = 'Score must be a number between ' + L.SCORE_MIN + ' and ' + L.SCORE_MAX + '.';
    } else if (isNaN(Number(raw))) {
      errors.score = 'Score must be a number between ' + L.SCORE_MIN + ' and ' + L.SCORE_MAX + '.';
    } else {
      var n = Number(raw);
      if (n < L.SCORE_MIN || n > L.SCORE_MAX) {
        errors.score = 'Score must be a number between ' + L.SCORE_MIN + ' and ' + L.SCORE_MAX + '.';
      }
    }

    if (isBlank(values.judgment)) errors.judgment = 'Judgment is required.';
    return result(errors);
  }

  function revisionReason(value) {
    var errors = {};
    if (isBlank(value)) errors.reason = 'Please provide a reason for the revision request.';
    return result(errors);
  }

  function feedbackComment(value) {
    var errors = {};
    if (isBlank(value)) errors.comment = 'Please enter a comment.';
    return result(errors);
  }

  function milestoneCompletion(ctx) {
    ctx = ctx || {};
    var errors = {};
    if (ctx.requiresSubmission && !ctx.hasSubmission) {
      errors.milestone = 'Upload the required submission before completing this milestone.';
    }
    return result(errors);
  }

  FYP.Validation = Object.freeze({
    idea: idea,
    submission: submission,
    evaluation: evaluation,
    revisionReason: revisionReason,
    feedbackComment: feedbackComment,
    milestoneCompletion: milestoneCompletion
  });
})(window);