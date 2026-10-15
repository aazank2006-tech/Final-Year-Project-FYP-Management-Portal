/* Supervisor selection service (spec §5.6). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var Store = FYP.Store;
  var Selectors = FYP.Selectors;
  var Utils = FYP.Utils;
  var PS = C.PROJECT_STATUS;

  var REQUESTABLE = [PS.IDEA_SUBMITTED, PS.SUPERVISOR_PENDING];

  function request(projectId, supervisorId) {
    var project = Store.find('projects', projectId);
    if (!project) return { ok: false, errors: { project: 'Project not found.' } };
    if (project.status === 'Rejected') {
      return { ok: false, errors: { project: 'This project has been rejected and cannot request a supervisor.' } };
    }
    if (REQUESTABLE.indexOf(project.status) === -1) {
      return { ok: false, errors: { project: 'A supervisor can only be requested while the project is at the idea or pending stage.' } };
    }
    if (project.supervisorId) {
      return { ok: false, errors: { supervisor: 'This project already has an assigned supervisor.' } };
    }
    var supervisor = Store.find('supervisors', supervisorId);
    if (!supervisor) return { ok: false, errors: { supervisor: 'Please select a supervisor.' } };

    var capacity = Selectors.supervisorCapacity(supervisorId);
    if (capacity.atCapacity) {
      return { ok: false, errors: { supervisor: 'This supervisor is at capacity; please choose another.' } };
    }

    var record = {
      id: Utils.sequenceId('req'),
      projectId: projectId,
      supervisorId: supervisorId,
      status: 'Pending',
      requestedDate: Utils.today()
    };
    Store.transaction(function () {
      Store.insert('supervisionRequests', record);
      Store.update('projects', projectId, { status: PS.SUPERVISOR_PENDING });
    });
    return { ok: true, request: record };
  }

  function decide(requestId, accept) {
    var req = Store.find('supervisionRequests', requestId);
    if (!req) return { ok: false, errors: { request: 'Supervision request not found.' } };
    if (req.status !== 'Pending') return { ok: false, errors: { request: 'This request has already been decided.' } };

    if (!accept) {
      Store.transaction(function () {
        Store.update('supervisionRequests', requestId, { status: 'Declined' });
        Store.update('projects', req.projectId, { status: PS.SUPERVISOR_PENDING, supervisorId: null });
      });
      return { ok: true, declined: true };
    }

    var capacity = Selectors.supervisorCapacity(req.supervisorId);
    var project = Store.find('projects', req.projectId);
    if (capacity.atCapacity || (project && project.supervisorId)) {
      Store.transaction(function () {
        Store.update('supervisionRequests', requestId, { status: 'Blocked' });
        Store.update('projects', req.projectId, { status: PS.SUPERVISOR_PENDING });
      });
      return { ok: false, errors: { request: 'Supervisor at capacity; the project remains Supervisor Pending.' } };
    }

    Store.transaction(function () {
      Store.update('supervisionRequests', requestId, { status: 'Accepted' });
      Store.update('projects', req.projectId, { supervisorId: req.supervisorId, status: PS.IN_PROGRESS });
    });
    return { ok: true, accepted: true };
  }

  FYP.SupervisorRequestService = Object.freeze({ request: request, decide: decide });
})(window);