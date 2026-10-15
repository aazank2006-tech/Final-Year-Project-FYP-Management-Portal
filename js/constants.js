/* Constants — the single frozen source of every status/type literal (design I-1). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});

  var PROJECT_STATUS = Object.freeze({
    IDEA_SUBMITTED: 'Idea Submitted',
    SUPERVISOR_PENDING: 'Supervisor Pending',
    IN_PROGRESS: 'In Progress',
    SUBMITTED: 'Submitted',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected'
  });

  var MILESTONE_STATUS = Object.freeze({
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    OVERDUE: 'Overdue'
  });

  var SUBMISSION_STATUS = Object.freeze({
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    NEEDS_REVISION: 'Needs Revision'
  });

  var SUBMISSION_TYPE = Object.freeze({
    PROPOSAL: 'Proposal',
    REPORT: 'Report',
    CODE: 'Code',
    PRESENTATION: 'Presentation',
    OTHER: 'Other'
  });

  var JUDGMENT = Object.freeze({
    EXCELLENT: 'Excellent',
    GOOD: 'Good',
    SATISFACTORY: 'Satisfactory',
    NEEDS_IMPROVEMENT: 'Needs Improvement',
    UNSATISFACTORY: 'Unsatisfactory'
  });

  var DEADLINE_STATE = Object.freeze({
    UPCOMING: 'Upcoming',
    DUE_SOON: 'Due Soon',
    OVERDUE: 'Overdue'
  });

  var FEEDBACK_TARGET = Object.freeze({
    PROJECT: 'Project',
    MILESTONE: 'Milestone',
    SUBMISSION: 'Submission'
  });

  var TEAM_ROLE = Object.freeze({
    LEAD: 'Team Lead',
    MEMBER: 'Member'
  });

  var ROLE = Object.freeze({
    STUDENT: 'Student',
    SUPERVISOR: 'Supervisor',
    COORDINATOR: 'Coordinator'
  });

  var TONE = Object.freeze({
    NEUTRAL: 'neutral',
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    DANGER: 'danger'
  });

  var LIMITS = Object.freeze({
    TITLE_MAX: 120,
    DESCRIPTION_MIN: 20,
    DUE_SOON_WINDOW_DAYS: 7,
    SCORE_MIN: 0,
    SCORE_MAX: 100
  });

  FYP.Constants = Object.freeze({
    PROJECT_STATUS: PROJECT_STATUS,
    MILESTONE_STATUS: MILESTONE_STATUS,
    SUBMISSION_STATUS: SUBMISSION_STATUS,
    SUBMISSION_TYPE: SUBMISSION_TYPE,
    JUDGMENT: JUDGMENT,
    DEADLINE_STATE: DEADLINE_STATE,
    FEEDBACK_TARGET: FEEDBACK_TARGET,
    TEAM_ROLE: TEAM_ROLE,
    ROLE: ROLE,
    TONE: TONE,
    LIMITS: LIMITS
  });
})(window);