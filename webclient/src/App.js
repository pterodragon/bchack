import React, { Component } from "react";
import { Provider } from "react-redux";
import { Web3ReactProvider } from '@web3-react/core'
import { Grid } from '@material-ui/core';
import Portis from '@portis/web3';
import SearchAppBar from './components/SearchAppBar';
import MainPlayer from './components/MainPlayer';
import ProgressDataGrid from './components/ProgressDataGrid';
import ProgressDescription from './components/ProgressDescription';
import StateChannelsContainer from './containers/StateChannelsContainer';

import { config as configDotEnv }from 'dotenv';
configDotEnv();
const portis = new Portis(process.env.PORTIS_DAPP_ADDRESS, process.env.DAPP_NETWORK);

function getLibrary(provider, connector) {
    return new ethers.providers.Web3Provider(portis.provider);
  //return new Web3Provider(provider) // this will vary according to whether you use e.g. ethers or web3.js
}

import store from "./redux/store";

class App extends Component {
  componentDidMount() {
  }

  render() {
    return (
      <Provider store={store}>
      <Web3ReactProvider getLibrary={getLibrary}>
          <SearchAppBar/>
          <hr/>
          <Grid container alignContent="center" spacing={2}>
            <Grid item md={6} sm={12}><MainPlayer/></Grid>
            <Grid item md={6} sm={12}>
                <ProgressDataGrid/>
            </Grid>
            <Grid item md={12} sm={12}>
                <ProgressDescription/>
            </Grid>
            <Grid item md={12} sm={12}>
              <StateChannelsContainer />
            </Grid>
          </Grid>
      </Web3ReactProvider>
      </Provider>
    );
  }
}
export default App;
