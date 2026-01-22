# Green Analyze CSV Exporter

転職サイト **Green（企業管理画面）** の  
**「数値分析」ページに表示される求人別KPIテーブル**を  
**CSV形式でダウンロード**する Chrome 拡張です。

- 「求職者からのアプローチ」
- 「貴社からのアプローチ」

両タブに対応しています。

---

## ✨ 主な機能

- 数値分析テーブルを **CSVとして保存**
- **保存先選択ダイアログあり**（downloads API使用）
- 表示中のタブ（apply / approach）を自動判別
- 期間・職種・タブ情報をCSVにメタ情報として付与
- 以下の行を **除外するオプション**付き
  - 合計
  - 平均
  - 採用成功求人平均

---

## 🧩 技術構成

- Chrome Extension **Manifest V3**
- Content Script による DOM 抽出
- Service Worker（background）による `chrome.downloads.download`
- Green内部APIは使用せず、**表示済みDOMのみを対象**

> 管理画面上で人が見る情報をそのままCSV化するため、  
> 仕様変更に比較的強く、実務用途向けです。

---

## 📦 ファイル構成

```text
.
├─ manifest.json
├─ sw.js              # service worker（CSVダウンロード）
├─ content.js         # テーブル抽出・CSV生成
├─ popup.html         # UI
├─ popup.js
└─ README.md
