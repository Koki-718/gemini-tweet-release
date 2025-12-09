# 🚀 Gemini Tweet Release

**「リリース作業を、もっと楽しく。」**
GitHub ActionsとGemini APIを使って、コミット内容から魅力的なリリースツイートを自動生成するActionです。

## ✨ Features

- **📝 構造化された自動ツイート**: 単なる要約ではなく、「解説」「結果」「感想」の3部構成で、ストーリー性のあるツイート文章をつくります。
- **🤖 Gemini 2.0 Flash**: 高速かつ自然な日本語で、エンジニアらしい親しみやすいトーンを実現。
- **🎨 AI画像生成 (Imagen)**: コミット内容を解析し、その変更を表すクールなイメージ画像を自動生成します（GitHub Artifactsに保存）。
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
          enable_image_generation: 'true' # 画像生成を有効にする場合
```

## 🔑 Setup

1. [Google AI Studio](https://aistudio.google.com/app/apikey) で API Key を取得します。
2. GitHubリポジトリの **Settings > Secrets > Actions** に `GEMINI_API_KEY` として登録します。
3. `enable_image_generation: 'true'` にする場合、APIキーが Imagen (画像生成) に対応している必要があります（現在は多くのキーで利用可能ですが、Beta版の制限を受ける場合があります）。

## 🖼️ About Image Generation

`enable_image_generation: 'true'` に設定すると、Gemini (Imagen) がコミット内容から画像を生成します。
生成された画像は **GitHub Actionsの「Artifacts」セクション** からダウンロードできます。
ツイートする際に手動で添付してください（Twitter Intent URLの仕様上、画像の自動添付はできません）。

---
License: MIT
