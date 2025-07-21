import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Input, 
  Button, 
  Space,
  Upload,
  message,
  Row,
  Col,
  Typography,
  Tag,
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
  FileTextOutlined,
  ReloadOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { conversationService, Conversation, Message as ApiMessage } from '../../services/conversationService';
import { useNotification } from '../../contexts/NotificationContext';
import websocketService from '../../services/websocketService';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  isFromUser: boolean;
  isLocalMessage?: boolean; // Flag to identify locally added messages
}

const ChatSystem: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationListRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();

  const PAGE_SIZE = 10;

  // Convert API message to chat message format
  const convertApiMessageToChatMessage = (apiMessage: ApiMessage, _conversationEmail: string): ChatMessage => {
    // Get the current admin user ID from the websocket service
    const currentAdminId = websocketService.getCurrentUserId();
    
    // Check if the message is from the current admin user
    // If currentAdminId is null (token issue), fallback to checking specific admin IDs
    const isFromAdmin = currentAdminId 
      ? apiMessage.senderId === currentAdminId 
      : apiMessage.senderId === 12; // Fallback to hardcoded admin ID
      
    const isFromUser = !isFromAdmin;
    
    return {
      id: apiMessage.id.toString(),
      senderId: apiMessage.senderId.toString(),
      senderName: isFromUser ? 'Customer' : 'Support Agent',
      senderEmail: apiMessage.senderEmail,
      content: apiMessage.message,
      timestamp: apiMessage.createdAt,
      type: apiMessage.type === 'IMAGE' ? 'image' : 'text',
      fileUrl: apiMessage.imageUrl || undefined,
      fileName: apiMessage.imageUrl ? 'Image' : undefined,
      isRead: true,
      isFromUser
    };
  };

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: number, page: number = 0, append: boolean = false) => {
    if (page === 0) {
      setLoadingMessages(true);
    }

    try {
      const response = await conversationService.getConversationMessages(conversationId, {
        page,
        size: PAGE_SIZE,
        sort: 'DESC'
      });

      if (response.success) {
        const newMessages = response.data.content.map(msg => 
          convertApiMessageToChatMessage(msg, selectedConversation?.email || '')
        );
        
        if (append) {
          setMessages(prev => [...prev, ...newMessages]);
        } else {
          setMessages(newMessages.reverse()); // Reverse to show oldest first
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      showNotification('error', error.message || 'Failed to fetch messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedConversation?.email, showNotification]);

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
      setMessages([]);
      fetchMessages(selectedConversation.id, 0, false);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Initialize WebSocket
    const wsEndpoint = 'https://manzone.wizlab.io.vn/ws-chat';
    
    // Initialize WebSocket service with minimal configuration
    const initialized = websocketService.initialize({
      endpoint: wsEndpoint,
      debug: false
    });
    
    if (initialized) {
      // Only try to connect if initialization was successful
      try {
        websocketService.connect();
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
      }
    }

    // Add connection listener
    const handleConnectionChange = (connected: boolean) => {
      console.log('WebSocket connection state changed:', connected);
      setIsWebSocketConnected(connected);
      
      if (connected) {
        showNotification('success', 'Connected to chat server');
        
        // If there was a selected conversation, resubscribe to it
        if (selectedConversation) {
          // Re-fetch messages to ensure we have the latest
          fetchMessages(selectedConversation.id, 0, false);
        }
      } else {
        showNotification('warning', 'Disconnected from chat server');
      }
    };

    websocketService.addConnectionListener(handleConnectionChange);

    // Cleanup when component unmounts
    return () => {
      try {
        websocketService.removeConnectionListener(handleConnectionChange);
        websocketService.disconnect();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [showNotification, fetchMessages]); // Removed selectedConversation dependency to prevent reconnections when switching conversations

  // Subscribe to conversation when selected
  useEffect(() => {
    if (!selectedConversation || !isWebSocketConnected) {
      return;
    }
    
    console.log('Subscribing to conversation:', selectedConversation.id);

    // Subscribe to the selected conversation
    const handleNewMessage = (newMsg: ApiMessage) => {
      console.log('New WebSocket message received:', newMsg);
      
      try {
        // The message from WebSocket service is already transformed to the Message format
        // Convert API message to chat message format
        const chatMessage = convertApiMessageToChatMessage(newMsg, selectedConversation.email);
        
        // Add message to state if it doesn't already exist
        setMessages(prevMessages => {
          // Check for duplicates by comparing the message content and timestamp
          // or by checking if the message ID already exists
          const isDuplicate = prevMessages.some(msg => {
            // Check exact message ID match
            const idMatch = msg.id === chatMessage.id;
            
            // Or check if there's a message with the same content that was sent recently
            const contentMatch = msg.content === chatMessage.content &&
                                 msg.isFromUser === chatMessage.isFromUser &&
                                 (msg.isLocalMessage === true || chatMessage.senderEmail === 'admin@manzone.com');
            
            // Check if the messages are close in time
            const timeMatch = Math.abs(new Date(msg.timestamp).getTime() - new Date(chatMessage.timestamp).getTime()) < 10000;
            
            const isDuplicateMsg = idMatch || (contentMatch && timeMatch);
            
            if (isDuplicateMsg) {
              console.log('Duplicate message detected:', {
                newMessage: chatMessage,
                existingMessage: msg,
                reason: idMatch ? 'ID match' : 'Content and time match'
              });
            }
            
            return isDuplicateMsg;
          });
          
          if (!isDuplicate) {
            console.log('Adding new message to chat:', chatMessage);
            return [...prevMessages, chatMessage];
          }
          console.log('Skipping duplicate message:', chatMessage);
          return prevMessages;
        });
      } catch (error) {
        console.error('Error processing incoming message:', error);
        // Don't crash the UI if there's a format error
      }
    };

    try {
      // Switch to the selected conversation instead of manually subscribing
      websocketService.switchConversation(selectedConversation.id, handleNewMessage);
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      showNotification('error', 'Failed to subscribe to conversation');
    }
    
    // No need to manually unsubscribe as switchConversation handles this
  }, [selectedConversation, isWebSocketConnected, showNotification]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConversationSelect = (conversation: Conversation) => {
    // Check if this is a different conversation than the currently selected one
    if (selectedConversation?.id !== conversation.id) {
      setSelectedConversation(conversation);
      
      // Clear current messages while loading new ones
      setMessages([]);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Check if the conversation is marked as done
    if (selectedConversation.done) {
      showNotification('warning', 'Cannot send messages to a closed conversation.');
      return;
    }

    if (isWebSocketConnected) {
      // Send message through WebSocket with updated return type
      const result = websocketService.sendMessage(
        selectedConversation.id, 
        newMessage,
        'TEXT',
        null,
        selectedConversation.done // Pass done status to websocket service
      );
      
      if (!result.success) {
        showNotification('error', result.errorMessage || 'Failed to send message. Please try again.');
        return;
      }
    } else {
      showNotification('error', 'Not connected to chat server. Please wait for connection or refresh the page.');
      return;
    }

    // Add message to UI immediately (optimistic UI update)
    const tempId = `local_${Date.now()}`; // Create a temporary local ID
    const message: ChatMessage = {
      id: tempId,
      senderId: 'admin',
      senderName: 'Support Agent',
      senderEmail: 'admin@manzone.com',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false,
      isFromUser: false,
      isLocalMessage: true // Flag to identify locally added messages
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleFileUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success('File uploaded successfully');
      
      if (!selectedConversation) return;
      
      const imageUrl = info.file.response?.url || '#';
      
      if (isWebSocketConnected) {
        // Send image through WebSocket
        websocketService.sendMessage(
          selectedConversation.id,
          `Image: ${info.file.name}`,
          'IMAGE',
          imageUrl
        );
      } else {
        showNotification('error', 'Not connected to chat server. Please try again.');
      }
      
      // Optimistic UI update
      const tempId = `local_${Date.now()}`; // Create a temporary local ID
      const fileMessage: ChatMessage = {
        id: tempId,
        senderId: 'admin',
        senderName: 'Support Agent',
        senderEmail: 'admin@manzone.com',
        content: `Image: ${info.file.name}`,
        timestamp: new Date().toISOString(),
        type: 'image',
        fileUrl: imageUrl,
        fileName: info.file.name,
        isRead: false,
        isFromUser: false,
        isLocalMessage: true // Flag to identify locally added messages
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

  // Mark conversation as done
  const handleMarkAsDone = async () => {
    if (!selectedConversation) return;
    
    try {
      // Use the new markConversationAsDone API
      const response = await conversationService.markConversationAsDone(selectedConversation.id);

      if (response.success) {
        showNotification('success', 'Conversation marked as done');
        
        // Update selected conversation locally to reflect done status
        setSelectedConversation(prev => {
          if (prev) {
            return { ...prev, done: true };
          }
          return prev;
        });
        
        // Refresh conversation list to update the status
        fetchConversations(0, false);
      } else {
        throw new Error(response.errors || 'Failed to mark conversation as done');
      }
    } catch (error: any) {
      console.error('Error marking conversation as done:', error);
      showNotification('error', error.message || 'Failed to mark conversation as done');
    }
  };

  // Manually reconnect WebSocket
  const handleReconnectWebSocket = () => {
    const wsEndpoint = 'https://manzone.wizlab.io.vn/ws-chat';
    
    try {
      if (isWebSocketConnected) {
        // Disconnect first
        websocketService.disconnect();
        showNotification('info', 'Disconnected from chat server');
      } else {
        // Completely reinitialize the WebSocket service
        websocketService.disconnect(); // Ensure clean state even if it thinks it's disconnected
        
        // Initialize with fresh settings
        const initialized = websocketService.initialize({
          endpoint: wsEndpoint,
          debug: false
        });
        
        if (initialized) {
          // Connect after successful initialization
          const connected = websocketService.connect();
          if (connected) {
            showNotification('info', 'Connecting to chat server...');
            
            // Wait a bit to ensure connection is established before trying to subscribe
            setTimeout(() => {
              // Force refresh selected conversation to trigger resubscription via useEffect
              if (selectedConversation) {
                const currentConversation = {...selectedConversation};
                setSelectedConversation(null);
                
                // Small delay to ensure state updates properly
                setTimeout(() => {
                  setSelectedConversation(currentConversation);
                }, 300);
              }
            }, 500);
          } else {
            showNotification('error', 'Failed to connect to chat server');
          }
        } else {
          showNotification('error', 'Failed to initialize WebSocket');
        }
      }
    } catch (error) {
      console.error('Error during WebSocket reconnection:', error);
      showNotification('error', 'Failed to manage WebSocket connection');
    }
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
                <div className="flex items-center">
                  <Title level={4} className="mb-0 text-gray-800 mr-2">Customer Support</Title>
                  {isWebSocketConnected ? (
                    <Tag color="success" className="flex items-center cursor-pointer" onClick={handleReconnectWebSocket}>
                      <WifiOutlined className="mr-1" /> Connected
                    </Tag>
                  ) : (
                    <Tag color="error" className="flex items-center cursor-pointer" onClick={handleReconnectWebSocket}>
                      <DisconnectOutlined className="mr-1" /> Reconnect
                    </Tag>
                  )}
                </div>
                <Space>
                  <Button 
                    icon={isWebSocketConnected ? <DisconnectOutlined /> : <WifiOutlined />}
                    onClick={handleReconnectWebSocket}
                    type={isWebSocketConnected ? "default" : "primary"}
                    size="small"
                  />
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleRefresh}
                    loading={loading}
                    size="small"
                  />
                </Space>
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
                        <Tag color={conversation.done ? "success" : "processing"}>
                          {conversation.done ? "Done" : "Active"}
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
                    {selectedConversation.done ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Conversation Closed
                      </Tag>
                    ) : (
                      <Button 
                        type="primary" 
                        icon={<CheckOutlined />}
                        className="bg-green-500 hover:bg-green-600 border-green-500"
                        onClick={handleMarkAsDone}
                      >
                        Mark as Done
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                      <Spin size="large" />
                      <span className="ml-2">Loading messages...</span>
                    </div>
                  ) : (
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
                          className={`flex ${message.isFromUser ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-md ${message.isFromUser ? '' : 'flex-row-reverse space-x-reverse'}`}>
                            <Avatar 
                              size="small"
                              icon={<UserOutlined />}
                              className={message.isFromUser ? 'bg-gray-400' : 'bg-blue-500'}
                            />
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                message.isFromUser
                                  ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                  : 'bg-blue-500 text-white rounded-br-md'
                              }`}
                            >
                              <div className={`text-xs font-medium mb-1 ${message.isFromUser ? 'text-gray-600' : 'text-blue-100'}`}>
                                {message.senderName}
                              </div>
                              {message.type === 'file' ? (
                                <div className="flex items-center space-x-2">
                                  <FileTextOutlined />
                                  <span className="text-sm">{message.fileName}</span>
                                </div>
                              ) : message.type === 'image' ? (
                                <div className="flex flex-col space-y-2">
                                  {message.fileUrl && (
                                    <img 
                                      src={message.fileUrl} 
                                      alt="Uploaded image" 
                                      className="max-w-xs rounded-lg"
                                    />
                                  )}
                                  <div className="text-sm leading-relaxed">{message.content}</div>
                                </div>
                              ) : (
                                <div className="text-sm leading-relaxed">{message.content}</div>
                              )}
                              <div className={`text-xs mt-2 ${message.isFromUser ? 'text-gray-500' : 'text-blue-100'}`}>
                                {formatTimestamp(message.timestamp)}
                                {!message.isFromUser && (
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
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                  {selectedConversation && selectedConversation.done ? (
                    <div className="bg-gray-100 p-3 rounded-lg text-center text-gray-600">
                      <CheckCircleOutlined className="mr-2 text-green-500" />
                      This conversation has been marked as done and is closed for new messages.
                    </div>
                  ) : (
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <TextArea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          className="resize-none rounded-lg"
                          disabled={selectedConversation?.done}
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
                            disabled={selectedConversation?.done}
                          />
                        </Upload>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || selectedConversation?.done}
                          size="large"
                          className="rounded-lg bg-blue-500 hover:bg-blue-600"
                        >
                          Send
                        </Button>
                      </Space>
                    </div>
                  )}
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