

export function methodSelectButton(method?: string, num?: number, webgpu?: boolean){

  const buttons = document.querySelectorAll('.method-select a')
  buttons.forEach((button) => {

    
    const a = button as HTMLAnchorElement
    const met = a.dataset.method
    
    if(!webgpu && met === 'webgpu'){
      button.remove()
      return;
    }

    a.href = `/?method=${met}&num=${num||''}`

    if(method === met){
      a.classList.add('active')
    }

  })

  

}