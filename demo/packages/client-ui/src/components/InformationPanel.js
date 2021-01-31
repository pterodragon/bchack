import React from 'react';
import { Space, Tabs } from 'antd';
import TorrentDescription from './TorrentDescription';
import WalletDescription from './WalletDescription';
import PeerDescription from './PeerDescription';

export default function InformationPanel({address, balance, torrent, peers}) {
  return (
    <div>
    <Space style={{ padding: 30 }}>
      <Tabs>
        <Tabs.TabPane tab="Wallet" key="1">
          <WalletDescription address={address} balance={balance}/>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Torrent" key="2">
          <TorrentDescription torrent={torrent}/>
        </Tabs.TabPane>
      </Tabs>
    </Space>
    </div>
  )
}

    /*
        <TabPane tab="Peer Info" key="peer">
          <PeerDescription peers={peers}/>
        </TabPane>
        */
