/*
    Search Bar (top bar)
    for user to search videos with magnet link, upload video?
*/

import React from 'react';
import { connect } from 'react-redux';
import { magnet_search } from '../redux/actions';
import { Button, Typography, Input, Space, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
const { Title } = Typography;
const { Search } = Input;

function MagnetSearch(props) {
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
                    <Button><UploadOutlined />Video Upload</Button>
                </Upload>
            </Space>
        </div>
    )
}

/*no use currently
const onSearch = value => {
    console.log(value);
    
}*/

const mapStateToProps = (state) => {
    return {
        magnet_link: state.video.magnet_link
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        // Search video with input magnet link when user clicked search button
        inputChanged: value => {
            dispatch(magnet_search(value));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MagnetSearch);