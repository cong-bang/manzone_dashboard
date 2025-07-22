import React from 'react';
import { Row, Col, Card, Typography, Timeline } from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  ShoppingOutlined,
  TagsOutlined,
  OrderedListOutlined,
  MessageOutlined,
  TeamOutlined,
  SettingOutlined,
  MobileOutlined,
  RocketOutlined,
  LineChartOutlined,
  LockOutlined,
  TrophyOutlined,
  BulbOutlined,
  SecurityScanOutlined,
  CustomerServiceOutlined,
  CloudOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const features = [
  {
    icon: <UserOutlined />,
    title: 'Quản lý Người dùng',
    description: 'Theo dõi và quản lý người dùng, phân quyền và xem số liệu thống kê chi tiết.',
    color: '#1890ff'
  },
  {
    icon: <ShoppingOutlined />,
    title: 'Quản lý Sản phẩm',
    description: 'Thêm, sửa, xóa và quản lý kho hàng cho tất cả phụ kiện thời trang nam.',
    color: '#52c41a'
  },
  {
    icon: <TagsOutlined />,
    title: 'Quản lý Danh mục',
    description: 'Tổ chức sản phẩm theo danh mục, dễ dàng phân loại và tìm kiếm.',
    color: '#722ed1'
  },
  {
    icon: <OrderedListOutlined />,
    title: 'Quản lý Đơn hàng',
    description: 'Xử lý đơn hàng, cập nhật trạng thái và theo dõi doanh số bán hàng.',
    color: '#fa8c16'
  },
  {
    icon: <MessageOutlined />,
    title: 'Hệ thống Chat',
    description: 'Hỗ trợ khách hàng trực tiếp thông qua hệ thống chat tích hợp.',
    color: '#f5222d'
  },
  {
    icon: <LineChartOutlined />,
    title: 'Thống kê & Báo cáo',
    description: 'Xem báo cáo chi tiết về doanh số, người dùng và hiệu suất cửa hàng.',
    color: '#13c2c2'
  }
];

const userTypes = [
  {
    icon: <SettingOutlined />,
    title: 'Quản trị viên',
    description: 'Quyền truy cập đầy đủ vào tất cả chức năng của hệ thống quản lý.',
    color: '#2f54eb'
  },
  {
    icon: <TeamOutlined />,
    title: 'Nhân viên',
    description: 'Quyền truy cập hạn chế để quản lý đơn hàng và hỗ trợ khách hàng.',
    color: '#1890ff'
  }
];

const benefitItems = [
  {
    icon: <RocketOutlined />,
    title: 'Hiệu quả cao',
    description: 'Tối ưu hóa quy trình làm việc và quản lý dễ dàng.',
    color: '#1890ff'
  },
  {
    icon: <MobileOutlined />,
    title: 'Thiết kế hiện đại',
    description: 'Giao diện thân thiện với người dùng, tương thích với thiết bị di động.',
    color: '#52c41a'
  },
  {
    icon: <LockOutlined />,
    title: 'Bảo mật cao',
    description: 'Hệ thống xác thực và phân quyền người dùng an toàn.',
    color: '#f5222d'
  },
  {
    icon: <LineChartOutlined />,
    title: 'Phân tích dữ liệu',
    description: 'Theo dõi và phân tích dữ liệu bán hàng và người dùng.',
    color: '#722ed1'
  },
  {
    icon: <CustomerServiceOutlined />,
    title: 'Hỗ trợ khách hàng',
    description: 'Hệ thống chat tức thời và theo dõi phản hồi người dùng.',
    color: '#fa8c16'
  },
  {
    icon: <CloudOutlined />,
    title: 'Đám mây',
    description: 'Dữ liệu được lưu trữ an toàn trên đám mây, truy cập mọi lúc mọi nơi.',
    color: '#13c2c2'
  }
];

