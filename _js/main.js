---
layout: null
permalink: "/assets/js/script.js"
---
{% include_relative _preview.js %}
{% include_relative _form.js %}
{% include_relative _export.js %}

class pdvApp {

	constructor() {
		this.width = 400;
		this.height = 240;
		this.fps = 30;
		this.preview = new pdvPreview();
		this.form = new pdvForm();
		this.export = new pdvExport();
	}

}

let device;

async function connectToPlaydate() {
	device = await pdusb.requestConnectPlaydate();
	if (device == null)
    	throw new Error('Could not find playdate')

    await device.open();
    const serial = await device.getSerial();
}

const w = pdusb.PLAYDATE_WIDTH;
const h = pdusb.PLAYDATE_HEIGHT;
const global_bitmap = new Uint8Array(w * h).fill(1);

async function sendBitmap() {
	try {
		const frame = app.preview.getFrame();
		const dataRGB = frame.data;
		for (let i = 0; i < dataRGB.length; i += 4) {
			let value = dataRGB[i];
			if(value != 0) {
				value = 1;
			}
			global_bitmap[i/4] = value;
		}
		await device.sendBitmapIndexed(global_bitmap);
		setTimeout(sendBitmap, (1000 / 4));
	}
	catch(e) {
		console.warn(e.message);
	}
}

async function getCamera() {
	navigator.mediaDevices.getUserMedia({
		audio: true,
		video: {
			width: { min: 400 },
			height: { min: 240 },
			facingMode: "user",
		},
	}).then((mediaStream) => {
		const video = document.querySelector("video");
		video.srcObject = mediaStream;
		video.onloadedmetadata = () => {
			video.play();
		};
	}).catch((err) => {
	// always check for errors at the end.
		console.error(`${err.name}: ${err.message}`);
	});
}

async function getHelp() {

}

document.addEventListener('DOMContentLoaded', e => {
	window.app = new pdvApp();
})
