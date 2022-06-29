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
		for (let i = 0; i < length; i += 4) {
			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			const avg = (red + green + blue) / 3;
			let newValue = 0;
			if(avg > threshold) {
				newValue = 255;
			}
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
	const debug = {coucou: "monde"};
	const blob = new Blob([JSON.stringify(debug, null, 2)], {type : 'application/json'});
	output.href = URL.createObjectURL(blob);
})