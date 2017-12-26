const path = require('path');
const BlogBase = require('./base');
const fs = require('fs');

module.exports = (() => {
  class BlogDelete extends BlogBase {
    constructor(options) {
      super(options);
      this.dir = path.resolve(options.dir);
      this.filePath = path.resolve(`${options.dir}/${options.filePath}`);
    }

    delete() {
      return new Promise((res, rej) => {
        const me = this;
        this.login()
          .then((member) => {
            me.currentMember = member;
            // 保存処理
            if (Object.keys(member).length === 0) {
              throw new Error('認証エラー');
            }
            // ファイルを読み込む
            return this.readFile(this.filePath);
          })
          .then(contents => me.setContents(contents))
          .then((entry) => {
            entry.refid = entry.get('refid');
            return entry.delete()
          })
          // 元ファイルを削除
          .then((success) => fs.unlink(me.filePath))
          .then((success) => {
            // 完了
            res(success);
          }, (err) =>  rej(err))
      });
    }
  }
  return BlogDelete;
})();
