import React, { useState } from 'react';
import { message } from 'antd';
import SetupView from './components/SetupView';
import TradingView from './components/TradingView';
import SettlementView from './components/SettlementView';
import { startNewGame } from './api';

const App = () => {
  // 游戏阶段: 'setup' | 'playing' | 'settlement'
  const [phase, setPhase] = useState('setup');
  const [loading, setLoading] = useState(false);
  
  // 游戏数据
  const [gameData, setGameData] = useState(null); // { ticker, data, start_index }
  const [results, setResults] = useState(null); // 结算数据

  // 开始游戏
  const handleStartGame = async (startDate) => {
    setLoading(true);
    try {
      const data = await startNewGame(startDate);
      setGameData(data); // data 包含: ticker, data[], start_index
      setPhase('playing');
      message.success(`成功加载股票：${data.ticker}`);
    } catch (error) {
      message.error("加载失败，请检查后端服务");
    } finally {
      setLoading(false);
    }
  };

  // 游戏结束
  const handleGameOver = (resultData) => {
    setResults(resultData);
    setPhase('settlement');
  };

  // 重启
  const handleRestart = () => {
    setGameData(null);
    setResults(null);
    setPhase('setup');
  };

  return (
    <div className="app-container">
      {phase === 'setup' && (
        <SetupView onStart={handleStartGame} loading={loading} />
      )}
      
      {phase === 'playing' && gameData && (
        <TradingView
          fullData={gameData.data}
          startIndex={gameData.start_index}
          onGameOver={handleGameOver}
        />
      )}

      {phase === 'settlement' && results && (
        <SettlementView results={results} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default App;