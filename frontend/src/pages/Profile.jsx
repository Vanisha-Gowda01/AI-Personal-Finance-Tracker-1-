import React, { useState } from 'react';
import { Card, Row, Col, Form, Input, Button, Avatar, Statistic, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, NumberOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

export default function Profile({ user, transactionsCount, onUpdateUser }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/user/${user.id}`, {
        name: values.name,
        email: values.email
      });
      message.success('Profile updated successfully.');
      onUpdateUser(response.data); // Update main user state
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Outfit' }}>Profile</Title>
        <Text type="secondary">Manage account details and review usage.</Text>
      </div>

      {/* User Stats Display */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="glass-panel" bordered={false} bodyStyle={{ textAlign: 'center', padding: '32px 16px' }}>
            <Avatar 
              size={80} 
              style={{ 
                backgroundColor: '#10b981', 
                color: '#ffffff', 
                fontSize: 32, 
                fontWeight: 700,
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                marginBottom: 16 
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Avatar>
            <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>{user?.name}</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>{user?.email}</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card className="glass-panel" bordered={false} style={{ height: '100%' }}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Total Transactions</span>}
              value={transactionsCount}
              valueStyle={{ color: '#14b8a6', fontWeight: 800, fontSize: 32, fontFamily: 'Outfit' }}
              prefix={<NumberOutlined />}
            />
            <div style={{ marginTop: 16, color: '#718096', fontSize: 12 }}>
              Transactions registered on your database log.
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card className="glass-panel" bordered={false} style={{ height: '100%' }}>
            <Statistic
              title={<span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>System Integrity</span>}
              value="Secure"
              valueStyle={{ color: '#10b981', fontWeight: 800, fontSize: 32, fontFamily: 'Outfit' }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ marginTop: 16, color: '#718096', fontSize: 12 }}>
              Account secured with PBKDF2 hashing functions.
            </div>
          </Card>
        </Col>
      </Row>

      {/* Account Settings Editor Form */}
      <Card 
        className="glass-panel" 
        title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}>Account Settings</span>}
        bordered={false}
      >
        <div style={{ maxWidth: 500 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            initialValues={{ name: user?.name, email: user?.email }}
            requiredMark={false}
          >
            <Form.Item
              name="name"
              label={<Text style={{ color: '#475569' }}>User Name</Text>}
              rules={[{ required: true, message: 'User name is required' }]}
            >
              <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />} placeholder="Full Name" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              label={<Text style={{ color: '#475569' }}>Email Address</Text>}
              rules={[
                { required: true, message: 'Email address is required' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} placeholder="Email Address" size="large" />
            </Form.Item>

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                borderColor: 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                marginTop: 12,
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
              }}
            >
              Update Settings
            </Button>
          </Form>
        </div>
      </Card>
    </div>
  );
}
