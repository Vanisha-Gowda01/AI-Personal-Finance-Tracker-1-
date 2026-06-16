import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, AccountBookOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Link } = Typography;

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      if (isLogin) {
        const response = await axios.post('/api/auth/login', {
          email: values.email,
          password: values.password
        });
        message.success('Signed in successfully.');
        onLoginSuccess(response.data);
      } else {
        if (values.password !== values.confirmPassword) {
          message.error('Passwords do not match.');
          setLoading(false);
          return;
        }
        const response = await axios.post('/api/auth/signup', {
          name: values.name,
          email: values.email,
          password: values.password
        });
        message.success('Account created successfully.');
        onLoginSuccess(response.data);
      }
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Authentication failed. Please try again.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card 
        className="glass-panel animate-slide-in"
        style={{ width: 440, padding: '24px 16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Space align="center" style={{ marginBottom: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
            }}>
              <AccountBookOutlined style={{ fontSize: 22, color: '#ffffff' }} />
            </div>
            <Title level={2} style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, background: 'linear-gradient(135deg, #0f172a, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Finance AI
            </Title>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: 14, color: '#475569' }}>
            {isLogin ? 'Smart financial tracking & Gemini-powered insights' : 'Get started with your smart personal tracker'}
          </Text>
        </div>

        <Form
          form={form}
          name="auth_form"
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          {!isLogin && (
            <Form.Item
              name="name"
              label={<Text style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Full Name</Text>}
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} placeholder="Vanisha Gowda" size="large" />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label={<Text style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Email Address</Text>}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} placeholder="you@example.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label={<Text style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Password</Text>}
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} placeholder="••••••••" size="large" />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="confirmPassword"
              label={<Text style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Confirm Password</Text>}
              rules={[{ required: true, message: 'Please confirm your password' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} placeholder="••••••••" size="large" />
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                borderColor: 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                height: 44,
                borderRadius: 8,
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
              }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#475569' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link 
              onClick={() => {
                form.resetFields();
                setIsLogin(!isLogin);
              }}
              style={{ color: '#10b981', fontWeight: 600 }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
