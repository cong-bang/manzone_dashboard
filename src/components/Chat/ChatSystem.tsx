import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Empty,
  Spin
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
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { conversationService, Conversation } from '../../services/conversationService';
import { useNotification } from '../../contexts/NotificationContext';

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

const ChatSystem: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationListRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();

  const PAGE_SIZE = 10;

  // Mock messages data for selected conversation
  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: '1',
      senderName: 'Customer',
      content: 'Hi, I have a question about my recent order.',
      timestamp: '2024-01-15T10:30:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '2',
      senderId: 'admin',
      senderName: 'Support Agent',
      content: 'Hello! I\'d be happy to help you with your order. Could you please provide your order number?',
      timestamp: '2024-01-15T10:32:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '3',
      senderId: '1',
      senderName: 'Customer',
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
      senderName: 'Customer',
      content: 'Thanks for the help!',
      timestamp: '2024-01-15T10:40:00Z',
      type: 'text',
      isRead: false
    }
  ];

  // Fetch conversations with pagination
  const fetchConversations = useCallback(async (page: number = 0, append: boolean = false) => {
    if (page === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await conversationService.getAllConversations({
        page,
        size: PAGE_SIZE,
        sort: 'DESC'
      });

      if (response.success) {
        const newConversations = response.data.content;
        
        if (append) {
          setConversations(prev => [...prev, ...newConversations]);
        } else {
          setConversations(newConversations);
        }
        
        setTotalElements(response.data.totalElements);
        setHasMore(!response.data.last);
        setCurrentPage(page);
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      showNotification('error', error.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showNotification]);

  // Load more conversations
  const loadMoreConversations = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchConversations(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore, fetchConversations]);

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100;
    
    if (isNearBottom && hasMore && !loadingMore) {
      loadMoreConversations();
    }
  }, [hasMore, loadingMore, loadMoreConversations]);

  useEffect(() => {
    fetchConversations(0, false);
  }, [fetchConversations]);

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

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setCurrentPage(0);
    setHasMore(true);
    fetchConversations(0, false);
  };

  return (
    <div className="h-[calc(100vh-200px)]">
      <Row gutter={0} className="h-full">
        {/* Conversations Sidebar */}
        <Col span={8} className="h-full">
          <div className="h-full bg-white border-r border-gray-200 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Title level={4} className="mb-0 text-gray-800">Customer Support</Title>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={loading}
                  size="small"
                />
              </div>
              <Input
                placeholder="Search conversations..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg"
                size="large"
              />
              <div className="mt-2 text-xs text-gray-500">
                {totalElements} total conversations
              </div>
            </div>

            {/* Conversations List */}
            <div 
              className="flex-1 overflow-y-auto"
              onScroll={handleScroll}
              ref={conversationListRef}
            >
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <Spin size="large" />
                </div>
              ) : filteredConversations.length === 0 ? (
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
                            <Text strong className="text-sm text-gray-900 truncate">
                              {conversation.title}
                            </Text>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <UserOutlined className="text-gray-400 text-xs" />
                            <Text className="text-xs text-gray-600">{conversation.email}</Text>
                          </div>
                          <Text className="text-xs text-gray-500">
                            ID: {conversation.id} • User: {conversation.userId}
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <ClockCircleOutlined />
                          <span>{getTimeAgo(conversation.updatedAt)}</span>
                        </div>
                        <Tag color="processing" size="small">
                          Active
                        </Tag>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="flex justify-center items-center p-4">
                      <Spin size="small" />
                      <span className="ml-2 text-sm text-gray-500">Loading more...</span>
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasMore && conversations.length > 0 && (
                    <div className="text-center p-4 text-sm text-gray-500">
                      No more conversations to load
                    </div>
                  )}
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
                            {selectedConversation.email}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            ID: {selectedConversation.id}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      icon={<CheckOutlined />}
                      className="bg-green-500 hover:bg-green-600 border-green-500"
                    >
                      Mark as Done
                    </Button>
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