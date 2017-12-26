const path = require('path');
const BlogBase = require('./base');

module.exports = (() => {
  class BlogUpdate extends BlogBase {
    constructor(options) {
      super(options);
      this.dir = path.resolve(options.dir);
      this.filePath = path.resolve(`${options.dir}/${options.filePath}`);
    }

    update() {
      return new Promise((res, rej) => {
        const me = this;
        // 認証処理
        this.login()
          .then((member) => {
            me.currentMember = member;
            // 認証処理結果の確認
            if (Object.keys(member).length === 0) {
              throw new Error('認証エラー');
            }
            // ファイルを読み込む
            return this.readFile(this.filePath);
          })
          // ブログのエントリーにします
          .then(contents => me.setContents(contents))
          // refid を適用すると更新処理になります
          .then((entry) => {
            entry.refid = entry.get('refid');
            return entry.push()
          })
          // 処理がうまくいった場合です
          .then((success) => {
            // 完了
            res(success);
          }, (err) =>  rej(err))
      });
    }
  }
  return BlogUpdate;
})();
