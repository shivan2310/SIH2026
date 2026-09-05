export interface MasteryItem {
  topic: string;
  progress: number;
}

export function Mastery({ masteryData }: { masteryData: MasteryItem[] }) {
  const getColor = (index: number) => {
    const colors = ["bg-[#20B486]", "bg-[#F47F45]", "bg-[#F89864]", "bg-[#FF6680]"];
    return colors[index % colors.length];
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-[#111111]">Your Mastery</h2>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
        {masteryData.map((item, index) => (
          <div key={item.topic}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#111111]">{item.topic}</span>
              <span className="text-xs font-bold text-[#707070]">{item.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F5F5]">
              <div
                className={`h-full rounded-full ${getColor(index)}`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ))}
        {masteryData.length === 0 && (
          <p className="col-span-full text-sm text-[#707070]">No mastery data available.</p>
        )}
      </div>
    </div>
  );
}
