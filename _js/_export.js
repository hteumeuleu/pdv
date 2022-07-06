class pdvExport {

	constructor() {
		this.button = document.querySelector('#download');
		this.addEvents();
	}

	addEvents() {
		this.button.addEventListener('click', e => {
			this.downloadHandler();
		});
	}

	downloadHandler() {
		if(typeof fflate == 'undefined') {
			this.addZlibScript(() => {
				this.download();
			});
		} else {
			this.download();
		}
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
		script.src = '/assets/js/fflate.min.js';
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
		numFrames[0] = 4;

		// Reserved, always 0
		let reserved = new Uint16Array(1);

		// Framerate
		let framerate = new Float32Array(1);
		framerate[0] = 1;

		// Frame width
		let framewidth = new Uint16Array(1);
		framewidth[0] = width;

		// Frame height
		let frameheight = new Uint16Array(1);
		frameheight[0] = height;

		// Zeros, after frametable
		let zeros = new Uint32Array(1);

		// Frame Table & Frame Data
		let frametable = new Uint32Array(numFrames[0]);
		let framedata = new Array();
		let frameDataOffset = 0;
		for (let i = 0; i < frametable.length; i++) {
			// Set Frame Data
			const data1bit = this.getFrameArray();
			const dataZipped = fflate.zlibSync(data1bit);
			const dataLength = dataZipped.byteLength;
			framedata.push(dataZipped);
			// Set Frame Table
			let frameType = 1;
			frametable[i] = (frameDataOffset << 2) + frameType;
			// Increase offset for next frame
			frameDataOffset += dataLength;
		}
		let blobArray = [ident, numFrames, reserved, framerate, framewidth, frameheight, frametable, zeros];
		blobArray = blobArray.concat(framedata);
		return new Blob(blobArray, {type : 'application/octet-stream'});
	}

	getFrameArray() {
		const frame = app.preview.getFrame();
		const dataRGB = frame.data;
		let data1bit = new Uint8Array(app.width * app.height);
		for (let i = 0; i < dataRGB.length; i += 4) {
			let value = 0;
			if(dataRGB[i] == 255) {
				value = 1;
			}
			data1bit[i / 4] = value;
		}
		return data1bit;
	}
}
