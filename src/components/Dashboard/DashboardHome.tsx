import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  UserOutlined, 
  ShoppingOutlined, 
  OrderedListOutlined, 
  DollarOutlined,
  RiseOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { apiService } from '../../services/apiService';

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.dashboard.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const orderColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `$${total}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          shipped: 'blue',
          processing: 'orange',
          delivered: 'green',
          pending: 'default',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Total Users"
              value={stats?.totalUsers}
              prefix={<UserOutlined className="text-blue-500" />}
              suffix={
                <div className="flex items-center text-green-500 text-sm">
                  <RiseOutlined className="mr-1" />
                  12%
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Total Products"
              value={stats?.totalProducts}
              prefix={<ShoppingOutlined className="text-green-500" />}
              suffix={
                <div className="flex items-center text-green-500 text-sm">
                  <RiseOutlined className="mr-1" />
                  8%
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Total Orders"
              value={stats?.totalOrders}
              prefix={<OrderedListOutlined className="text-orange-500" />}
              suffix={
                <div className="flex items-center text-red-500 text-sm">
                  <ArrowDownOutlined className="mr-1" />
                  3%
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Total Revenue"
              value={stats?.totalRevenue}
              prefix={<DollarOutlined className="text-purple-500" />}
              precision={2}
              suffix={
                <div className="flex items-center text-green-500 text-sm">
                  <RiseOutlined className="mr-1" />
                  15%
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Sales Overview" className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  dot={{ fill: '#1890ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Top Products" className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="sales" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders and Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Orders">
            <Table
              columns={orderColumns}
              dataSource={stats?.recentOrders}
              pagination={false}
              rowKey="id"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <div className="space-y-4">
            <Card title="Quick Stats">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Order Completion Rate</span>
                    <span className="text-sm font-semibold">87%</span>
                  </div>
                  <Progress percent={87} strokeColor="#52c41a" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Customer Satisfaction</span>
                    <span className="text-sm font-semibold">92%</span>
                  </div>
                  <Progress percent={92} strokeColor="#1890ff" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Stock Availability</span>
                    <span className="text-sm font-semibold">76%</span>
                  </div>
                  <Progress percent={76} strokeColor="#faad14" />
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardHome;