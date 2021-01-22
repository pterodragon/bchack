/*
    Video Description (right sider)
    showing information of the playing video
*/

import { connect } from 'react-redux';
import { Space, Descriptions } from 'antd';

function VideoDescription(props) {
    return (
        <div>
            <Space style={{ padding: 30 }}>
                <Descriptions title="Video Info" column={1} bordered>
                    <Descriptions.Item label="IP">{props.IP}</Descriptions.Item>
                    <Descriptions.Item label="Download from">{props.peer} peers</Descriptions.Item>
                    <Descriptions.Item label="Seeder">{props.seeder}</Descriptions.Item>
                    <Descriptions.Item label="State Channel ID"><a href="/">{props.statechannelid}</a></Descriptions.Item>
                </Descriptions>
            </Space>
        </div>
    )
}

const mapStateToProps = (state) => {
    return {
        IP: state.video.address,
        peer: state.video.peer,
        seeder: state.video.seeder,
        statechannelid: state.video.statechannelid,
    }
}

export default connect(mapStateToProps)(VideoDescription);