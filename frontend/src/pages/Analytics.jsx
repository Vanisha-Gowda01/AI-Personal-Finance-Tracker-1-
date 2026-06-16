import React from 'react';
import { Card, Row, Col, Statistic, Typography, Empty } from 'antd';
import { 
  ArrowDownOutlined, 
  PieChartOutlined, 
  PercentageOutlined, 
  WalletOutlined 
} from '@ant-design/icons';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const { Title, Text } = Typography;

export default function Analytics({ transactions }) {
  // Helper to format currency
  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  // Calculations
  const income = transactions
    .filter(t => t.Amount > 0)
    .reduce((sum, t) => sum + t.Amount, 0);

  const expense = transactions
    .filter(t => t.Amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.Amount), 0);

  const savings = income - expense;
  
  const savingsPercentage = income ? (savings / income) * 100 : 0;

  // Expense by category
  const categoryExpenses = transactions
    .filter(t => t.Amount < 0)
    .reduce((acc, t) => {
      const amt = Math.abs(t.Amount);
      acc[t.Category] = (acc[t.Category] || 0) + amt;
      return acc;
    }, {});

  const categoryData = Object.keys(categoryExpenses).map(cat => ({
    category: cat,
    spend: categoryExpenses[cat]
  })).sort((a, b) => b.spend - a.spend);

  const topCategory = categoryData.length > 0 ? categoryData[0].category : 'None';

  // Monthly Expenses (Area Chart)
  const monthlyExpenses = transactions
    .filter(t => t.Amount < 0)
    .reduce((acc, t) => {
      const date = new Date(t.Date);
      const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      acc[key] = (acc[key] || 0) + Math.abs(t.Amount);
      return acc;
    }, {});

  const areaData = Object.keys(monthlyExpenses).map(key => ({
    month: key,
    spend: monthlyExpenses[key]
  })).reverse(); // oldest first

  if (transactions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Outfit' }}>Analytics</Title>
          <Text type="secondary">Understand the shape of your spending and saving habits.</Text>
        </div>
        <Card className="glass-panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Empty description={<span style={{ color: '#a0aec0' }}>Add transactions to view analytics.</span>} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Outfit' }}>Analytics</Title>
        <Text type="secondary">Understand the shape of your spending and saving habits.</Text>
      </div>

      {/* Analytics Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-expense" bordered={false}>
            <Statistic
              title={<span style={{ color: '#a0aec0', fontSize: 13, fontWeight: 500 }}>Spending Summary</span>}
              value={expense}
              precision={2}
              valueStyle={{ color: '#ff4d4f', fontWeight: 800, fontFamily: 'Outfit', fontSize: 24 }}
              prefix={<ArrowDownOutlined />}
              formatter={(val) => formatMoney(val)}
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Total outflow</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-budget" bordered={false}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Top Category</span>}
              value={topCategory}
              valueStyle={{ color: '#ff5ca8', fontWeight: 800, fontFamily: 'Outfit', fontSize: 22 }}
              prefix={<PieChartOutlined />}
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Highest spend area</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-savings" bordered={false}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Savings Percentage</span>}
              value={savingsPercentage}
              precision={1}
              valueStyle={{ color: '#14b8a6', fontWeight: 800, fontFamily: 'Outfit', fontSize: 24 }}
              prefix={<PercentageOutlined />}
              suffix="%"
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Of total income</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-income" bordered={false}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Net Savings</span>}
              value={savings}
              precision={2}
              valueStyle={{ color: '#10b981', fontWeight: 800, fontFamily: 'Outfit', fontSize: 24 }}
              prefix={<WalletOutlined />}
              formatter={(val) => formatMoney(val)}
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Remaining liquid funds</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Trend Area Chart */}
        <Col xs={24} lg={12}>
          <Card 
            className="glass-panel" 
            title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}>Monthly Spending Trend</span>}
            bordered={false}
          >
            {areaData.length === 0 ? (
              <Empty description="No spending history available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                    <XAxis dataKey="month" stroke="#718096" style={{ fontSize: 11 }} />
                    <YAxis stroke="#718096" style={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: 8 }}
                      itemStyle={{ color: '#1e293b' }}
                      labelStyle={{ color: '#475569' }}
                      formatter={(value) => [formatMoney(value), 'Spend']}
                    />
                    <Area type="monotone" dataKey="spend" stroke="#14b8a6" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Category Breakdown (Horizontal Bar Chart) */}
        <Col xs={24} lg={12}>
          <Card 
            className="glass-panel" 
            title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}>Category breakdown</span>}
            bordered={false}
          >
            {categoryData.length === 0 ? (
              <Empty description="No categories spend data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={categoryData} 
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" horizontal={false} />
                    <XAxis type="number" stroke="#718096" style={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                    <YAxis dataKey="category" type="category" stroke="#718096" style={{ fontSize: 11 }} width={80} />
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: 8 }}
                      itemStyle={{ color: '#1e293b' }}
                      labelStyle={{ color: '#475569' }}
                      formatter={(value) => [formatMoney(value), 'Spend']}
                    />
                    <Bar dataKey="spend" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16}>
                      {categoryData.map((entry, index) => {
                        // Color variation for aesthetic touch
                        const colorGrad = index === 0 ? '#ff5ca8' : index === 1 ? '#14b8a6' : '#10b981';
                        return <Cell key={`cell-${index}`} fill={colorGrad} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
