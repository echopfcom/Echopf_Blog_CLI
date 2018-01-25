const ECHOPF = require('../../ECHO.min');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const BlogBase = require('../base');
const showdown = require('showdown');

module.exports = (() => {
  class MailMagazineBase extends BlogBase {
    constructor(options) {
      super(options)
    }
    
    saveMailMagazine(m) {
      const me = this;
      const data = ['---'];
      const metas = ['title', 'distributed', 'from_email', 'text_type'];
      for (let key of metas) {
        data.push(`${key}: ${m.get(key)}`);
      }
      data.push('---');
      data.push('');
      data.push('');
      return new Promise((res, rej) => {
        fs.writeFile(`${me.dir}/${m.refid}.md`, data.join('\n'), err => (err ? rej(err) : ''));
        res(m);
      });
    }
    
    MarkdownToMailMagazine() {
      return new Promise((res, rej) => {
        this.readFile(this.filePath)
          .then(contents => {
            return this.generateMailMagazine(contents)
          }, (err => rej(err)))
          .then(() => {
            res();
          }, (err => rej(err)))
      });
    }
    
    generateMailMagazine(contents) {
      return new Promise((res, rej) => {
        const mm = new this.ECHOPF.Members.MailmagObject(this.config.mmInstanceId);
        const parts = contents
          .match(/---\n([\s\S]*)\n---\n([\s\S]*)$/);
        // ヘッダー部をYAMLとして読み込みます
        const headers = yaml.safeLoad(parts[1]);
        for (const key in headers) {
          mm.put(key, headers[key]);
        }
        mm.put('distributed', new Date(headers.distributed));
        mm.targetAllMembers();
        if (mm.get('text_type') === 'html') {
          const converter = new showdown.Converter();
          mm.put('text', converter.makeHtml(parts[2]));
        } else {
          mm.put('text', parts[1]);
        }
        this.mailmag = mm;
        res();
      })
    }
    
    sendExecute() {
      return new Promise((res, rej) => {
        this.mailmag.push()
          .then(() => res(),
            err => {
              rej(err)
            })
      });
    }
  }
  return MailMagazineBase;
})();
