import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Progress, Row, Col, Typography, Space, Popconfirm, Divider, Empty, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

export default function Goals({ goals, user, onRefresh }) {
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editingGoal, setEditingGoal] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Helper to format currency
  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const handleCreateFinish = async (values) => {
    try {
      const payload = {
        user_id: user.id,
        title: values.title,
        target_amount: values.target_amount,
        current_amount: values.current_amount || 0
      };

      await axios.post('/api/goals', payload);
      message.success('Savings goal created.');
      createForm.resetFields();
      onRefresh();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to create goal.');
    }
  };

  const handleEditClick = (goal) => {
    setEditingGoal(goal);
    editForm.setFieldsValue({
      title: goal.Goal,
      target_amount: goal.Target,
      current_amount: goal.Current
    });
    setIsEditModalVisible(true);
  };

  const handleEditFinish = async (values) => {
    try {
      const payload = {
        user_id: user.id,
        title: values.title,
        target_amount: values.target_amount,
        current_amount: values.current_amount
      };

      await axios.put(`/api/goals/${editingGoal.id}`, payload);
      message.success('Goal updated.');
      setIsEditModalVisible(false);
      setEditingGoal(null);
      onRefresh();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to update goal.');
    }
  };

  const handleDelete = async (goalId) => {
    try {
      await axios.delete(`/api/goals/${goalId}`, {
        params: { user_id: user.id }
      });
      message.success('Savings goal deleted.');
      onRefresh();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to delete goal.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Outfit' }}>Budget Goals</Title>
        <Text type="secondary">Create savings goals and track progress to completion.</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Create Goal Form Card */}
        <Col xs={24} lg={8}>
          <Card 
            className="glass-panel" 
            title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}><TrophyOutlined style={{ color: '#10b981', marginRight: 8 }} />New Savings Target</span>}
            bordered={false}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreateFinish}
              initialValues={{ current_amount: 0 }}
              requiredMark={false}
            >
              <Form.Item
                name="title"
                label={<Text style={{ color: '#475569' }}>Savings Goal Name</Text>}
                rules={[{ required: true, message: 'Please enter a goal name' }]}
              >
                <Input placeholder="e.g. Emergency Fund, Tesla car" />
              </Form.Item>

              <Form.Item
                name="target_amount"
                label={<Text style={{ color: '#475569' }}>Target Amount (INR)</Text>}
                rules={[
                  { required: true, message: 'Please enter target amount' },
                  { type: 'number', min: 1, message: 'Must be greater than 0' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} step={1000} placeholder="5,00_000" />
              </Form.Item>

              <Form.Item
                name="current_amount"
                label={<Text style={{ color: '#475569' }}>Current Progress (INR)</Text>}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={1000} placeholder="10,000" />
              </Form.Item>

              <Button 
                type="primary" 
                htmlType="submit" 
                block
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
                Create Target Goal
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Goals Progress Listing */}
        <Col xs={24} lg={16}>
          <Card 
            className="glass-panel" 
            title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}>Active Goals</span>}
            bordered={false}
          >
            {goals.length === 0 ? (
              <Empty description={<span style={{ color: '#a0aec0' }}>No active goals. Define your first target on the left.</span>} />
            ) : (
              <Row gutter={[16, 16]}>
                {goals.map((g) => {
                  const target = Math.max(g.Target, 1);
                  const current = Math.max(g.Current, 0);
                  const pct = Math.min((current / target) * 100, 100);
                  const remaining = Math.max(target - current, 0);
                  
                  return (
                    <Col xs={24} md={12} key={g.id}>
                      <div style={{
                        padding: 20,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: 600, display: 'block' }}>{g.Goal}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatMoney(current)} saved of {formatMoney(target)}
                            </Text>
                          </div>
                          
                          <Space>
                            <Button 
                              type="text" 
                              icon={<EditOutlined style={{ color: '#14b8a6' }} />} 
                              onClick={() => handleEditClick(g)}
                              size="small"
                            />
                            <Popconfirm
                              title="Delete Savings Goal?"
                              description="Are you sure you want to delete this target?"
                              onConfirm={() => handleDelete(g.id)}
                              okText="Yes"
                              cancelText="No"
                              okButtonProps={{ danger: true }}
                            >
                              <Button 
                                type="text" 
                                icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} 
                                size="small"
                              />
                            </Popconfirm>
                          </Space>
                        </div>

                        <Progress 
                          percent={parseFloat(pct.toFixed(1))} 
                          status="active" 
                          strokeColor={{
                            '0%': '#14b8a6',
                            '100%': '#10b981',
                          }}
                          trailColor="rgba(0, 0, 0, 0.05)"
                          style={{ margin: 0 }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0aec0' }}>
                          <span>{pct.toFixed(1)}% Completed</span>
                          <span>Remaining: {formatMoney(remaining)}</span>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* Edit Goal Modal */}
      <Modal
        title={<span style={{ color: '#1e293b' }}>Edit Savings Goal</span>}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingGoal(null);
        }}
        footer={null}
        width={360}
        bodyStyle={{ background: 'var(--bg-sidebar)' }}
        headerStyle={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)' }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditFinish}
          requiredMark={false}
        >
          <Form.Item
            name="title"
            label={<Text style={{ color: '#475569' }}>Savings Goal Name</Text>}
            rules={[{ required: true, message: 'Please enter a goal name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="target_amount"
            label={<Text style={{ color: '#475569' }}>Target Amount (INR)</Text>}
            rules={[
              { required: true, message: 'Please enter target amount' },
              { type: 'number', min: 1, message: 'Must be greater than 0' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} step={1000} />
          </Form.Item>

          <Form.Item
            name="current_amount"
            label={<Text style={{ color: '#475569' }}>Current Progress (INR)</Text>}
            rules={[{ required: true, message: 'Please enter current progress' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ flexGrow: 1, background: '#10b981', border: 'none', color: '#ffffff', fontWeight: 600 }}
            >
              Save Changes
            </Button>
            <Button 
              style={{ flexGrow: 1 }} 
              onClick={() => {
                setIsEditModalVisible(false);
                setEditingGoal(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
