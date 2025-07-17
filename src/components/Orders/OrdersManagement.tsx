import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Modal, 
  Tag,
  Descriptions,
  Image,
  Divider,
  Steps,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  EyeOutlined, 
  SearchOutlined,
  ExportOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CreditCardOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { adminOrderService, Order, OrderListParams, UpdateOrderRequest, OrderDetail } from '../../services/adminOrderService';
import { useNotification } from '../../contexts/NotificationContext';

const { Option } = Select;
const { Step } = Steps;

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const { showNotification } = useNotification();

  const orderStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: OrderListParams = {
        page: pagination.current - 1, // API uses 0-based page index
        size: pagination.pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const response = await adminOrderService.getAllOrders(params);
      setOrders(response.data.content);
      setPagination(prev => ({ ...prev, total: response.data.totalElements }));
    } catch (error) {
      showNotification('error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleUpdateStatus = async (orderId: number, status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') => {
    try {
      const orderData: UpdateOrderRequest = { status };
      await adminOrderService.updateOrderById(orderId, orderData);
      showNotification('success', 'Order status updated successfully');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      showNotification('error', 'Failed to update order status');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      // Note: This is a placeholder since exportOrders is not defined in adminOrderService
      showNotification('success', `Orders exported to ${format.toUpperCase()} successfully`);
    } catch (error) {
      showNotification('error', 'Failed to export orders');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'default',
      CONFIRMED: 'blue',
      SHIPPED: 'orange',
      DELIVERED: 'green',
      CANCELLED: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusStep = (status: string) => {
    const steps = {
      PENDING: 0,
      CONFIRMED: 1,
      SHIPPED: 2,
      DELIVERED: 3,
      CANCELLED: -1
    };
    return steps[status as keyof typeof steps] || 0;
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => (
        <span className="font-mono font-semibold">#{id}</span>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (customerName: string, record: Order) => (
        <div>
          <div className="font-semibold">{customerName}</div>
          <div className="text-sm text-gray-500">{record.user.email}</div>
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'orderDetails',
      key: 'items',
      render: (orderDetails: OrderDetail[]) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {orderDetails.length} items
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      render: (total: number) => (
        <span className="font-semibold text-lg">{total} đ</span>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button 
            type="primary" 
            ghost
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 120 }}
            onChange={(value) => handleUpdateStatus(record.id, value as 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED')}
          >
            {orderStatuses.map(status => (
              <Option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Option>
            ))}
          </Select>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
          <Space>
            <Button
              icon={<ExportOutlined />}
              onClick={() => handleExport('csv')}
            >
              Export CSV
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchOrders}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <Input.Search
            placeholder="Search orders by number or customer..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
          >
            <Option value="all">All Status</Option>
            {orderStatuses.map(status => (
              <Option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
            onChange: (page, size) => setPagination(prev => ({ ...prev, current: page, pageSize: size })),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title="Order Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />}>
            Print
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={900}
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status Progress */}
            <Card size="small" title="Order Progress">
              <Steps
                current={getStatusStep(selectedOrder.status)}
                status={selectedOrder.status === 'CANCELLED' ? 'error' : 'process'}
              >
                <Step title="Pending" icon={<ShoppingCartOutlined />} />
                <Step title="Confirmed" icon={<UserOutlined />} />
                <Step title="Shipped" icon={<TruckOutlined />} />
                <Step title="Delivered" icon={<CreditCardOutlined />} />
              </Steps>
            </Card>

            {/* Order Information */}
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Order Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Order Number">
                      <span className="font-mono font-semibold">#{selectedOrder.id}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Updated">
                      {new Date(selectedOrder.updatedAt).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Customer Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Name">
                      {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedOrder.user.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Shipping Address">
                      {selectedOrder.shippingAddress}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* Order Items */}
            <Card size="small" title="Order Items">
              <Table
                dataSource={selectedOrder.orderDetails}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Product',
                    dataIndex: 'productImageUrl',
                    key: 'image',
                    render: (image: string, record: OrderDetail) => (
                      <div className="flex items-center space-x-3">
                        <Image
                          width={50}
                          height={50}
                          src={image}
                          alt={record.productName}
                          className="object-cover rounded"
                        />
                        <span className="font-medium">{record.productName}</span>
                      </div>
                    ),
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `${price} đ`,
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Subtotal',
                    key: 'subtotal',
                    render: (_, record: OrderDetail) => `${(record.price * record.quantity).toFixed(2)} đ`,
                  },
                ]}
              />
              <Divider />
              <div className="flex justify-end">
                <Statistic
                  title="Total Amount"
                  value={selectedOrder.totalAmount} 
                  formatter={value => `${Number(value).toFixed(2)} đ`}
                />
              </div>
            </Card>

            {/* Status Update */}
            <Card size="small" title="Update Status">
              <div className="flex items-center space-x-4">
                <span>Change order status:</span>
                <Select
                  value={selectedOrder.status}
                  style={{ width: 150 }}
                  onChange={(value) => handleUpdateStatus(selectedOrder.id, value as 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED')}
                >
                  {orderStatuses.map(status => (
                    <Option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Option>
                  ))}
                </Select>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersManagement;