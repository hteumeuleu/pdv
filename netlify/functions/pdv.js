const zlib = require('zlib');

exports.handler = async function(event, context) {
	const body = JSON.parse(event.body);

	if(!body.width || !body.height || !body.framerate || !body.frames) {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "Missing expected parameter." }),
		}
	}

	const width = body.width;
	const height = body.height;
	const framerate = body.framerate;
	const frames = body.frames;
	const ident = "Playdate VID";
	const numberOfFrames = frames.length;

	/**
	 * Headers
	 */
	// Ident "Playdate VID"
	// Offset 0, chr[16]
	let identBytes = new Uint8Array(16);
	identBytes.set(ident.split("").map(x => x.charCodeAt()));

	// Number of frames
	// Offset 16, int16
	let numberOfFramesBytes = new Uint16Array(1);
	numberOfFramesBytes[0] = numberOfFrames;

	// Reserved, always 0
	// Offset 18, int16
	let reservedBytes = new Uint16Array(1);

	// Framerate
	// Offset 20, float32
	let framerateBytes = new Float32Array(1);
	framerateBytes[0] = framerate;

	// Frame width
	// Offset 24, int16
	let frameWidthBytes = new Uint16Array(1);
	frameWidthBytes[0] = width;

	// Frame height
	// Offset 26, int16
	let frameHeightBytes = new Uint16Array(1);
	frameHeightBytes[0] = height;

	/**
	 * Result buffer string
	 */
	let decoder = new TextDecoder();
	let bufferString = "";
	bufferString += decoder.decode(identBytes);
	bufferString += decoder.decode(numberOfFramesBytes);
	bufferString += decoder.decode(reservedBytes);
	bufferString += decoder.decode(framerateBytes);
	bufferString += decoder.decode(frameWidthBytes);
	bufferString += decoder.decode(frameHeightBytes);

	return {
		statusCode: 200,
		body: JSON.stringify({
			buffer: bufferString
		}),
	};
}