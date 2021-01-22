
export const input = evt => {
    return {
        type: 'INPUT_CHANGE',
        payload: evt.target.value
    }
}
