import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { jwtDecode } from 'jwt-decode';
import { getValidTokenFromStorage } from '../utils/tokenUtils';
import { Message } from './conversationService';
import '../utils/sockjsPolyfill'; // Import the polyfill to fix the 'global is not defined' error

interface WebSocketConfig {
  endpoint: string;
  debug?: boolean;
}

interface JWTPayload {
  sub: string;
  scope: string;
  email: string;
}

// Message event listeners
export type MessageListener = (message: Message) => void;
export type ConnectionListener = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageListeners: Map<string, Set<MessageListener>> = new Map();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connected: boolean = false;
  private debug: boolean = false;
  private currentConversationId: number | null = null;
  private config: WebSocketConfig | null = null;

  /**
   * Initialize the WebSocket connection
   */
  initialize(config: WebSocketConfig): boolean {
    try {
      // If already initialized with the same endpoint, don't reinitialize
      if (this.client && this.config && this.config.endpoint === config.endpoint) {
        this.log('WebSocket client already initialized with the same endpoint');
        return true;
      }
      
      // Disconnect if there is an existing client
      if (this.client) {
        this.log('WebSocket client already initialized with different endpoint, disconnecting first');
        this.disconnect();
      }

      this.debug = config.debug || false;
      this.config = config;
      this.log('Initializing WebSocket service', config);

      // Create Client and configure it with minimal options to avoid issues
      this.client = new Client({
        // Use SockJS for WebSocket connection with error handling
        webSocketFactory: () => {
          try {
            return new SockJS(config.endpoint);
          } catch (error) {
            console.error('Error creating SockJS instance:', error);
            throw error;
          }
        },
        
        // Configure reconnection behavior
        reconnectDelay: this.reconnectInterval,
        
        // Event handlers
        onConnect: this.onConnect.bind(this),
        onStompError: this.onError.bind(this),
        onWebSocketClose: this.onClose.bind(this)
      });
      
      return true;
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      return false;
    }
  }

  /**
   * Connect to the WebSocket server with authentication
   */
  connect(): boolean {
    if (!this.client) {
      console.error('WebSocket client not initialized. Call initialize() first');
      return false;
    }

    try {
      // If already connected, just return true
      if (this.isConnected()) {
        this.log('WebSocket already connected');
        return true;
      }
      
      const token = getValidTokenFromStorage();
      
      if (!token) {
        console.error('No valid authentication token available');
        return false;
      }

      // Connect with authentication headers
      this.client.connectHeaders = {
        Authorization: `Bearer ${token}`
      };

      // Activate the client to establish connection
      this.client.activate();
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting WebSocket client');
    
    if (this.client) {
      try {
        // Unsubscribe from all topics
        this.unsubscribeAll();
        
        // Deactivate client
        if (this.client.connected) {
          this.client.deactivate();
        }
        
        // Clear client reference
        this.client = null;
        
        this.setConnected(false);
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      }
    }

    // Clear any pending reconnect attempt
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
    this.currentConversationId = null;
  }

  /**
   * Switch to a different conversation
   * This will unsubscribe from the current conversation and subscribe to the new one
   */
  switchConversation(conversationId: number, listener: MessageListener): boolean {
    this.log(`Switching from conversation ${this.currentConversationId} to ${conversationId}`);
    
    // If we have a current conversation, unsubscribe from it
    if (this.currentConversationId !== null && this.currentConversationId !== conversationId) {
      const oldTopic = `/topic/conversation.${this.currentConversationId}`;
      this.unsubscribe(oldTopic);
    }
    
    // Set the new conversation as current
    this.currentConversationId = conversationId;
    
    // Make sure we're connected before subscribing
    if (!this.isConnected()) {
      if (!this.config) {
        console.error('WebSocket not configured. Call initialize() first');
        return false;
      }
      
      // Only initialize if not already initialized
      if (!this.client) {
        this.initialize(this.config);
      }
      
      // Connect and then subscribe when connection is established
      const success = this.connect();
      if (!success) {
        return false;
      }
      
      // Add a temporary listener to subscribe once connected
      const tempListener = (connected: boolean) => {
        if (connected) {
          this.subscribeToConversation(conversationId, listener);
          this.removeConnectionListener(tempListener);
        }
      };
      
      this.addConnectionListener(tempListener);
      return true;
    }
    
    // We're already connected, so subscribe directly
    return this.subscribeToConversation(conversationId, listener);
  }

  /**
   * Subscribe to a specific conversation
   */
  subscribeToConversation(conversationId: number, listener: MessageListener): boolean {
    if (!this.isConnected()) {
      console.error('Cannot subscribe - WebSocket not connected');
      return false;
    }

    const topic = `/topic/conversation.${conversationId}`;
    this.currentConversationId = conversationId;
    return this.subscribe(topic, listener);
  }

  /**
   * Subscribe to all conversations
   */
  subscribeToAllConversations(listener: MessageListener): boolean {
    if (!this.isConnected()) {
      console.error('Cannot subscribe - WebSocket not connected');
      return false;
    }

    const topic = '/topic/all-conversation/';
    return this.subscribe(topic, listener);
  }

  /**
   * Subscribe to a topic
   */
  private subscribe(topic: string, listener: MessageListener): boolean {
    try {
      if (!this.client || !this.client.connected) {
        console.error('Cannot subscribe - client not connected');
        return false;
      }

      // Add listener to the topic's listener set
      if (!this.messageListeners.has(topic)) {
        this.messageListeners.set(topic, new Set());
      }
      this.messageListeners.get(topic)?.add(listener);

      // Subscribe to the topic if not already subscribed
      if (!this.subscriptions.has(topic)) {
        const subscription = this.client.subscribe(topic, (message) => {
          this.handleMessage(topic, message);
        });
        this.subscriptions.set(topic, subscription);
        this.log(`Subscribed to topic: ${topic}`);
      }

      return true;
    } catch (error) {
      console.error(`Error subscribing to ${topic}:`, error);
      return false;
    }
  }

  /**
   * Unsubscribe from a specific topic
   */
  unsubscribe(topic: string): void {
    try {
      const subscription = this.subscriptions.get(topic);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(topic);
        this.messageListeners.delete(topic);
        this.log(`Unsubscribed from topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error unsubscribing from ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from all topics
   */
  unsubscribeAll(): void {
    try {
      this.subscriptions.forEach((subscription, topic) => {
        try {
          subscription.unsubscribe();
          this.log(`Unsubscribed from topic: ${topic}`);
        } catch (innerError) {
          console.error(`Error unsubscribing from ${topic}:`, innerError);
        }
      });
      this.subscriptions.clear();
      this.messageListeners.clear();
    } catch (error) {
      console.error('Error unsubscribing from all topics:', error);
    }
  }

  /**
   * Send a message to the server
   */
  sendMessage(conversationId: number, message: string, type: 'TEXT' | 'IMAGE' = 'TEXT', imageUrl: string | null = null): boolean {
    if (!this.isConnected()) {
      console.error('Cannot send message - WebSocket not connected');
      return false;
    }

    try {
      const token = getValidTokenFromStorage();
      if (!token) {
        console.error('No valid authentication token');
        return false;
      }

      // Extract sender information from JWT
      const decodedToken = jwtDecode<JWTPayload>(token);
      const senderId = parseInt(decodedToken.sub, 10);

      // Create message payload
      const payload = {
        conversationId,
        senderId,
        messageText: message,
        type,
        imageUrl
      };

      // Send the message
      this.client?.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });

      this.log('Message sent:', payload);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Get the current conversation ID
   */
  getCurrentConversationId(): number | null {
    return this.currentConversationId;
  }

  /**
   * Register a connection state listener
   */
  addConnectionListener(listener: ConnectionListener): void {
    this.connectionListeners.add(listener);
    // Immediately notify of current state
    if (this.connected) {
      listener(true);
    }
  }

  /**
   * Remove a connection state listener
   */
  removeConnectionListener(listener: ConnectionListener): void {
    this.connectionListeners.delete(listener);
  }

  /**
   * Check if the WebSocket is connected
   */
  isConnected(): boolean {
    return this.connected && !!this.client?.connected;
  }

  // Private methods for handling WebSocket events

  private handleMessage(topic: string, stompMessage: IMessage): void {
    try {
      const payload = JSON.parse(stompMessage.body);
      this.log(`Received message on ${topic}:`, payload);
      
      // Notify all listeners for this topic
      const listeners = this.messageListeners.get(topic);
      listeners?.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private onConnect(): void {
    this.log('WebSocket connected successfully');
    this.setConnected(true);
    this.reconnectAttempts = 0;
  }

  private onError(frame: any): void {
    console.error('WebSocket error:', frame);
    this.setConnected(false);
    this.attemptReconnect();
  }

  private onClose(): void {
    this.log('WebSocket connection closed');
    this.setConnected(false);
    this.attemptReconnect();
  }

  private setConnected(connected: boolean): void {
    if (this.connected !== connected) {
      this.connected = connected;
      // Notify all connection listeners
      this.connectionListeners.forEach((listener) => {
        try {
          listener(connected);
        } catch (error) {
          console.error('Error in connection listener:', error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Create fresh client instance to avoid any lingering issues
      if (this.config) {
        this.initialize(this.config);
        this.connect();
      }
    }, delay);
  }

  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
