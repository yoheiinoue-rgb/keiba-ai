export const metadata = {
  title: "分析履歴 | 競馬AI",
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">分析履歴</h1>
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-lg font-medium">履歴はまだありません</p>
        <p className="text-sm mt-1">AI考察を実行すると、ここに履歴が表示されます</p>
      </div>
    </div>
  );
}
