import React from 'react';
import { Card, Button, Typography } from 'antd';

const { Title, Text } = Typography;

const SetupView = ({ onStart, loading }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>

        <Title level={3} style={{ marginBottom: '5px' }}>股票技术分析训练器</Title>

        <div style={{ margin: '40px 0 10px 0', color: '#666' }}>
          <Text>系统将随机抽取一只股票</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            (筛选条件：2016年后，历史数据充足，剩余交易日 &gt; 500天)
          </Text>
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <Text strong>初始资金：1,000,000</Text>
        </div>
        
        <Button type="primary" size="large" onClick={() => onStart()} loading={loading} block style={{ height: '50px', fontSize: '18px' }}>
          开始随机训练
        </Button>
      </Card>
    </div>
  );
};

export default SetupView;
