import React, { Component } from "react";

import { Layout, Menu } from 'antd';
const { Header, Footer, Sider } = Layout;

import StateChannelsPanel from './containers/StateChannelsPanel';
import InformationPanel from './containers/InformationPanel';
import MagnetSearch from './containers/SearchBar';
import VideoPlayer from './components/VideoPlayer'; 
import 'antd/dist/antd.css';



export default function App() {
  return (
    <div className="App">
      <Layout>
        <Header className="header">
          <MagnetSearch />
        </Header>
        <Layout>
          <Layout style={{ margin: '30px 24px 24px 24px' }}>
            <VideoPlayer />
          </Layout>
          <Sider width={550} className="site-layout-background">
            <Menu mode="inline" style={{ height: '100%', borderRight: 0 }} >
              <InformationPanel/>
            </Menu>
          </Sider>
        </Layout>
        <Footer className="header" style={{ height: '300px' }}>
          <StateChannelsPanel />
        </Footer>
      </Layout>
    </div>
  );
}

