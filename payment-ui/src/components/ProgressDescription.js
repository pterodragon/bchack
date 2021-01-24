import React from 'react';
import { connect } from 'react-redux'
import { Grid } from '@material-ui/core';
import CircularProgressWithLabel from './CircularProgressWithLabel';


function Desc({text}) {
  return (
    <span style={{ fontWeight: 'bold'}}>
      {text}
    </span>
  )
}


class ProgressDescription extends React.Component {

  render() {
    return (
      <div style={{float: 'bottom'}}>
      <Grid container alignContent="center" spacing={5}>
        <Grid item lg={4} sm={12}>
          <Desc text="Downloading sintel.torrent from 7 peers" />
        </Grid>
        <Grid item lg={4} sm={12}>
          <Desc text=" 3 GB of 3.2 GB — A few seconds remaining.  " />
        </Grid>
        <Grid item lg={4} sm={12}>
          <Desc text="Deposited Holding: 100 wei Spent: 90 wei" />
        </Grid>
      </Grid>
      </div>
    );
  }
}

export default ProgressDescription;

