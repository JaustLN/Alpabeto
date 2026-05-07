/* Lightweight confetti system (no external libs) */
(function(){
    const canvas = document.getElementById('confetti-canvas') || (function(){
        const c = document.createElement('canvas');
        c.id = 'confetti-canvas';
        c.setAttribute('aria-hidden','true');
        c.style.position = 'fixed';
        c.style.left = '0';
        c.style.top = '0';
        c.style.width = '100%';
        c.style.height = '100%';
        c.style.pointerEvents = 'none';
        c.style.zIndex = '9999';
        document.body.appendChild(c);
        return c;
    })();

    const ctx = canvas.getContext('2d');
    function resize(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const colors = ['#FF6B8A','#FFD76B','#8EE6A4','#A98BFF','#7ED9F7','#FFB3BA','#FFD1F2','#C6FFD6'];
    const gravity = 0.35;
    function rand(min,max){ return Math.random()*(max-min)+min; }

    function spawnConfetti(x,y,amount=30){
        if(particles.length > 900) return; // avoid runaway
        for(let i=0;i<amount;i++){
            particles.push({
                x: x + rand(-12,12),
                y: y + rand(-12,12),
                vx: rand(-6,6),
                vy: rand(-11,-2),
                size: rand(6,14),
                rot: rand(0,Math.PI*2),
                vr: rand(-0.25,0.25),
                color: colors[Math.floor(rand(0,colors.length))],
                shape: Math.random() > 0.5 ? 'rect' : 'circle',
                life: 0,
                ttl: Math.floor(rand(60,140))
            });
        }
    }

    function update(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for(let i=particles.length-1;i>=0;i--){
            const p = particles[i];
            p.vy += gravity; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
            ctx.save();
            ctx.translate(p.x,p.y);
            if(p.shape === 'rect'){
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0,0,p.size/2,0,Math.PI*2);
                ctx.fill();
            }
            ctx.restore();
            if(p.life > p.ttl || p.y > canvas.height + 60) particles.splice(i,1);
        }
        requestAnimationFrame(update);
    }
    update();

    window.emitConfetti = spawnConfetti;
})();

// Note: audio pooling and forced global pause were removed to allow concurrent playback.

// Optional audio tracking (no forced single-audio pause)
window.currentlyPlayingAudio = window.currentlyPlayingAudio || null;
window.setCurrentlyPlaying = function(a){
    try{
        if(!a) return;
        // Do not forcibly pause other audio here — allow concurrent playback.
        window.currentlyPlayingAudio = a;
        const clear = () => { if(window.currentlyPlayingAudio === a) window.currentlyPlayingAudio = null; if(window.clearPlaying) window.clearPlaying(); };
        a.addEventListener('ended', clear, { once: true });
        a.addEventListener('pause', clear, { once: true });
    }catch(e){}
};

window.clearCurrentlyPlaying = function(){ try{ window.currentlyPlayingAudio = null; }catch(e){} };

// Audio visual helpers kept as no-ops to avoid errors in pages that call them.
window.setPlayingElement = function(/*el*/){};
window.clearPlaying = function(){};

// Existing page script: make robust if elements are missing
const popup = document.getElementById('letter-popup');
const mainContent = document.querySelector('.main-content');

// Add click and hover events to all letters (if present)
const letters = document.querySelectorAll('.letter');
if(letters && letters.length && popup && mainContent){
    letters.forEach(letter => {
        letter.addEventListener('click', () => {
            letter.classList.remove('bounce');
            void letter.offsetWidth;
            letter.classList.add('bounce');
            const soundName = letter.getAttribute('data-sound');
            const audio = document.getElementById(`audio-${soundName}`);
                if(audio){
                if(window.setPlayingElement) window.setPlayingElement(letter);
                audio.currentTime = 0;
                audio.play().catch(err => console.log('Audio failed:', err));
                if(window.setCurrentlyPlaying) window.setCurrentlyPlaying(audio);
                // clear visuals when audio ends or is paused
                const clear = () => { if(window.clearPlaying) window.clearPlaying(); };
                audio.addEventListener('ended', clear, { once: true });
                audio.addEventListener('pause', clear, { once: true });
            }
        });
        letter.addEventListener('mouseenter', () => {
            popup.textContent = letter.getAttribute('data-full');
            popup.style.top = `${mainContent.offsetTop + mainContent.offsetHeight / 2}px`;
            popup.style.left = `${mainContent.offsetLeft + mainContent.offsetWidth / 2}px`;
            popup.classList.add('show');
        });
        letter.addEventListener('mouseleave', () => { popup.classList.remove('show'); });
    });
}

// Add confetti hover for selection squares with continuous small bursts while hovered
try{
    const hoverEmitters = new WeakMap();
    document.querySelectorAll('.grid-container .square[data-confetti="true"]').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            if(hoverEmitters.has(el)) return;
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width/2;
            const y = rect.top + rect.height/2;
            if(window.emitConfetti) window.emitConfetti(x, y, 40);
            const id = setInterval(() => {
                const r = el.getBoundingClientRect();
                if(window.emitConfetti) window.emitConfetti(r.left + r.width/2, r.top + r.height/2, 8);
            }, 180);
            hoverEmitters.set(el, id);
        });
        el.addEventListener('mouseleave', () => {
            const id = hoverEmitters.get(el);
            if(id) { clearInterval(id); hoverEmitters.delete(el); }
        });
        // Larger burst on click
        el.addEventListener('click', (e) => {
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width/2;
            const y = rect.top + rect.height/2;
            if(window.emitConfetti) window.emitConfetti(x, y, 120);
        });
    });
}catch(err){ console.warn('Confetti listeners setup failed:', err); }
