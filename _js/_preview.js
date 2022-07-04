class pdvPreview {

	constructor() {
		this.canvas = document.querySelector('.pdv-preview-canvas');
		this.video = document.querySelector('.pdv-preview-video');
		this.width = 400;
		this.height = 240;
		this.scale = "outside";
		this.filterThreshold = 127;

		if(this.canvas && this.video) {
			this.ctx = this.canvas.getContext('2d');
			this.addEvents();
		}
	}

	addEvents() {
		this.video.addEventListener('play', () => {
			this.timerCallback();
		}, false);

		this.video.addEventListener('canplay', () => {
			this.computeFrame();
		}, false);

		this.canvas.addEventListener('click', () => {
			if(this.video.paused) {
				this.video.play();
			} else {
				this.video.pause();
			}
		}, false);

		// Custom `pdvFormChange` created in `_form.js`
		document.addEventListener('pdvFormChange', () => {
			this.computeFrame();
		});

		// Custom `pdvFormScaleChange` created in `_form.js`
		document.addEventListener('pdvFormScaleChange', e => {
			this.setScale(e.detail);
		});

		// Custom `pdvFormVideoChange` created in `_form.js`
		document.addEventListener('pdvFormVideoChange', () => {
			this.setVideo();
		});
	}

	timerCallback() {
		if (this.video.paused || this.video.ended) {
		  return;
		}
		this.computeFrame();
		setTimeout(() => {
			this.timerCallback();
		}, 0);
	}

	computeFrame() {
		if(this.video.readyState > 1) {
			// Reset the frame to black
			this.ctx.fillStyle = '#000'
			this.ctx.fillRect(0, 0, this.width, this.height);
			// Calculate sizes of source and destination
			// depending on ratio
			let dWidth, dHeight, dx, dy, sx, sy, sWidth, sHeight;
			const playdateRatio = this.width / this.height;
			const videoRatio = this.video.videoWidth / this.video.videoHeight;
			const biggerRatio = videoRatio > playdateRatio;
			if(this.scale == "inside") {
				// Source
				sx = 0;
				sy = 0;
				sWidth = this.video.videoWidth;
				sHeight = this.video.videoHeight;
				// Destination
				if(!biggerRatio) {
					dWidth = Math.round(sWidth * this.height / sHeight);
					dHeight = this.height;
				} else {
					dWidth = this.width;
					dHeight = Math.round(sHeight * this.width / sWidth);
				}
				dx = Math.round((this.width - dWidth) / 2);
				dy = Math.round((this.height - dHeight) / 2);
			} else {
				// Source
				if(!biggerRatio) {
					sWidth = this.video.videoWidth;
					sHeight = Math.round(this.height * this.video.videoWidth / this.width);
					sx = 0;
					sy = Math.round((this.video.videoHeight - sHeight) / 2);
				} else {
					sWidth = Math.round(this.width * this.video.videoHeight / this.height);
					sHeight = this.video.videoHeight;
					sx = Math.round((sWidth - this.video.videoWidth) / 2) * -1;
					sy = 0;
				}
				// Destination
				dx = 0;
				dy = 0;
				dWidth = this.width;
				dHeight = this.height;
			}
			// Draw the original frame from the video, cropped
			this.ctx.drawImage(this.video, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
			// Get the drawn frame, get its data, and apply a filter
			const frame = this.ctx.getImageData(0, 0, this.width, this.height);
			const data = frame.data;
			let newData = this.filter(data);
			// Reset the frame to black again
			this.ctx.fillStyle = '#000';
			this.ctx.fillRect(0, 0, this.width, this.height);
			// Draw the new frame, cropped and filtered
			let newFrame = this.ctx.createImageData(this.width, this.height);
			newFrame.data.set(newData);
			this.ctx.putImageData(newFrame, 0, 0);
		}
	}

	setScale(value) {
		if(value == "inside") {
			this.scale = "inside";
			this.video.style.objectFit = "contain";
		} else {
			this.scale = "outside";
			this.video.style.objectFit = "cover";
		}
	}

	setVideo() {
		const fileInput = document.querySelector('form input[type="file"]')
		if (fileInput.files.length) {
			this.video.src = URL.createObjectURL(fileInput.files[0]);
			this.video.onload = function() {
				URL.revokeObjectURL(this.video.src);
			}
			const output = document.querySelector('#output');
			output.download = fileInput.files[0].name + '.pdv';
		}
	}


	/**
	 * 
	 * Filter and dithering effects
	 *
	 */
	filter(data) {
		const select = document.querySelector('#select-dither')
		const selected = select.options[select.selectedIndex].value;
		if(selected == "basic") {
			return this.filterBasicThresholdWithError(data);
		} else if(selected == "floydsteinberg") {
			return this.filterFloydSteinberg(data);
		} else if(selected == "stucki") {
			return this.filterStucki(data);
		} else if(selected == "atkinson") {
			return this.filterAtkinson(data);
		} else {
			return this.filterBasicThreshold(data);
		}
	}

	filterAtkinson(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);

		for (let i = 0; i < length; i += 4) {
			const col = Math.round(i % (this.width * 4) / 4);
			const row = Math.round(i / (this.width * 4));

			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;

			let newValue = 0;
			if(avg > this.filterThreshold) {
				newValue = 255;
			}

			const error = avg - newValue;
			const errorShare = error / 8;
			if(col < this.width - 2) {
				data[i + 4] += errorShare*1;
				data[i + 5] += errorShare*1;
				data[i + 6] += errorShare*1;
				data[i + 8] += errorShare*1;
				data[i + 9] += errorShare*1;
				data[i + 10] += errorShare*1;
			}
			if(row < this.height - 2) {
				if(col >= 1) {
					data[i - 4 + (this.width * 4)] += errorShare*1;
					data[i - 3 + (this.width * 4)] += errorShare*1;
					data[i - 2 + (this.width * 4)] += errorShare*1;
				}
				data[i + 0 + (this.width * 4)] += errorShare*1;
				data[i + 1 + (this.width * 4)] += errorShare*1;
				data[i + 2 + (this.width * 4)] += errorShare*1;
				data[i + 0 + (this.width * 4 * 2)] += errorShare*1;
				data[i + 1 + (this.width * 4 * 2)] += errorShare*1;
				data[i + 2 + (this.width * 4 * 2)] += errorShare*1;
				if(col < this.width - 1) {
					data[i + 4 + (this.width * 4)] += errorShare*1;
					data[i + 5 + (this.width * 4)] += errorShare*1;
					data[i + 6 + (this.width * 4)] += errorShare*1;
				}
			}

			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	filterStucki(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);

		for (let i = 0; i < length; i += 4) {
			const col = Math.round(i % (this.width * 4) / 4);
			const row = Math.round(i / (this.width * 4));

			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;

			let newValue = 0;
			if(avg > this.filterThreshold) {
				newValue = 255;
			}

			const error = avg - newValue;
			const errorShare = error / 42;
			if(col < this.width - 2) {
				data[i + 4] += errorShare*8;
				data[i + 5] += errorShare*8;
				data[i + 6] += errorShare*8;
				data[i + 8] += errorShare*4;
				data[i + 9] += errorShare*4;
				data[i + 10] += errorShare*4;
			}
			if(row < this.height - 2) {
				if(col >= 2) {
					data[i - 4 + (this.width * 4)] += errorShare*4;
					data[i - 3 + (this.width * 4)] += errorShare*4;
					data[i - 2 + (this.width * 4)] += errorShare*4;
					data[i - 8 + (this.width * 4)] += errorShare*2;
					data[i - 7 + (this.width * 4)] += errorShare*2;
					data[i - 6 + (this.width * 4)] += errorShare*2;

					data[i - 4 + (this.width * 4 * 2)] += errorShare*2;
					data[i - 3 + (this.width * 4 * 2)] += errorShare*2;
					data[i - 2 + (this.width * 4 * 2)] += errorShare*2;
					data[i - 8 + (this.width * 4 * 2)] += errorShare*1;
					data[i - 7 + (this.width * 4 * 2)] += errorShare*1;
					data[i - 6 + (this.width * 4 * 2)] += errorShare*1;
				}
				data[i + 0 + (this.width * 4)] += errorShare*8;
				data[i + 1 + (this.width * 4)] += errorShare*8;
				data[i + 2 + (this.width * 4)] += errorShare*8;
				data[i + 0 + (this.width * 4 * 2)] += errorShare*4;
				data[i + 1 + (this.width * 4 * 2)] += errorShare*4;
				data[i + 2 + (this.width * 4 * 2)] += errorShare*4;
				if(col < this.width - 2) {
					data[i + 4 + (this.width * 4)] += errorShare*4;
					data[i + 5 + (this.width * 4)] += errorShare*4;
					data[i + 6 + (this.width * 4)] += errorShare*4;
					data[i + 8 + (this.width * 4)] += errorShare*2;
					data[i + 9 + (this.width * 4)] += errorShare*2;
					data[i + 10 + (this.width * 4)] += errorShare*2;

					data[i + 4 + (this.width * 4 * 2)] += errorShare*1;
					data[i + 5 + (this.width * 4 * 2)] += errorShare*1;
					data[i + 6 + (this.width * 4 * 2)] += errorShare*1;
					data[i + 8 + (this.width * 4 * 2)] += errorShare*1;
					data[i + 9 + (this.width * 4 * 2)] += errorShare*1;
					data[i + 10 + (this.width * 4 * 2)] += errorShare*1;
				}
			}

			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	filterFloydSteinberg(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);

		for (let i = 0; i < length; i += 4) {
			const col = Math.round(i % (this.width * 4) / 4);
			const row = Math.round(i / (this.width * 4));

			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;

			let newValue = 0;
			if(avg > this.filterThreshold) {
				newValue = 255;
			}
			const error = avg - newValue;
			const errorShare = error / 16;
			if(col < this.width - 1) {
				data[i + 4] += errorShare*7;
				data[i + 5] += errorShare*7;
				data[i + 6] += errorShare*7;
			}
			if(row < this.height - 1) {
				if(col > 0) {
					data[i - 4 + (this.width * 4)] += errorShare*3;
					data[i - 3 + (this.width * 4)] += errorShare*3;
					data[i - 2 + (this.width * 4)] += errorShare*3;
				}
				data[i + 0 + (this.width * 4)] += errorShare*5;
				data[i + 1 + (this.width * 4)] += errorShare*5;
				data[i + 2 + (this.width * 4)] += errorShare*5;
				if(col < this.width - 1) {
					data[i + 4 + (this.width * 4)] += errorShare*1;
					data[i + 5 + (this.width * 4)] += errorShare*1;
					data[i + 6 + (this.width * 4)] += errorShare*1;
				}
			}

			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	filterBasicThreshold(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);
		for (let i = 0; i < length; i += 4) {
			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;
			let newValue = 0;
			if(avg > this.filterThreshold) {
				newValue = 255;
			}
			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	filterBasicThresholdWithError(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);
		let previousError = 0;
		for (let i = 0; i < length; i += 4) {
			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3 + previousError;
			let newValue = 0;
			if(avg > this.width) {
				newValue = 255;
			}
			previousError = avg - newValue;
			if(i % this.width == 0) {
				previousError = 0;
			}
			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

}
