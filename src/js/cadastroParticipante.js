document.addEventListener('DOMContentLoaded', () => {
    setupCadastroForm({
        endpoint: '../php/cadastroParticipante.php',
        redirectTo: 'loginParticipante.html',
        successText: 'Conta criada. Redirecionando para o login...',
        loadingText: 'Criando conta...'
    });
});

function setupCadastroForm({ endpoint, redirectTo, successText, loadingText }) {
    const ctaForm = document.getElementById('ctaForm');
    if (!ctaForm) return;

    const feedback = document.getElementById('authFeedback');
    const submitButton = ctaForm.querySelector('button[type="submit"]');
    const defaultSubmitText = submitButton ? submitButton.textContent.trim() : '';
    const fields = Array.from(ctaForm.querySelectorAll('input, select, textarea')).filter((field) => {
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
        const rawValue = field.value || '';
        const value = rawValue.trim();
        const fieldType = (field.type || '').toLowerCase();
        const fieldName = `${field.name || ''} ${field.id || ''}`.toLowerCase();

        if (field.hasAttribute('required') && !value) return 'Este campo é obrigatório.';
        if (!value) return '';

        if (fieldName.includes('cpf')) {
            const cpfDigits = rawValue.replace(/\D/g, '');
            if (cpfDigits.length !== 11) return 'Informe um CPF válido com 11 dígitos.';
        }

        if (fieldName.includes('cnpj')) {
            const cnpjDigits = rawValue.replace(/\D/g, '');
            if (cnpjDigits.length !== 14) return 'Informe um CNPJ válido com 14 dígitos.';
        }

        if (fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Informe um e-mail válido.';
        }

        if (field.validity) {
            if (field.validity.patternMismatch) return 'Formato inválido.';
            if (field.validity.tooShort) return `Mínimo de ${field.minLength} caracteres.`;
            if (field.validity.tooLong) return `Máximo de ${field.maxLength} caracteres.`;
            if (field.validity.rangeUnderflow) return `Valor mínimo: ${field.min}.`;
            if (field.validity.rangeOverflow) return `Valor máximo: ${field.max}.`;
            if (field.validity.stepMismatch) return 'Valor inválido para este campo.';
            if (field.validity.typeMismatch) return fieldType === 'email' ? 'Informe um e-mail válido.' : 'Formato inválido.';
            if (field.validity.badInput) return 'Valor inválido.';
        }

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

    function clearFieldErrors() {
        fields.forEach((field) => setFieldError(field, ''));
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

    function normalizeResponse(text) {
        try {
            return JSON.parse(text);
        } catch {
            const cleanText = text.trim();
            return {
                success: cleanText === 'sucesso',
                message: cleanText
            };
        }
    }

    fields.forEach((field) => {
        field.addEventListener('input', () => {
            setFieldError(field, getFieldError(field));
            clearFeedback();
        });
        field.addEventListener('change', () => setFieldError(field, getFieldError(field)));
    });

    ctaForm.noValidate = true;

    ctaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFeedback();

        if (!validateForm()) {
            showFeedback('Revise os campos destacados para continuar.');
            return;
        }

        clearFieldErrors();
        setLoading(true);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: new FormData(ctaForm)
            });

            const result = normalizeResponse(await response.text());

            if (result.success) {
                showFeedback(successText, 'success');
                ctaForm.reset();
                window.setTimeout(() => {
                    window.location.href = redirectTo;
                }, 700);
                return;
            }

            const errorMessage = result.message || 'Erro no cadastro. Tente novamente.';
            if (result.field) {
                const field = ctaForm.querySelector(`[name="${result.field}"]`);
                if (field) {
                    setFieldError(field, errorMessage);
                    field.focus();
                }
            }
            showFeedback(errorMessage);
        } catch (error) {
            console.error('Erro na requisição:', error);
            showFeedback('Erro ao conectar com o servidor. Verifique se o XAMPP está ligado.');
        } finally {
            setLoading(false);
        }
    });
}
