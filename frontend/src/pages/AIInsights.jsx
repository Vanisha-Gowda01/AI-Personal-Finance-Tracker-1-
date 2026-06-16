import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Space, Avatar, Typography, Row, Col, Empty, Spin, message } from 'antd';
import { BulbOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

// Helper function to render simple markdown returned by Gemini
function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    let content = line.trim();
    if (!content) return <div key={idx} style={{ height: 8 }} />;

    // Headers
    if (content.startsWith('### ')) {
      return <h4 key={idx} style={{ color: '#14b8a6', marginTop: 14, marginBottom: 6, fontWeight: 600 }}>{content.slice(4)}</h4>;
    }
    if (content.startsWith('## ')) {
      return <h3 key={idx} style={{ color: '#10b981', marginTop: 18, marginBottom: 8, fontWeight: 700 }}>{content.slice(3)}</h3>;
    }
    if (content.startsWith('# ')) {
      return <h2 key={idx} style={{ color: '#0f172a', marginTop: 22, marginBottom: 12, fontWeight: 800 }}>{content.slice(2)}</h2>;
    }
    
    // Bullet points
    if (content.startsWith('* ') || content.startsWith('- ')) {
      const bulletText = content.substring(2);
      return (
        <div key={idx} style={{ display: 'flex', gap: 8, marginLeft: 12, marginBottom: 6, alignItems: 'flex-start' }}>
          <span style={{ color: '#10b981', fontSize: 14 }}>•</span>
          <span style={{ color: '#1e293b', fontSize: 13 }}>{renderBoldText(bulletText)}</span>
        </div>
      );
    }

    // Numbered list items
    const numMatch = content.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <div key={idx} style={{ display: 'flex', gap: 8, marginLeft: 12, marginBottom: 6, alignItems: 'flex-start' }}>
          <span style={{ color: '#14b8a6', fontWeight: 'bold', fontSize: 13 }}>{numMatch[1]}.</span>
          <span style={{ color: '#1e293b', fontSize: 13 }}>{renderBoldText(numMatch[2])}</span>
        </div>
      );
    }

    return (
      <p key={idx} style={{ color: '#1e293b', marginBottom: 8, fontSize: 13, lineHeight: '1.6' }}>
        {renderBoldText(content)}
      </p>
    );
  });
}

function renderBoldText(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#0f172a', fontWeight: 600 }}>{part}</strong> : part);
}

export default function AIInsights({ transactions, user }) {
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Restore generated insights and chat history from local storage on mount
  useEffect(() => {
    const cachedInsights = localStorage.getItem(`insights_${user.id}`);
    if (cachedInsights) {
      setInsights(cachedInsights);
    }
    const cachedChat = localStorage.getItem(`chat_${user.id}`);
    if (cachedChat) {
      setChatMessages(JSON.parse(cachedChat));
    }
  }, [user.id]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, sendingMessage]);

  const handleGenerateInsights = async () => {
    if (transactions.length === 0) {
      message.warning('Please add transactions before generating insights.');
      return;
    }
    setGeneratingInsights(true);
    try {
      const response = await axios.post('/api/ai/insights', { user_id: user.id });
      const text = response.data.insights;
      setInsights(text);
      localStorage.setItem(`insights_${user.id}`, text);
      message.success('Financial insights updated.');
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to generate financial insights.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMsg = inputValue.trim();
    setInputValue('');

    const newMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newMessages);
    localStorage.setItem(`chat_${user.id}`, JSON.stringify(newMessages));

    setSendingMessage(true);
    try {
      const response = await axios.post('/api/ai/chat', { 
        user_id: user.id, 
        message: userMsg 
      });
      const aiReply = response.data.response;
      const finalMessages = [...newMessages, { role: 'assistant', content: aiReply }];
      setChatMessages(finalMessages);
      localStorage.setItem(`chat_${user.id}`, JSON.stringify(finalMessages));
    } catch (error) {
      const errReply = `Could not contact Gemini: ${error.response?.data?.detail || error.message}`;
      const finalMessages = [...newMessages, { role: 'assistant', content: errReply }];
      setChatMessages(finalMessages);
      localStorage.setItem(`chat_${user.id}`, JSON.stringify(finalMessages));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Outfit' }}>AI Insights</Title>
        <Text type="secondary">Gemini-powered analysis for smarter financial decisions.</Text>
      </div>

      {transactions.length === 0 ? (
        <Card className="glass-panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Empty description={<span style={{ color: '#a0aec0' }}>Add transactions before generating AI insights.</span>} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {/* Insights Panel */}
          <Col xs={24} lg={12}>
            <Card 
              className="glass-panel" 
              title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}><BulbOutlined style={{ color: '#10b981', marginRight: 8 }} />Financial Analysis</span>}
              bordered={false}
              extra={
                <Button 
                  type="primary" 
                  onClick={handleGenerateInsights} 
                  loading={generatingInsights}
                  style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', border: 'none', color: '#ffffff', fontWeight: 600 }}
                >
                  Generate Insights
                </Button>
              }
            >
              {generatingInsights ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <Spin size="large" tip="Analyzing your finances with Gemini..." style={{ color: '#10b981' }} />
                </div>
              ) : insights ? (
                <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 10 }}>
                  {renderMarkdown(insights)}
                </div>
              ) : (
                <Empty description={<span style={{ color: '#a0aec0' }}>Click "Generate Insights" above to trigger AI review.</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>

          {/* Chat Panel */}
          <Col xs={24} lg={12}>
            <Card 
              className="glass-panel" 
              title={<span style={{ color: '#1e293b', fontSize: 16, fontWeight: 600 }}><RobotOutlined style={{ color: '#14b8a6', marginRight: 8 }} />Finance AI Chat</span>}
              bordered={false}
              bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: 580 }}
            >
              {/* Chat Messages Log */}
              <div style={{ flexGrow: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 500 }}>
                {chatMessages.length === 0 && (
                  <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5, padding: '24px 0' }}>
                    <RobotOutlined style={{ fontSize: 36, color: '#14b8a6', marginBottom: 12 }} />
                    <p style={{ color: '#a0aec0', fontSize: 14 }}>Ask me about your budget, savings targets, or spending leaks!</p>
                  </div>
                )}
                
                {chatMessages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      maxWidth: '85%'
                    }}>
                      {msg.role !== 'user' && (
                        <Avatar style={{ backgroundColor: '#f8fafc', border: '1px solid rgba(16, 185, 129, 0.2)' }} icon={<RobotOutlined style={{ color: '#10b981' }} />} />
                      )}
                      <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                        {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                      </div>
                      {msg.role === 'user' && (
                        <Avatar style={{ backgroundColor: '#135e3d' }} icon={<UserOutlined />} />
                      )}
                    </div>
                  </div>
                ))}

                {sendingMessage && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Avatar style={{ backgroundColor: '#f8fafc', border: '1px solid rgba(16, 185, 129, 0.2)' }} icon={<RobotOutlined style={{ color: '#10b981' }} />} />
                    <div className="chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Spin size="small" />
                      <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 4 }}>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Box */}
              <div style={{ padding: 16, borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input 
                    placeholder="Ask about your spending, budget, or savings plan..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                    size="large"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !inputValue.trim()}
                    size="large"
                    style={{ background: '#10b981', borderColor: 'transparent', color: '#ffffff' }}
                  />
                </Space.Compact>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
