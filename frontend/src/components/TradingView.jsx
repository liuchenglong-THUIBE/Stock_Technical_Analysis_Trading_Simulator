import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Layout, Button, InputNumber, Radio, Statistic, Card, message, Row, Col, Modal } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

// --- ECharts 配置函数 (保持不变) ---
const getOption = (data, subChartType, globalStartIndex, zoomStartValue, zoomEndValue) => {
  if (!data || data.length === 0) return {};

  const dates = data.map((_, index) => {
    const diff = index - globalStartIndex;
    if (diff === 0) return 'Start';
    return diff > 0 ? `T+${diff}` : `T${diff}`;
  });

  const kLineData = data.map(item => [item.open, item.close, item.low, item.high]);
  
  const calculateMA = (dayCount) => {
    return data.map((item, index) => {
      if (index < dayCount) return '-';
      let sum = 0;
      for (let i = 0; i < dayCount; i++) {
        sum += data[index - i].close;
      }
      return (sum / dayCount).toFixed(2);
    });
  };

  let subSeriesData = [];
  let subSeriesType = 'bar';
  let subSeriesName = '';

  switch (subChartType) {
    case 'volume':
      subSeriesData = data.map((item, idx) => [idx, item.volume, item.close > item.open ? 1 : -1]);
      subSeriesName = '成交量';
      subSeriesType = 'bar';
      break;
    case 'turnover':
      subSeriesData = data.map(item => item.turnover_rate);
      subSeriesName = '换手率(%)';
      subSeriesType = 'bar';
      break;
    case 'pe':
      subSeriesData = data.map(item => item.pe);
      subSeriesName = 'PE';
      subSeriesType = 'line';
      break;
    case 'pb':
      subSeriesData = data.map(item => item.pb);
      subSeriesName = 'PB';
      subSeriesType = 'line';
      break;
    default: break;
  }

  return {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'cross' },
      confine: true,
      formatter: (params) => {
        if (!params || params.length === 0) return '';
        const axisValue = params[0].axisValue;
        let result = `<strong>交易日: ${axisValue}</strong><br/>`;
        params.forEach(param => {
          if (param.value !== undefined && param.value !== '-') {
            if (param.seriesType === 'candlestick') {
            } else {
                let val = param.value;
                if (Array.isArray(val)) val = val[1];
                result += `${param.marker} ${param.seriesName}: ${Number(val).toFixed(2)}<br/>`;
            }
          }
        });
        return result;
      }
    },
    axisPointer: { link: { xAxisIndex: 'all' } },
    grid: [
      { left: '60px', right: '40px', height: '60%', top: '20px' },
      { left: '60px', right: '40px', top: '72%', height: '20%' }
    ],
    xAxis: [
      { type: 'category', data: dates, scale: true, boundaryGap: false, axisLine: { onZero: false }, splitLine: { show: false }, min: 'dataMin', max: 'dataMax' },
      { type: 'category', gridIndex: 1, data: dates, axisLabel: { show: false } }
    ],
    yAxis: [
      { scale: true, splitArea: { show: true } },
      { scale: true, gridIndex: 1, splitNumber: 3, axisLabel: { show: true } }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], startValue: zoomStartValue, endValue: zoomEndValue },
      { show: true, xAxisIndex: [0, 1], type: 'slider', top: '94%', startValue: zoomStartValue, endValue: zoomEndValue }
    ],
    series: [
      {
        name: '日K', type: 'candlestick', data: kLineData,
        itemStyle: { color: '#ef232a', color0: '#14b143', borderColor: '#ef232a', borderColor0: '#14b143' }
      },
      { name: 'MA10', type: 'line', data: calculateMA(10), smooth: true, showSymbol: false, lineStyle: { opacity: 0.8, width: 2 } },
      { name: 'MA20', type: 'line', data: calculateMA(20), smooth: true, showSymbol: false, lineStyle: { opacity: 0.8, width: 2 } },
      { name: 'MA60', type: 'line', data: calculateMA(60), smooth: true, showSymbol: false, lineStyle: { opacity: 0.8, width: 2 } },
      { name: 'MA250', type: 'line', data: calculateMA(250), smooth: true, showSymbol: false, lineStyle: { opacity: 0.8, width: 2 } },
      {
        name: subSeriesName, type: subSeriesType, xAxisIndex: 1, yAxisIndex: 1, data: subSeriesData,
        itemStyle: { color: subSeriesType === 'bar' ? '#7fbe9e' : '#5470c6' }
      }
    ]
  };
};

