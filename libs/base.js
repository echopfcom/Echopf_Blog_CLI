const ECHOPF = require('../ECHO.min');
const path = require('path');
const fs = require('fs');
const toMarkdown = require('to-markdown');

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
          const acl = acls[meta];
          const subMetas = ['get', 'list', 'edit', 'delete'];
          for (let j = 0; j < subMetas.length; j += 1) {
            const key = subMetas[j];
            if (typeof acl[key] !== 'undefined') {
              data.push(`    ${key}: ${acl[key]}`);
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
    
  }
  return BlogBase;
})();
