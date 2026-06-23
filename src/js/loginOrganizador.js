document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm({
        endpoint: '../php/loginOrganizador.php',
        redirectTo: 'organizador.html',
        loadingText: 'Entrando...',
        successText: 'Login realizado. Abrindo o painel...'
    });
});

function setupLoginForm({ endpoint, redirectTo, loadingText, successText }) {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const feedback = document.getElementById('authFeedback');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const defaultSubmitText = submitButton ? submitButton.textContent.trim() : '';
    const fields = Array.from(loginForm.querySelectorAll('input, select, textarea')).filter((field) => {
        const blockedTypes = ['submit', 'button', 'reset', 'hidden', 'file'];
        return !field.disabled && !blockedTypes.includes((field.type || '').toLowerCase());
    });

    function getErrorElement(field) {
        let errorEl = field.nextElementSibling;
        if (!errorEl || !errorEl.classList || !errorEl.classList.contains('js-field-error')) {
            errorEl = document.createElement('small');
            errorEl.className = 'js-field-error';
            errorEl.style.display = 'none';
            field.insertAdjacentElement('afterend', errorEl);
        }
        return errorEl;
    }

    function getFieldError(field) {
        const value = (field.value || '').trim();
        const type = (field.type || '').toLowerCase();

        if (field.hasAttribute('required') && !value) return 'Este campo é obrigatório.';
        if (!value) return '';
        if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Informe um e-mail válido.';
        if (field.validity?.typeMismatch) return 'Formato inválido.';

        return '';
    }

    function setFieldError(field, message) {
        const errorEl = getErrorElement(field);
        if (message) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            field.style.borderColor = '#ff6b6b';
            field.style.boxShadow = '0 0 0 2px rgba(255, 107, 107, 0.15)';
            field.setAttribute('aria-invalid', 'true');
            return false;
        }

        errorEl.textContent = '';
        errorEl.style.display = 'none';
        field.style.borderColor = '';
        field.style.boxShadow = '';
        field.removeAttribute('aria-invalid');
        return true;
    }

    function showFeedback(message, type = 'error') {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.className = `auth-feedback auth-feedback--${type} is-visible`;
    }

    function clearFeedback() {
        if (!feedback) return;
        feedback.textContent = '';
        feedback.className = 'auth-feedback';
    }

    function setLoading(isLoading) {
        if (!submitButton) return;
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? loadingText : defaultSubmitText;
    }

    function validateForm() {
        let firstInvalidField = null;
        fields.forEach((field) => {
            const isValid = setFieldError(field, getFieldError(field));
            if (!isValid && !firstInvalidField) firstInvalidField = field;
        });

        if (firstInvalidField) {
            firstInvalidField.focus();
            return false;
        }

        return true;
    }

    fields.forEach((field) => {
        field.addEventListener('input', () => {
            setFieldError(field, getFieldError(field));
            clearFeedback();
        });
        field.addEventListener('change', () => setFieldError(field, getFieldError(field)));
    });

    loginForm.noValidate = true;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFeedback();

        if (!validateForm()) {
            showFeedback('Revise os campos destacados para continuar.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: new FormData(loginForm)
            });

            const result = (await response.text()).trim();

            if (result === 'sucesso') {
                showFeedback(successText, 'success');
                window.setTimeout(() => {
                    window.location.href = redirectTo;
                }, 450);
                return;
            }

            showFeedback(result || 'Não foi possível entrar. Confira seus dados e tente novamente.');
        } catch (error) {
            console.error('Erro na requisição:', error);
            showFeedback('Erro ao conectar com o servidor. Verifique se o XAMPP está ligado.');
        } finally {
            setLoading(false);
        }
    });
}
