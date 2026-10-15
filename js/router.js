/* Hash-based router (design I-12). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var UI = FYP.UI;

  var routes = {};
  var listeners = [];
  var container = null;
  var currentRoute = 'dashboard';

  function parseHash() {
    var h = String(global.location.hash || '').replace(/^#\/?/, '').trim();
    return h || 'dashboard';
  }

  function render(routeName) {
    var name = routes[routeName] ? routeName : 'dashboard';
    currentRoute = name;
    if (container) {
      UI.clear(container);
      try {
        routes[name](container);
      } catch (err) {
        UI.clear(container);
        container.appendChild(UI.emptyState('Could not render this section.', err && err.message ? err.message : 'Unexpected error.'));
      }
    }
    listeners.forEach(function (fn) { try { fn(name); } catch (e) { /* noop */ } });
  }

  function register(routeName, renderer) { routes[routeName] = renderer; }

  function navigate(routeName) {
    var target = routes[routeName] ? routeName : 'dashboard';
    if (parseHash() === target) render(target);
    else global.location.hash = '#/' + target;
  }

  function start(containerEl) {
    container = containerEl;
    global.addEventListener('hashchange', function () { render(parseHash()); });
    if (!global.location.hash) global.location.hash = '#/dashboard';
    render(parseHash());
  }

  function current() { return currentRoute; }
  function rerender() { render(currentRoute); }
  function on(event, cb) { if (event === 'change' && typeof cb === 'function') listeners.push(cb); }

  FYP.Router = Object.freeze({
    register: register,
    navigate: navigate,
    start: start,
    current: current,
    rerender: rerender,
    on: on
  });
})(window);