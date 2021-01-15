import Vidcontent from './content';
import './App.css';
import history from './history';

import { Button, Layout, Menu, Breadcrumb, Typography, Input, Avatar, Space } from 'antd';
import { UserOutlined, LaptopOutlined, NotificationOutlined } from '@ant-design/icons';

const { SubMenu } = Menu;
const { Title } = Typography;
const { Search } = Input;
const { Header, Content, Sider } = Layout;

function App() {
  return (
    <div className="App">
      <Button type="primary">Button</Button>
    </div>
  );
}

const onSearch = value => console.log(value);

function App2() {
  return (
    <div className="App">
      <Layout>
        <Header className="header">
          <Space>
            <Title id="title" level={2} onClick={() => history.push('/')}>Hackathon</Title>
          </Space>
          <Space style={{float:'right', padding:15}}>
            <Search id="search" placeholder="Search" onSearch={onSearch} enterButton />
          </Space>
        </Header>
        <Layout>
          <Sider width={200} className="site-layout-background">
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <SubMenu key="sub1" icon={<LaptopOutlined />} title="Videos">
                <Menu.Item key="1">Home</Menu.Item>
                <Menu.Item key="2">Trending</Menu.Item>
                <Menu.Item key="3">Recent</Menu.Item>
                <Menu.Item key="4">Watched</Menu.Item>
              </SubMenu>
              <SubMenu key="sub2" icon={<UserOutlined />} title="Account">
                <Menu.Item key="5">Details</Menu.Item>
                <Menu.Item key="6">Payment</Menu.Item>
                <Menu.Item key="7">Settings</Menu.Item>
              </SubMenu>
              <Space style={{padding:30}}>
                <Button type="primary" style={{width:'100px'}} onClick={() => history.push('/Login')}>Login</Button>
              </Space>
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 24px 24px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>Videos</Breadcrumb.Item>
              <Breadcrumb.Item></Breadcrumb.Item>
              <Breadcrumb.Item></Breadcrumb.Item>
            </Breadcrumb>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              <Vidcontent />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </div>
  );
}

export default App2;
