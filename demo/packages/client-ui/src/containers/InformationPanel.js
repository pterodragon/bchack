import InformationPanel from '../components/InformationPanel';
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  const { torrent, peers, client } = state;
  const { balance, address } = client;
  return { torrent, peers, balance, address };
}

const mapDispatchToProps = {
  // ... normally is an object full of action creators
}

export default connect(mapStateToProps, mapDispatchToProps)(InformationPanel);
