/* Seeded dummy dataset (design I-5 / spec §6). No real personal or institutional data. */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var PS = FYP.Constants.PROJECT_STATUS;
  var MS = FYP.Constants.MILESTONE_STATUS;
  var SS = FYP.Constants.SUBMISSION_STATUS;
  var ST = FYP.Constants.SUBMISSION_TYPE;
  var JD = FYP.Constants.JUDGMENT;
  var FT = FYP.Constants.FEEDBACK_TARGET;
  var TR = FYP.Constants.TEAM_ROLE;

  /* Edge cases deliberately seeded:
     - p3: no team, no supervisor
     - p5: no milestones (progress -> "Not started"), idea stage
     - sup-3: at capacity (capacity 1, assigned 1) AND missing specialization
     - stu-6: duplicate studentId with stu-1; unassigned
     - m8/m10: overdue milestones
     - sub-6: submission with no deadline date
     - sub-2: late submission
  */

  var supervisors = [
    { id: 'sup-1', name: 'Dr. Ayesha Khan', department: 'Computer Science', specialization: 'Artificial Intelligence', capacity: 5 },
    { id: 'sup-2', name: 'Dr. Bilal Ahmed', department: 'Software Engineering', specialization: 'Web Systems', capacity: 3 },
    { id: 'sup-3', name: 'Dr. Sana Malik', department: 'Computer Science', specialization: '', capacity: 1 },
    { id: 'sup-4', name: 'Dr. Omar Farooq', department: 'Information Systems', specialization: 'Data Science', capacity: 4 }
  ];

  var students = [
    { id: 'stu-1', name: 'Aisha Siddiqui', studentId: 'FA21-BSCS-001', program: 'BS Computer Science', projectId: 'p1', teamRole: TR.LEAD },
    { id: 'stu-2', name: 'Hamza Tariq', studentId: 'FA21-BSCS-002', program: 'BS Computer Science', projectId: 'p1', teamRole: TR.MEMBER },
    { id: 'stu-3', name: 'Zainab Ali', studentId: 'FA21-BSSE-010', program: 'BS Software Engineering', projectId: 'p2', teamRole: TR.LEAD },
    { id: 'stu-4', name: 'Usman Raza', studentId: 'FA21-BSCS-004', program: 'BS Computer Science', projectId: 'p3', teamRole: null },
    { id: 'stu-5', name: 'Fatima Noor', studentId: 'FA21-BSIS-021', program: 'BS Information Systems', projectId: 'p5', teamRole: null },
    { id: 'stu-6', name: 'Bilal Yousaf', studentId: 'FA21-BSCS-001', program: 'BS Computer Science', projectId: null, teamRole: null },
    { id: 'stu-7', name: 'Maria Javed', studentId: 'FA21-BSCS-007', program: 'BS Computer Science', projectId: 'p4', teamRole: TR.LEAD },
    { id: 'stu-8', name: 'Ali Hassan', studentId: 'FA21-BSCS-008', program: 'BS Computer Science', projectId: 'p4', teamRole: TR.MEMBER },
    { id: 'stu-9', name: 'Nida Aslam', studentId: 'FA21-BSSE-015', program: 'BS Software Engineering', projectId: 'p6', teamRole: TR.LEAD },
    { id: 'stu-10', name: 'Kashif Iqbal', studentId: 'FA21-BSSE-016', program: 'BS Software Engineering', projectId: 'p6', teamRole: TR.MEMBER }
  ];

  var teams = [
    { id: 'team-1', teamName: 'Team Nexus', projectId: 'p1', members: [{ studentId: 'stu-1', teamRole: TR.LEAD }, { studentId: 'stu-2', teamRole: TR.MEMBER }] },
    { id: 'team-2', teamName: 'Code Crushers', projectId: 'p2', members: [{ studentId: 'stu-3', teamRole: TR.LEAD }] },
    { id: 'team-3', teamName: 'Data Wizards', projectId: 'p4', members: [{ studentId: 'stu-7', teamRole: TR.LEAD }, { studentId: 'stu-8', teamRole: TR.MEMBER }] },
    { id: 'team-4', teamName: 'Vision Coders', projectId: 'p6', members: [{ studentId: 'stu-9', teamRole: TR.LEAD }, { studentId: 'stu-10', teamRole: TR.MEMBER }] }
  ];

  var projects = [
    { id: 'p1', title: 'Campus Navigation Mobile App', description: 'An indoor navigation application that guides students across campus buildings using a graph-based pathfinder.', domain: 'Web Development', status: PS.IN_PROGRESS, supervisorId: 'sup-2', teamId: 'team-1', ownerStudentId: 'stu-1', createdDate: '2026-09-01' },
    { id: 'p2', title: 'AI Chatbot for Student Services', description: 'A retrieval-augmented chatbot answering common student queries about admissions, fees, and timetables.', domain: 'AI/ML', status: PS.IN_PROGRESS, supervisorId: 'sup-1', teamId: 'team-2', ownerStudentId: 'stu-3', createdDate: '2026-09-02' },
    { id: 'p3', title: 'Blockchain-based Transcript Verification', description: 'A tamper-evident ledger for issuing and verifying university transcripts between institutions.', domain: 'Web Development', status: PS.SUPERVISOR_PENDING, supervisorId: null, teamId: null, ownerStudentId: 'stu-4', createdDate: '2026-09-05' },
    { id: 'p4', title: 'Smart Attendance via Face Recognition', description: 'An automated attendance system that recognises enrolled students from a classroom camera feed.', domain: 'AI/ML', status: PS.IN_PROGRESS, supervisorId: 'sup-3', teamId: 'team-3', ownerStudentId: 'stu-7', createdDate: '2026-09-03' },
    { id: 'p5', title: 'Library Management Dashboard', description: 'An analytics dashboard surfacing book circulation, overdue loans, and inventory trends for the library.', domain: 'Web Development', status: PS.IDEA_SUBMITTED, supervisorId: null, teamId: null, ownerStudentId: 'stu-5', createdDate: '2026-09-10' },
    { id: 'p6', title: 'Campus Food Delivery Platform', description: 'A marketplace connecting campus cafeterias with students for scheduled pickup and delivery orders.', domain: 'Web Development', status: PS.COMPLETED, supervisorId: 'sup-1', teamId: 'team-4', ownerStudentId: 'stu-9', createdDate: '2026-05-02' }
  ];

  var milestones = [
    { id: 'm1', projectId: 'p1', name: 'Proposal Approved', dueDate: '2026-09-15', status: MS.COMPLETED, requiresSubmission: true },
    { id: 'm2', projectId: 'p1', name: 'Mid-term Demo', dueDate: '2026-10-20', status: MS.COMPLETED, requiresSubmission: false },
    { id: 'm3', projectId: 'p1', name: 'Final Report', dueDate: '2026-12-01', status: MS.IN_PROGRESS, requiresSubmission: true },

    { id: 'm4', projectId: 'p2', name: 'Proposal Approved', dueDate: '2026-09-14', status: MS.COMPLETED, requiresSubmission: true },
    { id: 'm5', projectId: 'p2', name: 'Prototype Review', dueDate: '2026-10-25', status: MS.PENDING, requiresSubmission: false },
    { id: 'm6', projectId: 'p2', name: 'Final Defense', dueDate: '2026-12-05', status: MS.PENDING, requiresSubmission: true },

    { id: 'm7', projectId: 'p3', name: 'Idea Approval', dueDate: '2026-09-20', status: MS.PENDING, requiresSubmission: false },
    { id: 'm8', projectId: 'p3', name: 'Proposal Defense', dueDate: '2026-10-05', status: MS.PENDING, requiresSubmission: false },

    { id: 'm9', projectId: 'p4', name: 'Literature Review', dueDate: '2026-09-10', status: MS.COMPLETED, requiresSubmission: false },
    { id: 'm10', projectId: 'p4', name: 'Dataset Preparation', dueDate: '2026-10-01', status: MS.PENDING, requiresSubmission: false },
    { id: 'm11', projectId: 'p4', name: 'Model Training', dueDate: '2026-11-15', status: MS.PENDING, requiresSubmission: true },

    { id: 'm12', projectId: 'p6', name: 'Final Report', dueDate: '2026-05-20', status: MS.COMPLETED, requiresSubmission: true }
  ];

  var submissions = [
    { id: 'sub-1', title: 'Project Proposal Document', type: ST.PROPOSAL, projectId: 'p1', milestoneId: 'm1', submittedBy: 'stu-1', submittedDate: '2026-09-12', deadlineDate: '2026-09-15', status: SS.APPROVED },
    { id: 'sub-2', title: 'Mid-term Demo Video', type: ST.PRESENTATION, projectId: 'p1', milestoneId: 'm2', submittedBy: 'stu-2', submittedDate: '2026-10-12', deadlineDate: '2026-10-10', status: SS.SUBMITTED },
    { id: 'sub-3', title: 'AI Prototype Report', type: ST.REPORT, projectId: 'p2', milestoneId: 'm5', submittedBy: 'stu-3', submittedDate: '2026-10-08', deadlineDate: '2026-10-20', status: SS.UNDER_REVIEW },
    { id: 'sub-4', title: 'Final Project Source Code', type: ST.CODE, projectId: 'p6', milestoneId: 'm12', submittedBy: 'stu-9', submittedDate: '2026-05-18', deadlineDate: '2026-05-20', status: SS.APPROVED },
    { id: 'sub-5', title: 'Proposal Draft', type: ST.PROPOSAL, projectId: 'p2', milestoneId: 'm4', submittedBy: 'stu-3', submittedDate: '2026-09-14', deadlineDate: '2026-09-14', status: SS.NEEDS_REVISION },
    { id: 'sub-6', title: 'Attendance Model Source', type: ST.CODE, projectId: 'p4', milestoneId: 'm11', submittedBy: 'stu-7', submittedDate: '2026-10-09', deadlineDate: null, status: SS.SUBMITTED }
  ];

  var evaluations = [
    { id: 'ev-1', projectId: 'p1', submissionId: 'sub-1', evaluatorId: 'sup-2', score: 88, judgment: JD.GOOD, evaluationDate: '2026-09-16' },
    { id: 'ev-2', projectId: 'p2', submissionId: null, evaluatorId: 'sup-1', score: 92, judgment: JD.EXCELLENT, evaluationDate: '2026-09-18' },
    { id: 'ev-3', projectId: 'p6', submissionId: 'sub-4', evaluatorId: 'sup-1', score: 95, judgment: JD.EXCELLENT, evaluationDate: '2026-05-25' },
    { id: 'ev-4', projectId: 'p4', submissionId: null, evaluatorId: 'sup-3', score: 74, judgment: JD.SATISFACTORY, evaluationDate: '2026-10-02' }
  ];

  var feedback = [
    { id: 'fb-1', targetType: FT.PROJECT, targetId: 'p1', authorId: 'sup-2', comment: 'Strong progress on the navigation prototype. Keep refining the UI responsiveness.', createdDate: '2026-09-16' },
    { id: 'fb-2', targetType: FT.MILESTONE, targetId: 'm3', authorId: 'sup-2', comment: 'Please ensure the final report follows the official university template.', createdDate: '2026-10-05' },
    { id: 'fb-3', targetType: FT.SUBMISSION, targetId: 'sub-5', authorId: 'sup-1', comment: 'Please provide a reason for the revision request.', createdDate: '2026-10-13' },
    { id: 'fb-4', targetType: FT.PROJECT, targetId: 'p2', authorId: 'sup-1', comment: 'Excellent dataset choice. Document the preprocessing pipeline in the report.', createdDate: '2026-09-18' },
    { id: 'fb-5', targetType: FT.SUBMISSION, targetId: 'sub-2', authorId: 'sup-2', comment: 'Demo video arrived after the deadline; please plan uploads earlier next time.', createdDate: '2026-10-13' }
  ];

  /* Supervision requests (pending decisions). */
  var supervisionRequests = [
    { id: 'req-1', projectId: 'p3', supervisorId: 'sup-4', status: 'Pending', requestedDate: '2026-09-06' }
  ];

  var deadlines = [
    { id: 'dl-1', label: 'Proposal Approved', dueDate: '2026-09-15', relatedType: 'Milestone', relatedId: 'm1' },
    { id: 'dl-2', label: 'Mid-term Demo', dueDate: '2026-10-20', relatedType: 'Milestone', relatedId: 'm2' },
    { id: 'dl-3', label: 'Prototype Review', dueDate: '2026-10-25', relatedType: 'Milestone', relatedId: 'm5' },
    { id: 'dl-4', label: 'Final Report', dueDate: '2026-12-01', relatedType: 'Milestone', relatedId: 'm3' },
    { id: 'dl-5', label: 'Proposal Defense', dueDate: '2026-10-05', relatedType: 'Milestone', relatedId: 'm8' },
    { id: 'dl-6', label: 'Dataset Preparation', dueDate: '2026-10-01', relatedType: 'Milestone', relatedId: 'm10' },
    { id: 'dl-7', label: 'Final Defense', dueDate: '2026-12-05', relatedType: 'Milestone', relatedId: 'm6' },
    { id: 'dl-8', label: 'AI Prototype Report', dueDate: '2026-10-20', relatedType: 'Submission', relatedId: 'sub-3' }
  ];

  var coordinators = [
    { id: 'coord-1', name: 'Dr. Rehan Aziz', department: 'FYP Coordination Office' }
  ];

  FYP.Data = Object.freeze({
    SEED: Object.freeze({
      projects: projects,
      students: students,
      supervisors: supervisors,
      teams: teams,
      milestones: milestones,
      submissions: submissions,
      evaluations: evaluations,
      feedback: feedback,
      supervisionRequests: supervisionRequests,
      deadlines: deadlines,
      coordinators: coordinators
    })
  });
})(window);