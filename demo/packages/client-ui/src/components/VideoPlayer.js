/*
    Video Player (middle content)
    play video with below requirements:
    1. found video with input magnet link
    2. paid / view ad
*/

import React from 'react';
import { Layout } from 'antd';
const { Content } = Layout;

function VideoPlayer({src}) {
    return (
        <div>
            <Content
                style={{ margin: 24, margin: 0, minHeight: 480, minWidth: 640}}>
                <div className="video">
                  <video id="MainVideoPlayer" width='100%' height='100%'/>
                </div>
            </Content>
        </div>
    )
}

export default VideoPlayer;
