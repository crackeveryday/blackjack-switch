# Blackjack Switch

React + TypeScript + Vite で作られた、シングルプレイ用の Blackjack Switch 実装です。  
2 つの手札を同時に扱い、配られた 2 枚目同士を 1 回だけ入れ替える `Switch` を中心に、Insurance / Double Down / Split / Surrender まで含めてブラウザで遊べます。

demo: https://crackeveryday.github.io/blackjack-switch/

## 特徴

- 2 ハンド同時進行の Blackjack Switch ルールを実装
- `Switch` と `Keep` の選択に対応
- `Insurance`、`Double Down`、`Split`、`Surrender` に対応
- ディーラーの進行、精算、チップ管理を含むラウンド進行を実装
- `localStorage` にチップ数を保存
- 開発時はデバッグシナリオを UI から読み込み可能
- 純粋関数中心のゲームロジックと Vitest による単体テストを用意

## ルール実装の概要

このアプリは一般的な Blackjack Switch をベースにしつつ、実装上の仕様を明示しています。

- 1 ラウンド開始時に同額ベットの手札を 2 つ作成します
- ベットは `10` から `500` まで、`10` 刻みです
- ラウンド開始には 2 ハンド分のチップが必要です
- ディーラーが A を表向きにしているときだけ Insurance を選べます
- Insurance は 1 ハンド分のベット額で、成立時は `2:1` です
- 初期 2 枚の 21 で、かつ `Switch` や `Split` を経ていない手札だけをナチュラルブラックジャックとして扱います
- `Switch` 後や `Split` 後の 21 はナチュラル扱いになりません
- `Double Down` は未行動の 2 枚手札にのみ可能で、追加は 1 枚だけです
- ディーラーはソフト 17 でスタンドします
- ディーラー合計が `22` の場合、通常手札はプッシュですが、ナチュラルブラックジャックは勝ちのままです
- 精算時のブラックジャック配当は現在の実装では `1:1` です

## セットアップ

### 必要環境

- Node.js 18 以降推奨
- npm

### インストール

```bash
npm install
```

### 開発サーバー

```bash
npm run dev
```

Vite の開発サーバーが起動します。開発モードでは、再現しづらいケースを確認するための Debug Scenario セレクタが表示されます。

### ビルド

```bash
npm run build
```

TypeScript の型チェック後に本番ビルドを生成します。

### プレビュー

```bash
npm run preview
```

`dist/` の内容をローカルで確認できます。

## テスト

```bash
npm test
```

Vitest でゲームロジックの単体テストを実行します。主に以下を検証しています。

- Hand value 計算とブラックジャック判定
- `Switch`、`Insurance`、`Double Down`、`Split` の状態遷移
- ディーラー 22 ルール、保険精算、ソフト 17 スタンド
- デバッグシナリオの生成内容

## ディレクトリ構成

```text
src/
  components/   UI コンポーネント
  game/         ルール、状態遷移、精算、デッキ、テスト
  styles/       グローバル CSS
  App.tsx       画面全体と操作の接続
  main.tsx      エントリーポイント
```

主な責務は次の通りです。

- `src/game/gameState.ts`: ラウンド進行、各種アクション、チップ管理
- `src/game/settlement.ts`: 勝敗判定と精算
- `src/game/rules.ts`: Double / Split / Surrender / Dealer 行動条件
- `src/game/debugScenarios.ts`: 開発用の再現シナリオ

## 開発メモ

- UI テキストは一部日本語、フェーズ名など一部英語です
- チップ数は `localStorage` の `blackjack-switch-chips` キーで保持されます
- `dist/` は生成物です

