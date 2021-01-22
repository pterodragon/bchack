/*
    Wallet (left sider)
    - showing user informations: name, balance...
    - logout button
*/

import { connect } from 'react-redux';
import { Button, Space, Descriptions } from 'antd';

function Wallet(props) {
    return (
        <div>
            <Space style={{ padding: 30 }}>
                <Descriptions title="Wallet" column={1} bordered>
                    <Descriptions.Item label="Name">{props.Name}</Descriptions.Item>
                    <Descriptions.Item label="Balance">${props.Balance}</Descriptions.Item>
                </Descriptions>
            </Space><Space style={{ padding: 30 }}>
                <Button type="primary" style={{ width: '100px' }}>Log Out</Button>
            </Space>
        </div>
    )
}

const mapStateToProps = (state) => {
    return {
        Name: state.auth.name,
        Balance: state.auth.balance
    }
}

export default connect(mapStateToProps)(Wallet);