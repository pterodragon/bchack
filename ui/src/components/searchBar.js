/*
    Search Bar (top bar)
    for user to search videos with magnet link, upload video?
*/

import React from 'react';
import { connect } from 'react-redux';
import { magnet_search, close_pay, pay_method } from '../redux/actions';
import { Button, Typography, Input, Space, Upload, Radio, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
const { Title } = Typography;
const { Search } = Input;

function MagnetSearch(props, { dispatch }) {

    const onSearch = value => {
        console.log(value);
        //close model;
        //update payment method;
    }

    return (
        <div>
            <Space>
                <Title id="title" style={{ color: 'white', width: '300px' }} level={1}>WebTorrent</Title>
            </Space>
            <Space style={{ padding: 15 }}>
                <Search id="search" style={{ float: 'right', width: '700px' }} placeholder="Magnet Link" onSearch={props.inputChanged} enterButton />
            </Space>
            <Space>
                <Upload>
                    <Button><UploadOutlined />Video upload</Button>
                </Upload>
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

const mapStateToProps = (state) => {
    return {
        //magnet_link: state.video.magnet_link,
        confirmmodal: state.payment.confirmpaywindow,
        paymentmodal: state.payment.paymentwindow,
        paymethod: state.payment.method
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        // Search video with input magnet link when user clicked search button
        inputChanged: value => { dispatch(magnet_search(value)); },
        updatePayMethod: value => { dispatch(pay_method(value.target.value)); },
        modalInvisible: () => { dispatch(close_pay()); }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MagnetSearch);