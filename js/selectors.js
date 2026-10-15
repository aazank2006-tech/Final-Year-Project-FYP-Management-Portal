/* Derivation / selector layer (design I-4). All functions are pure. */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Store = FYP.Store;
  var Utils = FYP.Utils;
  var PS = C.PROJECT_STATUS;
  var MS = C.MILESTONE_STATUS;
  var SS = C.SUBMISSION_STATUS;
  var DS = C.DEADLINE_STATE;
  var ROLE = C.ROLE;

  /* ---------- lookups ---------- */
  function studentName(id) {
    var s = Store.find('students', id);
    return s ? s.name : 'Unassigned';
  }
  function supervisorName(id) {
    var s = Store.find('supervisors', id);
    return s ? s.name : 'Unassigned';
  }
  function teamName(id) {
    var t = Store.find('teams', id);
    return t ? t.teamName : null;
  }
  function projectTitle(id) {
    var p = Store.find('projects', id);
    return p ? p.title : 'Unknown project';
  }
  function projectById(id) { return Store.find('projects', id); }

  /* ---------- milestones ---------- */
  function milestonesFor(projectId) {
    return Store.all('milestones')
      .filter(function (m) { return m.projectId === projectId; })
      .slice()
      .sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)); });
  }

  function milestoneDisplayStatus(m) {
    if (!m) return MS.PENDING;
    if (m.status !== MS.COMPLETED && m.dueDate && m.dueDate < Utils.today()) return MS.OVERDUE;
    return m.status;
  }

  /* ---------- progress ---------- */
  function projectProgress(projectId) {
    var ms = milestonesFor(projectId);
    if (!ms.length) {
      return { percent: null, label: 'Not started', completed: 0, total: 0, known: true };
    }
    var completed = ms.filter(function (m) { return m.status === MS.COMPLETED; }).length;
    var percent = Math.round((completed / ms.length) * 100);
    return { percent: percent, label: percent + '%', completed: completed, total: ms.length, known: true };
  }

  /* ---------- supervisor capacity ---------- */
  function supervisorCapacity(supervisorId) {
    var sup = Store.find('supervisors', supervisorId);
    var capacity = sup ? sup.capacity : 0;
    var assigned = Store.all('projects').filter(function (p) {
      return p.supervisorId === supervisorId && p.status !== PS.REJECTED;
    }).length;
    return {
      assigned: assigned,
      capacity: capacity,
      remaining: Math.max(0, capacity - assigned),
      atCapacity: assigned >= capacity
    };
  }

  /* ---------- deadlines ---------- */
  function classifyDeadline(dueDate) {
    if (!dueDate) return null;
    var diff = Utils.daysBetween(Utils.today(), dueDate);
    if (diff === null) return null;
    if (diff < 0) return DS.OVERDUE;
    if (diff <= C.LIMITS.DUE_SOON_WINDOW_DAYS) return DS.DUE_SOON;
    return DS.UPCOMING;
  }

  function upcomingDeadlines() {
    var today = Utils.today();
    return Store.all('deadlines')
      .filter(function (d) { return d.dueDate && d.dueDate >= today; })
      .map(function (d) {
        return { deadline: d, state: classifyDeadline(d.dueDate), days: Utils.daysBetween(today, d.dueDate) };
      })
      .sort(function (a, b) { return String(a.deadline.dueDate).localeCompare(String(b.deadline.dueDate)); });
  }

  function allDeadlinesWithState() {
    return Store.all('deadlines')
      .map(function (d) {
        return { deadline: d, state: classifyDeadline(d.dueDate), days: Utils.daysBetween(Utils.today(), d.dueDate) };
      })
      .sort(function (a, b) { return String(a.deadline.dueDate).localeCompare(String(b.deadline.dueDate)); });
  }

  /* ---------- submission timeliness ---------- */
  function submissionTimeliness(sub) {
    if (!sub || !sub.deadlineDate || !sub.submittedDate) return null;
    return sub.submittedDate <= sub.deadlineDate ? 'On time' : 'Late';
  }

  /* ---------- summary ---------- */
  function dashboardSummary() {
    var pendingSubmissions = Store.all('submissions').filter(function (s) {
      return s.status === SS.SUBMITTED || s.status === SS.UNDER_REVIEW;
    }).length;
    return {
      projects: Store.all('projects').length,
      students: Store.all('students').length,
      supervisors: Store.all('supervisors').length,
      pendingSubmissions: pendingSubmissions,
      upcomingDeadlines: upcomingDeadlines().length
    };
  }

  /* ---------- filters ---------- */
  function filterProjects(opts) {
    opts = opts || {};
    return Store.all('projects').filter(function (p) {
      if (opts.status && p.status !== opts.status) return false;
      if (opts.domain && p.domain !== opts.domain) return false;
      if (opts.supervisorId && p.supervisorId !== opts.supervisorId) return false;
      if (opts.search) {
        var name = teamName(p.teamId) || '';
        if (!Utils.contains(p.title, opts.search) && !Utils.contains(name, opts.search)) return false;
      }
      return true;
    });
  }

  function filterStudents(opts) {
    opts = opts || {};
    return Store.all('students').filter(function (s) {
      if (opts.program && s.program !== opts.program) return false;
      if (opts.assignment === 'assigned' && !s.projectId) return false;
      if (opts.assignment === 'unassigned' && s.projectId) return false;
      if (opts.search) {
        if (!Utils.contains(s.name, opts.search) && !Utils.contains(s.studentId, opts.search)) return false;
      }
      return true;
    });
  }

  function filterSupervisors(opts) {
    opts = opts || {};
    return Store.all('supervisors').filter(function (s) {
      if (opts.department && s.department !== opts.department) return false;
      if (opts.search) {
        if (!Utils.contains(s.name, opts.search) && !Utils.contains(s.specialization, opts.search)) return false;
      }
      return true;
    });
  }

  function filterSubmissions(opts) {
    opts = opts || {};
    return Store.all('submissions').filter(function (s) {
      if (opts.status && s.status !== opts.status) return false;
      if (opts.projectId && s.projectId !== opts.projectId) return false;
      if (opts.type && s.type !== opts.type) return false;
      return true;
    });
  }

  /* ---------- duplicate detection ---------- */
  function duplicateStudentIds() {
    var seen = {};
    Store.all('students').forEach(function (s) {
      seen[s.studentId] = (seen[s.studentId] || 0) + 1;
    });
    return Object.keys(seen).filter(function (id) { return seen[id] > 1; });
  }
  function isDuplicateStudentId(studentId) {
    return duplicateStudentIds().indexOf(studentId) !== -1;
  }

  /* ---------- aggregation ---------- */
  function teamFor(projectId) {
    var p = Store.find('projects', projectId);
    if (!p || !p.teamId) return null;
    return Store.find('teams', p.teamId);
  }

  function teamMembers(projectId) {
    var team = teamFor(projectId);
    if (!team) return [];
    return team.members.map(function (mem) {
      var s = Store.find('students', mem.studentId);
      return { student: s, teamRole: mem.teamRole, name: s ? s.name : 'Unknown student' };
    });
  }

  function projectDetail(projectId) {
    var project = Store.find('projects', projectId);
    if (!project) return null;
    return {
      project: project,
      team: teamFor(projectId),
      members: teamMembers(projectId),
      supervisor: project.supervisorId ? Store.find('supervisors', project.supervisorId) : null,
      milestones: milestonesFor(projectId),
      submissions: Store.all('submissions').filter(function (s) { return s.projectId === projectId; }),
      evaluations: Store.all('evaluations').filter(function (e) { return e.projectId === projectId; }),
      feedback: feedbackFor(C.FEEDBACK_TARGET.PROJECT, projectId),
      progress: projectProgress(projectId)
    };
  }

  function feedbackFor(targetType, targetId) {
    return Store.all('feedback')
      .filter(function (f) { return f.targetType === targetType && f.targetId === targetId; })
      .slice()
      .sort(function (a, b) { return String(b.createdDate).localeCompare(String(a.createdDate)); });
  }

  function studentFor(student) {
    var project = student.projectId ? Store.find('projects', student.projectId) : null;
    return {
      student: student,
      project: project,
      team: project ? teamFor(project.id) : null,
      milestones: project ? milestonesFor(project.id) : [],
      submissions: project ? Store.all('submissions').filter(function (s) { return s.projectId === project.id; }) : [],
      feedback: project ? feedbackFor(C.FEEDBACK_TARGET.PROJECT, project.id) : []
    };
  }

  function supervisorDetail(supervisorId) {
    var supervisor = Store.find('supervisors', supervisorId);
    if (!supervisor) return null;
    return {
      supervisor: supervisor,
      capacity: supervisorCapacity(supervisorId),
      projects: Store.all('projects').filter(function (p) { return p.supervisorId === supervisorId; }),
      pendingRequests: Store.all('supervisionRequests').filter(function (r) {
        return r.supervisorId === supervisorId && r.status === 'Pending';
      }),
      awaitingReview: Store.all('submissions').filter(function (s) {
        if (s.status !== SS.SUBMITTED && s.status !== SS.UNDER_REVIEW) return false;
        var p = Store.find('projects', s.projectId);
        return p && p.supervisorId === supervisorId;
      })
    };
  }

  /* ---------- capability gating ---------- */
  var CAPABILITIES = {
    submitIdea: [ROLE.STUDENT],
    requestSupervisor: [ROLE.STUDENT],
    createSubmission: [ROLE.STUDENT],
    manageMilestones: [ROLE.STUDENT, ROLE.SUPERVISOR],
    reviewSubmission: [ROLE.SUPERVISOR],
    decideRequest: [ROLE.SUPERVISOR],
    recordEvaluation: [ROLE.SUPERVISOR],
    addFeedback: [ROLE.SUPERVISOR],
    configureDeadlines: [ROLE.COORDINATOR]
  };

  function can(role, capability) {
    var allowed = CAPABILITIES[capability];
    if (!allowed) return false;
    return allowed.indexOf(role) !== -1;
  }

  FYP.Selectors = Object.freeze({
    studentName: studentName,
    supervisorName: supervisorName,
    teamName: teamName,
    projectTitle: projectTitle,
    projectById: projectById,
    milestonesFor: milestonesFor,
    milestoneDisplayStatus: milestoneDisplayStatus,
    projectProgress: projectProgress,
    supervisorCapacity: supervisorCapacity,
    classifyDeadline: classifyDeadline,
    upcomingDeadlines: upcomingDeadlines,
    allDeadlinesWithState: allDeadlinesWithState,
    submissionTimeliness: submissionTimeliness,
    dashboardSummary: dashboardSummary,
    filterProjects: filterProjects,
    filterStudents: filterStudents,
    filterSupervisors: filterSupervisors,
    filterSubmissions: filterSubmissions,
    duplicateStudentIds: duplicateStudentIds,
    isDuplicateStudentId: isDuplicateStudentId,
    teamFor: teamFor,
    teamMembers: teamMembers,
    projectDetail: projectDetail,
    feedbackFor: feedbackFor,
    studentFor: studentFor,
    supervisorDetail: supervisorDetail,
    can: can
  });
})(window);