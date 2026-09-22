const { Point, Range } = require('text-buffer');
const { Emitter, Disposable, CompositeDisposable } = require('event-kit');
const { File, Directory } = require('pathwatcher');
const { watchPath } = require('../src/path-watcher');

module.exports = {
  BufferedNodeProcess: require('../src/buffered-node-process'),
  BufferedProcess: require('../src/buffered-process'),
  CompositeDisposable,
  Disposable,
  Emitter,
  File,
  Directory,
  GitRepository: require('../src/git-repository'),
  Notification: require('../src/notification'),
  Point,
  Range,
  Task: require('../src/task'),
  TextBuffer: require('text-buffer'),
  TextEditor: require('../src/text-editor'),
  watchPath
};
