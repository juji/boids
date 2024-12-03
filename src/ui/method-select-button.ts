

export function methodSelectButton(method?: string, num?: number){

  const buttons = document.querySelectorAll('.method-select a')
  buttons.forEach((button) => {

    const a = button as HTMLAnchorElement
    const met = a.dataset.method
    a.href = `/?method=${met}&num=${num||''}`

    if(method === met){
      a.classList.add('active')
    }

  })

  

}