import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Badge, 
  Space,
  Upload,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  Avatar,
  Divider,
  Empty
} from 'antd';
import { 
  SendOutlined,
  PaperClipOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  CheckOutlined,
  UserOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  title: string;
  createdBy: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'open' | 'resolved';
  priority: 'low' | 'medium' | 'high';
}

const ChatSystem: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversations data
  const mockConversations: Conversation[] = [
    {
      id: '1',
      title: 'Order #MZ-000123 Support',
      createdBy: 'John Doe',
      lastMessage: 'Thanks for the help!',
      lastMessageTime: '2 min ago',
      unreadCount: 2,
      status: 'open',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Product Inquiry - Leather Wallet',
      createdBy: 'Jane Smith',
      lastMessage: 'Is this available in brown?',
      lastMessageTime: '1 hour ago',
      unreadCount: 0,
      status: 'open',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Refund Request - Order #MZ-000124',
      createdBy: 'Bob Johnson',
      lastMessage: 'I need a refund please',
      lastMessageTime: '3 hours ago',
      unreadCount: 1,
      status: 'open',
      priority: 'high'
    },
    {
      id: '4',
      title: 'General Support',
      createdBy: 'Alice Brown',
      lastMessage: 'Great service!',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      status: 'resolved',
      priority: 'low'
    },
    {
      id: '5',
      title: 'Shipping Inquiry - Order #MZ-000125',
      createdBy: 'Mike Wilson',
      lastMessage: 'When will my order arrive?',
      lastMessageTime: '2 days ago',
      unreadCount: 0,
      status: 'open',
      priority: 'medium'
    }
  ];

  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: '1',
      senderName: 'John Doe',
      content: 'Hi, I have a question about my recent order.',
      timestamp: '2024-01-15T10:30:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '2',
      senderId: 'admin',
      senderName: 'Support Agent',
      content: 'Hello John! I\'d be happy to help you with your order. Could you please provide your order number?',
      timestamp: '2024-01-15T10:32:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '3',
      senderId: '1',
      senderName: 'John Doe',
      content: 'Sure, it\'s MZ-000123',
      timestamp: '2024-01-15T10:35:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '4',
      senderId: 'admin',
      senderName: 'Support Agent',
      content: 'Thank you! I can see your order for the leather wallet. It\'s currently being processed and will be shipped within 2 business days.',
      timestamp: '2024-01-15T10:38:00Z',
      type: 'text',
      isRead: false
    },
    {
      id: '5',
      senderId: '1',
      senderName: 'John Doe',
      content: 'Thanks for the help!',
      timestamp: '2024-01-15T10:40:00Z',
      type: 'text',
      isRead: false
    }
  ];

  useEffect(() => {
    setConversations(mockConversations);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(mockMessages);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark messages as read
    const updatedConversations = conversations.map(conv => 
      conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
    );
    setConversations(updatedConversations);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'admin',
      senderName: 'Support Agent',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update conversation's last message
    const updatedConversations = conversations.map(conv =>
      conv.id === selectedConversation.id
        ? { ...conv, lastMessage: newMessage, lastMessageTime: 'now' }
        : conv
    );
    setConversations(updatedConversations);
  };

  const handleMarkAsDone = () => {
    if (!selectedConversation) return;

    const updatedConversations = conversations.map(conv =>
      conv.id === selectedConversation.id
        ? { ...conv, status: 'resolved' as const }
        : conv
    );
    setConversations(updatedConversations);
    setSelectedConversation({ ...selectedConversation, status: 'resolved' });
    message.success('Conversation marked as resolved');
  };

  const handleFileUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success('File uploaded successfully');
      
      const fileMessage: Message = {
        id: Date.now().toString(),
        senderId: 'admin',
        senderName: 'Support Agent',
        content: `File: ${info.file.name}`,
        timestamp: new Date().toISOString(),
        type: 'file',
        fileUrl: info.file.response?.url || '#',
        fileName: info.file.name,
        isRead: false
      };

      setMessages(prev => [...prev, fileMessage]);
    } else if (info.file.status === 'error') {
      message.error('File upload failed');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: '#ff4d4f',
      medium: '#faad14',
      low: '#52c41a'
    };
    return colors[priority as keyof typeof colors] || '#d9d9d9';
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-200px)]">
      <Row gutter={0} className="h-full">
        {/* Conversations Sidebar */}
        <Col span={8} className="h-full">
          <div className="h-full bg-white border-r border-gray-200 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-100">
              <Title level={4} className="mb-4 text-gray-800">Customer Support</Title>
              <Input
                placeholder="Search conversations..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg"
                size="large"
              />
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6">
                  <Empty description="No conversations found" />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        selectedConversation?.id === conversation.id 
                          ? 'bg-blue-50 border-r-3 border-blue-500' 
                          : ''
                      }`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getPriorityColor(conversation.priority) }}
                            />
                            <Text strong className="text-sm text-gray-900 truncate">
                              {conversation.title}
                            </Text>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <UserOutlined className="text-gray-400 text-xs" />
                            <Text className="text-xs text-gray-600">{conversation.createdBy}</Text>
                            <Tag 
                              color={conversation.status === 'resolved' ? 'success' : 'processing'} 
                              size="small"
                              className="ml-auto"
                            >
                              {conversation.status === 'resolved' ? 'Resolved' : 'Open'}
                            </Tag>
                          </div>
                          <Text className="text-xs text-gray-500 line-clamp-2">
                            {conversation.lastMessage}
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <ClockCircleOutlined />
                          <span>{conversation.lastMessageTime}</span>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge 
                            count={conversation.unreadCount} 
                            size="small"
                            className="bg-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* Chat Area */}
        <Col span={16} className="h-full">
          <div className="h-full bg-white flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        icon={<UserOutlined />} 
                        className="bg-blue-500"
                        size="large"
                      />
                      <div>
                        <Title level={5} className="mb-0 text-gray-900">
                          {selectedConversation.title}
                        </Title>
                        <div className="flex items-center space-x-3 mt-1">
                          <Text className="text-sm text-gray-600">
                            Created by: {selectedConversation.createdBy}
                          </Text>
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getPriorityColor(selectedConversation.priority) }}
                          />
                          <Text className="text-xs text-gray-500 capitalize">
                            {selectedConversation.priority} priority
                          </Text>
                        </div>
                      </div>
                    </div>
                    {selectedConversation.status === 'open' && (
                      <Popconfirm
                        title="Mark this conversation as resolved?"
                        description="This action will close the conversation and prevent further messages."
                        onConfirm={handleMarkAsDone}
                        okText="Mark as Done"
                        cancelText="Cancel"
                        okButtonProps={{ type: 'primary' }}
                      >
                        <Button 
                          type="primary" 
                          icon={<CheckOutlined />}
                          className="bg-green-500 hover:bg-green-600 border-green-500"
                        >
                          Mark as Done
                        </Button>
                      </Popconfirm>
                    )}
                    {selectedConversation.status === 'resolved' && (
                      <Tag color="success" className="px-3 py-1">
                        <CheckCircleOutlined className="mr-1" />
                        Resolved
                      </Tag>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div key={message.id}>
                        {/* Date separator */}
                        {index === 0 && (
                          <div className="flex items-center justify-center mb-4">
                            <Divider className="text-xs text-gray-400">
                              {new Date(message.timestamp).toLocaleDateString()}
                            </Divider>
                          </div>
                        )}
                        
                        <div
                          className={`flex ${message.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-md ${message.senderId === 'admin' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar 
                              size="small"
                              icon={<UserOutlined />}
                              className={message.senderId === 'admin' ? 'bg-blue-500' : 'bg-gray-400'}
                            />
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                message.senderId === 'admin'
                                  ? 'bg-blue-500 text-white rounded-br-md'
                                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                              }`}
                            >
                              <div className={`text-xs font-medium mb-1 ${message.senderId === 'admin' ? 'text-blue-100' : 'text-gray-600'}`}>
                                {message.senderName}
                              </div>
                              {message.type === 'file' ? (
                                <div className="flex items-center space-x-2">
                                  <FileTextOutlined />
                                  <span className="text-sm">{message.fileName}</span>
                                </div>
                              ) : (
                                <div className="text-sm leading-relaxed">{message.content}</div>
                              )}
                              <div className={`text-xs mt-2 ${message.senderId === 'admin' ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatTimestamp(message.timestamp)}
                                {message.senderId === 'admin' && (
                                  <CheckCircleOutlined 
                                    className={`ml-1 ${message.isRead ? 'text-blue-200' : 'text-blue-300'}`} 
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedConversation.status === 'open' ? (
                  <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <TextArea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          className="resize-none rounded-lg"
                          onPressEnter={(e) => {
                            if (!e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <Space>
                        <Upload
                          showUploadList={false}
                          onChange={handleFileUpload}
                          beforeUpload={() => false}
                        >
                          <Button 
                            icon={<PaperClipOutlined />} 
                            size="large"
                            className="rounded-lg"
                          />
                        </Upload>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          size="large"
                          className="rounded-lg bg-blue-500 hover:bg-blue-600"
                        >
                          Send
                        </Button>
                      </Space>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="text-center">
                      <Text className="text-gray-500">
                        <CheckCircleOutlined className="mr-2" />
                        This conversation has been resolved
                      </Text>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageOutlined className="text-2xl text-blue-500" />
                  </div>
                  <Title level={4} className="text-gray-600 mb-2">
                    Select a conversation
                  </Title>
                  <Text className="text-gray-500">
                    Choose a conversation from the sidebar to start chatting
                  </Text>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ChatSystem;