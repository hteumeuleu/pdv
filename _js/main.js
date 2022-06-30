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
		let sx, sy, sWidth, sHeight;
		if (scale == "inside") {
			if(video.videoWidth < video.videoHeight) { // Portrait
				sWidth = Math.round(width * video.videoHeight / height);
				sHeight = video.videoHeight;
				sx = Math.round((sWidth - video.videoWidth) / 2) * -1;
				sy = 0; 
			} else { // Landscape
				sWidth = video.videoWidth;
				sHeight = Math.round(height * video.videoWidth / width);
				sx = 0;
				sy = Math.round((video.videoHeight - sHeight) / 2);
			}
		} else {
			if(video.videoWidth < video.videoHeight) { // Portrait
				sWidth = video.videoWidth;
				sHeight = Math.round(height * video.videoWidth / width);
				sx = 0;
				sy = Math.round((video.videoHeight - sHeight) / 2);
			} else { // Landscape
				sWidth = Math.round(width * video.videoHeight / height);
				sHeight = video.videoHeight;
				sx = Math.round((sWidth - video.videoWidth) / 2) * -1;
				sy = 0; 
			}
		}
		ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);
		const frame = ctx.getImageData(0, 0, width, height);
		const length = frame.data.length;
		const data = frame.data;
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
			data[i + 0] = newValue;
			data[i + 1] = newValue;
			data[i + 2] = newValue;
		}
		ctx.fillStyle = '#000'
		ctx.fillRect(0, 0, width, height);
		ctx.putImageData(frame, 0, 0);
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
		computeFrame();
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

	// Calling Netlify functions: pdv.js
	const message = JSON.stringify({
		width: 400,
		height: 240,
		framerate: 30,
		frames: [
			[0,0,0,0],
			[1,1,1,1],
			[0,1,0,1],
			[1,0,1,0],
		]
	});
	const endpoint = "/.netlify/functions/pdv";
	fetch(endpoint, {
		method: 'POST',
		body: message
	})
	.then(response => response.json())
	.then(data => {
		console.log('Success:', data);
		textarea.value = textarea.value + "\n\n" + data.buffer;
		const encoder = new TextEncoder();
		const view = encoder.encode(data.buffer);
		const responseBlob = new Blob([view], {type : 'application/octet-stream'});
		output.href = URL.createObjectURL(responseBlob);
		URL.revokeObjectURL(responseBlob);
	})
	.catch((error) => {
	  console.error('Error:', error);
	});
})