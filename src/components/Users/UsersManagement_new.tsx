import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Popconfirm,
  Avatar,
  Tag,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
  LockOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  adminUserService,
  User,
  UserListParams,
  CreateUserRequest,
  UpdateUserRequest,
} from "../../services/adminUserService";
import { useNotification } from "../../contexts/NotificationContext";

const { Option } = Select;

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<"CUSTOMER" | "ADMIN" | "">("");
  const [statusFilter, setStatusFilter] = useState<
    "active" | "inactive" | "deleted" | ""
  >("");
  const [sortBy, setSortBy] = useState<UserListParams["sortBy"]>("CREATED_AT");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  const { showNotification } = useNotification();

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any): string => {
    const errorMessage = error.message || "";

    switch (errorMessage) {
      case "USER_NOT_FOUND":
        return "User not found";
      case "EMAIL_ALREADY_EXISTS":
        return "Email address is already in use";
      case "INVALID_EMAIL_FORMAT":
        return "Invalid email format";
      case "INVALID_PHONE_FORMAT":
        return "Invalid phone number format";
      case "CANNOT_DELETE_ADMIN":
        return "Cannot delete admin users";
      case "CANNOT_DEACTIVATE_ADMIN":
        return "Cannot deactivate admin users";
      case "USER_ALREADY_ACTIVE":
        return "User is already active";
      case "USER_ALREADY_INACTIVE":
        return "User is already inactive";
      case "USER_ALREADY_DELETED":
        return "User is already deleted";
      case "INVALID_CREDENTIALS":
        return "Invalid credentials";
      case "INSUFFICIENT_PERMISSIONS":
        return "Insufficient permissions";
      case "UNAUTHORIZED":
        return "Unauthorized access";
      case "FORBIDDEN":
        return "Access forbidden";
      case "NETWORK_ERROR":
        return "Network connection error";
      default:
        if (errorMessage.includes("CORS")) {
          return "Connection error. Please check server configuration.";
        }
        return errorMessage || "An unexpected error occurred";
    }
  };

  // Check if user is admin and show warning
  const isAdminUser = (user: User): boolean => {
    return user.role === "ADMIN";
  };

  useEffect(() => {
    fetchUsers();
  }, [
    pagination.current,
    pagination.pageSize,
    searchText,
    roleFilter,
    statusFilter,
    sortBy,
    sortDir,
  ]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: UserListParams = {
        page: pagination.current - 1, // API uses 0-based pagination
        size: pagination.pageSize,
        sortBy,
        sortDir,
        searchString: searchText || undefined,
        role: roleFilter || undefined,
        isDeleted: statusFilter === "deleted" ? true : undefined,
      };

      const response = await adminUserService.getAllUsers(params);

      if (response.success) {
        setUsers(response.data.content);
        setPagination((prev) => ({
          ...prev,
          total: response.data.totalElements,
        }));
      }
    } catch (error: any) {
      showNotification("error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingUser(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (user: User) => {
    // Prevent editing admin users
    if (isAdminUser(user)) {
      showNotification(
        "warning",
        "Admin users cannot be edited for security reasons"
      );
      return;
    }

    setEditingUser(user);
    setModalVisible(true);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      avatarUrl: user.avatarUrl,
      active: user.active,
    });
  };

  const handleDelete = async (userId: number) => {
    try {
      const response = await adminUserService.deleteUser(userId);
      if (response.success) {
        showNotification("success", "User deleted successfully");
        fetchUsers();
      }
    } catch (error: any) {
      showNotification("error", getErrorMessage(error));
    }
  };

  const handleRestore = async (userId: number) => {
    try {
      const response = await adminUserService.restoreUser(userId);
      if (response.success) {
        showNotification("success", "User restored successfully");
        fetchUsers();
      }
    } catch (error: any) {
      showNotification("error", getErrorMessage(error));
    }
  };

  const handleActivate = async (userId: number, isActive: boolean) => {
    try {
      const response = isActive
        ? await adminUserService.deactivateUser(userId)
        : await adminUserService.activateUser(userId);

      if (response.success) {
        showNotification(
          "success",
          `User ${isActive ? "deactivated" : "activated"} successfully`
        );
        fetchUsers();
      }
    } catch (error: any) {
      showNotification("error", getErrorMessage(error));
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const response = await adminUserService.resetUserPassword(userId);
      if (response.success) {
        showNotification("success", "Password reset successfully");
      }
    } catch (error: any) {
      showNotification("error", getErrorMessage(error));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Additional check to prevent admin updates
        if (isAdminUser(editingUser)) {
          showNotification("error", "Admin users cannot be modified");
          return;
        }

        const updateData: UpdateUserRequest = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          address: values.address,
          role: values.role,
          avatarUrl: values.avatarUrl,
          active: values.active,
        };

        const response = await adminUserService.updateUser(
          editingUser.id,
          updateData
        );
        if (response.success) {
          showNotification("success", "User updated successfully");
        }
      } else {
        const createData: CreateUserRequest = {
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
          email: values.email,
          phoneNumber: values.phoneNumber,
          address: values.address,
          role: values.role,
          avatarUrl: values.avatarUrl,
          active: values.active ?? true,
        };

        const response = await adminUserService.createUser(createData);
        if (response.success) {
          showNotification("success", "User created successfully");
        }
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      showNotification("error", getErrorMessage(error));
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatarUrl",
      key: "avatarUrl",
      render: (avatar: string) => (
        <Avatar src={avatar} icon={<UserOutlined />} />
      ),
    },
    {
      title: "Name",
      dataIndex: "firstName",
      key: "name",
      sorter: true,
      render: (_: any, record: User) =>
        `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "ADMIN" ? "red" : "blue"}>{role}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: User) => {
        if (record.deleted) {
          return <Tag color="red">Deleted</Tag>;
        }
        return record.active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="orange">Inactive</Tag>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            disabled={isAdminUser(record)}
            title={
              isAdminUser(record) ? "Admin users cannot be edited" : "Edit user"
            }
          />
          {!record.deleted && record.role !== "ADMIN" && (
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Popconfirm>
          )}
          {record.deleted && !isAdminUser(record) && (
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={() => handleRestore(record.id)}
              size="small"
            />
          )}
          {!record.deleted && record.role !== "ADMIN" && (
            <Button
              type="text"
              icon={<UserSwitchOutlined />}
              onClick={() => handleActivate(record.id, record.active)}
              size="small"
              title={`${record.active ? "Deactivate" : "Activate"} user`}
            />
          )}
          {!record.deleted && (
            <Button
              type="text"
              icon={<LockOutlined />}
              onClick={() => handleResetPassword(record.id)}
              size="small"
              title="Reset password"
            />
          )}
        </Space>
      ),
    },
  ];

  const handleTableChange = (
    paginationInfo: any,
    _filters: any,
    sorter: any
  ) => {
    setPagination({
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
      total: pagination.total,
    });

    if (sorter.field) {
      const sortByMap: Record<string, UserListParams["sortBy"]> = {
        name: "FIRST_NAME",
        email: "EMAIL",
        createdAt: "CREATED_AT",
      };
      setSortBy(sortByMap[sorter.field] || "CREATED_AT");
      setSortDir(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  return (
    <div className="users-management">
      <Card
        title="User Management"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add User
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              Refresh
            </Button>
          </Space>
        }
      >
        <div className="mb-4">
          <Space wrap>
            <Input.Search
              placeholder="Search users..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Filter by role"
              allowClear
              style={{ width: 150 }}
              value={roleFilter || undefined}
              onChange={(value) => setRoleFilter(value || "")}
            >
              <Option value="CUSTOMER">Customer</Option>
              <Option value="ADMIN">Admin</Option>
            </Select>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 150 }}
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || "")}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="deleted">Deleted</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingUser ? "Edit User" : "Add User"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            active: true,
            role: "CUSTOMER",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  { required: true, message: "Please enter first name!" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: "Please enter last name!" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: "Please enter phone number!" },
              {
                pattern: /^(0|\+84|84)([35789])[0-9]{8}$/,
                message: "Please enter a valid Vietnamese phone number!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please enter password!" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: "Please select role!" }]}
              >
                <Select>
                  <Option value="CUSTOMER">Customer</Option>
                  <Option value="ADMIN">Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="active"
                label="Status"
                rules={[{ required: true, message: "Please select status!" }]}
              >
                <Select>
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="avatarUrl" label="Avatar URL">
            <Input placeholder="Enter avatar URL (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersManagement;
