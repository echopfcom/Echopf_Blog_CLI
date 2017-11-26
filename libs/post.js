const path = require('path');
const BlogBase = require('./base');

module.exports = (() => {
  class BlogPost extends BlogBase {
    constructor(options) {
      super(options);
      this.dir = path.resolve(options.dir);
      this.filePath = path.resolve(options.filePath);
    }

    post() {
      return new Promise((res, rej) => {
        const me = this;
        
        // ログイン処理を行う
        this.login()
          .then((member) => {
            // 保存処理
            if (Object.keys(member).length === 0) {
              throw new Error('認証エラー');
            }
            // ファイルを読み込む
            return this.readFile(this.filePath);
          })
          // Markdownの内容をブログエントリーオブジェクトに展開
          .then(contents => me.setContents(contents))
          // ブログエントリーをアップロード
          .then((entry) => entry.push())
          // アップロード成功
          .then((success) => {
            // 完了
            res(success);
          }, (err) =>  rej(err)) // エラー
      });
    }
  }
  return BlogPost;
})();
