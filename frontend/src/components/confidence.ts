export const getConfidenceColor = (confidence: number): string => {
  const pct = confidence <= 1 ? confidence * 100 : confidence;
  if (pct >= 90) {
    return "bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-xs font-medium ml-1.5";
  }
  if (pct >= 50) {
    return "bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded text-xs font-medium ml-1.5";
  }
  
  return "bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded text-xs font-medium ml-1.5";
};

