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
		blob.then((value) => {
			const blobURL = URL.createObjectURL(value);
			URL.revokeObjectURL(value);
			// Create invisible link
			const a = document.createElement('a');
			a.setAttribute('href', blobURL);
			a.setAttribute('download', filename);
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}).catch((reason) => {
			console.error(reason);
		});
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

	async getBlob() {
		return new Promise(function(resolve, reject) {
			let width = 400;
			let height = 240;
			// Ident
			const identString = "Playdate VID"
			let ident = new Uint8Array(16);
			ident.set(identString.split("").map(x => x.charCodeAt()));

			// Reserved, always 0
			let reserved = new Uint16Array(1);

			// Frame width
			let framewidth = new Uint16Array(1);
			framewidth[0] = width;

			// Frame height
			let frameheight = new Uint16Array(1);
			frameheight[0] = height;

			// Frame Table & Frame Data
			let frametable = new Array();
			let framedata = new Array();
			let frameDataOffset = 0;

			// Play video to get every frame
			if(app && app.preview && app.preview.video) {
				const that = this || app.export;
				let video = app.preview.video;
				video.removeAttribute('loop');
				video.removeAttribute('controls');
				app.form.showMessage();
				that.button.setAttribute('disabled', 'disabled');

				function doSomethingWithTheFrame(now, metadata) {
					// Push Frame Data
					const data1bit = that.getFrameArray();
					const dataZipped = fflate.zlibSync(data1bit);
					framedata.push(dataZipped);
					// Push Frame Table
					let frameType = 1;
					frametable.push((frameDataOffset << 2) + frameType);
					// Increase offset for next frame
					const dataLength = dataZipped.byteLength;
					frameDataOffset += dataLength;
					// Update message
					let timeRemaining = Math.round(video.duration - video.currentTime);
					app.form.updateMessage(timeRemaining + "s");
					// Re-register the callback to be notified about the next frame.
					video.requestVideoFrameCallback(doSomethingWithTheFrame);
				}
				video.requestVideoFrameCallback(doSomethingWithTheFrame);

				video.addEventListener('ended', e => {
					video.setAttribute('loop', 'loop');
					video.setAttribute('controls', 'controls');
					app.form.hideMessage();
					that.button.removeAttribute('disabled');

					// Frame Table
					const frametableUint32 = Uint32Array.from(frametable);

					// Number of frames
					let numFrames = new Uint16Array(1);
					numFrames[0] = frametable.length;

					// Framerate
					let framerate = new Float32Array(1);
					framerate[0] = frametable.length / video.duration;

					let blobArray = [ident, numFrames, reserved, framerate, framewidth, frameheight, frametableUint32];
					blobArray = blobArray.concat(framedata);
					const blob = new Blob(blobArray, {type : 'application/octet-stream'});
					resolve(blob);
				});

				video.play();
				video.blur();
			} else {
				reject(Error('Object [video] is undefined.'))
			}
		});
	}

	getFrameArray() {
		const frame = app.preview.getFrame();
		const dataRGB = frame.data;
		let data1bit = new Uint8Array(app.width * app.height);
		let j = 0;
		for (let i = 0; i < dataRGB.length; i += 32) {
			let chunk = 0;
			let k = i;
			for(let shift=7; shift >= 0; shift--) {
				let value = dataRGB[k];
				if(value == 255) {
					value = 1;
				} else {
					value = 0;
				}
				k += 4;
				chunk += (value << shift);
			}
			data1bit[j] = chunk;
			j++;
		}
		return data1bit;
	}
}
