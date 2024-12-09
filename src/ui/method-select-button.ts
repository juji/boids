

export function methodSelectButton(
  method?: string, num?: number, 
  webgpu?: boolean, webgl?: boolean
){

  const buttons = document.querySelectorAll('.method-select a')
  buttons.forEach((button) => {

    
    const a = button as HTMLAnchorElement
    const met = a.dataset.method
    
    if(met === 'webgpu' && !webgpu){
      button.remove()
      return;
    }

    if(met === 'webgl' && !webgl){
      button.remove()
      return;
    }

    if(met === 'webgl-worker' && !webgl){
      button.remove()
      return;
    }

    a.href = `/?method=${met}&num=${num||''}`

    if(method === met){
      a.classList.add('active')
    }

  })

  

}