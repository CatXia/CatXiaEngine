// 浏览器里面，顶层对象是window，但 Node 和 Web Worker 没有window。
// 浏览器和 Web Worker 里面，self也指向顶层对象，但是 Node 没有self。
// Node 里面，顶层对象是global，但其他环境都不支持。
let _global = typeof window === 'undefined' ? global : window;

_global.cc = _global.cc || {};


module.exports = _global.cc;