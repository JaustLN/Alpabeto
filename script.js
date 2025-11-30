// Get the hover popup and main content container
const popup = document.getElementById('letter-popup');
const mainContent = document.querySelector('.main-content');

// Add click and hover events to all letters
document.querySelectorAll(".letter").forEach(letter => {

    // Play audio on click
    letter.addEventListener("click", () => {
        // Bounce animation
        letter.classList.remove("bounce");
        void letter.offsetWidth; // force reflow to restart animation
        letter.classList.add("bounce");

        // Play the corresponding audio
        const soundName = letter.getAttribute("data-sound");
        const audio = document.getElementById(`audio-${soundName}`);
        if(audio){
            audio.currentTime = 0;
            audio.play().catch(err => console.log("Audio failed:", err));
        }
    });

    // Hover popup
    letter.addEventListener("mouseenter", () => {
        popup.textContent = letter.getAttribute("data-full");
        popup.style.top = `${mainContent.offsetTop + mainContent.offsetHeight / 2}px`;
        popup.style.left = `${mainContent.offsetLeft + mainContent.offsetWidth / 2}px`;
        popup.classList.add("show");
    });

    letter.addEventListener("mouseleave", () => {
        popup.classList.remove("show");
    });
});
