/**
 * Azure Policy Bicep Generator for Service Health Alerts
 */

function getSelectedOptions(select) {
  return Array.from(select.selectedOptions).map((o) => o.value);
}

function makeShortName(name) {
  if (!name) return "pol";
  let s = name && name.normalize
    ? name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    : name;
  s = String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!s) return "pol";
  if (/^[0-9]/.test(s)) s = "pol" + s;
  return s.slice(0, 12) || "pol";
}

function jsObjToBicep(obj, indent = "  ", compactThreshold = 2) {
  const isSimple = (v) =>
    typeof v === "string" || typeof v === "number" || typeof v === "boolean";
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    if (obj.length <= compactThreshold && obj.every(isSimple)) {
      return "[" + obj.map((v) => JSON.stringify(v)).join(", ") + "]";
    }
    const items = obj.map((item) => indent + jsObjToBicep(item, indent, compactThreshold));
    return "[\n" + items.join("\n") + "\n" + indent.slice(0, -2) + "]";
  }
  
  if (obj !== null && typeof obj === "object") {
    const keys = Object.keys(obj).filter((k) => obj[k] !== undefined && obj[k] !== null);
    if (keys.length === 0) return "{}";
    const items = keys.map(
      (k) => indent + k + ": " + jsObjToBicep(obj[k], indent + "  ", compactThreshold)
    );
    return "{\n" + items.join("\n") + "\n" + indent.slice(0, -2) + "}";
  }
  
  return JSON.stringify(obj);
}

function generatePolicyBicep(formData) {
  const shortName = makeShortName(formData.policyName);
  const eventTypesArray = formData.eventTypes && formData.eventTypes.length > 0 
    ? formData.eventTypes 
    : ["ServiceIssue"];

  const resourceScope = formData.scopeId.toLowerCase();
  const isSubscription = resourceScope.match(/^\/subscriptions\/[a-f0-9\-]+$/i);
  const isManagementGroup = resourceScope.startsWith("/providers/microsoft.management/managementgroups/");

  const policyRuleConditions = {
    field: "type",
    equals: formData.resourceType
  };

  const policyRuleEffect = {
    effect: formData.policyEffect
  };

  if (formData.policyEffect === "Deny") {
    policyRuleEffect.details = {
      message: `Resource '${formData.resourceType}' with Service Health Alerts is not allowed`
    };
  }

  if (formData.policyEffect === "Audit") {
    policyRuleEffect.details = {
      evaluationDelay: "AfterProvisioning"
    };
  }

  const policyDefinition = {
    name: shortName,
    displayName: formData.displayName || formData.policyName,
    description: formData.policyDescription,
    mode: "All",
    metadata: {
      version: "1.0.0",
      category: "Monitoring",
      source: "github.com/Azure"
    },
    parameters: {
      effect: {
        type: "String",
        defaultValue: formData.policyEffect,
        allowedValues: ["Audit", "Deny", "DeployIfNotExists", "Modify", "Append"],
        metadata: {
          displayName: "Effect",
          description: "The desired effect of the policy"
        }
      }
    },
    policyRule: {
      if: policyRuleConditions,
      then: policyRuleEffect
    }
  };

  const assignmentName = `assignment-${shortName}`;
  const tagKeys = Object.keys(formData.tags || {}).filter(k => formData.tags[k]);
  const tagsObj = {};
  tagKeys.forEach(k => {
    tagsObj[k] = formData.tags[k];
  });

  const policyAssignment = {
    name: assignmentName,
    displayName: `${formData.displayName || formData.policyName} - Assignment`,
    description: `Assignment of ${formData.policyName} to ${formData.assignmentScope}`,
    policyDefinitionId: isSubscription 
      ? `${formData.scopeId}/providers/Microsoft.Authorization/policyDefinitions/${shortName}`
      : `${formData.scopeId}/providers/Microsoft.Authorization/policyDefinitions/${shortName}`,
    scope: formData.scopeId,
    parameters: {
      effect: {
        value: formData.policyEffect
      }
    },
    metadata: {
      assignedBy: "ServiceHealthAlerts",
      assignedDate: new Date().toISOString()
    }
  };

  if (Object.keys(tagsObj).length > 0) {
    policyAssignment.tags = tagsObj;
  }

  const bicepTemplate = `// Service Health Alerts Policy Definition and Assignment
// Generated for: ${formData.policyName}
// Location: ${formData.location}

param location string = '${formData.location}'
param environment string = 'prod'
param tags object = ${jsObjToBicep(tagsObj)}

// Policy Definition
resource policyDef 'Microsoft.Authorization/policyDefinitions@2023-04-01' = {
  name: '${shortName}'
  properties: ${jsObjToBicep(policyDefinition, "    ")}
}

// Policy Assignment
resource policyAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = {
  name: '${assignmentName}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    displayName: '${formData.displayName || formData.policyName} - Assignment'
    description: 'Assignment of ${formData.policyName} to ${formData.assignmentScope}'
    policyDefinitionId: policyDef.id
    scope: '/subscriptions/${extractSubscriptionId(formData.scopeId)}'
    parameters: {
      effect: {
        value: '${formData.policyEffect}'
      }
    }
    metadata: {
      assignedBy: 'ServiceHealthAlerts'
      assignedDate: '${new Date().toISOString()}'
    }
  }
}

// Outputs
output policyDefinitionId string = policyDef.id
output policyAssignmentId string = policyAssignment.id
output policyAssignmentName string = policyAssignment.name
`;

  return bicepTemplate;
}

function extractSubscriptionId(scopeId) {
  const match = scopeId.match(/\/subscriptions\/([a-f0-9\-]+)/i);
  return match ? match[1] : "subscription-id";
}

