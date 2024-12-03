

export function numBoidsSelectButton(method?: string, num?: number){

  const defaultNum = 3000
  const buttons = document.querySelectorAll('.num-boids-link a')
  buttons.forEach((button) => {

    const a = button as HTMLAnchorElement
    const number = a.dataset.num ? Number(a.dataset.num) : 0
    a.href = `?method=${method||''}&num=${number||''}`

    if(
      number === num ||
      (!num && number === defaultNum)
    ){
      a.classList.add('active')
    }

  })

  

}