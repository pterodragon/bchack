/*
    Video Player (middle content)
    play video with below requirements:
    1. found video with input magnet link
    2. paid / view ad
*/

import { Button, Layout, Menu, Typography, Input, Space } from 'antd';
const { Header, Content, Sider } = Layout;

function VideoPlayer() {
    return (
        <div>
            <Content
                className="site-layout-background" style={{ padding: 24, margin: 0, minHeight: 280, }}>
                <div className="video">
                    <iframe width="420" height="315" src="https://www.youtube.com/embed/tgbNymZ7vqY"></iframe>
                    <div class="log"></div>
                </div>
            </Content>
        </div>
    )
}

export default VideoPlayer;