import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge, Breadcrumb } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
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
import Introduction from './Introduction';
import UsersManagement from '../Users/UsersManagement';
import ProductsManagement from '../Products/ProductsManagement';
import CategoriesManagement from '../Categories/CategoriesManagement';
import OrdersManagement from '../Orders/OrdersManagement';
import ChatSystem from '../Chat/ChatSystem';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const Dashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Trang chủ',
    },
    {
      key: '/dashboard/users',
      icon: <UserOutlined />,
      label: 'Người dùng',
    },
    {
      key: '/dashboard/products',
      icon: <ShoppingOutlined />,
      label: 'Sản phẩm',
    },
    {
      key: '/dashboard/categories',
      icon: <TagsOutlined />,
      label: 'Danh mục',
    },
    {
      key: '/dashboard/orders',
      icon: <OrderedListOutlined />,
      label: 'Đơn hàng',
    },
    {
      key: '/dashboard/chat',
      icon: <MessageOutlined />,
      label: 'Chat',
    },
  ];

  const handleMenuClick = (info: any) => {
    navigate(info.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems: {title: string, href?: string}[] = [
      {
        title: 'Trang chủ',
        href: '/dashboard',
      },
    ];

    if (pathSegments.length > 1) {
      const currentPage = pathSegments[1];
      const title = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
      const translatedTitle = 
        currentPage === 'users' ? 'Người dùng' :
        currentPage === 'products' ? 'Sản phẩm' :
        currentPage === 'categories' ? 'Danh mục' :
        currentPage === 'orders' ? 'Đơn hàng' :
        currentPage === 'chat' ? 'Chat' : title;
      
      breadcrumbItems.push({
        title: translatedTitle,
        href: `/dashboard/${currentPage}`
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
            <Route path="/" element={<Introduction />} />
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