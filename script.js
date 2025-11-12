let cards = [];
let currentIndex = 0;
let animating = false;

function showSection(section) {
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    if (section === 'flashcards') renderCard();
}

document.getElementById('importCsv').addEventListener('change', function(e){
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e){
        const text = e.target.result;
        cards = text.trim().split('\n').map(line => {
            const [front, back, learned] = line.split(',');
            return { front, back, learned: learned === 'true' };
        });
        currentIndex = 0;
        renderCard();
    };
    reader.readAsText(file);
});

function renderCard(animation = '') {
    const container = document.getElementById('cardContainer');
    container.innerHTML = '';

    if (cards.length === 0) {
        container.innerHTML = '<p>No cards loaded.</p>';
        document.getElementById('learnedBtn').style.display = 'none';
        return;
    }

    const card = cards[currentIndex];
    const div = document.createElement('div');
    div.className = 'card' + (card.learned ? ' learned' : '');
    if (animation) div.classList.add(animation);

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.textContent = card.front;

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    back.textContent = card.back;

    div.addEventListener('click', () => {
        div.classList.toggle('flipped');
    });

    div.appendChild(front);
    div.appendChild(back);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'arrow-btn';
    prevBtn.id = 'prevBtn';
    prevBtn.innerHTML = '←';
    prevBtn.addEventListener('click', e => { e.stopPropagation(); prevCard(); });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'arrow-btn';
    nextBtn.id = 'nextBtn';
    nextBtn.innerHTML = '→';
    nextBtn.addEventListener('click', e => { e.stopPropagation(); nextCard(); });

    div.appendChild(prevBtn);
    div.appendChild(nextBtn);

    container.appendChild(div);

    const learnedBtn = document.getElementById('learnedBtn');
    learnedBtn.style.display = 'inline-block';
    if (card.learned) {
        learnedBtn.textContent = 'Unmark as Learned';
        learnedBtn.classList.add('unmark');
    } else {
        learnedBtn.textContent = 'Mark as Learned';
        learnedBtn.classList.remove('unmark');
    }
}

function animateCardChange(direction) {
    if (animating) return;
    animating = true;
    const container = document.getElementById('cardContainer');
    const oldCard = container.querySelector('.card');
    if (!oldCard) { animating = false; return; }

    let outAnim = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    let inAnim = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    oldCard.classList.add(outAnim);

    setTimeout(() => {
        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % cards.length;
        } else {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        }
        renderCard(inAnim);
        animating = false;
    }, 400);
}

function nextCard() {
    if (cards.length === 0) return;
    animateCardChange('next');
}

function prevCard() {
    if (cards.length === 0) return;
    animateCardChange('prev');
}

function toggleLearned() {
    if (cards.length === 0) return;
    const card = cards[currentIndex];
    card.learned = !card.learned;
    renderCard();
}

function addCard() {
    const front = document.getElementById('frontInput').value.trim();
    const back = document.getElementById('backInput').value.trim();
    if (!front || !back) return;
    cards.push({ front, back, learned: false });
    renderInputList();
    document.getElementById('frontInput').value = '';
    document.getElementById('backInput').value = '';
}

function renderInputList() {
    const ul = document.getElementById('cardList');
    ul.innerHTML = '';
    cards.forEach((c, i) => {
        const li = document.createElement('li');
        li.textContent = `${c.front} → ${c.back}`;
        li.onclick = () => {
            cards.splice(i, 1);
            renderInputList();
        };
        ul.appendChild(li);
    });
}

function exportCsv() {
    if (cards.length === 0) return;
    const csvContent = cards.map(c => `${c.front},${c.back},${c.learned}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards.csv';
    a.click();
    URL.revokeObjectURL(url);
}
