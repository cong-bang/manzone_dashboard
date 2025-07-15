import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge, Breadcrumb } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  TagsOutlined,
  OrderedListOutlined,
  MessageOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHome from './DashboardHome';
import UsersManagement from '../Users/UsersManagement';
import ProductsManagement from '../Products/ProductsManagement';
import CategoriesManagement from '../Categories/CategoriesManagement';
import OrdersManagement from '../Orders/OrdersManagement';
import ChatSystem from '../Chat/ChatSystem';

const { Header, Sider, Content } = Layout;

const Dashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/dashboard/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/dashboard/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: '/dashboard/categories',
      icon: <TagsOutlined />,
      label: 'Categories',
    },
    {
      key: '/dashboard/orders',
      icon: <OrderedListOutlined />,
      label: 'Orders',
    },
    {
      key: '/dashboard/chat',
      icon: <MessageOutlined />,
      label: 'Chat',
    },
  ];

  const handleMenuClick = (e: any) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems = [
      {
        title: 'Dashboard',
        href: '/dashboard',
      },
    ];

    if (pathSegments.length > 1) {
      const currentPage = pathSegments[1];
      breadcrumbItems.push({
        title: currentPage.charAt(0).toUpperCase() + currentPage.slice(1),
      });
    }

    return breadcrumbItems;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        className="bg-white border-r border-gray-200"
        breakpoint="lg"
        collapsedWidth={collapsed ? 80 : 240}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MZ</span>
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-gray-800">ManZone</span>
            )}
          </div>
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0"
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-gray-800"
            />
            
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="text-gray-600 hover:text-gray-800"
              />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <Avatar src={user?.avatar} icon={<UserOutlined />} />
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="p-6 bg-gray-50">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/products" element={<ProductsManagement />} />
            <Route path="/categories" element={<CategoriesManagement />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/chat" element={<ChatSystem />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;