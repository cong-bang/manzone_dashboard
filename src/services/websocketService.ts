import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { jwtDecode } from 'jwt-decode';
import { getValidTokenFromStorage } from '../utils/tokenUtils';
import { Message as ApiMessage } from './conversationService';
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

// WebSocket Message from server
interface WebSocketMessage {
  conversationId: number;
  senderId: number;
  messageText: string;
  type: 'TEXT' | 'IMAGE';
  imageUrl: string | null;
}

// Message event listeners
export type MessageListener = (message: ApiMessage) => void;
export type ConnectionListener = (connected: boolean) => void;

// Track sent messages to prevent duplicate handling
interface SentMessage {
  content: string;
  timestamp: number;
  conversationId: number;
  senderId: number;
}

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
  // Track recently sent messages to avoid duplicates
  private recentlySentMessages: SentMessage[] = [];
  // Maximum time to track sent messages (in milliseconds)
  private messageTrackingWindow: number = 10000; // 10 seconds

  /**
   * Generate a simple hash code from a string
   * This is used to create deterministic IDs for messages
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

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
          // Ensure the STOMP client is fully connected before subscribing
          // Add a small delay to ensure STOMP connection is complete
          setTimeout(() => {
            if (this.client && this.client.connected) {
              this.subscribeToConversation(conversationId, listener);
            } else {
              // If still not connected, try one more time after a delay
              setTimeout(() => {
                this.subscribeToConversation(conversationId, listener);
              }, 1000);
            }
            this.removeConnectionListener(tempListener);
          }, 500);
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
    if (!this.client) {
      console.error('Cannot subscribe - WebSocket client not initialized');
      return false;
    }
    
    if (!this.client.connected) {
      console.error('Cannot subscribe - WebSocket client not connected');
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
   * @returns {object} An object with result and errorMessage properties
   */
  sendMessage(
    conversationId: number, 
    message: string, 
    type: 'TEXT' | 'IMAGE' = 'TEXT', 
    imageUrl: string | null = null,
    isDone: boolean = false
  ): { success: boolean; errorMessage?: string } {
    // Check if conversation is marked as done
    if (isDone) {
      return { 
        success: false, 
        errorMessage: 'Cannot send messages to a closed conversation' 
      };
    }
    
    if (!this.isConnected()) {
      return { 
        success: false, 
        errorMessage: 'Cannot send message - WebSocket not connected' 
      };
    }

    try {
      const token = getValidTokenFromStorage();
      if (!token) {
        return { 
          success: false, 
          errorMessage: 'No valid authentication token' 
        };
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

      // Track this message as sent by client to prevent duplicate handling
      this.trackSentMessage({
        content: message,
        timestamp: Date.now(),
        conversationId,
        senderId
      });

      // Send the message
      this.client?.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });

      this.log('Message sent:', payload);
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        success: false, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error sending message' 
      };
    }
  }

  /**
   * Track a sent message to avoid duplicates when received back from server
   */
  private trackSentMessage(message: SentMessage): void {
    // Add to tracked messages
    this.recentlySentMessages.push(message);
    
    // Clean up old messages
    this.cleanupTrackedMessages();
  }

  /**
   * Clean up tracked messages that are older than the tracking window
   */
  private cleanupTrackedMessages(): void {
    const now = Date.now();
    this.recentlySentMessages = this.recentlySentMessages.filter(
      msg => (now - msg.timestamp) < this.messageTrackingWindow
    );
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
    return this.connected && !!this.client && !!this.client.connected;
  }

  /**
   * Get the current user ID from the JWT token
   * This helps identify messages sent by the current admin user
   */
  getCurrentUserId(): number | null {
    try {
      const token = getValidTokenFromStorage();
      if (!token) {
        return null;
      }
      
      const decodedToken = jwtDecode<JWTPayload>(token);
      return parseInt(decodedToken.sub, 10);
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // Private methods for handling WebSocket events

  private handleMessage(topic: string, stompMessage: IMessage): void {
    try {
      const wsMessage = JSON.parse(stompMessage.body) as WebSocketMessage;
      this.log(`Received message on ${topic}:`, wsMessage);
      
      // Check if this message is one we just sent (to avoid duplicates)
      const isDuplicate = this.recentlySentMessages.some(
        sentMsg => 
          sentMsg.content === wsMessage.messageText &&
          sentMsg.conversationId === wsMessage.conversationId &&
          sentMsg.senderId === wsMessage.senderId &&
          (Date.now() - sentMsg.timestamp) < this.messageTrackingWindow
      );
      
      if (isDuplicate) {
        this.log('Ignoring message we just sent:', wsMessage);
        return; // Skip processing this message
      }
      
      // Generate a deterministic numeric ID to avoid duplicates
      let messageId: number;
      if (wsMessage.conversationId) {
        // Create a hash based on conversation ID, sender ID, and message content
        const contentHash = this.simpleHash(wsMessage.messageText || '');
        // Use timestamp as part of the ID to ensure uniqueness but keep similar messages distinct
        messageId = contentHash;
      } else {
        messageId = Date.now();
      }
      
      // Check if this message is from the current user/admin
      const currentUserId = this.getCurrentUserId();
      const senderEmail = wsMessage.senderId === currentUserId ? 'admin@manzone.com' : '';
      
      // Convert WebSocket message to the ApiMessage format expected by components
      const message: ApiMessage = {
        id: messageId,
        senderId: wsMessage.senderId,
        senderEmail: senderEmail, // Set admin email if this is from current admin
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: wsMessage.type,
        message: wsMessage.messageText,
        imageUrl: wsMessage.imageUrl
      };
      
      // Notify all listeners for this topic
      const listeners = this.messageListeners.get(topic);
      listeners?.forEach((listener) => {
        try {
          listener(message);
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
    this.reconnectAttempts = 0;
    
    // Short delay to ensure the STOMP client connection is fully established
    setTimeout(() => {
      this.setConnected(true);
    }, 200);
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