const TradingView = ({ fullData, startIndex, onGameOver }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [subChartType, setSubChartType] = useState('volume');
  
  const [cash, setCash] = useState(1000000);
  const [holdings, setHoldings] = useState(0);
  const [avgCost, setAvgCost] = useState(0);
  const [tradeVol, setTradeVol] = useState(100);
  
  const [tradeLog, setTradeLog] = useState([]);
  const [assetsHistory, setAssetsHistory] = useState([]);

  const currentData = fullData[currentIndex] || {};
  const currentPrice = currentData.close || 0;
  
  // --- 关键计算更新 ---
  const stockMarketValue = holdings * currentPrice; // 持仓市值
  const totalAssets = cash + stockMarketValue;      // 总资产
  
  // 计算仓位比例
  const positionRatio = totalAssets > 0 ? (stockMarketValue / totalAssets) * 100 : 0;

  const currentDayCount = currentIndex - startIndex;
  const tradeAmount = tradeVol * currentPrice;
  const tradeRatio = totalAssets > 0 ? (tradeAmount / totalAssets) * 100 : 0;

  useEffect(() => {
    if (!chartInstance.current && chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    const slicedData = fullData.slice(0, currentIndex + 1);
    
    // --- 缩放保持逻辑 ---
    let zoomStartValue;
    let zoomEndValue;
    const totalLen = slicedData.length;
    const model = chartInstance.current.getModel();
    let currentSpan = null;
    
    if (model) {
        const dz = model.getComponent('dataZoom', 0);
        if (dz) {
            const currentStart = dz.option.startValue;
            const currentEnd = dz.option.endValue;
            if (currentStart != null && currentEnd != null && !isNaN(currentStart)) {
                currentSpan = currentEnd - currentStart;
            }
        }
    }

    if (currentSpan != null) {
        zoomEndValue = totalLen - 1;
        zoomStartValue = Math.max(0, zoomEndValue - currentSpan);
    } else {
        zoomEndValue = totalLen - 1;
        zoomStartValue = Math.max(0, zoomEndValue - 60);
    }
    
    const option = getOption(slicedData, subChartType, startIndex, zoomStartValue, zoomEndValue);
    chartInstance.current.setOption(option, { notMerge: true }); 
    
  }, [currentIndex, subChartType, fullData, startIndex]);

  useEffect(() => {
    const handleResize = () => chartInstance.current && chartInstance.current.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setAssetsHistory(prev => [...prev, totalAssets]);
  }, [currentIndex]);

  const handleNextDay = () => {
    if (currentIndex >= fullData.length - 1) {
      Modal.info({
        title: '训练结束',
        content: '已到达该股票的最新交易数据，即将进入结算页面。',
        onOk: doSettlement
      });
      return;
    }
    setCurrentIndex(prev => prev + 1);
  };

  const handleBuy = () => {
    if (tradeAmount > cash) { message.error("资金不足！"); return; }
    const newAvgCost = ((holdings * avgCost) + tradeAmount) / (holdings + tradeVol);
    setAvgCost(newAvgCost);
    setCash(prev => prev - tradeAmount);
    setHoldings(prev => prev + tradeVol);
    
    setTradeLog(prev => [...prev, { day: `T+${currentDayCount}`, action: 'buy', price: currentPrice, volume: tradeVol }]);
    message.success(`买入 ${tradeVol} 股`);
    handleNextDay();
  };

  const handleSell = () => {
    if (tradeVol > holdings) { message.error("持仓不足！"); return; }
    const income = tradeAmount;
    const profitRate = (currentPrice - avgCost) / avgCost;
    setCash(prev => prev + income);
    setHoldings(prev => {
        const remaining = prev - tradeVol;
        if (remaining === 0) setAvgCost(0);
        return remaining;
    });
    setTradeLog(prev => [...prev, { day: `T+${currentDayCount}`, action: 'sell', price: currentPrice, volume: tradeVol, profitRate: profitRate }]);
    message.success(`卖出 ${tradeVol} 股 (收益: ${(profitRate * 100).toFixed(2)}%)`);
    handleNextDay();
  };

  const doSettlement = () => {
    onGameOver({ finalAssets: totalAssets, assetsHistory, tradeLog, totalDays: currentIndex - startIndex });
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Content style={{ padding: '10px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div ref={chartRef} style={{ flex: 1, width: '100%' }} />
        <div style={{ padding: '10px', display: 'flex', justifyContent: 'center', background: '#f5f5f5' }}>
          <span style={{ marginRight: 10, lineHeight: '32px' }}>副图指标：</span>
          <Radio.Group value={subChartType} onChange={e => setSubChartType(e.target.value)} buttonStyle="solid">
            <Radio.Button value="volume">成交量</Radio.Button>
            <Radio.Button value="turnover">换手率</Radio.Button>
            <Radio.Button value="pe">PE</Radio.Button>
            <Radio.Button value="pb">PB</Radio.Button>
          </Radio.Group>
        </div>
      </Content>

      <Sider width={320} theme="light" style={{ borderLeft: '1px solid #ddd', padding: '16px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title={`交易进程: 第 ${currentDayCount} 天`} size="small">
            <Statistic 
              title="当前价格" 
              value={currentPrice} 
              precision={2}
              valueStyle={{ color: currentData.change_pct >= 0 ? '#cf1322' : '#3f8600' }}
              prefix={currentData.change_pct >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={`(${currentData.change_pct}%)`}
            />
          </Card>

          <Card title="账户信息" size="small">
            <Row gutter={16}>
              <Col span={12}><Statistic title="总资产" value={totalAssets} precision={0} /></Col>
              <Col span={12}>
                <Statistic title="累计收益" value={(totalAssets - 1000000) / 10000} precision={2} suffix="%" 
                  valueStyle={{ color: totalAssets >= 1000000 ? '#cf1322' : '#3f8600' }} />
              </Col>
            </Row>
            
            {/* 修改点：新增股票仓位显示 */}
            <div style={{ marginTop: 12, padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
              <div style={{ marginBottom: 4 }}>
                股票仓位: <b style={{ color: '#1890ff' }}>{positionRatio.toFixed(2)}%</b>
                <span style={{ fontSize: '12px', color: '#999', marginLeft: 4 }}>(¥{stockMarketValue.toLocaleString()})</span>
              </div>
              <div style={{ marginBottom: 4 }}>可用现金: <b>{cash.toFixed(0)}</b></div>
              <div style={{ marginBottom: 4 }}>持仓股数: <b>{holdings}</b></div>
              <div>持仓成本: <b>{avgCost.toFixed(2)}</b></div>
            </div>
          </Card>

          <Card title="交易控制" size="small">
            <div style={{ marginBottom: 16 }}>
              <span>交易数量：</span>
              <InputNumber min={100} step={100} value={tradeVol} onChange={setTradeVol} style={{ width: '120px' }} />
            </div>
            
            <div style={{ marginBottom: 16, fontSize: '12px', color: '#666', background: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>交易金额:</span>
                <span style={{ fontWeight: 'bold' }}>¥{tradeAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>占总资产比:</span>
                <span style={{ fontWeight: 'bold', color: tradeRatio > 50 ? '#cf1322' : '#1890ff' }}>
                  {tradeRatio.toFixed(2)}%
                </span>
              </div>
            </div>

            <Row gutter={8}>
              <Col span={12}><Button type="primary" danger block onClick={handleBuy}>买入</Button></Col>
              <Col span={12}><Button type="primary" style={{ background: '#14b143', borderColor: '#14b143' }} block onClick={handleSell}>卖出</Button></Col>
            </Row>
            <Button block style={{ marginTop: 12 }} onClick={handleNextDay}>下一天 (观望)</Button>
          </Card>
          <Button type="dashed" danger block onClick={doSettlement} style={{ marginTop: '20px' }}>提前结算</Button>
        </div>
      </Sider>
    </Layout>
  );
};

export default TradingView;