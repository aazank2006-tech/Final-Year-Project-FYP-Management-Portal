/* Application bootstrap (design I-14). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var C = FYP.Constants;
  var UI = FYP.UI;
  var el = UI.el;

  var session = { role: C.ROLE.COORDINATOR, actorId: 'coord-1' };

  function actorName() {
    if (session.role === C.ROLE.STUDENT) {
      var s = FYP.Store.find('students', session.actorId);
      return s ? s.name : 'Unknown student';
    }
    if (session.role === C.ROLE.SUPERVISOR) {
      var sup = FYP.Store.find('supervisors', session.actorId);
      return sup ? sup.name : 'Unknown supervisor';
    }
    var c = FYP.Store.find('coordinators', session.actorId);
    return c ? c.name : 'Coordinator';
  }

  FYP.Session = {
    get: function () { return { role: session.role, actorId: session.actorId, actorName: actorName() }; },
    set: function (role, actorId) {
      if (role) session.role = role;
      if (actorId) session.actorId = actorId;
    }
  };

  function actorsFor(role) {
    if (role === C.ROLE.STUDENT) return FYP.Store.all('students').map(function (s) { return { id: s.id, name: s.name }; });
    if (role === C.ROLE.SUPERVISOR) return FYP.Store.all('supervisors').map(function (s) { return { id: s.id, name: s.name }; });
    return FYP.Store.all('coordinators').map(function (c) { return { id: c.id, name: c.name }; });
  }

  function buildRoleSwitcher(host) {
    var roleSel = el('select', { id: 'role-select', 'aria-label': 'Acting role' });
    [C.ROLE.STUDENT, C.ROLE.SUPERVISOR, C.ROLE.COORDINATOR].forEach(function (r) {
      roleSel.appendChild(el('option', { value: r, text: r }));
    });
    roleSel.value = session.role;

    var actorSel = el('select', { id: 'actor-select', 'aria-label': 'Acting user' });
    function fillActors() {
      UI.clear(actorSel);
      var actors = actorsFor(session.role);
      actors.forEach(function (a) { actorSel.appendChild(el('option', { value: a.id, text: a.name })); });
      if (!actors.some(function (a) { return a.id === session.actorId; })) {
        session.actorId = actors.length ? actors[0].id : null;
      }
      actorSel.value = session.actorId || '';
    }
    fillActors();

    roleSel.addEventListener('change', function () {
      session.role = roleSel.value;
      var actors = actorsFor(session.role);
      session.actorId = actors.length ? actors[0].id : null;
      fillActors();
      FYP.Router.rerender();
    });
    actorSel.addEventListener('change', function () {
      session.actorId = actorSel.value;
      FYP.Router.rerender();
    });

    host.appendChild(el('label', { for: 'role-select', text: 'Viewing as' }));
    host.appendChild(roleSel);
    host.appendChild(actorSel);
  }

  function updateNav(route) {
    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('active', links[i].getAttribute('data-route') === route);
    }
  }

  function registerRoutes() {
    FYP.Router.register('dashboard', FYP.Views.Dashboard.render);
    FYP.Router.register('projects', FYP.Views.Projects.render);
    FYP.Router.register('students', FYP.Views.Students.render);
    FYP.Router.register('supervisors', FYP.Views.Supervisors.render);
    FYP.Router.register('submissions', FYP.Views.Submissions.render);
    FYP.Router.register('evaluations', FYP.Views.Evaluations.render);
  }

  function boot() {
    try {
      FYP.Store.init(FYP.Data.SEED);
      buildRoleSwitcher(document.getElementById('role-switcher'));
      registerRoutes();
      FYP.Store.subscribe(function () { FYP.Router.rerender(); });
      FYP.Router.on('change', updateNav);
      FYP.Router.start(document.getElementById('app-view'));
    } catch (err) {
      var host = document.getElementById('app-view');
      if (host) {
        UI.clear(host);
        host.appendChild(el('div', { class: 'app-error' }, [
          el('div', { class: 'banner banner-danger', text: 'The portal failed to start. ' + (err && err.message ? err.message : '') })
        ]));
      }
    }
  }

  FYP.App = Object.freeze({ boot: boot, setRole: function (role, actorId) { FYP.Session.set(role, actorId); FYP.Router.rerender(); } });

  document.addEventListener('DOMContentLoaded', boot);
})(window);