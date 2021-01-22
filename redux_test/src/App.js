import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './action';
import React from 'react';
import InputMirror from './components/inputmirror';
import { Provider } from 'react-redux';
import store from './store';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <InputMirror />
      </div>
    </Provider>
  );
}

export default App;
