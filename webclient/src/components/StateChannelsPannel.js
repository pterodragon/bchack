import React from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import DoneIcon from '@material-ui/icons/Done';
import Avatar from '@material-ui/core/Avatar';
import { BigNumber } from 'ethers';

function LinearProgressWithLabel({value, text}) {
  console.log(value)
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" value={value} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${text}%`}</Typography>
      </Box>
    </Box>
  );
}


function Participant({address}) {
  return (
      <Chip
        avatar={<Avatar>{address.substring(0,1).toUpperCase()}</Avatar>}
        label={address.substring(0,6)}
        color="primary"
        deleteIcon={<DoneIcon />}
        variant="outlined"
      />
  );
}

function RemainHolding({initial, remain}) {
  remain = BigNumber.from(remain);
  return (
    <LinearProgressWithLabel 
      value={Math.round(remain.mul(100).div(initial).toNumber())} 
      text={remain.toString() + ' wei'}
    />
  );
}

function StateChannel({ channelId, participants, deposited, remain }) {
  return (
    <div width="90%">
      <span><b>{channelId}</b></span>&nbsp;&nbsp;
      <span>
      {participants.map(address=>
        (<Participant key={address} address={address} />)
      )}
      </span>
      <span><RemainHolding initial={deposited} remain={remain}/></span>
    </div>
  );
}


export default function StateChannelsPanel({statechannels}) {
  return (
    Object.entries(statechannels).map(([channelId, {deposited,remain,participants}]) => 
      (<StateChannel 
        channelId={channelId} 
        deposited={deposited}
        remain={remain}
        participants={participants}
        key={channelId}
      />)
    )
  );
}

