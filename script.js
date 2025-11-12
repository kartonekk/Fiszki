let cards = []
let currentIndex = 0
let animating = false

function showSection(section) {
  document.querySelectorAll('.container').forEach(c => c.classList.remove('active'))
  document.getElementById(section).classList.add('active')
  if (section === 'flashcards') renderCard()
}

document.getElementById('importCsv').addEventListener('change', e => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    const text = ev.target.result
    cards = text.trim().split('\n').map(line => {
      const [front = '', back = '', learned = 'false'] = line.split(',')
      return { front: front.trim(), back: back.trim(), learned: learned.trim() === 'true' }
    })
    currentIndex = 0
    renderCard()
    renderInputList()
  }
  reader.readAsText(file)
})

function renderCard(animation = '') {
  const container = document.getElementById('cardContainer')
  container.innerHTML = ''
  if (cards.length === 0) {
    container.innerHTML = '<p>No cards loaded.</p>'
    document.getElementById('learnedBtn').style.display = 'none'
    return
  }
  const card = cards[currentIndex]
  const wrapper = document.createElement('div')
  wrapper.className = 'card-wrapper'
  if (animation) wrapper.classList.add(animation)
  const inner = document.createElement('div')
  inner.className = 'card-inner'
  if (card.learned) inner.classList.add('learned')
  const faceFront = document.createElement('div')
  faceFront.className = 'card-face card-front'
  faceFront.textContent = card.front
  const faceBack = document.createElement('div')
  faceBack.className = 'card-face card-back'
  faceBack.textContent = card.back
  inner.addEventListener('click', () => inner.classList.toggle('flipped'))

  const speakBtn = document.createElement('button')
  speakBtn.textContent = '🔊'
  speakBtn.style.position = 'absolute'
  speakBtn.style.bottom = '10px'
  speakBtn.style.left = '50%'
  speakBtn.style.transform = 'translateX(-50%)'
  speakBtn.style.background = 'rgba(51,51,51,0.7)'
  speakBtn.style.border = 'none'
  speakBtn.style.color = '#e0e0e0'
  speakBtn.style.width = '35px'
  speakBtn.style.height = '35px'
  speakBtn.style.borderRadius = '6px'
  speakBtn.style.cursor = 'pointer'
  speakBtn.addEventListener('click', e => {
    e.stopPropagation()
    const frontLang = document.getElementById('frontLang').value
    const backLang = document.getElementById('backLang').value
    if (!inner.classList.contains('flipped')) speakText(card.front, frontLang)
    else speakText(card.back, backLang)
  })

  inner.appendChild(faceFront)
  inner.appendChild(faceBack)
  inner.appendChild(speakBtn) // append inside the card

  const prev = document.createElement('button')
  prev.className = 'arrow-btn'
  prev.id = 'prevBtn'
  prev.innerHTML = '←'
  prev.addEventListener('click', e => { e.stopPropagation(); prevCard() })

  const next = document.createElement('button')
  next.className = 'arrow-btn'
  next.id = 'nextBtn'
  next.innerHTML = '→'
  next.addEventListener('click', e => { e.stopPropagation(); nextCard() })

  wrapper.appendChild(prev)
  wrapper.appendChild(next)
  wrapper.appendChild(inner)
  container.appendChild(wrapper)

  const learnedBtn = document.getElementById('learnedBtn')
  learnedBtn.style.display = 'inline-block'
  if (card.learned) {
    learnedBtn.textContent = 'Unmark as Learned'
    learnedBtn.classList.add('unmark')
  } else {
    learnedBtn.textContent = 'Mark as Learned'
    learnedBtn.classList.remove('unmark')
  }

  wrapper.addEventListener('animationend', () => {
    wrapper.classList.remove('slide-in-right','slide-out-left','slide-in-left','slide-out-right')
  }, { once: true })
}

function animateCardChange(direction) {
  if (animating || cards.length === 0) return
  animating = true
  const container = document.getElementById('cardContainer')
  const wrapper = container.querySelector('.card-wrapper')
  if (!wrapper) { animating = false; return }
  const outAnim = direction === 'next' ? 'slide-out-left' : 'slide-out-right'
  const inAnim = direction === 'next' ? 'slide-in-right' : 'slide-in-left'
  wrapper.classList.add(outAnim)
  wrapper.addEventListener('animationend', function handler() {
    wrapper.removeEventListener('animationend', handler)
    if (direction === 'next') currentIndex = (currentIndex + 1) % cards.length
    else currentIndex = (currentIndex - 1 + cards.length) % cards.length
    renderCard(inAnim)
    const newWrapper = document.getElementById('cardContainer').querySelector('.card-wrapper')
    if (!newWrapper) { animating = false; return }
    newWrapper.addEventListener('animationend', function onInEnd() {
      newWrapper.removeEventListener('animationend', onInEnd)
      animating = false
    }, { once: true })
  }, { once: true })
}

function nextCard() { animateCardChange('next') }
function prevCard() { animateCardChange('prev') }

function toggleLearned() {
  if (cards.length === 0) return
  cards[currentIndex].learned = !cards[currentIndex].learned
  renderCard()
  renderInputList()
}

function addCard() {
  const front = document.getElementById('frontInput').value.trim()
  const back = document.getElementById('backInput').value.trim()
  if (!front || !back) return
  cards.push({ front, back, learned: false })
  document.getElementById('frontInput').value = ''
  document.getElementById('backInput').value = ''
  renderInputList()
  renderCard()
}

function renderInputList() {
  const ul = document.getElementById('cardList')
  ul.innerHTML = ''
  cards.forEach((c, i) => {
    const li = document.createElement('li')
    li.textContent = `${c.front} → ${c.back}`
    li.addEventListener('click', () => {
      cards.splice(i,1)
      if (currentIndex >= cards.length) currentIndex = Math.max(0, cards.length - 1)
      renderInputList()
      renderCard()
    })
    ul.appendChild(li)
  })
}

function exportCsv() {
  if (cards.length === 0) return
  const csvContent = cards.map(c => `${c.front},${c.back},${c.learned}`).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cards.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function speakText(text, lang = 'en-US') {
  if (!window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  window.speechSynthesis.speak(utterance)
}

renderCard()
renderInputList()
