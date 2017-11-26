const path = require('path');
const strftime = require('strftime');
const BlogBase = require('./base');

module.exports = (() => {
  class BlogNew extends BlogBase {
    constructor(options) {
      super(options);
      this.dir = path.resolve(options.dir);
    }

    generate() {
      this.entry = new this.ECHOPF.Blogs.EntryObject(this.config.blogInstanceId);
      this.entry.refid = strftime('%Y%m%d%H%M%S');
      this.entry.put('published', new Date());
      this.entry.put('categories', []);
      this.entry.put('contents', { main: '', detail: '' });
      const entries = [this.entry];
      return this.saveEntries(entries);
    }
  }
  return BlogNew;
})();