const Introduction: React.FC = () => {
  return (
    <div className="introduction-page">
      {/* Hero Section - Clean Modern Style */}
      <div className="relative mb-8 overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            backgroundSize: 'cover'
          }}
        ></div>
        <div className="relative p-12 text-white">
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} md={14}>
              <div className="mb-6">
                <Title level={1} className="text-white m-0 text-4xl md:text-5xl font-bold">
                  ManZone Dashboard
                </Title>
                <div className="h-1 w-24 bg-white my-4"></div>
              </div>
              <Title level={3} className="text-white font-normal opacity-90 m-0 mb-6">
                Hệ thống quản lý cho ứng dụng thương mại điện tử bán phụ kiện thời trang nam
              </Title>
              <Paragraph className="text-white text-lg mb-8 opacity-80 leading-relaxed">
                Nền tảng quản lý toàn diện giúp bạn vận hành hiệu quả cửa hàng phụ kiện thời trang nam trực tuyến. Thiết kế hiện đại, chuyên nghiệp với đầy đủ công cụ để quản lý mọi khía cạnh của doanh nghiệp của bạn.
              </Paragraph>
            </Col>
            <Col xs={24} md={10} className="text-center">
              <div className="relative">
                <div className="w-64 h-64 mx-auto rounded-full bg-white bg-opacity-10 flex items-center justify-center">
                  <ShopOutlined className="text-8xl text-white" />
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* About Section - Clean Modern Style */}
      <div className="mb-12">
        <Title level={2} className="text-center mb-2 text-3xl font-bold">
          Về hệ thống quản lý ManZone
        </Title>
        <div className="w-20 h-1 bg-blue-500 mx-auto mb-8"></div>
        <Paragraph className="text-lg text-center mb-10 max-w-4xl mx-auto text-gray-600">
          ManZone Dashboard là hệ thống quản lý chuyên nghiệp được thiết kế dành riêng cho ứng dụng thương mại điện tử bán phụ kiện thời trang nam. Hệ thống cung cấp đầy đủ công cụ cho quản trị viên và nhân viên để vận hành cửa hàng một cách hiệu quả và mang lại trải nghiệm tốt nhất cho khách hàng.
        </Paragraph>
        
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} md={8}>
            <Card className="h-full hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#1890ff' }}>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <BulbOutlined className="text-3xl text-blue-500" />
                </div>
              </div>
              <Title level={4} className="text-center mb-4">Hiện đại & Chuyên nghiệp</Title>
              <Paragraph className="text-center text-gray-600">
                Giao diện người dùng trực quan và công nghệ tiên tiến giúp quản lý dễ dàng và chuyên nghiệp.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#52c41a' }}>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <TrophyOutlined className="text-3xl text-green-500" />
                </div>
              </div>
              <Title level={4} className="text-center mb-4">Nâng cao hiệu suất</Title>
              <Paragraph className="text-center text-gray-600">
                Tự động hóa quy trình và báo cáo thời gian thực để tối ưu hóa hoạt động kinh doanh.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#13c2c2' }}>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 mb-4">
                  <SecurityScanOutlined className="text-3xl text-cyan-500" />
                </div>
              </div>
              <Title level={4} className="text-center mb-4">Đáng tin cậy & An toàn</Title>
              <Paragraph className="text-center text-gray-600">
                Bảo mật dữ liệu tốt và hệ thống ổn định cho hoạt động liên tục, an toàn.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Features Section - Modern Clean Design */}
      <div className="mb-12 bg-gray-50 py-10 px-4 rounded-lg">
        <Title level={2} className="text-center mb-2 text-3xl font-bold">
          Tính năng chính
        </Title>
        <div className="w-20 h-1 bg-blue-500 mx-auto mb-8"></div>
        
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card 
                className="h-full hover:shadow-lg transition-all duration-300 border-none"
              >
                <div className="flex items-start">
                  <div 
                    className="flex-shrink-0 mr-4 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${feature.color}15` }} // light background
                  >
                    <span style={{ color: feature.color }}>{feature.icon}</span>
                  </div>
                  <div>
                    <Title level={4} className="m-0 mb-3">
                      {feature.title}
                    </Title>
                    <Paragraph className="text-gray-600 mb-0">
                      {feature.description}
                    </Paragraph>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* User Roles Section - Simple Clean Design */}
      <div className="mb-12">
        <Title level={2} className="text-center mb-2 text-3xl font-bold">
          Phân quyền người dùng
        </Title>
        <div className="w-20 h-1 bg-blue-500 mx-auto mb-8"></div>
        <Paragraph className="text-lg text-center mb-10 max-w-3xl mx-auto text-gray-600">
          Hệ thống hỗ trợ nhiều vai trò người dùng với các quyền truy cập khác nhau,
          giúp phân quyền chính xác và bảo mật:
        </Paragraph>
        
        <Row gutter={[32, 32]} justify="center">
          {userTypes.map((item, index) => (
            <Col xs={24} sm={12} md={10} key={index}>
              <Card className="h-full shadow-md hover:shadow-lg transition-all duration-300">
                <div className="text-center mb-6">
                  <div 
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <span className="text-4xl" style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <Title level={3} className="text-gray-800">
                    {item.title}
                  </Title>
                </div>
                <Paragraph className="text-center text-gray-600 text-lg">
                  {item.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Benefits Section - Clean Grid */}
      <div className="mb-12 bg-gray-50 py-10 px-4 rounded-lg">
        <Title level={2} className="text-center mb-2 text-3xl font-bold">
          Lợi ích
        </Title>
        <div className="w-20 h-1 bg-blue-500 mx-auto mb-8"></div>
        
        <Row gutter={[24, 24]}>
          {benefitItems.map((item, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card 
                className="h-full border-none bg-white"
              >
                <div className="flex items-center mb-4">
                  <div 
                    className="flex-shrink-0 mr-4 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <span className="text-2xl" style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <Title level={4} className="m-0 text-gray-800">
                    {item.title}
                  </Title>
                </div>
                <Paragraph className="text-gray-600 pl-16">
                  {item.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Timeline Section - Clean Design */}
      <div className="mb-12">
        <Title level={2} className="text-center mb-2 text-3xl font-bold">
          Lộ trình phát triển
        </Title>
        <div className="w-20 h-1 bg-blue-500 mx-auto mb-12"></div>
        
        <Row justify="center">
          <Col xs={24} md={18} lg={16} xl={14}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <Title level={4} className="text-gray-800 mb-2">Phiên bản 1.0</Title>
                      <Paragraph className="mb-0 text-gray-600">
                        Ra mắt với các tính năng quản lý cơ bản: sản phẩm, đơn hàng, người dùng và danh mục.
                      </Paragraph>
                    </>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <Title level={4} className="text-gray-800 mb-2">Phiên bản 2.0</Title>
                      <Paragraph className="mb-0 text-gray-600">
                        Bổ sung hệ thống chat, thống kê nâng cao và cải thiện trải nghiệm người dùng.
                      </Paragraph>
                    </>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <>
                      <Title level={4} className="text-gray-800 mb-2">Phiên bản hiện tại</Title>
                      <Paragraph className="mb-0 text-gray-600">
                        Tối ưu hóa hiệu suất, giao diện hiện đại và tích hợp nhiều tính năng mới.
                      </Paragraph>
                    </>
                  )
                },
                {
                  color: 'cyan',
                  children: (
                    <>
                      <Title level={4} className="text-gray-800 mb-2">Tương lai</Title>
                      <Paragraph className="mb-0 text-gray-600">
                        Phát triển tính năng AI dự đoán xu hướng thời trang và hỗ trợ cá nhân hóa cho người dùng.
                      </Paragraph>
                    </>
                  )
                }
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* Call-to-action - Clean Style */}
      <div className="mb-2 rounded-lg overflow-hidden bg-blue-500 py-12 px-8 text-center">
        <Title level={2} className="text-white text-4xl font-bold mb-6">
          ManZone - Quản lý Hiệu quả
        </Title>
        <Paragraph className="text-white text-lg mb-0 max-w-2xl mx-auto opacity-90">
          Hệ thống quản lý chuyên nghiệp cho ứng dụng thương mại điện tử bán phụ kiện thời trang nam
        </Paragraph>
      </div>
    </div>
  );
};

export default Introduction;
