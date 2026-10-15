/* Shared utilities (design I-2). */
(function (global) {
  'use strict';
  var FYP = (global.FYP = global.FYP || {});

  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var seqCounters = {};

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function toISODate(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function today() {
    return toISODate(new Date());
  }

  function parseISO(iso) {
    if (typeof iso !== 'string' || !DATE_RE.test(iso)) return null;
    var p = iso.split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function daysBetween(fromISO, toISO) {
    var a = parseISO(fromISO);
    var b = parseISO(toISO);
    if (!a || !b) return null;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function formatDate(iso) {
    var d = parseISO(iso);
    if (!d) return 'Not provided';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function sequenceId(prefix) {
    seqCounters[prefix] = (seqCounters[prefix] || 0) + 1;
    return prefix + '-' + Date.now().toString(36) + '-' + seqCounters[prefix];
  }

  function renderText(el, text, placeholder) {
    if (!el) return;
    var fallback = placeholder === undefined ? 'Not provided' : placeholder;
    el.textContent = (text === null || text === undefined || text === '') ? fallback : String(text);
    return el;
  }

  function debounce(fn, ms) {
    var handle = null;
    return function () {
      var args = arguments;
      var self = this;
      if (handle) clearTimeout(handle);
      handle = setTimeout(function () { handle = null; fn.apply(self, args); }, ms || 200);
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function values(enumObj) {
    return Object.keys(enumObj).map(function (k) { return enumObj[k]; });
  }

  function contains(haystack, needle) {
    if (needle === null || needle === undefined || needle === '') return true;
    return String(haystack || '').toLowerCase().indexOf(String(needle).toLowerCase()) !== -1;
  }

  function byName(a, b) {
    return String(a && a.name || '').localeCompare(String(b && b.name || ''));
  }

  FYP.Utils = Object.freeze({
    today: today,
    toISODate: toISODate,
    parseISO: parseISO,
    daysBetween: daysBetween,
    formatDate: formatDate,
    sequenceId: sequenceId,
    renderText: renderText,
    debounce: debounce,
    clone: clone,
    values: values,
    contains: contains,
    byName: byName
  });
})(window);