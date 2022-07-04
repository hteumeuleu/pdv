class pdvExport {

	constructor() {
	}

	outputDownload() {
		//
		// Output download
		//
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
	}

	callServerSideFunction() {
		const textarea = document.querySelector('#textarea');
		const output = document.querySelector('#output');
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
	}
}
