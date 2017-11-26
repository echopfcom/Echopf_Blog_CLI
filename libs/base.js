const ECHOPF = require('../ECHO.min');
const path = require('path');
const fs = require('fs');
const toMarkdown = require('to-markdown');
const showdown = require('showdown');
const yaml = require('js-yaml');

module.exports = (() => {
  class BlogBase {
    constructor(options) {
      // 記事を保存するディレクトリ
      this.dir = `${path.resolve(options.dir)}/entries/`;
      // 設定ファイルのパス
      this.configPath = `${path.resolve(options.dir)}/echopf.config.json`;
      
      // ECHOPFで用いる設定があれば保存します
      this.config = options.config;
      if (this.configPath) {
        try{
          // 設定ファイルを読み込みます
          this.config = require(this.configPath);
          // ECHOPFを初期化します
          ECHOPF.initialize(
            this.config.domain,
            this.config.applicationId,
            this.config.applicationKey
          );
          // 初期化したECHOPFを保存します
          this.ECHOPF = ECHOPF;
        } catch(e) {
          // 設定ファイルがない場合
        }
      }
      
      this.bodySplit = '<!--more-->';
    }
    
    login() {
      return this.ECHOPF.Members.login(
        this.config.memberInstanceId,
        this.config.login_id,
        this.config.password
      );
    }
    
    // 記事をファイルとして保存する
    saveEntries(entries) {
      const me = this;
      return new Promise((res, rej) => {
        for (let i = 0; i < entries.length; i += 1) {
          const entry = entries[i];
          const data = this.entryToMarkdown(entry);
          fs.writeFile(`${me.dir}/${entry.refid}.md`, data.join('\n'), err => (err ? rej(err) : ''));
        }
        res(true);
      });
    }
    
    // 記事をMarkdown化
    entryToMarkdown(entry) {
      // メタ情報の作成（ここから）
      let data = ['---'];
      data.push(`refid: ${entry.refid}`);

      const metas = [
        'title',
        'description',
        'keywords',
        'robots',
        'link_status',
        'owner',
        'published',
      ];
      data = data.concat(this.pushMeta(metas, entry));
      data = data.concat(this.pushCategories(entry.get('categories')));

      data = data.concat(this.pushAcl(entry.getACL()));

      data.push('---');
      // メタ情報の作成（ここまで）
      
      // 本文の処理
      data = data.concat(this.pushContent(entry.get('contents')));

      return data;
    }
    
    // メタ情報の設定
    pushMeta(metas, data) {
      return metas.map(meta => `${meta}: ${data.get(meta) || ''}`);
    }
    
    // カテゴリの設定
    pushCategories(categories) {
      const data = [];
      if (!categories) return [];
      data.push('categories: ');
      for (let i = 0; i < categories.length; i += 1) {
        const category = categories[i];
        data.push(`  - ${category.get('refid')} : ${category.get('name')}`);
      }
      return data;
    }
    
    // アクセス権限（ACL）の設定
    pushAcl(acls) {
      if (!acls) return [];
      const data = [];
      const metas = [
        '_all',
        '_allMembers',
        '_specificGroups',
        '_specificMembers',
      ];
      data.push('acl:');
      for (let i = 0; i < metas.length; i += 1) {
        const meta = metas[i];
        if (Object.keys(acls[meta]).length === 0) {
          // 空だった場合
          data.push(`  ${meta}: `);
        } else {
          data.push(`  ${meta}:`);
          let acl = acls[meta];
          if (acl instanceof this.ECHOPF.ACL.Entry) {
            const subMetas = ['get', 'list', 'edit', 'delete'];
            for (let j = 0; j < subMetas.length; j += 1) {
              const key = subMetas[j];
              if (typeof acl[key] !== 'undefined') {
                data.push(`    ${key}: ${acl[key]}`);
              }
            }
          }else{
            const objs = acl;
            for (let aclName in objs) {
              acl = objs[aclName];
              data.push(`    ${aclName}:`);
              const subMetas = ['get', 'list', 'edit', 'delete'];
              for (let j = 0; j < subMetas.length; j += 1) {
                const key = subMetas[j];
                if (typeof acl[key] !== 'undefined') {
                  data.push(`      ${key}: ${acl[key]}`);
                }
              }
            }
          }
        }
      }
      return data;
    }
    
    // 本文部分の作成
    pushContent(contents) {
      if (!contents) return [];
      const data = [];
      const contentType = ['main', 'detail'];
      for (let i = 0; i < contentType.length; i += 1) {
        const type = contentType[i];
        const content = contents[type];
        
        // HTMLをMarkdownに変換しつつ、画像のURLを変換します
        data.push(toMarkdown(content)
          .replace(/!\[(.*?)\]\((\/.*?)\)/g, `![$1](https://${this.config.domain}$2)`));
        // 内容の後に <!--more--> を追加します
        if (type === 'main') { data.push(`\n${this.bodySplit}\n`); }
      }
      return data;
    }
    
    // 既存のカテゴリを取得します
    getCategories() {
      return new Promise((res, rej) => {
        const categoriesMap = new this.ECHOPF.ContentsCategoriesMap(this.config.blogInstanceId);
        categoriesMap
          .fetch()
          .then((categories) => {
            res(categories);
          }, (err) => {
            rej(err);
          })
      });
    }
    // カテゴリの存在チェック。なければ作成します
    createCategories(categories, ary) {
      return new Promise((res, rej) => {
        const me = this;
        // 新規作成するカテゴリが入ります
        const promises = [];
        // 最後にカテゴリはすべてこの配列に入れます
        const echopfCategries = [];
        // Markdown上のカテゴリについて順番に確認します
        for (let i = 0; i < ary.length; i += 1) {
          let name = ary[i];
          let existCategory = null;
          // 既存のカテゴリ名との一致を確認します
          for (let j = 0; j < categories.children.length; j += 1) {
            let category = categories.children[j];
            if (category.node.get('name') === name) {
              existCategory = category;
            }
          }
          if (existCategory) {
            // 既存カテゴリにある場合
            echopfCategries.push(existCategory);
          }else{
            // 既存カテゴリにない場合
            const newCategory = new me.ECHOPF.ContentsCategoryObject(me.config.blogInstanceId);
            newCategory.put('name', name);
            newCategory.put('refid', `cat-${new Date().getTime()}`);
            promises.push(newCategory.push());
          }
        }
        // 存在しないカテゴリ名をまとめて作成します
        Promise
          .all(promises)
          .then((ary) => {
            // 作成完了した場合
            for (let i = 0; i < ary.length; i += 1) {
              ary[i].refid = ary[i].get('refid');
              echopfCategries.push(ary[i]);
            }
            res(echopfCategries);
          }, (err) => rej(err))
      });
    }
    
    // ファイルからブログエントリーオブジェクトの生成
    setContents(contents) {
      const me = this;
      const entry = new this.ECHOPF.Blogs.EntryObject(this.config.blogInstanceId);
      return new Promise((res, rej) => {
        const parts = contents
          .match(/---\n([\s\S]*)\n---\n([\s\S]*)$/);
        // ヘッダー部をYAMLとして読み込みます
        const headers = yaml.safeLoad(parts[1]);
        me
          // 既存のカテゴリを取得します
          .getCategories()
          .then((categories) => {
            // 既存のカテゴリとMarkdown上のカテゴリを比較します
            return me.createCategories(categories, headers.categories);
          })
          .then((categories) => {
            // Markdown上のカテゴリは削除します
            delete headers.categories;
            // 取得したカテゴリを設定します
            entry.put('categories', categories);
            // ヘッダーを設定します
            for (let header in headers) {
              let value = headers[header];
              switch (header) {
              case 'published':
                entry.put(header, new Date(value));
                break;
              default:
                entry.put(header, value);
              }
            }
            // 日付を設定します
            const d = new Date();
            entry.put('modified', d);
            entry.put('created', d);
            // 記事本文の処理です
            const bodies = parts[2].split(me.bodySplit);
            // MarkdownからHTMLに変換するコンバータを用意します
            const converter = new showdown.Converter();
            // 記事本文はmainとdetailに分けて設定します
            entry.put('contents', {
              main: converter.makeHtml(bodies[0]),
              detail: converter.makeHtml(bodies[1]),
            });
            // 権限を設定します
            const acl = new me.ECHOPF.ACL();
            // get, list, edit, deleteの順
            acl.putEntryForAll(new me.ECHOPF.ACL.Entry(true, true, false, false));
            entry.setNewACL(acl);
            res(entry);
          })
      });
    }
    // ファイルを読み込みます
    readFile(filePath) {
      return new Promise((res, rej) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
          if (err) return rej(err);
          return res(data);
        });
      });
    }
    
  }
  return BlogBase;
})();
