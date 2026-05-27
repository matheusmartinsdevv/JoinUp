document.addEventListener('DOMContentLoaded', () => {
    const ctaForm = document.getElementById('ctaForm');

    function setupFormValidation(form) {
        const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter((field) => {
            const blockedTypes = ['submit', 'button', 'reset', 'hidden', 'file'];
            return !field.disabled && !blockedTypes.includes((field.type || '').toLowerCase());
        });

        function getErrorElement(field) {
            let errorEl = field.nextElementSibling;
            if (!errorEl || !errorEl.classList || !errorEl.classList.contains('js-field-error')) {
                errorEl = document.createElement('small');
                errorEl.className = 'js-field-error';
                errorEl.style.display = 'none';
                errorEl.style.color = '#ff6b6b';
                errorEl.style.fontSize = '0.75rem';
                errorEl.style.marginTop = '0.35rem';
                errorEl.style.lineHeight = '1.3';
                field.insertAdjacentElement('afterend', errorEl);
            }
            return errorEl;
        }

        function getFieldError(field) {
            const rawValue = field.value || '';
            const value = rawValue.trim();
            const fieldType = (field.type || '').toLowerCase();
            const fieldName = ((field.name || '') + ' ' + (field.id || '')).toLowerCase();

            if (field.hasAttribute('required') && !value) {
                return 'Este campo e obrigatorio.';
            }

            if (!value) {
                return '';
            }

            if (fieldName.includes('cpf')) {
                const cpfDigits = rawValue.replace(/\D/g, '');
                if (cpfDigits.length !== 11) {
                    return 'Informe um CPF valido com 11 digitos.';
                }
            }

            if (fieldName.includes('cnpj')) {
                const cnpjDigits = rawValue.replace(/\D/g, '');
                if (cnpjDigits.length !== 14) {
                    return 'Informe um CNPJ valido com 14 digitos.';
                }
            }

            if (fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Informe um e-mail valido.';
            }

            if (field.validity) {
                if (field.validity.patternMismatch) return 'Formato invalido.';
                if (field.validity.tooShort) return `Minimo de ${field.minLength} caracteres.`;
                if (field.validity.tooLong) return `Maximo de ${field.maxLength} caracteres.`;
                if (field.validity.rangeUnderflow) return `Valor minimo: ${field.min}.`;
                if (field.validity.rangeOverflow) return `Valor maximo: ${field.max}.`;
                if (field.validity.stepMismatch) return 'Valor invalido para este campo.';
                if (field.validity.typeMismatch) {
                    if (fieldType === 'email') return 'Informe um e-mail valido.';
                    return 'Formato invalido.';
                }
                if (field.validity.badInput) return 'Valor invalido.';
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

        function validateField(field) {
            const message = getFieldError(field);
            return setFieldError(field, message);
        }

        function validateForm() {
            let firstInvalidField = null;
            fields.forEach((field) => {
                const isValid = validateField(field);
                if (!isValid && !firstInvalidField) {
                    firstInvalidField = field;
                }
            });

            if (firstInvalidField) {
                firstInvalidField.focus();
                return false;
            }

            return true;
        }

        fields.forEach((field) => {
            field.addEventListener('input', () => validateField(field));
            field.addEventListener('change', () => validateField(field));
        });

        form.noValidate = true;

        return { validateForm, clearFieldErrors, setFieldError };
    }

    if (ctaForm) {
        const { validateForm, clearFieldErrors, setFieldError } = setupFormValidation(ctaForm);

        ctaForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão do HTML

            if (!validateForm()) {
                return;
            }

            clearFieldErrors();

            // pega os dados do forms
            const formData = new FormData(ctaForm);

            try {
                // envia para o PHP
                const response = await fetch('../php/cadastroParticipante.php', {
                    method: 'POST',
                    body: formData
                });

                const text = await response.text();
                let parsed;
                try {
                    parsed = JSON.parse(text);
                } catch {
                    parsed = { success: false, message: text };
                }

                if (parsed.success) {
                    window.location.href = 'loginParticipante.html';
                    return;
                }

                const errorMessage = parsed.message || 'Erro no cadastro. Tente novamente.';
                if (parsed.field) {
                    const field = ctaForm.querySelector(`[name="${parsed.field}"]`);
                    if (field) {
                        setFieldError(field, errorMessage);
                        field.focus();
                        return;
                    }
                }

                const firstField = ctaForm.querySelector('input');
                if (firstField) {
                    setFieldError(firstField, errorMessage);
                    firstField.focus();
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                const firstField = ctaForm.querySelector('input');
                if (firstField) {
                    setFieldError(firstField, 'Erro ao conectar com o servidor. Verifique se o XAMPP está ligado.');
                    firstField.focus();
                }
            }
        
        });
    }

});

    
    
