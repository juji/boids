

export function infoButton(){

  const revealTimeout = 10000
  
  const button = document.querySelector('button.info-button')
  const content = document.querySelector('.info-content')

  let to: ReturnType<typeof setTimeout>
  button?.addEventListener('click', () => { 
    
    to && clearTimeout(to)
    button.classList.toggle('on')
    content?.classList.toggle('on')

    if(content?.classList.contains('on')) {
      to = setTimeout(() => {
        button.classList.remove('on')
        content?.classList.remove('on')
      }, revealTimeout)
    }
  })

}