function loadAllSelectData() {
  const selectMapping = {
    policyEffect: 'data/policyEffects.json',
    resourceType: 'data/resourceTypes.json',
    eventTypes: 'data/eventTypes.json',
    assignmentScope: 'data/assignmentScopes.json',
    location: 'data/regions.json'
  };
  
  return loadMultipleSelects(selectMapping);
}

function getTags() {
  const tagsContainer = document.getElementById('tagsContainer');
  const tags = {};
  const tagRows = tagsContainer.querySelectorAll('.tag-row');
  
  tagRows.forEach(row => {
    const keyInput = row.querySelector('.tag-key');
    const valueInput = row.querySelector('.tag-value');
    if (keyInput.value.trim() && valueInput.value.trim()) {
      tags[keyInput.value.trim()] = valueInput.value.trim();
    }
  });
  
  return tags;
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  const formData = {
    policyName: document.getElementById('policyName').value,
    policyDescription: document.getElementById('policyDescription').value,
    policyEffect: document.getElementById('policyEffect').value,
    resourceType: document.getElementById('resourceType').value,
    eventTypes: getSelectedOptions(document.getElementById('eventTypes')),
    assignmentScope: document.getElementById('assignmentScope').value,
    scopeId: document.getElementById('scopeId').value,
    location: document.getElementById('location').value,
    displayName: document.getElementById('displayName').value,
    tags: getTags()
  };

  const bicepTemplate = generatePolicyBicep(formData);
  
  const outputDiv = document.getElementById("output");
  const bicepCodeElement = document.getElementById("bicepCode");
  bicepCodeElement.textContent = bicepTemplate;
  
  outputDiv.style.display = "block";
  
  // Trigger syntax highlighting
  if (window.hljs) {
    bicepCodeElement.classList.add('language-bicep');
    window.hljs.highlightElement(bicepCodeElement);
  }
  
  document.getElementById("copyBtn").disabled = false;
  document.getElementById("toast").classList.remove("show");
}

function handleAddTag() {
  const tagsContainer = document.getElementById('tagsContainer');
  const tagRow = document.createElement('div');
  tagRow.className = 'tag-row';
  tagRow.innerHTML = `
    <input type="text" class="tag-key" placeholder="Key (e.g., Environment)" />
    <input type="text" class="tag-value" placeholder="Value (e.g., Production)" />
    <button type="button" class="btn-remove-tag" aria-label="Remove tag">Remove</button>
  `;
  
  tagRow.querySelector('.btn-remove-tag').addEventListener('click', (e) => {
    e.preventDefault();
    tagRow.remove();
  });
  
  tagsContainer.appendChild(tagRow);
}

function handleClearForm() {
  document.getElementById('policyForm').reset();
  
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => clearValidationError(input));
  
  const tagsContainer = document.getElementById('tagsContainer');
  tagsContainer.innerHTML = `
    <div class="tag-row">
      <input type="text" class="tag-key" placeholder="Key (e.g., Environment)" />
      <input type="text" class="tag-value" placeholder="Value (e.g., Production)" />
      <button type="button" class="btn-remove-tag" aria-label="Remove tag">Remove</button>
    </div>
  `;
  
  document.getElementById('output').style.display = 'none';
  document.getElementById('copyBtn').disabled = true;
  document.getElementById('toast').classList.remove('show');
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

function handleCopyClick() {
  const bicepCodeElement = document.getElementById("bicepCode");
  const bicepCode = bicepCodeElement.textContent;
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(bicepCode).then(() => {
      showToast("Policy template copied to clipboard!");
    });
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Setup dark mode toggle
  const darkModeToggle = document.getElementById("darkModeToggle");
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️";
  }
  
  darkModeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    const isNowDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isNowDark);
    darkModeToggle.textContent = isNowDark ? "☀️" : "🌙";
  });

  // Load data and then wire up assignment scope -> scope hint behavior
  loadAllSelectData().then(() => {
    const assignmentScopeSelect = document.getElementById('assignmentScope');
    const scopeHint = document.getElementById('scopeIdHint');

    function updateScopeHint() {
      if (!assignmentScopeSelect || !scopeHint) return;
      const v = assignmentScopeSelect.value;
      let text = 'Full resource ID of the scope (Subscription, Management Group, or Resource Group)';
      if (v === 'Subscription') {
        text = 'Subscription scope example: /subscriptions/{subscriptionId}';
      } else if (v === 'ManagementGroup') {
        text = 'Management group scope example: /providers/Microsoft.Management/managementGroups/{managementGroupId}';
      } else if (v === 'ResourceGroup') {
        text = 'Resource group scope example: /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}';
      }
      scopeHint.textContent = text;
    }

    assignmentScopeSelect.addEventListener('change', updateScopeHint);
    // initialize hint based on current value (if any)
    updateScopeHint();
  }).catch((err) => console.error('Failed to load select data:', err));

  // Setup tag management
  document.getElementById('addTagBtn').addEventListener('click', (e) => {
    e.preventDefault();
    handleAddTag();
  });

  // Setup tag row remove buttons
  document.getElementById('tagsContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-tag')) {
      e.preventDefault();
      if (document.querySelectorAll('.tag-row').length > 1) {
        e.target.closest('.tag-row').remove();
      }
    }
  });

  // Setup form submission
  document.getElementById('policyForm').addEventListener('submit', handleFormSubmit);
  
  // Setup clear button
  document.getElementById('clearBtn').addEventListener('click', (e) => {
    e.preventDefault();
    handleClearForm();
  });

  // Setup copy button
  document.getElementById('copyBtn').addEventListener('click', handleCopyClick);
});
