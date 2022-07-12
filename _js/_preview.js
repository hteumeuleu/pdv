class pdvPreview {

	constructor() {
		this.canvas = document.querySelector('.pdv-preview-canvas');
		this.video = document.querySelector('.pdv-preview-video');
		this.width = 400;
		this.height = 240;
		this.scale = "outside";
		this.filterThreshold = 127;
		this.filter = "atkinson";

		if(this.canvas && this.video) {
			this.ctx = this.canvas.getContext('2d');
			this.video.volume = 0.4;
			this.video.removeAttribute('muted');
			this.addEvents();
			this.setDither();
		}
	}

	addEvents() {
		this.video.addEventListener('play', () => {
			this.timerCallback();
		}, false);

		this.video.addEventListener('canplay', () => {
			this.computeFrame();
			this.video.classList.add('show-on-hover')
		}, false);

		this.canvas.addEventListener('click', () => {
			if(this.video.paused) {
				this.video.play();
			} else {
				this.video.pause();
			}
		}, false);

		// Custom events created in `_form.js`
		document.addEventListener('pdvFormChange', () => {
			this.computeFrame();
		});

		document.addEventListener('pdvFormScaleChange', e => {
			this.setScale(e.detail);
		});

		document.addEventListener('pdvFormVideoChange', () => {
			this.setVideo();
		});

		document.querySelector('.pdv-form-dither').addEventListener('change', () => {
			this.setDither();
		});
	}

	getFrame() {
		return this.ctx.getImageData(0, 0, this.width, this.height);
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
			let newData = this.applyFilter(data);
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
		const fileInput = document.querySelector('.pdv-form-file')
		if (fileInput.files.length) {
			this.video.src = URL.createObjectURL(fileInput.files[0]);
			this.video.onload = function() {
				URL.revokeObjectURL(this.video.src);
			}
			this.video.removeAttribute('poster');
		}
	}

	setDither() {
		const select = document.querySelector('.pdv-form-dither')
		this.filter = select.options[select.selectedIndex].value;
	}


	// Filter and dithering effects
	applyFilter(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);

		for (let i = 0; i < length; i += 4) {
			// Column and row indexes
			const col = Math.round(i % (this.width * 4) / 4);
			const row = Math.round(i / (this.width * 4));
			// RGB values
			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			// Average for grayscale
			const avg = (red + green + blue) / 3;
			// Set new value
			let newValue = 0;
			if(avg > this.filterThreshold) {
				newValue = 255;
			}
			// Set error
			const error = avg - newValue;
			// Apply dithering filter
			if(this.filter == "bayer2") {
			} else if(this.filter == "bayer4") {
			} else if(this.filter == "bayer8") {
			} else if(this.filter == "blue") {
			} else if(this.filter == "floydsteinberg") {
				//
				// Floyd-Steinberg dithering
				//
				// 			X   7
				// 		3   5   1
				//
				const errorShare = error / 16;
				if(col < this.width - 1) {
					// [x+1][y]
					data[i + 4] += errorShare*7;
					data[i + 5] += errorShare*7;
					data[i + 6] += errorShare*7;
				}
				if(row < this.height - 1) {
					if(col > 0) {
						// [x-1][y+1]
						data[i - 4 + (this.width * 4)] += errorShare*3;
						data[i - 3 + (this.width * 4)] += errorShare*3;
						data[i - 2 + (this.width * 4)] += errorShare*3;
					}
					// [x][y+1]
					data[i + 0 + (this.width * 4)] += errorShare*5;
					data[i + 1 + (this.width * 4)] += errorShare*5;
					data[i + 2 + (this.width * 4)] += errorShare*5;
					if(col < this.width - 1) {
						// [x+1][y+1]
						data[i + 4 + (this.width * 4)] += errorShare*1;
						data[i + 5 + (this.width * 4)] += errorShare*1;
						data[i + 6 + (this.width * 4)] += errorShare*1;
					}
				}
			} else if(this.filter == "jarvis") {
				//
				// Jarvis, Judice, and Ninke dithering
				//
				//             X   7   5
				// 	   3   5   7   5   3
				// 	   1   3   5   3   1
				//
				const errorShare = error / 48;
				if(col < this.width - 2) {
					// [x+1][y]
					data[i + 4] += errorShare*7;
					data[i + 5] += errorShare*7;
					data[i + 6] += errorShare*7;
					// [x+2][y]
					data[i + 8] += errorShare*5;
					data[i + 9] += errorShare*5;
					data[i + 10] += errorShare*5;
				}
				if(row < this.height - 2) {
					if(col >= 2) {
						// [x-2][y+1]
						data[i - 8 + (this.width * 4)] += errorShare*3;
						data[i - 7 + (this.width * 4)] += errorShare*3;
						data[i - 6 + (this.width * 4)] += errorShare*3;
						// [x-1][y+1]
						data[i - 4 + (this.width * 4)] += errorShare*5;
						data[i - 3 + (this.width * 4)] += errorShare*5;
						data[i - 2 + (this.width * 4)] += errorShare*5;
						// [x-2][y+2]
						data[i - 8 + (this.width * 4 * 2)] += errorShare*1;
						data[i - 7 + (this.width * 4 * 2)] += errorShare*1;
						data[i - 6 + (this.width * 4 * 2)] += errorShare*1;
						// [x-1][y+2]
						data[i - 4 + (this.width * 4 * 2)] += errorShare*3;
						data[i - 3 + (this.width * 4 * 2)] += errorShare*3;
						data[i - 2 + (this.width * 4 * 2)] += errorShare*3;
					}
					// [x][y+1]
					data[i + 0 + (this.width * 4)] += errorShare*7;
					data[i + 1 + (this.width * 4)] += errorShare*7;
					data[i + 2 + (this.width * 4)] += errorShare*7;
					// [x][y+2]
					data[i + 0 + (this.width * 4 * 2)] += errorShare*5;
					data[i + 1 + (this.width * 4 * 2)] += errorShare*5;
					data[i + 2 + (this.width * 4 * 2)] += errorShare*5;
					if(col < this.width - 2) {
						// [x+1][y+1]
						data[i + 4 + (this.width * 4)] += errorShare*5;
						data[i + 5 + (this.width * 4)] += errorShare*5;
						data[i + 6 + (this.width * 4)] += errorShare*5;
						// [x+2][y+1]
						data[i + 8 + (this.width * 4)] += errorShare*3;
						data[i + 9 + (this.width * 4)] += errorShare*3;
						data[i + 10 + (this.width * 4)] += errorShare*3;
						// [x+1][y+2]
						data[i + 4 + (this.width * 4 * 2)] += errorShare*3;
						data[i + 5 + (this.width * 4 * 2)] += errorShare*3;
						data[i + 6 + (this.width * 4 * 2)] += errorShare*3;
						// [x+2][y+2]
						data[i + 8 + (this.width * 4 * 2)] += errorShare*1;
						data[i + 9 + (this.width * 4 * 2)] += errorShare*1;
						data[i + 10 + (this.width * 4 * 2)] += errorShare*1;
					}
				}
			} else if(this.filter == "stucki") {
				//
				// Stucki dithering
				//
				// 				X   8   4
				//  	2   4   8   4   2
				//  	1   2   4   2   1
				//
				const errorShare = error / 42;
				if(col < this.width - 2) {
					// [x+1][y]
					data[i + 4] += errorShare*8;
					data[i + 5] += errorShare*8;
					data[i + 6] += errorShare*8;
					// [x+2][y]
					data[i + 8] += errorShare*4;
					data[i + 9] += errorShare*4;
					data[i + 10] += errorShare*4;
				}
				if(row < this.height - 2) {
					if(col >= 2) {
						// [x-2][y+1]
						data[i - 8 + (this.width * 4)] += errorShare*2;
						data[i - 7 + (this.width * 4)] += errorShare*2;
						data[i - 6 + (this.width * 4)] += errorShare*2;
						// [x-1][y+1]
						data[i - 4 + (this.width * 4)] += errorShare*4;
						data[i - 3 + (this.width * 4)] += errorShare*4;
						data[i - 2 + (this.width * 4)] += errorShare*4;
						// [x-2][y+2]
						data[i - 8 + (this.width * 4 * 2)] += errorShare*1;
						data[i - 7 + (this.width * 4 * 2)] += errorShare*1;
						data[i - 6 + (this.width * 4 * 2)] += errorShare*1;
						// [x-1][y+2]
						data[i - 4 + (this.width * 4 * 2)] += errorShare*2;
						data[i - 3 + (this.width * 4 * 2)] += errorShare*2;
						data[i - 2 + (this.width * 4 * 2)] += errorShare*2;
					}
					// [x][y+1]
					data[i + 0 + (this.width * 4)] += errorShare*8;
					data[i + 1 + (this.width * 4)] += errorShare*8;
					data[i + 2 + (this.width * 4)] += errorShare*8;
					// [x][y+2]
					data[i + 0 + (this.width * 4 * 2)] += errorShare*4;
					data[i + 1 + (this.width * 4 * 2)] += errorShare*4;
					data[i + 2 + (this.width * 4 * 2)] += errorShare*4;
					if(col < this.width - 2) {
						// [x+1][y+1]
						data[i + 4 + (this.width * 4)] += errorShare*4;
						data[i + 5 + (this.width * 4)] += errorShare*4;
						data[i + 6 + (this.width * 4)] += errorShare*4;
						// [x+2][y+1]
						data[i + 8 + (this.width * 4)] += errorShare*2;
						data[i + 9 + (this.width * 4)] += errorShare*2;
						data[i + 10 + (this.width * 4)] += errorShare*2;
						// [x+1][y+2]
						data[i + 4 + (this.width * 4 * 2)] += errorShare*2;
						data[i + 5 + (this.width * 4 * 2)] += errorShare*2;
						data[i + 6 + (this.width * 4 * 2)] += errorShare*2;
						// [x+2][y+2]
						data[i + 8 + (this.width * 4 * 2)] += errorShare*1;
						data[i + 9 + (this.width * 4 * 2)] += errorShare*1;
						data[i + 10 + (this.width * 4 * 2)] += errorShare*1;
					}
				}
			} else if(this.filter == "atkinson") {
				//
				// Atkinson dithering
				//
				// 		 X   1   1
				//   1   1   1
				//       1
				//
				const errorShare = error / 8;
				if(col < this.width - 2) {
					// [x+1][y]
					data[i + 4] += errorShare*1;
					data[i + 5] += errorShare*1;
					data[i + 6] += errorShare*1;
					// [x+2][y]
					data[i + 8] += errorShare*1;
					data[i + 9] += errorShare*1;
					data[i + 10] += errorShare*1;
				}
				if(row < this.height - 2) {
					if(col >= 1) {
						// [x-1][y+1]
						data[i - 4 + (this.width * 4)] += errorShare*1;
						data[i - 3 + (this.width * 4)] += errorShare*1;
						data[i - 2 + (this.width * 4)] += errorShare*1;
					}
					// [x][y+1]
					data[i + 0 + (this.width * 4)] += errorShare*1;
					data[i + 1 + (this.width * 4)] += errorShare*1;
					data[i + 2 + (this.width * 4)] += errorShare*1;
					// [x][y+2]
					data[i + 0 + (this.width * 4 * 2)] += errorShare*1;
					data[i + 1 + (this.width * 4 * 2)] += errorShare*1;
					data[i + 2 + (this.width * 4 * 2)] += errorShare*1;
					if(col < this.width - 1) {
						// [x+1][y+1]
						data[i + 4 + (this.width * 4)] += errorShare*1;
						data[i + 5 + (this.width * 4)] += errorShare*1;
						data[i + 6 + (this.width * 4)] += errorShare*1;
					}
				}
			} else if(this.filter == "burkes") {
				//
				// Burkes dithering
				//
				//           X   8   4
     			//   2   4   8   4   2
				//
				const errorShare = error / 32;
				if(row < this.height - 1) {
					if(col >= 2) {
						// [x-2][y+1]
						data[i - 8 + (this.width * 4)] += errorShare*2;
						data[i - 7 + (this.width * 4)] += errorShare*2;
						data[i - 6 + (this.width * 4)] += errorShare*2;
						// [x-1][y+1]
						data[i - 4 + (this.width * 4)] += errorShare*4;
						data[i - 3 + (this.width * 4)] += errorShare*4;
						data[i - 2 + (this.width * 4)] += errorShare*4;
					}
					// [x][y+1]
					data[i + 0 + (this.width * 4)] += errorShare*8;
					data[i + 1 + (this.width * 4)] += errorShare*8;
					data[i + 2 + (this.width * 4)] += errorShare*8;
					if(col < this.width - 2) {
						// [x+1][y]
						data[i + 4] += errorShare*8;
						data[i + 5] += errorShare*8;
						data[i + 6] += errorShare*8;
						// [x+2][y]
						data[i + 8] += errorShare*4;
						data[i + 9] += errorShare*4;
						data[i + 10] += errorShare*4;
						// [x+1][y+1]
						data[i + 4 + (this.width * 4)] += errorShare*4;
						data[i + 5 + (this.width * 4)] += errorShare*4;
						data[i + 6 + (this.width * 4)] += errorShare*4;
						// [x+2][y+1]
						data[i + 8 + (this.width * 4)] += errorShare*2;
						data[i + 9 + (this.width * 4)] += errorShare*2;
						data[i + 10 + (this.width * 4)] += errorShare*2;
					}
				}
			} else if(this.filter == "sierra") {
				// Sierra Dithering
				//        X   5   3
				// 2   4  5   4   2
				//     2  3   2
				//      (1/32)
				const errorShare = error / 32;
				// [x+1][y]
				if(col < this.width - 1) {
					data[i + 4] += errorShare*5;
					data[i + 5] += errorShare*5;
					data[i + 6] += errorShare*5;
				}
				// [x+2][y]
				if(col < this.width - 2) {
					data[i + 8] += errorShare*3;
					data[i + 9] += errorShare*3;
					data[i + 10] += errorShare*3;
				}
				// […][y+1]
				if(row < this.height - 1) {
					// [x-2][y+1]
					if(col >= 2) {
						data[i - 8 + (this.width * 4)] += errorShare*2;
						data[i - 7 + (this.width * 4)] += errorShare*2;
						data[i - 6 + (this.width * 4)] += errorShare*2;
					}
					// [x-1][y+1]
					if(col >= 1) {
						data[i - 4 + (this.width * 4)] += errorShare*4;
						data[i - 3 + (this.width * 4)] += errorShare*4;
						data[i - 2 + (this.width * 4)] += errorShare*4;
					}
					// [x][y+1]
					data[i + (this.width * 4)] += errorShare*5;
					data[i + (this.width * 4)] += errorShare*5;
					data[i + (this.width * 4)] += errorShare*5;
					// [x+1][y]
					if(col < this.width - 1) {
						data[i + 4 + (this.width * 4)] += errorShare*4;
						data[i + 5 + (this.width * 4)] += errorShare*4;
						data[i + 6 + (this.width * 4)] += errorShare*4;
					}
					// [x+2][y]
					if(col < this.width - 2) {
						data[i + 8 + (this.width * 4)] += errorShare*2;
						data[i + 9 + (this.width * 4)] += errorShare*2;
						data[i + 10 + (this.width * 4)] += errorShare*2;
					}
				}
				// […][y+2]
				if(row < this.height - 2) {
					// [x-1][y+2]
					if(col >= 1) {
						data[i - 4 + (this.width * 4 * 2)] += errorShare*2;
						data[i - 3 + (this.width * 4 * 2)] += errorShare*2;
						data[i - 2 + (this.width * 4 * 2)] += errorShare*2;
					}
					// [x][y+2]
					data[i + (this.width * 4 * 2)] += errorShare*3;
					data[i + (this.width * 4 * 2)] += errorShare*3;
					data[i + (this.width * 4 * 2)] += errorShare*3;
					// [x+1][y+2]
					if(col < this.width - 1) {
						data[i + 4 + (this.width * 4 * 2)] += errorShare*2;
						data[i + 5 + (this.width * 4 * 2)] += errorShare*2;
						data[i + 6 + (this.width * 4 * 2)] += errorShare*2;
					}
				}
			} else if(this.filter == "tworowsierra") {
				// Two-Row Sierra Dithering
				//         X   4   3
				// 1   2   3   2   1
				//       (1/16)
				const errorShare = error / 16;
				// [x+1][y]
				if(col < this.width - 1) {
					data[i + 4] += errorShare*4;
					data[i + 5] += errorShare*4;
					data[i + 6] += errorShare*4;
				}
				// [x+2][y]
				if(col < this.width - 2) {
					data[i + 8] += errorShare*3;
					data[i + 9] += errorShare*3;
					data[i + 10] += errorShare*3;
				}
				// […][y+1]
				if(row < this.height - 1) {
					// [x-2][y+1]
					if(col >= 2) {
						data[i - 8 + (this.width * 4)] += errorShare*1;
						data[i - 7 + (this.width * 4)] += errorShare*1;
						data[i - 6 + (this.width * 4)] += errorShare*1;
					}
					// [x-1][y+1]
					if(col >= 1) {
						data[i - 4 + (this.width * 4)] += errorShare*2;
						data[i - 3 + (this.width * 4)] += errorShare*2;
						data[i - 2 + (this.width * 4)] += errorShare*2;
					}
					// [x][y+1]
					data[i + (this.width * 4)] += errorShare*3;
					data[i + (this.width * 4)] += errorShare*3;
					data[i + (this.width * 4)] += errorShare*3;
					// [x+1][y]
					if(col < this.width - 1) {
						data[i + 4 + (this.width * 4)] += errorShare*2;
						data[i + 5 + (this.width * 4)] += errorShare*2;
						data[i + 6 + (this.width * 4)] += errorShare*2;
					}
					// [x+2][y]
					if(col < this.width - 2) {
						data[i + 8 + (this.width * 4)] += errorShare*1;
						data[i + 9 + (this.width * 4)] += errorShare*1;
						data[i + 10 + (this.width * 4)] += errorShare*1;
					}
				}
			} else if(this.filter == "sierralite") {
				// Sierra Lite Dithering
				//     X   2
				// 1   1
				//   (1/4)
				const errorShare = error / 4;
				// [x+1][y]
				if(col < this.width - 1) {
					data[i + 4] += errorShare*2;
					data[i + 5] += errorShare*2;
					data[i + 6] += errorShare*2;
				}
				// […][y+1]
				if(row < this.height - 1) {
					// [x-1][y+1]
					if(col >= 1) {
						data[i - 4 + (this.width * 4)] += errorShare*1;
						data[i - 3 + (this.width * 4)] += errorShare*1;
						data[i - 2 + (this.width * 4)] += errorShare*1;
					}
					// [x][y+1]
					data[i + (this.width * 4)] += errorShare*1;
					data[i + (this.width * 4)] += errorShare*1;
					data[i + (this.width * 4)] += errorShare*1;
				}
			}
			// Apply new values
			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}

		return newData;
	}
}
