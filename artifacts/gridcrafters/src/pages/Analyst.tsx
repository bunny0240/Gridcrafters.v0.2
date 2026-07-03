import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Analyst() {
  const { toast } = useToast();

  return (
    <div className="p-10 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-xs font-medium text-[#6B7280] mb-8">
        Module 3
      </div>
      
      <h1 className="text-5xl font-bold tracking-tight text-[#ECECEC] mb-4">
        Real Analysts
      </h1>
      
      <p className="text-[#6B7280] text-lg max-w-lg mb-12">
        Master the tools that drive real business decisions. Coming soon to GridCrafters.
      </p>

      <div className="w-full max-w-md bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-12 text-left">
        <h3 className="text-sm font-semibold text-[#ECECEC] mb-4 uppercase tracking-wider">Module Features</h3>
        <ul className="space-y-3">
          {["Advanced formula challenges", "Pivot table builder", "VLOOKUP mastery", "Data analysis projects"].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-[#6B7280]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]"></div>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[#6B7280]">Development Progress</span>
          <span className="text-[#ECECEC] font-medium">0%</span>
        </div>
        <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
          <div className="h-full bg-[#00B4D8] w-0"></div>
        </div>
      </div>

      <button
        onClick={() => toast({ title: "You'll be the first to know!" })}
        className="flex items-center gap-2 px-6 py-3 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-md font-medium transition-colors"
      >
        <Bell className="w-4 h-4" />
        Notify me when available
      </button>
    </div>
  );
}
