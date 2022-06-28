---
layout: null
permalink: "/assets/js/script.js"
---
document.addEventListener('DOMContentLoaded', e => {
	const video = document.querySelector('#source');
	const canvas = document.querySelector('#preview');
	const ctx = canvas.getContext('2d');
	const width = 400;
	const height = 240;
	const threshold = 127;

	video.addEventListener('play', () => {
		timerCallback();
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
		ctx.drawImage(video, 0, 0, width, height);
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
		ctx.putImageData(frame, 0, 0);

	}
})