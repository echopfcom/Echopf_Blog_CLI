const path = require('path');
const MailMagazineBase = require('./base');

module.exports = (() => {
  class MailMagazineSend extends MailMagazineBase {
    constructor(options) {
      super(options);
      this.filePath = path.resolve(options.filePath);
      this.dir = path.resolve(options.dir);
    }

    send() {
      return new Promise((res, rej) => {
        this.login()
          .then(() => this.MarkdownToMailMagazine(),
            (err => rej(err))
          )
          .then(() => {
            return this.sendExecute();
          }, (err => rej(err)))
          .then((r) => res(),
          err => {
            throw err;
          });
      });
    }
  }
  return MailMagazineSend;
})();
