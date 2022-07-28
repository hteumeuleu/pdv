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
			filename = fileInput.files[0].name;
			filename = filename.substring(0, filename.lastIndexOf('.'))
			filename += '.pdv';
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
				const frames = Math.floor(video.duration * app.fps);
				let currentFrame = 0;
				video.currentTime = currentFrame;

				video.removeAttribute('loop');
				video.removeAttribute('controls');
				app.form.showMessage();
				that.button.setAttribute('disabled', 'disabled');
				video.play()
				video.pause()
				video.blur();

				function doSomethingWithTheFrame() {
					if(video.readyState > 1) {
						video.currentTime = currentFrame * (1 / app.fps);
						app.preview.computeFrame();
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
						app.form.updateMessage(currentFrame + "/" + frames);
						// Re-register the callback to be notified about the next frame.
						if(currentFrame < frames) {
							// Update current frame
							currentFrame++;
							window.requestAnimationFrame(doSomethingWithTheFrame)
						} else {
							window.requestAnimationFrame(doEndOfFile)
						}
					} else {
						window.requestAnimationFrame(doSomethingWithTheFrame)
					}
				}

				function doEndOfFile() {
					// Offset to end of file in Frame Table
					frametable.push(frameDataOffset << 2);

					// Frame Table
					const frametableUint32 = Uint32Array.from(frametable);

					// Number of frames
					let numFrames = new Uint16Array(1);
					numFrames[0] = frametable.length - 1;

					// Framerate
					let framerate = new Float32Array(1);
					framerate[0] = (frametable.length - 1) / (video.duration / video.playbackRate);

					let blobArray = [ident, numFrames, reserved, framerate, framewidth, frameheight, frametableUint32];
					blobArray = blobArray.concat(framedata);
					const blob = new Blob(blobArray, {type : 'application/octet-stream'});
					resolve(blob);

					// Reinit UI
					video.setAttribute('loop', 'loop');
					video.setAttribute('controls', 'controls');
					app.form.hideMessage();
					that.button.removeAttribute('disabled');
				}
				window.requestAnimationFrame(doSomethingWithTheFrame)

			} else {
				reject(Error('Object [video] is undefined.'))
			}
		});
	}

	getFrameArray() {
		const frame = app.preview.getFrame();
		const dataRGB = frame.data;
		const src = new Uint8Array(app.width * app.height);
		for (let i = 0; i < dataRGB.length; i += 4) {
			let value = dataRGB[i];
			if(value != 0) {
				value = 1;
			}
			src[i/4] = value;
		}
		const dst = new Uint8Array(app.width * app.height / 8);
		const dstSize = dst.byteLength;
		let srcPtr = 0;
		let dstPtr = 0;
		while (dstPtr < dstSize) {
			let byte = 0;
			// pack every 8 pixels into one byte
			for (let shift = 0; shift < 8; shift++) {
				// if the input pixel isn't 0 (black), flip the output bit to 1 (white)
				if (src[srcPtr++] !== 0) {
				  byte |= (0x80 >> shift);
				}
			}
			dst[dstPtr++] = byte;
		}
		return dst;
	}
}
