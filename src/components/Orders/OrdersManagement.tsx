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
  Timeline,
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
import { apiService } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';

const { Option } = Select;
const { Step } = Steps;

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const { showNotification } = useNotification();

  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiService.orders.getAll(
        pagination.current,
        pagination.pageSize,
        searchText
      );
      setOrders(response.data);
      setPagination(prev => ({ ...prev, total: response.total }));
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

  const handleViewDetails = async (order: any) => {
    try {
      const orderDetails = await apiService.orders.getById(order.id);
      setSelectedOrder(orderDetails);
      setDetailModalVisible(true);
    } catch (error) {
      showNotification('error', 'Failed to fetch order details');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await apiService.orders.updateStatus(orderId, status);
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
      await apiService.orders.exportOrders(format);
      showNotification('success', `Orders exported to ${format.toUpperCase()} successfully`);
    } catch (error) {
      showNotification('error', 'Failed to export orders');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'default',
      processing: 'blue',
      shipped: 'orange',
      delivered: 'green',
      cancelled: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'default',
      paid: 'green',
      failed: 'red',
      refunded: 'orange'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusStep = (status: string) => {
    const steps = {
      pending: 0,
      processing: 1,
      shipped: 2,
      delivered: 3,
      cancelled: -1
    };
    return steps[status as keyof typeof steps] || 0;
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string) => (
        <span className="font-mono font-semibold">{orderNumber}</span>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: string, record: any) => (
        <div>
          <div className="font-semibold">{customer}</div>
          <div className="text-sm text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: number) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {items} items
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => (
        <span className="font-semibold text-lg">${total}</span>
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
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (paymentStatus: string) => (
        <Tag color={getPaymentStatusColor(paymentStatus)}>
          {paymentStatus.toUpperCase()}
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
      render: (_, record: any) => (
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
            onChange={(value) => handleUpdateStatus(record.id, value)}
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
            onChange={setStatusFilter}
          >
            <Option value="all">All Status</Option>
            {orderStatuses.map(status => (
              <Option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by payment"
            style={{ width: 150 }}
            value={paymentFilter}
            onChange={setPaymentFilter}
          >
            <Option value="all">All Payments</Option>
            {paymentStatuses.map(status => (
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
                status={selectedOrder.status === 'cancelled' ? 'error' : 'process'}
              >
                <Step title="Pending" icon={<ShoppingCartOutlined />} />
                <Step title="Processing" icon={<UserOutlined />} />
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
                      <span className="font-mono font-semibold">{selectedOrder.orderNumber}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Status">
                      <Tag color={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                        {selectedOrder.paymentStatus.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Customer Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Name">
                      {selectedOrder.customer}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedOrder.email}
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
                dataSource={selectedOrder.items}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Product',
                    dataIndex: 'image',
                    key: 'image',
                    render: (image: string, record: any) => (
                      <div className="flex items-center space-x-3">
                        <Image
                          width={50}
                          height={50}
                          src={image}
                          alt={record.name}
                          className="object-cover rounded"
                        />
                        <span className="font-medium">{record.name}</span>
                      </div>
                    ),
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `$${price}`,
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Subtotal',
                    key: 'subtotal',
                    render: (_, record: any) => `$${(record.price * record.quantity).toFixed(2)}`,
                  },
                ]}
              />
              <Divider />
              <div className="flex justify-end">
                <Statistic
                  title="Total Amount"
                  value={selectedOrder.total}
                  prefix="$"
                  precision={2}
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
                  onChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
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