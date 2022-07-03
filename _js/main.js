---
layout: null
permalink: "/assets/js/script.js"
---
document.addEventListener('DOMContentLoaded', e => {
	//
	// Basic canvas
	//
	const video = document.querySelector('#source');
	const canvas = document.querySelector('#preview');
	const ctx = canvas.getContext('2d');
	const input = document.querySelector('input[type="file"]');
	const output = document.querySelector('#output');
	const width = 400;
	const height = 240;
	const threshold = 127;
	let scale = "outside";

	video.addEventListener('play', () => {
		timerCallback();
	}, false);

	video.addEventListener('canplay', () => {
		computeFrame();
	}, false);

	canvas.addEventListener('click', () => {
		if(video.paused) {
			video.play();
		} else {
			video.pause();
		}
	}, false);

	const timerCallback = function() {
		if (video.paused || video.ended) {
		  return;
		}
		computeFrame();
		setTimeout(() => {
			timerCallback();
		}, 0);
	}

	const computeFrame = function() {
		ctx.fillStyle = '#000'
		ctx.fillRect(0, 0, width, height);
		let dWidth, dHeight, dx, dy, sx, sy, sWidth, sHeight;
		const playdateRatio = width / height;
		const videoRatio = video.videoWidth / video.videoHeight;
		const biggerRatio = videoRatio > playdateRatio;
		if(scale == "inside") {
			// Source
			sx = 0;
			sy = 0;
			sWidth = video.videoWidth;
			sHeight = video.videoHeight;
			// Destination
			if(!biggerRatio) {
				dWidth = Math.round(sWidth * height / sHeight);
				dHeight = height;
			} else {
				dWidth = width;
				dHeight = Math.round(sHeight * width / sWidth);
			}
			dx = Math.round((width - dWidth) / 2);
			dy = Math.round((height - dHeight) / 2);
		} else {
			// Source
			if(!biggerRatio) {
				sWidth = video.videoWidth;
				sHeight = Math.round(height * video.videoWidth / width);
				sx = 0;
				sy = Math.round((video.videoHeight - sHeight) / 2);
			} else {
				sWidth = Math.round(width * video.videoHeight / height);
				sHeight = video.videoHeight;
				sx = Math.round((sWidth - video.videoWidth) / 2) * -1;
				sy = 0;
			}
			// Destination
			dx = 0;
			dy = 0;
			dWidth = 400;
			dHeight = 240;
		}
		ctx.drawImage(video, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
		const frame = ctx.getImageData(0, 0, width, height);
		const length = frame.data.length;
		const data = frame.data;
		let newData = filter(data);
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, width, height);
		let newFrame = ctx.createImageData(width, height);
		newFrame.data.set(newData);
		ctx.putImageData(newFrame, 0, 0);
	}

	//
	// Dither Management
	//
	const select = document.querySelector('#select-dither')
	select.addEventListener('change', e => {
		if(video.readyState > 1) {
			computeFrame();
		}
	});

	function filter(data) {
		const selected = select.options[select.selectedIndex].value;
		if(selected == "basic") {
			return filterThresholdWithBasicError(data);
		} else if(selected == "floydsteinberg") {
			return filterFloydSteinberg(data);
		} else if(selected == "stucki") {
			return filterStucki(data);
		} else if(selected == "atkinson") {
			return filterAtkinson(data);
		} else {
			return filterThreshold(data);
		}
	}

	function filterAtkinson(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);

		for (let i = 0; i < length; i += 4) {
			const col = Math.round(i % (width * 4) / 4);
			const row = Math.round(i / (width * 4));

			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;

			let newValue = 0;
			if(avg > threshold) {
				newValue = 255;
			}


	// 	   X   1   1 
  //   1   1   1
  //       1

  //     (1/8)

			const error = avg - newValue;
			const errorShare = error / 8;
			if(col < width - 2) {
				data[i + 4] += errorShare*1;
				data[i + 5] += errorShare*1;
				data[i + 6] += errorShare*1;
				data[i + 8] += errorShare*1;
				data[i + 9] += errorShare*1;
				data[i + 10] += errorShare*1;
			}
			if(row < height - 2) {
				if(col >= 1) {
					data[i - 4 + (width * 4)] += errorShare*1;
					data[i - 3 + (width * 4)] += errorShare*1;
					data[i - 2 + (width * 4)] += errorShare*1;
				}
				data[i + 0 + (width * 4)] += errorShare*1;
				data[i + 1 + (width * 4)] += errorShare*1;
				data[i + 2 + (width * 4)] += errorShare*1;
				data[i + 0 + (width * 4 * 2)] += errorShare*1;
				data[i + 1 + (width * 4 * 2)] += errorShare*1;
				data[i + 2 + (width * 4 * 2)] += errorShare*1;
				if(col < width - 1) {
					data[i + 4 + (width * 4)] += errorShare*1;
					data[i + 5 + (width * 4)] += errorShare*1;
					data[i + 6 + (width * 4)] += errorShare*1;
				}
			}

			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	function filterStucki(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);

		for (let i = 0; i < length; i += 4) {
			const col = Math.round(i % (width * 4) / 4);
			const row = Math.round(i / (width * 4));

			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;

			let newValue = 0;
			if(avg > threshold) {
				newValue = 255;
			}

			const error = avg - newValue;
			const errorShare = error / 42;
			if(col < width - 2) {
				data[i + 4] += errorShare*8;
				data[i + 5] += errorShare*8;
				data[i + 6] += errorShare*8;
				data[i + 8] += errorShare*4;
				data[i + 9] += errorShare*4;
				data[i + 10] += errorShare*4;
			}
			if(row < height - 2) {
				if(col >= 2) {
					data[i - 4 + (width * 4)] += errorShare*4;
					data[i - 3 + (width * 4)] += errorShare*4;
					data[i - 2 + (width * 4)] += errorShare*4;
					data[i - 8 + (width * 4)] += errorShare*2;
					data[i - 7 + (width * 4)] += errorShare*2;
					data[i - 6 + (width * 4)] += errorShare*2;

					data[i - 4 + (width * 4 * 2)] += errorShare*2;
					data[i - 3 + (width * 4 * 2)] += errorShare*2;
					data[i - 2 + (width * 4 * 2)] += errorShare*2;
					data[i - 8 + (width * 4 * 2)] += errorShare*1;
					data[i - 7 + (width * 4 * 2)] += errorShare*1;
					data[i - 6 + (width * 4 * 2)] += errorShare*1;
				}
				data[i + 0 + (width * 4)] += errorShare*8;
				data[i + 1 + (width * 4)] += errorShare*8;
				data[i + 2 + (width * 4)] += errorShare*8;
				data[i + 0 + (width * 4 * 2)] += errorShare*4;
				data[i + 1 + (width * 4 * 2)] += errorShare*4;
				data[i + 2 + (width * 4 * 2)] += errorShare*4;
				if(col < width - 2) {
					data[i + 4 + (width * 4)] += errorShare*4;
					data[i + 5 + (width * 4)] += errorShare*4;
					data[i + 6 + (width * 4)] += errorShare*4;
					data[i + 8 + (width * 4)] += errorShare*2;
					data[i + 9 + (width * 4)] += errorShare*2;
					data[i + 10 + (width * 4)] += errorShare*2;

					data[i + 4 + (width * 4 * 2)] += errorShare*1;
					data[i + 5 + (width * 4 * 2)] += errorShare*1;
					data[i + 6 + (width * 4 * 2)] += errorShare*1;
					data[i + 8 + (width * 4 * 2)] += errorShare*1;
					data[i + 9 + (width * 4 * 2)] += errorShare*1;
					data[i + 10 + (width * 4 * 2)] += errorShare*1;
				}
			}

			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	function filterFloydSteinberg(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);

		for (let i = 0; i < length; i += 4) {
			const col = Math.round(i % (width * 4) / 4);
			const row = Math.round(i / (width * 4));

			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;

			let newValue = 0;
			if(avg > threshold) {
				newValue = 255;
			}
			const error = avg - newValue;
			const errorShare = error / 16;
			if(col < width - 1) {
				data[i + 4] += errorShare*7;
				data[i + 5] += errorShare*7;
				data[i + 6] += errorShare*7;
			}
			if(row < height - 1) {
				if(col > 0) {
					data[i - 4 + (width * 4)] += errorShare*3;
					data[i - 3 + (width * 4)] += errorShare*3;
					data[i - 2 + (width * 4)] += errorShare*3;
				}
				data[i + 0 + (width * 4)] += errorShare*5;
				data[i + 1 + (width * 4)] += errorShare*5;
				data[i + 2 + (width * 4)] += errorShare*5;
				if(col < width - 1) {
					data[i + 4 + (width * 4)] += errorShare*1;
					data[i + 5 + (width * 4)] += errorShare*1;
					data[i + 6 + (width * 4)] += errorShare*1;
				}
			}

			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	function filterThreshold(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);
		for (let i = 0; i < length; i += 4) {
			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;
			let newValue = 0;
			if(avg > threshold) {
				newValue = 255;
			}
			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	function filterThresholdWithBasicError(data) {
		const length = data.length;
		let newData = new Uint8ClampedArray(length);
		let previousError = 0;
		for (let i = 0; i < length; i += 4) {
			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3 + previousError;
			let newValue = 0;
			if(avg > threshold) {
				newValue = 255;
			}
			previousError = avg - newValue;
			if(i % width == 0) {
				previousError = 0;
			}
			newData[i + 0] = newValue;
			newData[i + 1] = newValue;
			newData[i + 2] = newValue;
			newData[i + 3] = 255;
		}
		return newData;
	}

	//
	// Input management
	//
	input.addEventListener('change', e => {
		if (input.files.length) {
			video.src = URL.createObjectURL(input.files[0]);
			video.onload = function() {
				URL.revokeObjectURL(video.src);
			}
			output.download = input.files[0].name + '.pdv';
		}
	});

	const radioScaleInside = document.querySelector('input[name="scale"][value="inside"]')
	const radioScaleOutside = document.querySelector('input[name="scale"][value="outside"]')
	radioScaleInside.addEventListener('change', radioScaleHandler);
	radioScaleOutside.addEventListener('change', radioScaleHandler);

	radioScaleHandler();

	function radioScaleHandler(e) {
		if(radioScaleInside.checked) {
			scale = "inside";
			video.style.objectFit = "contain";
		} else {
			scale = "outside";
			video.style.objectFit = "cover";
		}
		if(video.readyState > 1) {
			computeFrame();
		}
	}

	//
	// Output download
	//
	// Ident
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

	// Frame Table

	const blob = new Blob([ident, numFrames, reserved, framerate, framewidth, frameheight], {type : 'application/octet-stream'});
	output.href = URL.createObjectURL(blob);
	URL.revokeObjectURL(blob);

	const textarea = document.querySelector('#textarea');
	blob.text().then(value => { textarea.value = value })

	function serializeFrame() {
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

	// Calling Netlify functions: pdv.js
	const aSingleFrame = serializeFrame();
	const message = JSON.stringify({
		width: 400,
		height: 240,
		framerate: 30,
		frames: [
			aSingleFrame
		]
	});
	// const endpoint = "/.netlify/functions/pdv";
	// fetch(endpoint, {
	// 	method: 'POST',
	// 	body: message
	// })
	// .then(response => response.json())
	// .then(data => {
	// 	console.log('Success:', data);
	// 	textarea.value = textarea.value + "\n\n" + data.buffer;
	// 	const encoder = new TextEncoder();
	// 	const view = encoder.encode(data.buffer);
	// 	const responseBlob = new Blob([view], {type : 'application/octet-stream'});
	// 	output.href = URL.createObjectURL(responseBlob);
	// 	URL.revokeObjectURL(responseBlob);
	// })
	// .catch((error) => {
	//   console.error('Error:', error);
	// });
})