// code for sliders that show multiple slides at a time 
class SmoothSlider extends HTMLElement {
    constructor() {
        super();
        this.slideContainer = this.querySelector('.slider__container');
        this.slider = this.querySelector('.slides');
        this.slides = this.querySelectorAll('.slide');
        this.forward = this.querySelector('.forward');
        this.back = this.querySelector('.backward');
        this.index = 1;

        this.slideWidth = this.slides[this.index].clientWidth;
        this.slider.style.transform = `translateX(${-this.slideWidth * this.index}px)`;

        // Event listeners for navigation buttons
        this.forward.addEventListener("pointerdown", this.moveToNextSlide.bind(this));
        this.back.addEventListener("pointerdown", this.moveToPreviousSlide.bind(this));
    }

    moveToNextSlide() {
        if (this.index >= this.slides.length - 1) return;
        this.index++;
        this.slider.style.transform = `translateX(${-this.slideWidth * this.index}px)`;
        this.slider.style.transition = '.6s ease';
    }

    moveToPreviousSlide() {
        if (this.index <= 0) return;
        this.index--;
        this.slider.style.transform = `translateX(${-this.slideWidth * this.index}px)`;
        this.slider.style.transition = '.6s ease';
    }
}
customElements.define("smooth-slider", SmoothSlider);