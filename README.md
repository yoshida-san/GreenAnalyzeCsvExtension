# Green Analyze Exporter (CSV/XLSX)

Greenの分析ページに表示される応募/アプローチの表を、CSVまたはXLSXでダウンロードするChrome拡張です。

## できること

- 応募/アプローチのテーブルをCSVまたはXLSXで保存
- CSV/XLSXの切り替えUI
- 集計行（合計/平均/平均利用率）の除外オプション

## 仕組み

- Content Scriptで表を取得してデータ化
- XLSXはSheetJSで生成（`vendor/xlsx.full.min.js`）
- Service Workerで`chrome.downloads.download`を使用して保存

## ファイル構成

```text
.
├─ manifest.json
├─ sw.js
├─ content.js
├─ popup.html
├─ popup.js
├─ vendor/
│  └─ xlsx.full.min.js
└─ README.md
```

## インストール (Chromeに追加)

1. [GitHub/GreenAnalyzeCsvExtension](https://github.com/yoshida-san/GreenAnalyzeCsvExtension)からZIPでダウンロードして解凍
    1. 緑色の「<> Code」というボタンをクリックして「Download ZIP」をクリック
2. Chromeで `chrome://extensions` を開く
3. 右上の「デベロッパーモード」をON
4. 「パッケージ化されていない拡張機能を読み込む」で解凍したフォルダを選択
    1. content.jsやmanifest.jsonなどがあるフォルダ
5. ツールバーに拡張機能のアイコンが表示されれば完了

## 使い方

1. Greenの分析ページを開く  
   `https://www.green-japan.com/client/analyze`
2. 対象期間を指定し、応募/アプローチのタブを表示
3. 拡張のポップアップから形式（CSV/XLSX）を選択
4. 「ダウンロード」を押して保存

## 権限

- `downloads`: ファイル保存のため
- `activeTab`: アクティブタブへのアクセス
- `host_permissions`: `https://www.green-japan.com/*`

## 注意

- ページ表示直後は表が未描画のことがあります。表示されてから実行してください。
- Green側のDOMが変わると動作しなくなる可能性があります。

## ライセンス

Internal Use / As-Is

