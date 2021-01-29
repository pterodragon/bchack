import React from 'react';
import { DataGrid } from '@material-ui/data-grid';

//fake data
const rows = [
  { id:1, ip:'12.1.2.2', addr:'0xe123cb', downloaded:'1 GB', uploaded:'265 MB',  paid:'50 wei', received:'25 wei', balance:'-25 wei' },
  { id:2, ip:'12.1.2.3', addr:'0xc7a1e5', downloaded:'2 GB', uploaded:'3 MB', paid:'70 wei', received:'5 wei', balance:'-65 wei' },
];

const columns  = [
  { field: 'ip', headerName: 'IP'},
  { field: 'addr', headerName: 'Wallet' },
  { field: 'downloaded', headerName: 'Downloaded', width: 120 },
  { field: 'uploaded', headerName: 'Uploaded', width: 120},
  { field: 'received', headerName: 'Received'},
  { field: 'paid', headerName: 'Paid'},
  { field: 'balance', headerName: 'Balance'},

];

export default class WebtorrentGrid extends React.Component {
  render() {
    return ( <DataGrid rows={rows} columns={columns} hideFooter />);
  }
}


