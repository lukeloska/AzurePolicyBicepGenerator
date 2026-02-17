# Azure Policy Bicep Generator - Service Health Alerts

A web-based tool for generating Azure Policy Bicep templates for Service Health Alerts compliance policies.

## Features

- **Policy Configuration**: Define custom policy names, descriptions, and parameters
- **Multiple Policy Effects**: Support for Audit, Deny, DeployIfNotExists, Modify, and Append
- **Resource Type Selection**: Choose which Azure resources to monitor
- **Assignment Scopes**: Assign policies at Subscription, Management Group, or Resource Group levels
- **Tag Management**: Add custom tags to policy definitions
- **Syntax Highlighting**: Bicep code with color syntax highlighting
- **Dark Mode**: Toggle between light and dark themes (preference saved to local storage)
- **Form Validation**: Real-time input validation with helpful error messages
- **Copy to Clipboard**: One-click copying of generated Bicep templates
- **Toast Notifications**: Visual feedback for user actions

## Project Structure

```
AzurePolicyBicepGenerator/
├── Policy Generator.html      # Main HTML form
├── js/
│   ├── dataLoader.js         # Generic JSON data loader
│   ├── validation.js         # Form validation rules
│   └── policy-generator.js   # Main policy generation logic
├── css/
│   └── style.css             # Styling with dark mode support
└── data/
    ├── policyDefinitions.json      # Policy templates
    ├── resourceTypes.json          # Azure resource types
    ├── assignmentScopes.json       # Assignment scope options
    ├── policyEffects.json          # Policy effect options
    └── eventTypes.json             # Service Health event types
```

## Getting Started

### Prerequisites

- Python 3.x (for local development server)
- Modern web browser with JavaScript enabled

### Running Locally

1. Navigate to the project directory:

```bash
cd "path/to/AzurePolicyBicepGenerator"
```

2. Start a local HTTP server:

```bash
python -m http.server 8000
```

3. Open your browser and navigate to:

```
http://localhost:8000/Policy\ Generator.html
```

## Usage

1. **Fill in Policy Details**:

   - Policy Name: Unique identifier for your policy
   - Policy Description: Explain what the policy does
   - Display Name: User-friendly name (optional)

2. **Configure Policy Parameters**:

   - Select Policy Effect (Audit, Deny, etc.)
   - Choose Resource Type to monitor
   - Select Event Types relevant to your use case
   - Set Assignment Scope (where policy will be applied)

3. **Set Deployment Parameters**:

   - Scope ID: Full resource path of assignment target
   - Location: Azure region for deployment

4. **Add Tags** (Optional):

   - Click "Add Tag" to add custom key-value pairs
   - Remove tags as needed

5. **Generate and Copy**:
   - Click "Generate Policy Bicep" to create the template
   - Review the generated Bicep code
   - Click "Copy to Clipboard" to copy for use in your deployments

## Bicep Output

The generated Bicep template includes:

- Policy Definition with rules and metadata
- Policy Assignment configuration
- System-assigned managed identity
- Output values for reference IDs
- Support for parameterized effects and conditions

## Validation Rules

### Policy Name

- Required field
- Max 64 characters
- Alphanumeric and hyphens only

### Policy Description

- Required field
- Max 512 characters

### Scope ID

- Required field
- Must start with `/`
- Valid formats:
  - `/subscriptions/{subId}`
  - `/providers/Microsoft.Management/managementGroups/{mgId}`
  - `/subscriptions/{subId}/resourceGroups/{rgName}`

### Location

- Required field
- Lowercase alphanumeric (e.g., eastus, westeurope)

## Dark Mode

Click the moon (🌙) icon in the top-right corner to toggle dark mode. Your preference is automatically saved and restored on future visits.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any browser with ES6 and Fetch API support

## Features in Detail

### Form Validation

- Real-time validation on blur and input
- Clear error messages with recovery hints
- Prevents invalid submissions

### Syntax Highlighting

- Bicep code syntax highlighting using Highlight.js
- Dark mode friendly color schemes
- Line-by-line readable formatting

### Responsive Design

- Mobile-friendly form layout
- Touch-friendly buttons and inputs
- Responsive container width

## Contributing

To extend this tool:

1. Add new data files in `/data/` directory
2. Update the `loadAllSelectData()` function in `policy-generator.js`
3. Add validation rules to `validation.js` if needed
4. Update form fields in `Policy Generator.html`

## License

This tool is provided as-is for Azure policy generation.

## References

- [Azure Policy Documentation](https://learn.microsoft.com/en-us/azure/governance/policy/)
- [Bicep Language Reference](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Service Health Alerts](https://learn.microsoft.com/en-us/azure/service-health/)
