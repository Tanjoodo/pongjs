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
var gl;

function drawPaddle() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.useProgram(this.program);
	resloc = gl.getUniformLocation(this.program, "res");
	gl.uniform2f(resloc, res[0], res[1]);
	trans = gl.getUniformLocation(this.program, "translation");
	gl.uniform4f(trans, this.posx, this.posy, 0, 0);
	scale = gl.getUniformLocation(this.program, "scale");
	gl.uniform4f(scale, this.scalex, this.scaley, 1, 1);

	var positionloc = gl.getAttribLocation(this.program, "a_position");
	gl.enableVertexAttribArray(positionloc);
	gl.vertexAttribPointer(positionloc, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, 6);
}
var UP_ARROW = 38;
var DOWN_ARROW = 40;
var LEFT_ARROW = 37;
var RIGHT_ARROW = 39;

var gameObjects = [];
var models = [];
var keyState = [];
var paddleTransY = 55;
var paddleSpeedY = 120;
var paddleBuffer;
var res;

var deltas = [];
var di = 0;
function updatePaddle(delta) {
	if (keyState[UP_ARROW] == true) {
		this.speedy = 100/60.0;
	} else if (keyState[DOWN_ARROW] == true) {
		this.speedy = -100/60.0;
	} else if (keyState[UP_ARROW] == false || keyState[DOWN_ARROW] == true) {
		this.speedy = 0;
	}
	this.posx += this.speedx * delta;
	this.posy += this.speedy * delta;
	deltas[++di%10] = delta;
}

function paddle() {
	paddleBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, paddleBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(models["paddle"]), gl.STATIC_DRAW);

	var vertexShaderSource = document.getElementById("vshader").text;
	var fragmentShaderSource = document.getElementById("fshader").text;

	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	var paddleProgram = createProgram(gl, vertexShader, fragmentShader);

	return {posx:30,
		speedx:0,
		speedy:0,
		posy:0,
		scaley:50,
		scalex:50,
		buffer:paddleBuffer,
		program:paddleProgram,
		draw:drawPaddle,
		update:updatePaddle};

}


function resize() {
	var canvas = document.getElementById("c");
	var canvasWidth = canvas.clientWidth;
	var canvasHeight = canvas.clientHeight;
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	gl.viewport(0, 0, canvasWidth, canvasHeight);
	res = [canvasWidth, canvasHeight];
}
function draw() {
	resize();
	gl.clear(gl.COLOR_BUFFER_BIT);
	for (i = 0; i < gameObjects.length; ++i) {
		gameObjects[i].draw();
	}
}

function update(delta) {
	for (i = 0; i < gameObjects.length; ++i) {
		gameObjects[i].update(delta);
	}
}

var lastTimeStamp = new Date().getTime();
function tick() {
	currentTimeStamp = new Date().getTime();
	var delta = currentTimeStamp - lastTimeStamp;
	update(delta);
	draw();
	lastTimeStamp = currentTimeStamp;
	requestAnimationFrame(tick);
}

function handleKeyDown(event) {
	keyState[event.keyCode] = true;
	if (event.keyCode == RIGHT_ARROW) console.log(deltas);
}

function handleKeyUp(event) {
	keyState[event.keyCode] = false;
}

function start() {
	var canvas = document.getElementById("c");
	gl = canvas.getContext("webgl");
	if (!gl) {
		alert("u haff no gl");
	}
	
	models["paddle"] = [-0.3, -1.5,
	                    0.3, -1.5,
	                    0.3, 1.5,
	                    0.3, 1.5,
	                    -0.3, 1.5,
			    -0.3, -1.5,];
		

	gl.clearColor(0, 0, 0, 1);
	var primitiveType = gl.TRIANGLES;
	gameObjects[0] = paddle();

	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;

	requestAnimationFrame(tick);

}
