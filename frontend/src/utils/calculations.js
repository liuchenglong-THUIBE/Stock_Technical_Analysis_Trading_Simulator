// 计算最大回撤 
export const calculateMaxDrawdown = (assetsHistory) => { 
  if (!assetsHistory || assetsHistory.length === 0) return 0; 
  
  let maxPeak = assetsHistory[0]; 
  let maxDrawdown = 0; 

  for (let val of assetsHistory) { 
    if (val > maxPeak) { 
      maxPeak = val; 
    } 
    const drawdown = (maxPeak - val) / maxPeak; 
    if (drawdown > maxDrawdown) { 
      maxDrawdown = drawdown; 
    } 
  } 
  return maxDrawdown; // 返回小数，如 0.15 代表 15% 
}; 

// 计算平均收益率 (传入交易记录数组) 
// tradeLog 结构: { action: 'sell', profitRate: 0.05, ... } 
export const calculateAvgRate = (tradeLogs, type) => { 
  // type: 'win' (盈利) or 'loss' (亏损) 
  const targetLogs = tradeLogs.filter(t => 
    t.action === 'sell' && (type === 'win' ? t.profitRate > 0 : t.profitRate <= 0) 
  ); 

  if (targetLogs.length === 0) return 0; 

  const totalRate = targetLogs.reduce((acc, curr) => acc + curr.profitRate, 0); 
  return totalRate / targetLogs.length; 
};