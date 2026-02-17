/**
 * Generic data loader utility for populating select elements from JSON files
 */

/**
 * Load data from a JSON file and populate a select element
 * @param {string} selectId - The ID of the select element to populate
 * @param {string} jsonPath - The path to the JSON file (e.g., 'data/policyEffects.json')
 * @returns {Promise<void>}
 */
async function loadSelectFromJSON(selectId, jsonPath) {
  const selectElement = document.getElementById(selectId);
  
  if (!selectElement) {
    console.error(`Select element with ID "${selectId}" not found`);
    return;
  }

  try {
    const response = await fetch(jsonPath);
    
    if (!response.ok) {
      const errorMsg = response.status === 404 
        ? `${jsonPath} not found. Make sure the data file exists.`
        : `HTTP ${response.status}: Failed to load ${jsonPath}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();

    // For multi-select fields, don't add a placeholder option
    if (selectElement.multiple) {
      selectElement.innerHTML = '';
    } else {
      selectElement.innerHTML = `<option value="">Select ${selectId}...</option>`;
    }
    
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(item => {
        if (!item.value || !item.label) {
          console.warn(`Invalid data format in ${jsonPath}:`, item);
          return;
        }
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        selectElement.appendChild(option);
      });
    } else {
      throw new Error(`No valid data in ${jsonPath}. Expected array of objects with 'value' and 'label' properties.`);
    }
  } catch (error) {
    console.error(`Error loading ${jsonPath}:`, error);
    selectElement.innerHTML = `<option value="">Error loading data</option>`;
  }
}

/**
 * Load multiple select elements from their respective JSON files
 * @param {Object} selectMapping - Object with selectId: jsonPath pairs
 */
async function loadMultipleSelects(selectMapping) {
  const promises = Object.entries(selectMapping).map(([selectId, jsonPath]) =>
    loadSelectFromJSON(selectId, jsonPath)
  );
  await Promise.all(promises);
}
