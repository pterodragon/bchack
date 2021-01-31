/*
    Search Bar (top bar)
    for user to search videos with magnet link, upload video?
*/

import React from 'react';
import { Button, Typography, Input, Space, Radio, Modal } from 'antd';
const { Title } = Typography;
const { Search } = Input;

export default function MagnetSearch(props) {
    return (
        <div>
            <Space>
                <Title id="title" style={{ color: 'white', width: '300px' }} level={1}>WebTorrent</Title>
            </Space>
            <Space style={{ padding: 15 }}>
                <Search id="search" style={{ float: 'right', width: '700px' }} placeholder="Magnet Link" value={props.uri} onSearch={props.inputChanged} enterButton />
            </Space>
            <Modal title="Pay for the video?" visible={props.confirmmodal} onOk={props.modalInvisible} onCancel={props.modalInvisible}></Modal>
            <Modal title="Please pay or watch an ad to play the video:" visible={props.paymentmodal} onOk={props.modalInvisible} onCancel={props.modalInvisible}>
                <Radio.Group>
                    <Radio value='eth' onChange={props.updatePayMethod}>Pay by ETH</Radio>
                    <Radio value='ads' onChange={props.updatePayMethod}>Watch Ads</Radio>
                </Radio.Group>
            </Modal>
        </div>
    )
}

