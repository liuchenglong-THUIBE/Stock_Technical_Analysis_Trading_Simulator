import React from 'react';
import { Card, Button, Statistic, Row, Col, Typography, Divider } from 'antd';
import { calculateMaxDrawdown, calculateAvgRate } from '../utils/calculations';

const { Title } = Typography;

const SettlementView = ({ results, onRestart }) => {
  const { finalAssets, assetsHistory, tradeLog, totalDays } = results;
  const initialAssets = 1000000;

  // 1. 基础指标
  const totalReturnRate = ((finalAssets - initialAssets) / initialAssets) * 100;
  const maxDrawdown = calculateMaxDrawdown(assetsHistory) * 100;

  // 2. 进阶统计 (根据 profitRate 计算)
  const sellTrades = tradeLog.filter(t => t.action === 'sell');
  const totalTrades = sellTrades.length;
  
  const winTrades = sellTrades.filter(t => t.profitRate > 0);
  const winRate = totalTrades > 0 ? (winTrades.length / totalTrades) * 100 : 0;

  // 使用 utils 计算平均盈亏
  const avgWinRate = calculateAvgRate(tradeLog, 'win') * 100;
  const avgLossRate = calculateAvgRate(tradeLog, 'loss') * 100;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        style={{ width: 800 }} 
        title={<Title level={3} style={{ textAlign: 'center', margin: 0 }}>训练结算报告</Title>}
        actions={[<Button type="primary" size="large" onClick={onRestart}>再来一局</Button>]}
      >
        <Row gutter={[24, 24]}>
          <Col span={8}>
            <Statistic 
              title="最终资产" 
              value={finalAssets} 
              precision={0} 
              valueStyle={{ color: totalReturnRate >= 0 ? '#cf1322' : '#3f8600', fontSize: '24px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="总收益率" 
              value={totalReturnRate} 
              precision={2} 
              suffix="%" 
              valueStyle={{ color: totalReturnRate >= 0 ? '#cf1322' : '#3f8600', fontSize: '24px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="最大回撤" 
              value={maxDrawdown} 
              precision={2} 
              suffix="%" 
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Title level={5}>交易分析</Title>
        <Row gutter={[24, 24]}>
          <Col span={6}>
            <Statistic title="交易胜率" value={winRate} precision={1} suffix="%" />
          </Col>
          <Col span={6}>
            <Statistic title="盈利单平均收益" value={avgWinRate} precision={2} suffix="%" valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col span={6}>
            <Statistic title="亏损单平均亏损" value={avgLossRate} precision={2} suffix="%" valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col span={6}>
            <Statistic title="总交易次数" value={totalTrades} />
          </Col>
        </Row>

        <Divider />
        
        <div style={{ textAlign: 'center', color: '#888' }}>
          交易天数: {totalDays} 天
        </div>
      </Card>
    </div>
  );
};

export default SettlementView;