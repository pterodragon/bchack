import store from "./redux/store";
import React, { Component } from "react";
import { Provider } from "react-redux";
import { Web3ReactProvider } from '@web3-react/core'
import StateChannelsContainer from './containers/StateChannelsContainer';

//for debug
global.store = store;

class App extends Component {
  constructor(props) {
    super(props);
    if (props.portis) {
      this.getLibrary = (provider, connector) => {
          return new ethers.providers.Web3Provider(props.portis.provider);
      }
    }
  }

  componentDidMount() {
  }

  render() {
    return this.getLibrary ? (
      <Provider store={store}>
      <Web3ReactProvider getLibrary={this.getLibrary}>
          <StateChannelsContainer />
      </Web3ReactProvider>
      </Provider>
    ) : (
      <Provider store={store}>
        <StateChannelsContainer />
      </Provider>
    );
  }
}
export default App;
