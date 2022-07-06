---
layout: null
permalink: "/assets/js/script.js"
---
{% include_relative _preview.js %}
{% include_relative _form.js %}
{% include_relative _export.js %}
{% include_relative _rvfc-polyfill.js %}

class pdvApp {

	constructor() {
		this.width = 400;
		this.height = 240;
		this.preview = new pdvPreview();
		this.form = new pdvForm();
		this.export = new pdvExport();
	}

}

document.addEventListener('DOMContentLoaded', e => {
	window.app = new pdvApp();
})