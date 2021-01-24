import React from 'react';
import { connect } from 'react-redux'


class MainPlayer extends React.Component {

  render() {
    return (
      <video width="100%"  controls>
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4"/>
      Your browser does not support the video tag.
      </video>
    );
  }
}


export default connect(null, {})(MainPlayer)
