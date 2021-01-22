import React from 'react';
import {connect} from 'react-redux';
import {input} from '../action';

function InputMirror(props) {
    return (
        <div>
            <input value={props.inputValue} onChange={props.inputChanged}/>
            <p>{props.inputValue}</p>
        </div>
    )
}

const mapStateToProps = (state) => {
    return {
        inputValue: state.input.inputValue
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        inputChanged: (evt) => {
            console.log('changed', evt.target.value);
            //const action = {type:'INPUT_CHANGE', payload:evt.target.value};
            dispatch(input(evt));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(InputMirror);
