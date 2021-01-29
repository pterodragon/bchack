import { connect } from "react-redux";
import actions from "../redux/actions/webtorrennt";
import WebtorrentGrid from "../components/WebtorrentGrid.js"


const mapStateToProps = (state, ownProps) => ({
  // ... computed data from state and optionally ownProps
  webtorrent: state
});


const mapDispatchToProps = {
  // ... normally is an object full of action creators
}

// `connect` returns a new function that accepts the component to wrap:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WebtorrentGrid);
