import React from 'react';
import Chip from '@material-ui/core/Chip';
import Avatar from '@material-ui/core/Avatar';
import '../css/statechannels.css';


function AllocationItem({destination, amount}) {
  const shortname = destination.substring(2,8);
  return (
      <Chip
        avatar={<Avatar>{destination.substring(2,3).toUpperCase()}</Avatar>}
        label={`${shortname} : ${amount}wei`}
        color="primary"
        variant="outlined"
        size="small"
      />
  );
}


function StateChannel({ channelId, allocationItems, amountDeposited, channelStatus }) {
  return (
    <div className="statechannel">
      <span className="channelid">{channelId}</span>
      <span>{channelStatus} </span>
      <span>{amountDeposited} wei</span>
      <span className='allocations'>
      {allocationItems.map(({destination, amount}) =>
        (<AllocationItem key={destination} destination={destination} amount={amount} />)
      )}
      </span>
    </div>
  );
}


export default function StateChannelsPanel({statechannels}) {
  return (
    <div className='statechannels'>
    <div className='statechannel header'>
      <span>channelId</span>
      <span>status</span>
      <span>deposit</span>
      <span>allocations</span>
    </div>
    {(Object.entries(statechannels).map(([channelId, statechannel]) => 
      (<StateChannel 
        channelId={channelId} 
        key={channelId}
        {...statechannel}
      />)
    )
  )}
    </div>
  );
}

