# 🚀 Gemini Tweet Release

**「リリース作業を、もっと楽しく。」**
GitHub ActionsとGemini APIを使って、コミット内容から魅力的なリリースツイートを自動生成するActionです。

## ✨ Features

- **📝 構造化された自動ツイート**: 単なる要約ではなく、「解説」「結果」「感想」の3部構成で、ストーリー性のあるツイート文章をつくります。
- **🤖 Gemini 2.0 Flash**: 高速かつ自然な日本語で、エンジニアらしい親しみやすいトーンを実現。
- **Review First**: いきなり投稿せず、Intent URL（ツイート画面へのリンク）を生成するため、内容を確認・編集してから投稿できます。

## 📦 Usage

あなたのプロジェクトの `.github/workflows` にYAMLファイルを追加するだけです。
スクリプトをコピーする必要はありません。

```yaml
name: Generate Release Tweet

on:
  push:
    branches: [ main, master ]

jobs:
  tweet:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      # このActionを使用
      - uses: Koki-718/gemini-tweet-release@main
        with:
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
```


## 🔑 Setup

1. [Google AI Studio](https://aistudio.google.com/app/apikey) で API Key を取得します。
2. GitHubリポジトリの **Settings > Secrets > Actions** に `GEMINI_API_KEY` として登録します。

---
License: MIT
