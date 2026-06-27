# 冷蔵庫アプリ仕様

## ルーム（冷蔵庫の区画）

固定レイアウト（将来的にはユーザーが形を選択できるようにする）。

| RoomId | デフォルト名 | 位置 |
|--------|------------|------|
| `fridge` | 冷蔵室 | 1段目：全幅 |
| `vegetable` | 野菜室 | 2段目：全幅 |
| `ice-maker` | 製氷室 | 3段目：左半分 |
| `freezer-upper` | 冷凍室 | 3段目：右半分 |
| `freezer-lower` | 冷凍室 | 4段目：全幅 |

各ルームにはユーザーが任意の名前を設定できる（長押しでリネーム）。

## ナビゲーション

- ホーム画面でルームをタップ → `/(tabs)/ingredients?roomId=<id>` へ遷移
- 食材画面は `roomId` パラメータがあれば当該ルームの食材のみ表示、なければ全件表示

## データモデル

```typescript
Room      { id: RoomId; name: string }
Ingredient { id: string; name: string; roomId: RoomId }
```

状態は `store/AppContext.tsx` の React Context で管理。永続化は未実装（将来: AsyncStorage）。

## 未実装（今後）

- 冷蔵庫レイアウトのカスタマイズ
- 食材の追加・削除UI
- 永続化
