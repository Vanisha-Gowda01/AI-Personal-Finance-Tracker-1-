import React, { useState } from 'react';
import { 
  Tabs, Card, Form, Input, InputNumber, Select, DatePicker, Button, Table, Space, 
  Tag, Upload, Divider, message, Drawer, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UploadOutlined, 
  DownloadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  InboxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { TabPane } = Tabs;
const { Dragger } = Upload;
const { Text } = Typography;

const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Income",
  "Entertainment",
  "Healthcare",
  "Education",
  "Investment",
  "Rent",
  "Other"
];

import { Typography } from 'antd';

export default function Transactions({ transactions, user, onRefresh }) {
  const [activeTab, setActiveTab] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Drawer editing state
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  // Helper to format currency
  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  // 1. ADD TRANSACTION
  const handleAddSubmit = async (values) => {
    try {
      const payload = {
        user_id: user.id,
        date: values.date.format('YYYY-MM-DD'),
        description: values.description,
        amount: values.amount,
        category: values.category
      };

      await axios.post('/api/transactions', payload);
      message.success('Transaction added successfully.');
      addForm.resetFields();
      onRefresh(); // Refresh parent data
      setActiveTab('2'); // Switch to Manage tab
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to add transaction.');
    }
  };

  // 2. MANAGE / EDIT / DELETE
  const handleEditClick = (record) => {
    setEditingTransaction(record);
    editForm.setFieldsValue({
      date: dayjs(record.Date),
      category: record.Category,
      description: record.Description,
      amount: record.Amount
    });
    setEditDrawerVisible(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      const payload = {
        user_id: user.id,
        date: values.date.format('YYYY-MM-DD'),
        description: values.description,
        amount: values.amount,
        category: values.category
      };

      await axios.put(`/api/transactions/${editingTransaction.id}`, payload);
      message.success('Transaction updated.');
      setEditDrawerVisible(false);
      setEditingTransaction(null);
      onRefresh();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to update transaction.');
    }
  };

  const handleDelete = async (txId) => {
    try {
      await axios.delete(`/api/transactions/${txId}`, {
        params: { user_id: user.id }
      });
      message.success('Transaction deleted.');
      onRefresh();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to delete transaction.');
    }
  };

  // CSV Export
  const handleExport = () => {
    if (transactions.length === 0) {
      message.warning('No transactions to export.');
      return;
    }
    const headers = ['Date', 'Description', 'Amount', 'Category'];
    const rows = transactions.map(t => [
      t.Date,
      `"${t.Description.replace(/"/g, '""')}"`,
      t.Amount,
      t.Category
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'personal_finance_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom upload handoff
  const uploadProps = {
    name: 'file',
    multiple: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);

      try {
        const response = await axios.post('/api/transactions/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success(`CSV Imported successfully. Added ${response.data.imported} records.`);
        onSuccess(response.data);
        onRefresh();
        setActiveTab('2');
      } catch (error) {
        const detail = error.response?.data?.detail || 'Failed to process CSV file.';
        message.error(detail);
        onError(error);
      } finally {
        setUploading(false);
      }
    },
    showUploadList: false
  };

  // Filtering
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.Description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.Category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'Date',
      key: 'date',
      sorter: (a, b) => new Date(a.Date) - new Date(b.Date),
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
      filters: CATEGORIES.map(c => ({ text: c, value: c })),
      onFilter: (value, record) => record.Category === value,
      render: (cat) => <Tag color="rgba(0, 0, 0, 0.03)" style={{ color: '#1e293b', border: '1px solid rgba(0, 0, 0, 0.06)' }}>{cat}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'Amount',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => a.Amount - b.Amount,
      render: (val) => (
        <span style={{ color: val > 0 ? '#10b981' : '#ff4d4f', fontWeight: 600 }}>
          {val > 0 ? '+' : ''}{formatMoney(val)}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#14b8a6' }} />} 
            onClick={() => handleEditClick(record)} 
            size="small"
          />
          <Popconfirm
            title="Delete transaction?"
            description="Are you sure you want to delete this record?"
            onConfirm={() => handleDelete(record.id)}
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
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Outfit' }}>Transactions</Title>
        <Text type="secondary">Add, edit, filter, import, and export your money movement.</Text>
      </div>

      <Card className="glass-panel" bordered={false} bodyStyle={{ padding: '16px 24px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarGutter={24}>
          {/* TAB 1: ADD TRANSACTION */}
          <TabPane tab={<Space><PlusOutlined />Add Transaction</Space>} key="1">
            <div style={{ maxWidth: 600, margin: '24px 0' }}>
              <Form
                form={addForm}
                layout="vertical"
                onFinish={handleAddSubmit}
                initialValues={{ date: dayjs(), category: 'Other', amount: -100 }}
                requiredMark={false}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="date"
                      label={<Text style={{ color: '#475569' }}>Date</Text>}
                      rules={[{ required: true, message: 'Please select a date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="category"
                      label={<Text style={{ color: '#475569' }}>Category</Text>}
                      rules={[{ required: true, message: 'Please select a category' }]}
                    >
                      <Select style={{ width: '100%' }}>
                        {CATEGORIES.map(c => (
                          <Select.Option key={c} value={c}>{c}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="description"
                  label={<Text style={{ color: '#475569' }}>Description</Text>}
                  rules={[{ required: true, message: 'Please enter a description' }]}
                >
                  <Input placeholder="Uber ride, Salary deposit, Groceries..." size="large" />
                </Form.Item>

                <Form.Item
                  name="amount"
                  label={<Text style={{ color: '#475569' }}>Amount</Text>}
                  extra={<Text type="secondary" style={{ fontSize: 11 }}>Use positive values for income and negative values for expenses.</Text>}
                  rules={[
                    { required: true, message: 'Please enter an amount' },
                    { validator: (_, value) => value === 0 ? Promise.reject('Amount cannot be zero') : Promise.resolve() }
                  ]}
                >
                  <InputNumber style={{ width: '100%' }} size="large" step={100} />
                </Form.Item>

                <Button 
                  type="primary" 
                  htmlType="submit" 
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
                  Add Transaction
                </Button>
              </Form>
            </div>
          </TabPane>

          {/* TAB 2: MANAGE */}
          <TabPane tab={<Space><SearchOutlined />Manage</Space>} key="2">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '16px 0 24px 0' }}>
              <Input
                placeholder="Search transactions..."
                prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ maxWidth: 300, background: 'rgba(255,255,255,0.02)' }}
              />
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 180 }}
              >
                <Select.Option value="All">All Categories</Select.Option>
                {CATEGORIES.map(c => (
                  <Select.Option key={c} value={c}>{c}</Select.Option>
                ))}
              </Select>
            </div>

            <Table
              columns={columns}
              dataSource={filteredTransactions}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              style={{ background: 'transparent' }}
              className="custom-table"
            />
          </TabPane>

          {/* TAB 3: IMPORT / EXPORT */}
          <TabPane tab={<Space><UploadOutlined />Import / Export</Space>} key="3">
            <div style={{ padding: '24px 0' }}>
              <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>CSV Import</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                Upload a CSV transaction file. It must include columns for <strong>Date</strong>, <strong>Description</strong>, and <strong>Amount</strong>. 
                Missing categories will be automatically identified by our AI/NLP model.
              </Text>
              
              <Dragger {...uploadProps} disabled={uploading}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#10b981' }} />
                </p>
                <p className="ant-upload-text" style={{ color: '#fff' }}>Click or drag CSV file to this area to import</p>
                <p className="ant-upload-hint" style={{ color: '#a0aec0' }}>
                  Supports single .csv files containing bank or card statements.
                </p>
              </Dragger>

              <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

              <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>CSV Export</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                Export all transactions matching your profile to a structured CSV file for backups or spreadsheet processing.
              </Text>
              <Button 
                type="default" 
                icon={<DownloadOutlined />} 
                onClick={handleExport}
                size="large"
                style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', background: 'transparent' }}
              >
                Download CSV Report
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Editing Drawer */}
      <Drawer
        title={<span style={{ color: '#1e293b' }}>Edit Transaction #{editingTransaction?.id}</span>}
        placement="right"
        onClose={() => {
          setEditDrawerVisible(false);
          setEditingTransaction(null);
        }}
        open={editDrawerVisible}
        width={360}
        bodyStyle={{ background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border-color)' }}
        headerStyle={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)' }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="date"
            label={<Text style={{ color: '#475569' }}>Date</Text>}
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="category"
            label={<Text style={{ color: '#475569' }}>Category</Text>}
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select style={{ width: '100%' }}>
              {CATEGORIES.map(c => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={<Text style={{ color: '#475569' }}>Description</Text>}
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="amount"
            label={<Text style={{ color: '#475569' }}>Amount</Text>}
            extra={<Text type="secondary" style={{ fontSize: 11 }}>Positive for income, negative for expense.</Text>}
            rules={[
              { required: true, message: 'Please enter an amount' },
              { validator: (_, value) => value === 0 ? Promise.reject('Amount cannot be zero') : Promise.resolve() }
            ]}
          >
            <InputNumber style={{ width: '100%' }} step={100} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <Button type="primary" htmlType="submit" style={{ flexGrow: 1, background: '#10b981', border: 'none', color: '#ffffff', fontWeight: 600 }}>
              Save Changes
            </Button>
            <Button 
              danger 
              style={{ flexGrow: 1 }} 
              onClick={() => {
                handleDelete(editingTransaction.id);
                setEditDrawerVisible(false);
              }}
            >
              Delete
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
