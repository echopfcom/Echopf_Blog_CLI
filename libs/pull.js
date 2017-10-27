const BlogBase = require('./base');

module.exports = (() => {
  class BlogPull extends BlogBase {
    // 記事取得処理全体
    pull() {
      const me = this;
      return new Promise((res, rej) => {
        me
          // 記事を取得します
          .fetchBlogEntries()
          // 取得した記事内容を保存します
          .then(entries => me.saveEntries(entries))
          // 保存が完了したら res を実行します
          .then(() => {
            res();
          })
          // エラーの場合です
          .catch((err) => {
            rej(err);
          });
      });
    }
    
    // ブログ記事を取得
    fetchBlogEntries() {
      const me = this;
      return new Promise((res, rej) => {
        // ECHOPFのJavaScript SDKで記事を取得します
        me.ECHOPF
          .Blogs
          .find(me.config.blogInstanceId)
          // 記事取得が成功した場合
          .then((results) => {
            // 結果から記事だけを取り出します
            const entries = results.map((entry) => {
              if (!entry ||
                  !entry.constructor ||
                  entry.constructor.name !== 'EntryObject') return null;
              return entry;
            });
            // 処理成功に送ります
            res(entries);
          }, (err) => {
            // リソースが見つからない場合
            rej(err);
          });
      });
    }
  }
  
  return BlogPull;
})();
