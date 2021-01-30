import React from 'react';
import Chip from '@material-ui/core/Chip';
import Avatar from '@material-ui/core/Avatar';
import '../css/statechannels.css';


function AllocationItem({destination, amount}) {
  const shortname = '0x' + destination.substring(26,32);
  return (
      <Chip
        avatar={<Avatar>{destination.substring(26,27).toUpperCase()}</Avatar>}
        label={`${shortname} : ${Math.round(amount/1000000000)}gwei`}
        color="primary"
        variant="outlined"
        size="small"
      />
  );
}


function StateChannel({ channelId, allocationItems, amountDeposited, channelStatus }) {
  return (
    <div className="statechannel">
      <span className="channelid">{channelId.substring(0,8)}</span>
      <span>{channelStatus} </span>
      <span>{Math.round(amountDeposited/1000000000)} gwei</span>
      <span className='allocations'>
      {allocationItems && allocationItems.map(({destination, amount}) =>
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
    {(statechannels && Object.entries(statechannels).map(([channelId, statechannel]) => 
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

