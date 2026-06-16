import React, { useState } from 'react';
import { Layout, Menu, Button, Space, InputNumber, Typography, Avatar, Drawer, Grid } from 'antd';
import { 
  DashboardOutlined, 
  TransactionOutlined, 
  AreaChartOutlined, 
  BulbOutlined, 
  TrophyOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function MainLayout({ 
  children, 
  user, 
  currentPage, 
  setCurrentPage, 
  monthlyBudget, 
  setMonthlyBudget, 
  onLogout 
}) {
  const [mobileVisible, setMobileVisible] = useState(false);
  const screens = useBreakpoint();
  
  const isMobile = !screens.md;

  const menuItems = [
    { key: 'Dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'Transactions', icon: <TransactionOutlined />, label: 'Transactions' },
    { key: 'Analytics', icon: <AreaChartOutlined />, label: 'Analytics' },
    { key: 'AI Insights', icon: <BulbOutlined />, label: 'AI Insights' },
    { key: 'Goals', icon: <TrophyOutlined />, label: 'Budget Goals' },
    { key: 'Profile', icon: <UserOutlined />, label: 'Profile' },
  ];

  const handleMenuClick = (e) => {
    setCurrentPage(e.key);
    if (isMobile) {
      setMobileVisible(false);
    }
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 16 }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #10b981, #14b8a6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)'
        }}>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>PF</span>
        </div>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1e293b', fontSize: 17, fontWeight: 700, fontFamily: 'Outfit' }}>
            Finance AI
          </Title>
          <Text type="secondary" style={{ fontSize: 12, color: '#475569' }}>
            Personal Finance Tracker
          </Text>
        </div>
      </div>

      {/* Navigation Menu */}
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[currentPage]}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ background: 'transparent', flexGrow: 1 }}
      />

      <div style={{ padding: '0 16px', margin: '16px 0' }}>
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
      </div>

      {/* Budget Editor Panel */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <Text style={{ display: 'block', color: '#475569', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
          MONTHLY BUDGET (INR)
        </Text>
        <InputNumber
          min={1000}
          step={1000}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\₹\s?|(,*)/g, '')}
          value={monthlyBudget}
          onChange={(val) => setMonthlyBudget(val || 50000)}
          style={{ width: '100%', background: 'rgba(0,0,0,0.02)' }}
          size="middle"
        />
      </div>

      {/* User Info & Logout */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          padding: '12px',
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid rgba(0,0,0,0.04)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <Avatar style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 'bold' }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Avatar>
            <div style={{ maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Text style={{ color: '#1e293b', fontSize: 13, display: 'block', fontWeight: 600 }}>{user?.name}</Text>
              <Text style={{ color: '#718096', fontSize: 11, display: 'block' }}>{user?.email}</Text>
            </div>
          </Space>
          <Button 
            type="text" 
            icon={<LogoutOutlined style={{ color: '#ff4d4f' }} />} 
            onClick={onLogout}
            size="small"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          width={250}
          style={{
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border-color)',
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100
          }}
        >
          <SidebarContent />
        </Sider>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <Header style={{
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'fixed',
          width: '100%',
          top: 0,
          zIndex: 100,
          height: 60
        }}>
          <Space align="center">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>PF</span>
            </div>
            <Title level={4} style={{ margin: 0, color: '#1e293b', fontSize: 16, fontWeight: 700, fontFamily: 'Outfit' }}>
              Finance AI
            </Title>
          </Space>
          <Button 
            type="text" 
            icon={<MenuOutlined style={{ color: '#1e293b', fontSize: 20 }} />} 
            onClick={() => setMobileVisible(true)}
          />
        </Header>
      )}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
        bodyStyle={{ padding: 0, background: 'var(--bg-sidebar)' }}
        width={250}
      >
        <SidebarContent />
      </Drawer>

      {/* Main Content Area */}
      <Layout style={{ 
        marginLeft: isMobile ? 0 : 250, 
        marginTop: isMobile ? 60 : 0, 
        background: 'transparent',
        transition: 'all 0.2s'
      }}>
        <Content style={{ padding: screens.xs ? '20px 16px 40px 16px' : '32px 32px 60px 32px' }}>
          <div className="animate-slide-in">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
