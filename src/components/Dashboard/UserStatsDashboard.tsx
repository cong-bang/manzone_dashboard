import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Progress, Tag, Spin } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  UserOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  UserDeleteOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import {
  adminUserService,
  UserStatistics,
} from "../../services/adminUserService";
import { useNotification } from "../../contexts/NotificationContext";

const UserStatsDashboard = () => {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const response = await adminUserService.getUserStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      showNotification(
        "error",
        error.message || "Failed to fetch user statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        No statistics available
      </div>
    );
  }

  // Prepare data for charts
  const dailyRegistrationsData = Object.entries(stats.dailyRegistrations)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      registrations: count,
    }));

  const roleDistributionData = [
    {
      name: "Customers",
      value: stats.customersCount,
      percentage: stats.customerPercentage,
    },
    {
      name: "Admins",
      value: stats.adminsCount,
      percentage: stats.adminPercentage,
    },
  ];

  const COLORS = {
    customers: "#1890ff",
    admins: "#f5222d",
    active: "#52c41a",
    inactive: "#faad14",
    deleted: "#ff4d4f",
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <RiseOutlined className="text-green-500" />;
    if (rate < 0) return <FallOutlined className="text-red-500" />;
    return <LineChartOutlined className="text-yellow-500" />;
  };

  return (
    <div className="user-stats-dashboard">
      {/* Overview Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.activeUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#52c41a" }}
              suffix={
                <Tag color="green">
                  {stats.activeUserPercentage.toFixed(1)}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={stats.inactiveUsers}
              prefix={<UserSwitchOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Deleted Users"
              value={stats.deletedUsers}
              prefix={<UserDeleteOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
              suffix={
                <Tag color="red">{stats.deletedUserPercentage.toFixed(1)}%</Tag>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Registration Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today"
              value={stats.todayRegistrations}
              suffix="new users"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Week"
              value={stats.thisWeekRegistrations}
              suffix="new users"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Month"
              value={stats.thisMonthRegistrations}
              suffix="new users"
              prefix={getGrowthIcon(stats.registrationGrowthRate)}
            />
            <div className="mt-2">
              <span
                className={`${
                  stats.registrationGrowthRate > 0
                    ? "text-green-500"
                    : stats.registrationGrowthRate < 0
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {stats.registrationGrowthRate > 0 ? "+" : ""}
                {stats.registrationGrowthRate.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Year"
              value={stats.thisYearRegistrations}
              suffix="new users"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        {/* Daily Registrations Chart */}
        <Col xs={24} lg={16}>
          <Card title="Daily Registrations (Last 30 Days)" className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRegistrationsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ fill: "#1890ff", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Role Distribution */}
        <Col xs={24} lg={8}>
          <Card title="User Role Distribution" className="h-96">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) =>
                      `${name}: ${percentage.toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS.customers} />
                    <Cell fill={COLORS.admins} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span>Customers</span>
                <span className="font-semibold">{stats.customersCount}</span>
              </div>
              <Progress
                percent={stats.customerPercentage}
                strokeColor={COLORS.customers}
                showInfo={false}
              />
              <div className="flex justify-between items-center mb-2 mt-3">
                <span>Admins</span>
                <span className="font-semibold">{stats.adminsCount}</span>
              </div>
              <Progress
                percent={stats.adminPercentage}
                strokeColor={COLORS.admins}
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Status Distribution */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24}>
          <Card title="User Status Overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {stats.activeUsers}
                  </div>
                  <div className="text-gray-600 mb-3">Active Users</div>
                  <Progress
                    type="circle"
                    percent={stats.activeUserPercentage}
                    strokeColor={COLORS.active}
                    width={120}
                  />
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    {stats.inactiveUsers}
                  </div>
                  <div className="text-gray-600 mb-3">Inactive Users</div>
                  <Progress
                    type="circle"
                    percent={(stats.inactiveUsers / stats.totalUsers) * 100}
                    strokeColor={COLORS.inactive}
                    width={120}
                  />
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    {stats.deletedUsers}
                  </div>
                  <div className="text-gray-600 mb-3">Deleted Users</div>
                  <Progress
                    type="circle"
                    percent={stats.deletedUserPercentage}
                    strokeColor={COLORS.deleted}
                    width={120}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserStatsDashboard;
