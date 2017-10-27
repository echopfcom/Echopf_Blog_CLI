const pd = require('pretty-data').pd;
const fs = require('fs');
const inquirer = require('inquirer');
const BlogBase = require('./base');

module.exports = (() => {
  // 入力チェック
  const alphabetValidate = (input, label) => {
    return input.match(/^[a-zA-Z0-9\?\-\+\.\_]*$/) ? true : `${label}は英数字しか使えません。`;
  }
  // 対話型で入力してもらう内容
  const askConfig = () => {
    // ドメイン
    const questions = [{
      name: 'domain',
      message: 'ドメイン名（例：your-domain.echopf.com）: ',
    }];
    // 他は入力チェックやメッセージの作り方が共通なのでまとめてしまいます
    const sections = [
      { name: 'applicationId', label: 'アプリケーションID' },
      { name: 'applicationKey', label: 'アプリケーションキー' },
      { name: 'blogInstanceId', label: 'ブログのインスタンスID' },
      { name: 'memberInstanceId', label: 'メンバー管理のインスタンスID' },
      { name: 'login_id', label: 'ログインID' },
      { name: 'password', label: 'パスワード' },
    ];
    for (let i = 0; i < sections.length; i += 1) {
      // 対話型の内容を作成します
      const section = sections[i];
      questions.push({
        name: section.name,
        message: `${section.label}: `,
        validate: input => alphabetValidate(input, section.label),
      });
    }
    return inquirer.prompt(questions);
  };
  
  class BlogInit extends BlogBase {
    // コンストラクタ
    constructor(dir) {
      // BlogBaseクラスのコンストラクタを呼び出します
      super({ dir });
    }
    
    // 設定ファイルの存在チェックを行います
    checkConfig() {
      const me = this;
      return new Promise((res, rej) => {
        fs.access(me.configPath, (err) => {
          // エラーがない = ファイルがない場合は処理を抜ける
          if (err) return res();
          // ファイルがある場合は確認
          inquirer.prompt([{
            name: 'file',
            message: '設定ファイルが存在します。上書きしていいですか？',
            type: 'confirm',
          }])
            // 選択した場合、answer.file に true または false が入ります
            .then(answer => (answer.file ? res() : rej({ code: 'exit' })));
        });
      });
    }
    
    // 設定ファイルを作成します
    createConfigFile() {
      const me = this;
      // 全体を非同期処理にします
      return new Promise((res, rej) => {
        me.checkConfig()
          .then(() => askConfig())
          .then((config) => {
            // 設定内容のJSONを見やすく整形
            const json = pd.json(config);
            // ファイルに書き込み
            fs.writeFile(me.configPath, json, err => (err ? rej(err) : res()));
          })
          .catch((err) => {
            // err.code === 'exit' なのは上書きを拒否した場合です
            // その場合はエラー出ないので res() を呼び出します
            // それ以外の場合はエラーオブジェクトをそのまま次の処理に送ります
            if (err.code === 'exit') res();
            rej(err);
          });
      });
    }
    
    // 記事を保存するentriesというディレクトリを作成します
    createDirectory() {
      // ディレクトリのパス
      const dirName = this.dir;
      return new Promise((res, rej) => {
        // ディレクトリの存在確認
        fs.access(dirName, (err) => {
          // エラーがない = すでにフォルダが存在している
          if (!err) {
            return res(err);
          }
          // フォルダがなけれあ作成
          fs.mkdir(dirName, (err) => {
            err ? rej(err) : res();
          });
        });
      });
    }
  }
  return BlogInit;
})();
