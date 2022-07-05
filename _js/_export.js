class pdvExport {

	constructor() {
		if(typeof pako == 'undefined') {
			this.addZlibScript(() => console.log(pako));
		}

		this.button = document.querySelector('#download');
		this.addEvents();
	}

	addEvents() {
		this.button.addEventListener('click', e => {
			this.download();
		});
	}

	download() {
		// Get file name
		let filename = 'sample.pdv';
		const fileInput = document.querySelector('.pdv-form-file')
		if (fileInput.files.length) {
			filename = fileInput.files[0].name + '.pdv';
		}
		// Get blob URL
		const blob = this.getBlob();
		const blobURL = URL.createObjectURL(blob);
		URL.revokeObjectURL(blob);
		// Create invisible link
		const a = document.createElement('a');
		a.setAttribute('href', blobURL);
		a.setAttribute('download', filename);
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	addZlibScript(callback) {
		const script = document.createElement('script');
		script.src = '/assets/js/pako.min.js';
		document.body.append(script);

		script.addEventListener('load', e => {
			if(callback) {
				callback();
			}
		});
	}

	getBlob() {
		// Ident
		let width = 400;
		let height = 240;
		const identString = "Playdate VID"
		let ident = new Uint8Array(16);
		ident.set(identString.split("").map(x => x.charCodeAt()));

		// Number of frames
		let numFrames = new Uint16Array(1);
		numFrames[0] = 30;

		// Reserved, always 0
		let reserved = new Uint16Array(1);

		// Framerate
		let framerate = new Float32Array(1);
		framerate[0] = 30;

		// Frame width
		let framewidth = new Uint16Array(1);
		framewidth[0] = width;

		// Frame height
		let frameheight = new Uint16Array(1);
		frameheight[0] = height;

		// TODO: Frame Table
		const frame = window.pdvApp.preview.ctx.getImageData(0, 0, 400, 240);
		const data = frame.data;
		const zippedFrameData = pako.deflate(data);

		return new Blob([ident, numFrames, reserved, framerate, framewidth, frameheight, zippedFrameData], {type : 'application/octet-stream'});
	}

	serializeFrame() {
		const frame = ctx.getImageData(0, 0, width, height);
		const data = frame.data;
		let newDataArray = new Array();
		data.forEach((e, i) => {
			// console.log(e, i);
			let value = 0;
			if(e === 255) {
				value = 1;
			}
			newDataArray.push(value);
		});
		return newDataArray;
	}

			data1bit[i / 4] = value;
		}
		return data1bit;
	}
}
