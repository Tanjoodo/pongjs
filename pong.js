function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader,source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

function drawPaddle() {
	var modelPoints = [ 0, 0,
						1, 0,
						1, 5,
						0, 5 ];

}

function start() {
	var canvas = document.getElementById("c");
	var gl = canvas.getContext("webgl");
	if (!gl) {
		alert("u haff no gl");
	}

	var vertexShaderSource = document.getElementById("vshader").text;
	var fragmentShaderSource = document.getElementById("fshader").text;

	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	var program = createProgram(gl, vertexShader, fragmentShader);

	var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	var positionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	var positions = [ 0, 0, 0, 0.5, 0.7, 0, ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(positionAttributeLocation);

	var size = 2;
	var type = gl.FLOAT;
	var normalize = false;
	var stride = 0;
	var offset = 0
		gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, 
				stride, offset);

	var canvasWidth = canvas.clientWidth;
	var canvasHeight = canvas.clientHeight;

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	console.log(canvasWidth, canvasHeight);
	gl.viewport(0, 0, canvasWidth, canvasHeight);

	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);
	var primitiveType = gl.TRIANGLES;
	var count = 3;
	gl.drawArrays(primitiveType, offset, count);
}
