/*
    Video Description (right sider)
    showing information of the playing video
*/

import React from 'react';
import { Space, Descriptions } from 'antd';

export default function PeerDescription(props) {
    return (
        <div>
            <Space style={{ padding: 30 }}>
                <Descriptions title="Peer Info" column={1} bordered>
                    <Descriptions.Item label="IP">{props.IP}</Descriptions.Item>
                    <Descriptions.Item label="Download from">{props.peer} peers</Descriptions.Item>
                    <Descriptions.Item label="Seeder">{props.seeder}</Descriptions.Item>
                    <Descriptions.Item label="State Channel ID"><a href="/">{props.statechannelid}</a></Descriptions.Item>
                </Descriptions>
            </Space>
        </div>
    )
}

