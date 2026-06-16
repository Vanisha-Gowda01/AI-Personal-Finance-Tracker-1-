import React from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Space, Tag, Empty } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  WalletOutlined, 
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const { Title, Text } = Typography;

const COLORS = ['#10b981', '#14b8a6', '#ff5ca8', '#ffc658', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#82ca9d', '#8884d8'];

export default function Dashboard({ transactions, monthlyBudget }) {
  // Helper to format currency
  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
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
  
  const isOverBudget = expense > monthlyBudget;

  // Recent Transactions (top 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.Date) - new Date(a.Date))
    .slice(0, 5);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'Date',
      key: 'date',
      render: (text) => {
        const d = new Date(text);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    },
    {
      title: 'Description',
      dataIndex: 'Description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'Category',
      key: 'category',
      render: (cat) => <Tag color="rgba(255,255,255,0.06)" style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>{cat}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'Amount',
      key: 'amount',
      align: 'right',
      render: (val) => (
        <span style={{ color: val > 0 ? '#10b981' : '#ff4d4f', fontWeight: 600 }}>
          {val > 0 ? '+' : ''}{formatMoney(val)}
        </span>
      )
    }
  ];

  // Expense by Category (for donut chart)
  const expenseByCategory = transactions
    .filter(t => t.Amount < 0)
    .reduce((acc, t) => {
      const amt = Math.abs(t.Amount);
      acc[t.Category] = (acc[t.Category] || 0) + amt;
      return acc;
    }, {});

  const pieData = Object.keys(expenseByCategory).map(cat => ({
    name: cat,
    value: expenseByCategory[cat]
  })).sort((a, b) => b.value - a.value);

  // Monthly Spending Trend
  const monthlyExpenses = transactions
    .filter(t => t.Amount < 0)
    .reduce((acc, t) => {
      const date = new Date(t.Date);
      const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); // e.g. "Jun 2026"
      acc[key] = (acc[key] || 0) + Math.abs(t.Amount);
      return acc;
    }, {});

  // Convert to ordered array for charts
  const trendData = Object.keys(monthlyExpenses).map(key => ({
    month: key,
    spend: monthlyExpenses[key]
  })).reverse(); // Oldest first

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Outfit' }}>Dashboard</Title>
          <Text type="secondary">Your money overview, refreshed from every transaction.</Text>
        </div>
        <Tag color="#10b981" style={{ color: '#ffffff', fontWeight: 600, border: 'none', padding: '4px 12px', borderRadius: 20 }}>
          Live portfolio snapshot
        </Tag>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-income" bordered={false}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Total Income</span>}
              value={income}
              precision={2}
              valueStyle={{ color: '#10b981', fontWeight: 800, fontFamily: 'Outfit', fontSize: 24 }}
              prefix={<ArrowUpOutlined />}
              formatter={(val) => formatMoney(val)}
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Credited transactions</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-expense" bordered={false}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Total Expense</span>}
              value={expense}
              precision={2}
              valueStyle={{ color: '#ff4d4f', fontWeight: 800, fontFamily: 'Outfit', fontSize: 24 }}
              prefix={<ArrowDownOutlined />}
              formatter={(val) => formatMoney(val)}
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Debited transactions</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-savings" bordered={false}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Total Savings</span>}
              value={savings}
              precision={2}
              valueStyle={{ color: '#14b8a6', fontWeight: 800, fontFamily: 'Outfit', fontSize: 24 }}
              prefix={<WalletOutlined />}
              formatter={(val) => formatMoney(val)}
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>Income minus expenses</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-panel glow-card-budget" bordered={false}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Budget Status</span>}
              value={isOverBudget ? 'Over Budget' : 'Within Budget'}
              valueStyle={{ color: isOverBudget ? '#ff4d4f' : '#10b981', fontWeight: 800, fontFamily: 'Outfit', fontSize: 22 }}
              prefix={isOverBudget ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            />
            <div style={{ marginTop: 8, color: '#718096', fontSize: 12 }}>
              Limit: {formatMoney(monthlyBudget)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Panel grid */}
      {transactions.length === 0 ? (
        <Card className="glass-panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Empty 
            description={
              <span style={{ color: '#a0aec0', fontSize: 15 }}>
                Add or upload transactions to unlock your dashboard charts.
              </span>
            } 
          />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {/* Recent Transactions List */}
            <Col xs={24} lg={13}>
              <Card 
                className="glass-panel" 
                title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}>Recent Transactions</span>}
                bordered={false}
                bodyStyle={{ padding: 0 }}
              >
                <Table 
                  columns={columns} 
                  dataSource={recentTransactions} 
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: 'No transactions found' }}
                  style={{ background: 'transparent' }}
                  className="custom-table"
                />
              </Card>
            </Col>

            {/* Expense breakdown chart */}
            <Col xs={24} lg={11}>
              <Card 
                className="glass-panel" 
                title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}>Expense Distribution</span>}
                bordered={false}
              >
                {pieData.length === 0 ? (
                  <Empty description="No expense categories to display" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: 8 }}
                          itemStyle={{ color: '#1e293b' }}
                          formatter={(value) => [formatMoney(value), 'Spend']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div style={{ width: 150, paddingLeft: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                      {pieData.slice(0, 5).map((entry, idx) => (
                        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                           <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length] }} />
                           <div style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{entry.name}</div>
                           <div style={{ color: '#1e293b', fontWeight: 600, marginLeft: 'auto' }}>{Math.round((entry.value / expense) * 100)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Monthly Trend Chart */}
            <Col xs={24}>
              <Card 
                className="glass-panel" 
                title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}>Monthly Expense Trend</span>}
                bordered={false}
              >
                {trendData.length === 0 ? (
                  <Empty description="No monthly trend data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                        <XAxis dataKey="month" stroke="#718096" style={{ fontSize: 11 }} />
                        <YAxis stroke="#718096" style={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip 
                          contentStyle={{ background: '#ffffff', borderColor: 'rgba(0,0,0,0.06)', borderRadius: 8 }}
                          itemStyle={{ color: '#1e293b' }}
                          labelStyle={{ color: '#475569' }}
                          formatter={(value) => [formatMoney(value), 'Expenses']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="spend" 
                          stroke="#14b8a6" 
                          strokeWidth={3} 
                          activeDot={{ r: 8 }} 
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
