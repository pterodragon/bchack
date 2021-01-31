import { connect } from "react-redux";
import actions from "../redux/actions/statechanenls";
import StateChannelsPanel from "../components/StateChannelsPannel.js"


const mapStateToProps = (state) => {
  return state.statechannels;
};


const mapDispatchToProps = {
  // ... normally is an object full of action creators
}

// `connect` returns a new function that accepts the component to wrap:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StateChannelsPanel);
