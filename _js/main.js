---
layout: null
permalink: "/assets/js/script.js"
---
{% include_relative _preview.js %}
{% include_relative _form.js %}
{% include_relative _export.js %}

class pdvApp {

	constructor() {
		this.preview = new pdvPreview();
		this.form = new pdvForm();
		this.export = new pdvExport();
	}

}

document.addEventListener('DOMContentLoaded', e => {
	window.pdvApp = new pdvApp();
})