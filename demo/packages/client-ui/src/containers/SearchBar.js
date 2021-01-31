import { connect } from 'react-redux';
import { searchMagnet } from '../redux/actions/client';
import MagnetSearch from '../components/SearchBar';

const mapStateToProps = (state) => {
  return { uri: state.client.uri };
}

const mapDispatchToProps = (dispatch) => {
    return {
        // Search video with input magnet link when user clicked search button
        inputChanged: value => { dispatch(searchMagnet(value)); },
        //updatePayMethod: value => { dispatch(pay_method(value.target.value)); },
        //modalInvisible: () => { dispatch(close_pay()); }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MagnetSearch);
