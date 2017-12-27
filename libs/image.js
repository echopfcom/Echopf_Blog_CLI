const path = require('path');
const BlogBase = require('./base');

module.exports = (() => {
  class BlogImage extends BlogBase {
    constructor(options) {
      super(options);
      this.dir = path.resolve(options.dir);
      this.filePath = path.resolve(options.filePath);
    }

    upload() {
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
            return this.readBinaryFile(this.filePath);
          })
          // バイナリからレコードを作成
          .then(binary => this.setImage(path.basename(me.filePath), binary))
          // データベースレコードをアップロード
          .then((record) => {
            this.record = record;
            return this.record.push();
          })
          // アップロード成功
          .then((success) => {
            // 完了
            res(`${this.record.get('url')}?get_file=file&array_key=0`);
          }, (err) => rej(err)) // エラー
      });
    }
  }
  return BlogImage;
})();
