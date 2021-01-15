import React, { Component } from "react";
import { Provider } from "react-redux";
import store from "./redux/store";
import { Paper, Grid } from '@material-ui/core';
import SearchAppBar from './components/SearchAppBar';
import MainPlayer from './components/MainPlayer';
import ProgressDataGrid from './components/ProgressDataGrid';
import ProgressDescription from './components/ProgressDescription';



class App extends Component {
  componentDidMount() {
  }
  render() {
    return (
      <Provider store={store}>
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
              <div width="100%">State Channels</div>
            </Grid>
          </Grid>
      </Provider>
    );
  }
}
export default App;
