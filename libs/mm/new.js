const path = require('path');
const strftime = require('strftime');
const MailMagazineBase = require('./base');

module.exports = (() => {
  class MailMagazineNew extends MailMagazineBase {
    constructor(options) {
      super(options);
      this.dir = path.resolve(options.dir);
    }

    generate() {
      this.mailmag = new this.ECHOPF.Members.MailmagObject(this.config.mailMagazine.InstanceId);
      this.mailmag.refid = strftime('%Y%m%d%H%M%S');
      this.mailmag.put('distributed', new Date());
      this.mailmag.put('title', '');
      this.mailmag.put('text_type', 'html');
      this.mailmag.put('from_email', this.config.mailMagazine.FromMailAddress);
      return this.saveMailMagazine(this.mailmag);
    }
  }
  return MailMagazineNew;
})();
