// API Configuration Utility
// 
// This file provides utilities to manage API configuration.
// To change the base URL for production, simply update the BASE_URL below
// or call updateBaseUrl() with your production URL.

import { updateBaseUrl } from '../config/api';

/**
 * Configuration utility for switching between environments
 */
export const APIConfig = {
  // Development/Testing Configuration
  DEVELOPMENT: 'http://localhost:3001',
  
  // Production Configuration (update this when deploying)
  PRODUCTION: 'https://manzone.wizlab.io.vn',
  
  // Current environment - change this to switch environments
  CURRENT_ENV: 'PRODUCTION' as 'DEVELOPMENT' | 'PRODUCTION',
  
  /**
   * Get the current base URL based on environment
   */
  getCurrentBaseUrl(): string {
    return this.CURRENT_ENV === 'PRODUCTION' ? this.PRODUCTION : this.DEVELOPMENT;
  },
  
  /**
   * Switch to production environment
   */
  switchToProduction(): void {
    this.CURRENT_ENV = 'PRODUCTION';
    updateBaseUrl(this.PRODUCTION);
    console.log('API base URL switched to production:', this.PRODUCTION);
  },
  
  /**
   * Switch to development environment
   */
  switchToDevelopment(): void {
    this.CURRENT_ENV = 'DEVELOPMENT';
    updateBaseUrl(this.DEVELOPMENT);
    console.log('API base URL switched to development:', this.DEVELOPMENT);
  },
  
  /**
   * Set custom base URL
   */
  setCustomBaseUrl(url: string): void {
    updateBaseUrl(url);
    console.log('API base URL set to custom:', url);
  }
};

// Initialize with current environment
APIConfig.setCustomBaseUrl(APIConfig.getCurrentBaseUrl());

// Export for easy access in development console
(window as any).APIConfig = APIConfig;
