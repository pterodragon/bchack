export declare type PromptInputSpec = {type: 'number' | 'checkbox' | 'select', value:any, text: string}

export function promptUser(text: string, inputs:PromptInputSpec[], result:(responds: boolean, inputs: any[])=>void){
  const diag = document.getElementById("Dialog");
  if(diag){
    diag.getElementsByClassName("description")[0].innerHTML = text;
    const controls = diag.getElementsByClassName("controls");
    if(controls[0]){
      controls[0].innerHTML = inputs.reduce((acc, input, index)=>{
        let html="";
        switch(input.type){
          case 'number':
            html = `${input.text}: <input type='number' ${input.value? "value='"+input.value : ''} class='control'></input><br/>`;
            break;
          case 'checkbox':
            html = `<input type='checkbox' checked=${input.value? `true`:`false`} class='control' value='check${index}'></input>`;
            html += `<label for='check${index}'>${input.text}</label><br/>`;
            break;
          case 'select':
            html = `${input.text}: <select class='control'>`
            if(Array.isArray(input.value)){
              html+= input.value.reduce((acc, val)=>acc+=`<option>${val}</option>`, "");
            }
            html += "</select><br/>"
            break;
        }
        acc += html;
        return acc;
      }, "");

      const getElementValue = (elem: Element)=>{
        if(elem instanceof HTMLInputElement){
          switch(elem.type){
            case 'checkbox':
              console.log(`GetElementValue: ${elem} = ${elem.checked}`);
              return elem.checked;
            default:
              console.log(`GetElementValue: ${elem} = ${elem.value}`);
              return elem.value;
          }
        }else if(elem instanceof HTMLSelectElement){
          console.log(`GetElementValue: ${elem} = ${elem.value}`);
          return elem.value;
        }
        console.log(`Unknown type for ${elem}`)
      }
      
      let confirm = document.createElement('div');
      let btn = document.createElement('button');
      btn.textContent = "YES";
      btn.addEventListener('click', ()=>{
        const inputs = controls[0].getElementsByClassName('control');
        console.log(inputs)
        const inputValues = Array.from({length: inputs.length}, (v, i)=>getElementValue(inputs[i]));
        result(true, inputValues);
        diag.hidden = true;
      })
      confirm.appendChild(btn)
      btn = document.createElement('button')
      btn.textContent="NO";
      btn.addEventListener('click', ()=>{
        const inputs = controls[0].getElementsByClassName('control');
        const inputValues = Array.from({length: inputs.length}, (v, i)=>getElementValue(inputs[i]));
        result(false, inputValues);
        diag.hidden = true;
      })
      confirm.appendChild(btn);
      controls[0].appendChild(confirm);

    }

    diag.hidden = false;
  }else{
    
  }
}