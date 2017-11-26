#!/usr/bin/env node

// commanderライブラリの読み込み
const program = require('commander');

const BlogInit = require('./libs/init');
// commanderの実行内容です
program
  .version('1.0.0') // バージョン番号
  .command('init [directory]') // コマンドの実行方法
  .description('初期設定ファイルを生成します。最初に実行してください。') // コマンドの説明
  // 処理を書きます
  .action((dir) => {
    // 設定ファイルの生成
    const init = new BlogInit(dir);
    init
      // 設定ファイルの作成
      .createConfigFile()
      .then(() =>
        // ディレクトリの作成
        init.createDirectory())
      .then(() => {
        console.log('初期設定が完了しました。続けて pull コマンドを実行してみましょう');
      })
      .catch((err) => {
        console.log(`エラーが発生しました。${JSON.stringify(err)}`);
      });
  });

const BlogPull = require('./libs/pull');
program
  // コマンド pull を有効にします
  .command('pull')
  .description('サーバ上の記事をダウンロードします。')
  .action(() => {
    // BlogPullの処理
    const blogPull = new BlogPull({
      // 処理はカレントディレクトが対象
      dir: '.',
    });
    
    // 記事取得処理を実行します
    blogPull
      .pull()
      // 取得成功
      .then(() => {
        console.log('記事を取得しました');
      })
      // 取得失敗
      /*
      .catch((err) => {
        console.log(`エラーが発生しました。${JSON.stringify(err)}`);
      });
      */
  });

const BlogNew = require('./libs/new');
program
  .command('new')
  .description('新しい記事のベースを作成します')
  .action(() => {
    const blogNew = new BlogNew({
      dir: '.',
    });

    blogNew
      .generate()
      .then(() => {
        console.log(`記事を生成しました。./${blogNew.entry.refid}.md`);
      });
  });

const BlogPost = require('./libs/post');
program
  .command('post [filePath]')
  .description('記事を新規投稿します')
  .action((filePath) => {
    const blogPost = new BlogPost({
      dir: '.',
      filePath,
    });
    blogPost
      .post()
      .then((entry) => {
        console.log(`記事をアップロードしました。 ${entry.get('url')}`);
        const blogPull = new BlogPull({
          dir: '.',
        });
        console.log('記事一覧を更新します。');
        return blogPull.pull();
      })
      .then(() => {
        console.log('記事を取得しました。');
      })
      .catch((err) => {
        console.log(`エラーが発生しました。${JSON.stringify(err)}`);
      });
  });

// commanderでコマンドラインの引数を解釈
program.parse(process.argv);