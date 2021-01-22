/*
    App.js
    making layout
*/

import MagnetSearch from './components/searchBar';
import Wallet from './components/wallet';
import VideoPlayer from './components/videoPlayer';
import VideoDescription from './components/videoDescription';

import { Layout, Menu } from 'antd';
const { Header, Sider } = Layout;

function App(props) {
  return (
    <div className="App">
      <Layout>
        <Header className="header">
          <MagnetSearch props={props}/>
        </Header>
        <Layout>
          <Sider width={300} className="site-layout-background">
            <Menu mode="inline" style={{ height: '100%', borderRight: 0 }} >
              <Wallet props={props}/>
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 24px 24px' }}>
            <VideoPlayer />
          </Layout>
          <Sider width={500} className="site-layout-background">
            <Menu mode="inline" style={{ height: '100%', borderRight: 0 }} >
              <VideoDescription />
            </Menu>
          </Sider>
        </Layout>
      </Layout>
    </div>
  );
}

export default App;
