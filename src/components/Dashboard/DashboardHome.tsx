import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Table, Tag, Progress, Tabs } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  UserOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { adminUserService } from "../../services/adminUserService";
import UserStatsDashboard from "./UserStatsDashboard";
import { adminOrderService } from "../../services/adminOrderService";

// Mock data for when API is not available
const mockSalesTrend = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 5000 },
  { month: "Apr", sales: 4500 },
  { month: "May", sales: 6000 },
  { month: "Jun", sales: 5500 },
];

const mockOrderStatus = [
  { status: "Pending", count: 45 },
  { status: "Processing", count: 38 },
  { status: "Shipped", count: 52 },
  { status: "Delivered", count: 61 },
  { status: "Cancelled", count: 8 },
];

const DashboardHome = () => {
  const [stats, setStats] = useState<any>(null);
  const [statsOrder, setStatsOrder] = useState(mockOrderStatus); // Khởi tạo với mock data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminUserService.getUserStatistics();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchOrderStats = async () => {
      try {
        const response = await adminOrderService.getOrderStatistics();
        console.log("Order Stats Response:", response.data);
        if (response.success) {
          const transformedData = Object.entries(response.data)
            .map(([status, count]) => ({
              status: status.charAt(0).toUpperCase() + status.slice(1),
              count: count as number,
            }))
            .filter(item => item.status !== 'Total');
          setStatsOrder(transformedData);
        }
      } catch (error) {
        console.error("Error fetching order stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchOrderStats();
  }, []);

  const orderColumns = [
    {
      title: "Order ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `$${total}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={
            status === "completed"
              ? "green"
              : status === "pending"
              ? "orange"
              : status === "cancelled"
              ? "red"
              : "blue"
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: "1",
      label: "Overview",
      children: (
        <div>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Sales"
                  value={stats?.totalSales || 112893}
                  precision={2}
                  valueStyle={{ color: "#3f8600" }}
                  prefix={<DollarOutlined />}
                  suffix="USD"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Orders"
                  value={stats?.totalOrders || 1128}
                  valueStyle={{ color: "#1890ff" }}
                  prefix={<OrderedListOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Products"
                  value={stats?.totalProducts || 256}
                  valueStyle={{ color: "#722ed1" }}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Users"
                  value={stats?.totalUsers || 1052}
                  valueStyle={{ color: "#cf1322" }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={12}>
              <Card title="Sales Trend" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.salesTrend || mockSalesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Order Status" className="h-[400px] min-h-[400px]">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={Array.isArray(statsOrder) ? statsOrder : mockOrderStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Recent Orders">
                <Table
                  columns={orderColumns}
                  dataSource={stats?.recentOrders || []}
                  pagination={false}
                  rowKey="id"
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Quick Stats">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Order Completion Rate
                      </span>
                      <span className="text-sm font-semibold">87%</span>
                    </div>
                    <Progress percent={87} strokeColor="#52c41a" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Customer Satisfaction
                      </span>
                      <span className="text-sm font-semibold">92%</span>
                    </div>
                    <Progress percent={92} strokeColor="#1890ff" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Stock Availability
                      </span>
                      <span className="text-sm font-semibold">76%</span>
                    </div>
                    <Progress percent={76} strokeColor="#faad14" />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "2",
      label: "User Analytics",
      children: <UserStatsDashboard />,
    },
  ];

  return (
    <div className="dashboard-home">
      <Tabs defaultActiveKey="1" items={tabItems} />
    </div>
  );
};

export default DashboardHome;