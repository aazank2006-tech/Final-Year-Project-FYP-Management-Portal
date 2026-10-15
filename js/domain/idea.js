/* Idea submission service (spec §5.5). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Store = FYP.Store;
  var Utils = FYP.Utils;
  var Validation = FYP.Validation;

  function submit(values, ownerStudentId) {
    var check = Validation.idea(values, { ownerStudentId: ownerStudentId });
    if (!check.valid) return { ok: false, errors: check.errors };

    var project = {
      id: Utils.sequenceId('p'),
      title: String(values.title).trim(),
      description: String(values.description).trim(),
      domain: values.domain ? String(values.domain).trim() : '',
      status: C.PROJECT_STATUS.IDEA_SUBMITTED,
      supervisorId: null,
      teamId: null,
      ownerStudentId: ownerStudentId,
      createdDate: Utils.today()
    };

    Store.transaction(function () {
      Store.insert('projects', project);
      var student = Store.find('students', ownerStudentId);
      if (student && !student.projectId) Store.update('students', ownerStudentId, { projectId: project.id });
    });

    return { ok: true, project: project };
  }

  FYP.IdeaService = Object.freeze({ submit: submit });
})(window);