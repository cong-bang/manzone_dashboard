import React, { createContext, useContext, useState, ReactNode } from 'react';
import { notification } from 'antd';

interface NotificationContextType {
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string, description?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string, description?: string) => {
    api[type]({
      message,
      description,
      placement: 'topRight',
      duration: 4.5,
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};