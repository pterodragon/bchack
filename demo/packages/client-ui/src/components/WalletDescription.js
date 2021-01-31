import React from 'react';
import { Space, Descriptions } from 'antd';

export default function WalletDescription({address, balance}) {
    return (
        <div>
            <Space style={{ padding: 10 }}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item key="address" label="address">{address}</Descriptions.Item>
                  <Descriptions.Item key="balance" label="balance">{balance}</Descriptions.Item>
                </Descriptions>
            </Space>
        </div>
    )
}

