/* In-session store (design I-3): deep-copied working set + change notifications. */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});
  var Utils = FYP.Utils;

  var state = {};
  var listeners = [];
  var suspended = 0;

  function deepCopy(seed) {
    var out = {};
    Object.keys(seed).forEach(function (key) {
      out[key] = Utils.clone(seed[key]);
    });
    return out;
  }

  function notify() {
    var snapshot = state;
    listeners.slice().forEach(function (fn) {
      try { fn(snapshot); } catch (e) { /* a listener must never break the store */ }
    });
  }

  function init(seed) {
    state = deepCopy(seed || {});
    notify();
  }

  function all(collection) {
    return state[collection] || [];
  }

  function find(collection, id) {
    var list = all(collection);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function insert(collection, record) {
    if (!state[collection]) state[collection] = [];
    state[collection].push(record);
    return record;
  }

  function update(collection, id, patch) {
    var record = find(collection, id);
    if (!record) return null;
    Object.keys(patch || {}).forEach(function (key) { record[key] = patch[key]; });
    return record;
  }

  function remove(collection, id) {
    var list = all(collection);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list.splice(i, 1); return true; }
    }
    return false;
  }

  /* Atomic transaction: on throw, roll back to the pre-transaction snapshot and
     emit exactly one change event for the committed (or rolled-back) result. */
  function transaction(fn) {
    var backup = deepCopy(state);
    suspended++;
    try {
      var result = fn();
      suspended--;
      notify();
      return result;
    } catch (err) {
      suspended--;
      state = backup;
      notify();
      throw err;
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return function () {};
    listeners.push(listener);
    return function unsubscribe() {
      listeners = listeners.filter(function (fn) { return fn !== listener; });
    };
  }

  FYP.Store = Object.freeze({
    init: init,
    all: all,
    find: find,
    insert: insert,
    update: update,
    remove: remove,
    transaction: transaction,
    subscribe: subscribe
  });
})(window);