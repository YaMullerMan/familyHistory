/**
 * MultiStepForm — generic multi-step form manager.
 *
 * Usage:
 *   const msf = new MultiStepForm({
 *     formEl:       document.getElementById('my-form'),
 *     backBtnId:    'fa-back-btn',   // optional, defaults shown
 *     nextBtnId:    'fa-next-btn',
 *     stepperId:    'fa-stepper',
 *     counterId:    'fa-step-counter',
 *     clickableSteps: false,          // true lets stepper items jump to a step
 *     steps: [
 *       {
 *         label:    'Basic info',
 *         validate: () => 'Error message' | undefined,
 *         collect:  () => ({ fieldA: val }),
 *       },
 *       ...
 *     ],
 *     onStepChange: (stepIndex, data) => {},
 *     onComplete:   async (data)      => {},
 *   });
 */
class MultiStepForm {

    constructor(options) {
        this.formEl      = options.formEl;
        this.stepDefs    = options.steps || [];
        this.onComplete  = options.onComplete   || (() => {});
        this.onStepChange = options.onStepChange || (() => {});

        this._current     = 0;
        this._data        = {};
        this._submitting  = false;
        this._submitLabel = options.submitLabel || 'Save';
        this._completed   = false;

        this._backBtn  = document.getElementById(options.backBtnId  || 'fa-back-btn');
        this._nextBtn  = document.getElementById(options.nextBtnId  || 'fa-next-btn');
        this._stepper  = document.getElementById(options.stepperId  || 'fa-stepper');
        this._counter  = document.getElementById(options.counterId  || 'fa-step-counter');
        this._panels   = [...this.formEl.querySelectorAll('[data-step]')];

        this._bindNav();
        if (options.clickableSteps) this._bindStepper();
        this._render();
    }

    // ------------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------------
    _bindNav() {
        this._backBtn?.addEventListener('click', () => this.back());
        this._nextBtn?.addEventListener('click', () => this.next());
    }

    _bindStepper() {
        if (!this._stepper) return;
        this._stepper.classList.add('fa-stepper--clickable');
        this._stepper.querySelectorAll('.fa-stepper__step').forEach((el, i) => {
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
            el.addEventListener('click', () => this.goTo(i));
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.goTo(i); }
            });
        });
    }

    // Jump straight to a step. Collects every step's current values; going
    // forward validates each step passed over and stops at the first problem.
    goTo(index) {
        if (this._submitting || this._completed) return;
        if (index === this._current || index < 0 || index >= this._panels.length) return;

        let target = index;
        if (index > this._current) {
            for (let i = this._current; i < index; i++) {
                const err = this.stepDefs[i]?.validate?.();
                if (err) {
                    target = i;
                    break;
                }
            }
        }

        this.stepDefs.forEach(def => {
            if (def?.collect) Object.assign(this._data, def.collect());
        });

        this._clearError();
        const changed = target !== this._current;
        this._current = target;
        this._render();
        if (changed) this.onStepChange(this._current, this._data);

        if (target !== index) {
            this._showError(this.stepDefs[target].validate());
        }
    }

    async next() {
        if (this._submitting) return;
        const def = this.stepDefs[this._current];

        if (def?.validate) {
            const err = def.validate();
            if (err) { this._showError(err); return; }
        }
        this._clearError();

        if (def?.collect) {
            Object.assign(this._data, def.collect());
        }

        if (this._current === this._panels.length - 1) {
            await this._submit();
        } else {
            this._current++;
            this._render();
            this.onStepChange(this._current, this._data);
        }
    }

    back() {
        if (this._current === 0) return;
        this._clearError();
        this._current--;
        this._render();
        this.onStepChange(this._current, this._data);
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    _render() {
        // Panels
        this._panels.forEach((p, i) => { p.hidden = i !== this._current; });

        // Stepper indicators
        if (this._stepper) {
            this._stepper.querySelectorAll('.fa-stepper__step').forEach((el, i) => {
                el.classList.toggle('fa-stepper__step--active', i === this._current);
                el.classList.toggle('fa-stepper__step--done',   i <  this._current);
            });
        }

        // Counter
        if (this._counter) {
            this._counter.textContent = `Step ${this._current + 1} of ${this._panels.length}`;
        }

        // Back button
        if (this._backBtn) {
            this._backBtn.hidden = this._current === 0;
        }

        // Next/submit button
        if (this._nextBtn) {
            const isLast = this._current === this._panels.length - 1;
            this._nextBtn.textContent = isLast ? this._submitLabel : 'Next';
            this._nextBtn.classList.toggle('fa-btn--lg', isLast);
        }
    }

    // ------------------------------------------------------------------
    // Submission
    // ------------------------------------------------------------------
    async _submit() {
        this._submitting = true;
        if (this._nextBtn) {
            this._nextBtn.disabled = true;
            this._nextBtn.textContent = 'Saving…';
        }
        try {
            await this.onComplete(this._data);
            this._completed = true;
        } catch (err) {
            this._showError(err.message || 'Something went wrong. Please try again.');
            if (this._nextBtn) {
                this._nextBtn.disabled = false;
                this._nextBtn.textContent = this._submitLabel;
            }
        } finally {
            this._submitting = false;
        }
    }

    // ------------------------------------------------------------------
    // Error display
    // ------------------------------------------------------------------
    _showError(msg) {
        let el = this.formEl.querySelector('.fa-step-error');
        if (!el) {
            el = document.createElement('div');
            el.className = 'fa-notice fa-notice--error fa-step-error';
            const nav = this.formEl.querySelector('.fa-form-nav');
            if (nav) nav.before(el);
            else this.formEl.appendChild(el);
        }
        el.textContent = msg;
        el.hidden = false;
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    _clearError() {
        const el = this.formEl.querySelector('.fa-step-error');
        if (el) el.hidden = true;
    }

    // ------------------------------------------------------------------
    // Public
    // ------------------------------------------------------------------
    getData() { return { ...this._data }; }

    setSubmitLabel(label) {
        if (this._nextBtn && this._current === this._panels.length - 1) {
            this._nextBtn.textContent = label;
        }
    }
}
