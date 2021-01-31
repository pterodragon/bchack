import React from 'react';
import { Layout, Space, Descriptions } from 'antd';
const { Footer, Content } = Layout;
import LinearProgress from './LinearProgress';

export default function TorrentDescription({torrent}) {
  return (
      <div>
        <Layout>
          <Content style={{ padding: 10 }}>
              <Descriptions column={1} bordered>
              { Object.keys(torrent).filter(k=>k!=='ratio').map(k=>
                <Descriptions.Item key={k} label={k}>{torrent[k]}</Descriptions.Item>
              )}
              </Descriptions>
          </Content>
          <Footer>
            <LinearProgress value={Math.round((torrent.ratio||0) * 100)} />
          </Footer>
        </Layout>
      </div>
  )
}

