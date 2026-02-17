/**
 * Input validation for policy form fields
 */

const validationRules = {
  policyName: {
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Policy name is required';
      if (value.length > 64) return 'Policy name must be 64 characters or less';
      if (!/^[a-zA-Z0-9\-]+$/.test(value)) return 'Policy name can only contain alphanumeric characters and hyphens';
      return '';
    },
    hint: 'Use alphanumeric characters and hyphens (1-64 chars)'
  },
  policyDescription: {
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Policy description is required';
      if (value.length > 512) return `Description too long (${value.length}/512 chars)`;
      return '';
    },
    hint: 'Maximum 512 characters'
  },
  scopeId: {
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Scope ID is required';
      if (!value.startsWith('/')) return 'Scope ID must start with /';
      if (!/^\/subscriptions\/|^\/providers\/Microsoft\.Management\/managementGroups\/|^\/subscriptions\/[^\/]+\/resourceGroups\//.test(value)) {
        return 'Invalid scope ID format. Use subscription, management group, or resource group path';
      }
      return '';
    },
    hint: 'Full resource ID of the scope'
  },
  location: {
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Deployment location is required';
      if (!/^[a-z0-9]+$/.test(value)) return 'Location must be lowercase alphanumeric (e.g., eastus, westeurope)';
      return '';
    },
    hint: 'Azure region for policy assignment'
  },
  policyEffect: {
    validate: (value) => {
      if (!value) return 'Please select a policy effect';
      return '';
    }
  },
  resourceType: {
    validate: (value) => {
      if (!value) return 'Please select a resource type';
      return '';
    }
  },
  assignmentScope: {
    validate: (value) => {
      if (!value) return 'Please select an assignment scope';
      return '';
    }
  }
};

function showValidationError(input, errorMsg) {
  input.classList.add('input-error');
  
  let errorContainer = input.parentElement.querySelector('.error-message');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.setAttribute('role', 'alert');
    input.parentElement.insertBefore(errorContainer, input.nextSibling);
  }
  errorContainer.textContent = errorMsg;
}

function clearValidationError(input) {
  input.classList.remove('input-error');
  const errorContainer = input.parentElement.querySelector('.error-message');
  if (errorContainer) {
    errorContainer.remove();
  }
}

function validateForm() {
  const form = document.getElementById('policyForm');
  const inputs = Array.from(form.querySelectorAll('input, select'));
  let isValid = true;

  inputs.forEach(input => {
    const rules = validationRules[input.id];
    if (rules) {
      const error = rules.validate(input.value);
      if (error) {
        showValidationError(input, error);
        isValid = false;
      } else {
        clearValidationError(input);
      }
    }
  });

  return isValid;
}

// Real-time validation
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('policyForm');
  const inputs = Array.from(form.querySelectorAll('input, select'));
  
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      const rules = validationRules[this.id];
      if (rules) {
        const error = rules.validate(this.value);
        if (error) {
          showValidationError(this, error);
        } else {
          clearValidationError(this);
        }
      }
    });

    input.addEventListener('input', function() {
      if (this.classList.contains('input-error')) {
        const rules = validationRules[this.id];
        if (rules) {
          const error = rules.validate(this.value);
          if (!error) {
            clearValidationError(this);
          }
        }
      }
    });
  });
});
